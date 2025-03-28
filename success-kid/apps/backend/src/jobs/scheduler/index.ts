/**
 * Job Scheduler
 * 
 * Provides scheduled task functionality for the application.
 */
import { logger } from '../../lib/logger';
import { Schedule, SchedulerService } from './service';

// Singleton service instance
let schedulerService: SchedulerService | null = null;

/**
 * Get the scheduler service
 * @returns Scheduler service instance
 */
export function getSchedulerService(): SchedulerService {
  if (!schedulerService) {
    schedulerService = new SchedulerService();
  }
  return schedulerService;
}

/**
 * Start the job scheduler
 */
export function startJobScheduler(): void {
  try {
    const scheduler = getSchedulerService();
    scheduler.start();
    logger.info('Job scheduler started successfully');
  } catch (error) {
    logger.error('Failed to start job scheduler', { error });
    throw error;
  }
}

/**
 * Stop the job scheduler
 */
export function stopJobScheduler(): void {
  try {
    if (schedulerService) {
      schedulerService.stop();
      logger.info('Job scheduler stopped');
    }
  } catch (error) {
    logger.error('Failed to stop job scheduler', { error });
  }
}

// Export schedule types
export { Schedule, ScheduleStatus } from './service';
export { CronExpression } from './cron';

// Export scheduler operations
export const createSchedule = (schedule: Omit<Schedule, 'id' | 'createdAt' | 'updatedAt'>) => 
  getSchedulerService().createSchedule(schedule);

export const updateSchedule = (id: string, updates: Partial<Schedule>) => 
  getSchedulerService().updateSchedule(id, updates);

export const getSchedules = () => 
  getSchedulerService().getSchedules();

export const getScheduleById = (id: string) => 
  getSchedulerService().getScheduleById(id);

export const deleteSchedule = (id: string) => 
  getSchedulerService().deleteSchedule(id);

export const enableSchedule = (id: string) => 
  getSchedulerService().enableSchedule(id);

export const disableSchedule = (id: string) => 
  getSchedulerService().disableSchedule(id);

export const runScheduleNow = (id: string) => 
  getSchedulerService().runScheduleNow(id);
