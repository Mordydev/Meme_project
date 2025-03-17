/**
 * Scheduler Service
 * 
 * Manages scheduling and execution of recurring jobs
 */
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../../lib/logger';
import { Job } from 'bull';
import { QueueName, JobTypeMap } from '../queues';
import { jobService } from '../service';
import { 
  ScheduleRepository, 
  Schedule, 
  CreateScheduleDto, 
  UpdateScheduleDto 
} from './repository';
import { isValidCronExpression, getNextExecutionTime } from './cron';

/**
 * Service for managing scheduled jobs
 */
export class SchedulerService {
  private checkInterval: NodeJS.Timeout | null = null;
  private scheduleLocks: Set<string> = new Set();
  
  constructor(
    private scheduleRepository: ScheduleRepository,
    private checkIntervalMs: number = 60000 // Check every minute by default
  ) {}
  
  /**
   * Initialize the scheduler
   */
  async initialize(): Promise<void> {
    logger.info('Initializing scheduler service');
    
    try {
      // Calculate next run times for all schedules
      const schedules = await this.scheduleRepository.findEnabled();
      
      for (const schedule of schedules) {
        if (!schedule.nextRunAt) {
          const nextRunAt = getNextExecutionTime(
            schedule.pattern,
            schedule.timezone
          );
          
          await this.scheduleRepository.updateNextRunTime(
            schedule.id,
            nextRunAt
          );
          
          logger.debug('Updated next run time for schedule', {
            scheduleId: schedule.id,
            scheduleName: schedule.name,
            nextRunAt
          });
        }
      }
      
      // Start the scheduler check interval
      this.startSchedulerCheck();
      
      logger.info('Scheduler service initialized', {
        schedulesCount: schedules.length,
        checkIntervalMs: this.checkIntervalMs
      });
    } catch (error) {
      logger.error('Error initializing scheduler service', { error });
      throw error;
    }
  }
  
  /**
   * Start the scheduler check interval
   */
  private startSchedulerCheck(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }
    
    this.checkInterval = setInterval(
      async () => this.checkDueSchedules(),
      this.checkIntervalMs
    );
    
