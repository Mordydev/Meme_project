/**
 * Scheduler Service
 * 
 * Manages scheduled tasks in the application.
 */
import { v4 as uuidv4 } from 'uuid';
import { CronJob } from 'cron';
import { logger } from '../../lib/logger';
import { redisClient } from '../../lib/redis-client';
import { isValidCronExpression, getNextExecutionTime } from './cron';
import { addJob } from '../utils/queue-utils';

/**
 * Schedule status enum
 */
export enum ScheduleStatus {
  ENABLED = 'enabled',
  DISABLED = 'disabled',
  RUNNING = 'running',
  FAILED = 'failed'
}

/**
 * Schedule definition interface
 */
export interface Schedule {
  /** Unique schedule ID */
  id: string;
  /** Schedule name */
  name: string;
  /** Queue name */
  queue: string;
  /** Job name */
  jobName: string;
  /** Job data */
  data: any;
  /** Cron pattern */
  pattern: string;
  /** Timezone */
  timezone?: string;
  /** Whether the schedule is enabled */
  enabled: boolean;
  /** Last run timestamp */
  lastRunAt?: Date;
  /** Next run timestamp */
  nextRunAt?: Date;
  /** Schedule creation timestamp */
  createdAt: Date;
  /** Schedule update timestamp */
  updatedAt: Date;
}

/**
 * Scheduler service for managing scheduled jobs
 */
export class SchedulerService {
  private schedules: Map<string, Schedule> = new Map();
  private jobs: Map<string, CronJob> = new Map();
  private storageKey = 'sk:schedules';
  private isInitialized = false;
  
  /**
   * Create a new scheduler service
   */
  constructor() {}
  
  /**
   * Start the scheduler
   */
  async start(): Promise<void> {
    if (this.isInitialized) {
      logger.warn('Scheduler already started');
      return;
    }
    
    try {
      // Load schedules from storage
      await this.loadSchedules();
      
      // Start enabled schedules
      for (const [id, schedule] of this.schedules.entries()) {
        if (schedule.enabled) {
          this.startSchedule(id);
        }
      }
      
      this.isInitialized = true;
      logger.info('Scheduler started', { 
        scheduleCount: this.schedules.size,
        activeJobCount: this.jobs.size
      });
    } catch (error) {
      logger.error('Failed to start scheduler', { error });
      throw error;
    }
  }
  
  /**
   * Stop the scheduler
   */
  stop(): void {
    try {
      // Stop all cron jobs
      for (const [id, job] of this.jobs.entries()) {
        job.stop();
        logger.debug(`Stopped scheduled job: ${id}`);
      }
      
      this.jobs.clear();
      this.isInitialized = false;
      logger.info('Scheduler stopped');
    } catch (error) {
      logger.error('Failed to stop scheduler', { error });
      throw error;
    }
  }
  
  /**
   * Create a new schedule
   * 
   * @param schedule Schedule to create
   * @returns Created schedule
   */
  async createSchedule(schedule: Omit<Schedule, 'id' | 'createdAt' | 'updatedAt'>): Promise<Schedule> {
    // Validate cron pattern
    if (!isValidCronExpression(schedule.pattern)) {
      throw new Error(`Invalid cron pattern: ${schedule.pattern}`);
    }
    
    // Create new schedule
    const now = new Date();
    const newSchedule: Schedule = {
      ...schedule,
      id: uuidv4(),
      createdAt: now,
      updatedAt: now,
      nextRunAt: schedule.enabled ? 
        getNextExecutionTime(schedule.pattern, schedule.timezone) || undefined : 
        undefined
    };
    
    // Add to in-memory store
    this.schedules.set(newSchedule.id, newSchedule);
    
    // Persist to storage
    await this.saveSchedules();
    
    // Start if enabled
    if (newSchedule.enabled && this.isInitialized) {
      this.startSchedule(newSchedule.id);
    }
    
    logger.info('Created schedule', { 
      scheduleId: newSchedule.id, 
      name: newSchedule.name 
    });
    
    return newSchedule;
  }
  
  /**
   * Update an existing schedule
   * 
   * @param id Schedule ID
   * @param updates Schedule updates
   * @returns Updated schedule
   */
  async updateSchedule(id: string, updates: Partial<Schedule>): Promise<Schedule> {
    // Get existing schedule
    const schedule = this.schedules.get(id);
    if (!schedule) {
      throw new Error(`Schedule not found: ${id}`);
    }
    
    // Validate cron pattern if provided
    if (updates.pattern && !isValidCronExpression(updates.pattern)) {
      throw new Error(`Invalid cron pattern: ${updates.pattern}`);
    }
    
    // Stop existing job if running
    if (this.jobs.has(id)) {
      this.jobs.get(id)?.stop();
      this.jobs.delete(id);
    }
    
    // Update schedule
    const updatedSchedule: Schedule = {
      ...schedule,
      ...updates,
      updatedAt: new Date()
    };
    
    // Update next run time if schedule is enabled and pattern/timezone changed
    if (
      updatedSchedule.enabled && 
      (updates.pattern || updates.timezone)
    ) {
      updatedSchedule.nextRunAt = getNextExecutionTime(
        updatedSchedule.pattern, 
        updatedSchedule.timezone
      ) || undefined;
    }
    
    // Add to in-memory store
    this.schedules.set(id, updatedSchedule);
    
    // Persist to storage
    await this.saveSchedules();
    
    // Start if enabled
    if (updatedSchedule.enabled && this.isInitialized) {
      this.startSchedule(id);
    }
    
    logger.info('Updated schedule', { 
      scheduleId: id, 
      name: updatedSchedule.name 
    });
    
    return updatedSchedule;
  }
  
