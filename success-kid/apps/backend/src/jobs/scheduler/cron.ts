/**
 * Cron Expression Utilities
 * 
 * Provides utilities for working with cron expressions.
 */
import { CronJob, CronTime } from 'cron';
import { logger } from '../../lib/logger';

/**
 * Common cron expressions
 */
export enum CronExpression {
  EVERY_MINUTE = '* * * * *',
  EVERY_5_MINUTES = '*/5 * * * *',
  EVERY_10_MINUTES = '*/10 * * * *',
  EVERY_15_MINUTES = '*/15 * * * *',
  EVERY_30_MINUTES = '*/30 * * * *',
  EVERY_HOUR = '0 * * * *',
  EVERY_2_HOURS = '0 */2 * * *',
  EVERY_3_HOURS = '0 */3 * * *',
  EVERY_6_HOURS = '0 */6 * * *',
  EVERY_12_HOURS = '0 */12 * * *',
  DAILY_MIDNIGHT = '0 0 * * *',
  DAILY_MORNING = '0 8 * * *',
  DAILY_NOON = '0 12 * * *',
  DAILY_EVENING = '0 18 * * *',
  WEEKLY_SUNDAY = '0 0 * * 0',
  WEEKLY_MONDAY = '0 0 * * 1',
  MONTHLY_1ST = '0 0 1 * *',
  MONTHLY_15TH = '0 0 15 * *',
}

/**
 * Validate a cron expression
 * 
 * @param expression Cron expression to validate
 * @returns true if valid, false otherwise
 */
export function isValidCronExpression(expression: string): boolean {
  try {
    new CronTime(expression);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Get the next execution time for a cron expression
 * 
 * @param expression Cron expression
 * @param timezone Optional timezone (defaults to UTC)
 * @returns Next execution date or null if invalid
 */
export function getNextExecutionTime(expression: string, timezone = 'UTC'): Date | null {
  try {
    const job = new CronJob(expression, () => {}, null, false, timezone);
    return job.nextDate().toDate();
  } catch (error) {
    logger.error('Invalid cron expression', { expression, error });
    return null;
  }
}

/**
 * Calculate execution times for a cron expression
 * 
 * @param expression Cron expression
 * @param count Number of execution times to calculate
 * @param timezone Optional timezone (defaults to UTC)
 * @returns Array of execution dates or empty array if invalid
 */
export function getNextExecutionTimes(
  expression: string, 
  count = 5, 
  timezone = 'UTC'
): Date[] {
  try {
    const job = new CronJob(expression, () => {}, null, false, timezone);
    const times: Date[] = [];
    
    for (let i = 0; i < count; i++) {
      times.push(job.nextDate().toDate());
      // Move the internal next date calculation forward
      job.setTime(new CronTime(expression, timezone));
    }
    
    return times;
  } catch (error) {
    logger.error('Invalid cron expression', { expression, error });
    return [];
  }
}

/**
 * Describe a cron expression in human-readable format
 * 
 * @param expression Cron expression
 * @returns Human-readable description or error message
 */
export function describeCronExpression(expression: string): string {
  // This is a very simplified implementation
  // In a real application, you might want to use a library like 'cron-parser'
  try {
    switch (expression) {
      case CronExpression.EVERY_MINUTE:
        return 'Every minute';
      case CronExpression.EVERY_5_MINUTES:
        return 'Every 5 minutes';
      case CronExpression.EVERY_10_MINUTES:
        return 'Every 10 minutes';
      case CronExpression.EVERY_15_MINUTES:
        return 'Every 15 minutes';
      case CronExpression.EVERY_30_MINUTES:
        return 'Every 30 minutes';
      case CronExpression.EVERY_HOUR:
        return 'Every hour';
      case CronExpression.EVERY_2_HOURS:
        return 'Every 2 hours';
      case CronExpression.EVERY_3_HOURS:
        return 'Every 3 hours';
      case CronExpression.EVERY_6_HOURS:
        return 'Every 6 hours';
      case CronExpression.EVERY_12_HOURS:
        return 'Every 12 hours';
      case CronExpression.DAILY_MIDNIGHT:
        return 'Every day at midnight';
      case CronExpression.DAILY_MORNING:
        return 'Every day at 8:00 AM';
      case CronExpression.DAILY_NOON:
        return 'Every day at noon';
      case CronExpression.DAILY_EVENING:
        return 'Every day at 6:00 PM';
      case CronExpression.WEEKLY_SUNDAY:
        return 'Every Sunday at midnight';
      case CronExpression.WEEKLY_MONDAY:
        return 'Every Monday at midnight';
      case CronExpression.MONTHLY_1ST:
        return 'First day of every month at midnight';
      case CronExpression.MONTHLY_15TH:
        return '15th day of every month at midnight';
      default:
        return `Custom schedule (${expression})`;
    }
  } catch (error) {
    return 'Invalid cron expression';
  }
}