    logger.info('Scheduler check interval started', {
      intervalMs: this.checkIntervalMs
    });
  }
  
  /**
   * Stop the scheduler check interval
   */
  stop(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
      logger.info('Scheduler service stopped');
    }
  }
  
  /**
   * Check for schedules that are due to run
   */
  private async checkDueSchedules(): Promise<void> {
    try {
      const dueSchedules = await this.scheduleRepository.findDue();
      
      logger.debug('Checking due schedules', {
        count: dueSchedules.length
      });
      
      for (const schedule of dueSchedules) {
        // Skip if the schedule is already being processed
        if (this.scheduleLocks.has(schedule.id)) {
          continue;
        }
        
        // Lock the schedule to prevent concurrent execution
        this.scheduleLocks.add(schedule.id);
        
        try {
          // Execute the schedule
          await this.executeSchedule(schedule);
          
          // Calculate next run time
          const nextRunAt = getNextExecutionTime(
            schedule.pattern,
            schedule.timezone
          );
          
          // Update the schedule with the new run times
          await this.scheduleRepository.updateLastRunTime(
            schedule.id,
            new Date()
          );
          
          await this.scheduleRepository.updateNextRunTime(
            schedule.id,
            nextRunAt
          );
          
          logger.debug('Schedule executed and updated', {
            scheduleId: schedule.id,
            scheduleName: schedule.name,
            lastRunAt: new Date(),
            nextRunAt
          });
        } catch (error) {
          logger.error('Error executing schedule', {
            scheduleId: schedule.id,
            scheduleName: schedule.name,
            error
          });
        } finally {
          // Release the lock
          this.scheduleLocks.delete(schedule.id);
        }
      }
    } catch (error) {
      logger.error('Error checking due schedules', { error });
    }
  }
  
  /**
   * Execute a schedule by creating a job
   * 
   * @param schedule The schedule to execute
   * @returns The created job
   */
  private async executeSchedule(schedule: Schedule): Promise<Job | null> {
    try {
      // Create a job in the specified queue
      const jobId = await jobService.addJob(
        schedule.queue as QueueName,
        schedule.jobName as any,
        {
          ...schedule.data,
          _scheduledAt: new Date().toISOString(),
          _scheduleId: schedule.id
        }
      );
      
      logger.info('Schedule executed successfully', {
        scheduleId: schedule.id,
        scheduleName: schedule.name,
        jobId
      });
      
      return jobService.getJob(schedule.queue as QueueName, jobId);
    } catch (error) {
      logger.error('Error executing schedule', {
        scheduleId: schedule.id,
        scheduleName: schedule.name,
        error
      });
      return null;
    }
  }
  
  /**
   * Create a new schedule
   * 
   * @param scheduleData Schedule creation data
   * @returns The created schedule
   */
  async createSchedule(scheduleData: CreateScheduleDto): Promise<Schedule> {
    // Validate cron expression
    if (!isValidCronExpression(scheduleData.pattern)) {
      throw new Error(`Invalid cron expression: ${scheduleData.pattern}`);
    }
    
    // Calculate the next run time
    const nextRunAt = getNextExecutionTime(
      scheduleData.pattern,
      scheduleData.timezone
    );
    
    // Create the schedule
    const schedule = await this.scheduleRepository.create({
      ...scheduleData,
      enabled: scheduleData.enabled !== false // Default to enabled
    });
    
    // Update the next run time
    return this.scheduleRepository.updateNextRunTime(schedule.id, nextRunAt);
  }
  
  /**
   * Update an existing schedule
   * 
   * @param id Schedule ID
   * @param updates Schedule updates
   * @returns The updated schedule
   */
  async updateSchedule(id: string, updates: UpdateScheduleDto): Promise<Schedule> {
    // Validate cron expression if provided
    if (updates.pattern && !isValidCronExpression(updates.pattern)) {
      throw new Error(`Invalid cron expression: ${updates.pattern}`);
    }
    
    // Update the schedule
    const updatedSchedule = await this.scheduleRepository.update(id, updates);
    
    // If the pattern or timezone changed, recalculate the next run time
    if (updates.pattern || updates.timezone) {
      const nextRunAt = getNextExecutionTime(
        updates.pattern || updatedSchedule.pattern,
        updates.timezone || updatedSchedule.timezone
      );
      
      return this.scheduleRepository.updateNextRunTime(id, nextRunAt);
    }
    
    return updatedSchedule;
  }
  
  /**
   * Enable a schedule
   * 
   * @param id Schedule ID
   * @returns The updated schedule
   */
  async enableSchedule(id: string): Promise<Schedule> {
    const schedule = await this.scheduleRepository.findById(id);
    
    if (!schedule) {
      throw new Error(`Schedule with ID ${id} not found`);
    }
    
    // Calculate the next run time if not set
    let updatedSchedule = await this.scheduleRepository.update(id, { enabled: true });
    
    if (!updatedSchedule.nextRunAt) {
      const nextRunAt = getNextExecutionTime(
        updatedSchedule.pattern,
        updatedSchedule.timezone
      );
      
      updatedSchedule = await this.scheduleRepository.updateNextRunTime(
        id,
        nextRunAt
      );
    }
    
    logger.info('Schedule enabled', {
      scheduleId: id,
      scheduleName: updatedSchedule.name,
      nextRunAt: updatedSchedule.nextRunAt
    });
    
    return updatedSchedule;
  }
  
  /**
   * Disable a schedule
   * 
   * @param id Schedule ID
   * @returns The updated schedule
   */
  async disableSchedule(id: string): Promise<Schedule> {
    const updatedSchedule = await this.scheduleRepository.update(id, { enabled: false });
    
    logger.info('Schedule disabled', {
      scheduleId: id,
      scheduleName: updatedSchedule.name
    });
    
    return updatedSchedule;
  }
  
  /**
   * Get all schedules
   * 
   * @returns List of all schedules
   */
  async getSchedules(): Promise<Schedule[]> {
    return this.scheduleRepository.findAll();
  }
  
  /**
   * Get a schedule by ID
   * 
   * @param id Schedule ID
   * @returns The schedule or null if not found
   */
  async getSchedule(id: string): Promise<Schedule | null> {
    return this.scheduleRepository.findById(id);
  }
  
  /**
   * Delete a schedule
   * 
   * @param id Schedule ID
   * @returns True if the schedule was deleted
   */
  async deleteSchedule(id: string): Promise<boolean> {
    return this.scheduleRepository.delete(id);
  }
  
  /**
   * Run a schedule immediately
   * 
   * @param id Schedule ID
   * @returns The executed job or null if schedule not found
   */
  async runScheduleNow(id: string): Promise<Job | null> {
    const schedule = await this.scheduleRepository.findById(id);
    
    if (!schedule) {
      throw new Error(`Schedule with ID ${id} not found`);
    }
    
    // Execute the schedule immediately
    const job = await this.executeSchedule(schedule);
    
    // Update last run time
    await this.scheduleRepository.updateLastRunTime(id, new Date());
    
    return job;
  }
}

// Export factory function
export function createSchedulerService(
  scheduleRepository: ScheduleRepository,
  checkIntervalMs: number = 60000
): SchedulerService {
  return new SchedulerService(scheduleRepository, checkIntervalMs);
}