  /**
   * Get all schedules
   * 
   * @returns All schedules
   */
  getSchedules(): Schedule[] {
    return Array.from(this.schedules.values());
  }
  
  /**
   * Get a schedule by ID
   * 
   * @param id Schedule ID
   * @returns Schedule or null if not found
   */
  getScheduleById(id: string): Schedule | null {
    return this.schedules.get(id) || null;
  }
  
  /**
   * Delete a schedule
   * 
   * @param id Schedule ID
   * @returns true if deleted, false if not found
   */
  async deleteSchedule(id: string): Promise<boolean> {
    if (!this.schedules.has(id)) {
      return false;
    }
    
    // Stop job if running
    if (this.jobs.has(id)) {
      this.jobs.get(id)?.stop();
      this.jobs.delete(id);
    }
    
    // Remove from in-memory store
    this.schedules.delete(id);
    
    // Persist to storage
    await this.saveSchedules();
    
    logger.info('Deleted schedule', { scheduleId: id });
    
    return true;
  }
  
  /**
   * Enable a schedule
   * 
   * @param id Schedule ID
   * @returns Updated schedule
   */
  async enableSchedule(id: string): Promise<Schedule> {
    return this.updateSchedule(id, { enabled: true });
  }
  
  /**
   * Disable a schedule
   * 
   * @param id Schedule ID
   * @returns Updated schedule
   */
  async disableSchedule(id: string): Promise<Schedule> {
    return this.updateSchedule(id, { enabled: false });
  }
  
  /**
   * Run a schedule immediately
   * 
   * @param id Schedule ID
   * @returns Job ID
   */
  async runScheduleNow(id: string): Promise<string> {
    const schedule = this.schedules.get(id);
    if (!schedule) {
      throw new Error(`Schedule not found: ${id}`);
    }
    
    try {
      // Add job to queue
      const job = await addJob(
        schedule.queue,
        schedule.jobName,
        schedule.data,
        {}
      );
      
      // Update last run time
      await this.updateSchedule(id, { 
        lastRunAt: new Date() 
      });
      
      logger.info('Manually ran schedule', { 
        scheduleId: id, 
        name: schedule.name,
        jobId: job.id
      });
      
      return job.id;
    } catch (error) {
      logger.error('Failed to run schedule', { 
        scheduleId: id, 
        name: schedule.name, 
        error 
      });
      throw error;
    }
  }
  
  /**
   * Start a schedule
   * 
   * @param id Schedule ID
   */
  private startSchedule(id: string): void {
    const schedule = this.schedules.get(id);
    if (!schedule || !schedule.enabled) {
      return;
    }
    
    try {
      // Create cron job
      const job = new CronJob(
        schedule.pattern,
        // On tick function
        async () => {
          try {
            logger.debug('Running scheduled job', { 
              scheduleId: id, 
              name: schedule.name 
            });
            
            // Update last run time
            const now = new Date();
            schedule.lastRunAt = now;
            
            // Add job to queue
            const queuedJob = await addJob(
              schedule.queue,
              schedule.jobName,
              schedule.data,
              {}
            );
            
            // Update next run time
            schedule.nextRunAt = getNextExecutionTime(
              schedule.pattern, 
              schedule.timezone
            ) || undefined;
            
            // Persist updates
            this.schedules.set(id, schedule);
            await this.saveSchedules();
            
            logger.debug('Scheduled job completed', { 
              scheduleId: id, 
              name: schedule.name,
              jobId: queuedJob.id
            });
          } catch (error) {
            logger.error('Error running scheduled job', { 
              scheduleId: id, 
              name: schedule.name, 
              error 
            });
          }
        },
        // On complete function
        null,
        // Start immediately
        true,
        // Timezone
        schedule.timezone || 'UTC'
      );
      
      // Store job
      this.jobs.set(id, job);
      
      logger.debug('Started schedule', { 
        scheduleId: id, 
        name: schedule.name, 
        pattern: schedule.pattern,
        nextRun: schedule.nextRunAt
      });
    } catch (error) {
      logger.error('Failed to start schedule', { 
        scheduleId: id, 
        name: schedule.name, 
        error 
      });
    }
  }
  
  /**
   * Load schedules from storage
   */
  private async loadSchedules(): Promise<void> {
    try {
      // Get schedules from Redis
      const data = await redisClient.get(this.storageKey);
      
      if (data) {
        const schedules = JSON.parse(data) as Schedule[];
        
        // Add to in-memory store
        schedules.forEach(schedule => {
          // Convert string dates to Date objects
          if (schedule.lastRunAt) {
            schedule.lastRunAt = new Date(schedule.lastRunAt);
          }
          if (schedule.nextRunAt) {
            schedule.nextRunAt = new Date(schedule.nextRunAt);
          }
          schedule.createdAt = new Date(schedule.createdAt);
          schedule.updatedAt = new Date(schedule.updatedAt);
          
          this.schedules.set(schedule.id, schedule);
        });
        
        logger.info('Loaded schedules from storage', { count: schedules.length });
      } else {
        logger.info('No schedules found in storage');
      }
    } catch (error) {
      logger.error('Failed to load schedules', { error });
      // Start with empty schedules rather than failing
      this.schedules.clear();
    }
  }
  
  /**
   * Save schedules to storage
   */
  private async saveSchedules(): Promise<void> {
    try {
      const schedules = Array.from(this.schedules.values());
      await redisClient.set(this.storageKey, JSON.stringify(schedules));
      logger.debug('Saved schedules to storage', { count: schedules.length });
    } catch (error) {
      logger.error('Failed to save schedules', { error });
      throw error;
    }
  }
}
