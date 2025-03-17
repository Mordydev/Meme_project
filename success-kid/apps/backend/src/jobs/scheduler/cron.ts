/**
 * Cron Utilities
 * 
 * Utilities for working with cron expressions
 */

// Validate cron expression format
export function isValidCronExpression(expression: string): boolean {
  // Simple regex for cron expression validation
  // Format: second minute hour day-of-month month day-of-week
  // Each field can be a number, range, or step value
  const cronRegex = /^(\*|([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])|\*\/([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])|([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])-([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])) (\*|([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])|\*\/([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])|([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])-([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])) (\*|([0-9]|1[0-9]|2[0-3])|\*\/([0-9]|1[0-9]|2[0-3])|([0-9]|1[0-9]|2[0-3])-([0-9]|1[0-9]|2[0-3])) (\*|([1-9]|[12][0-9]|3[01])|\*\/([1-9]|[12][0-9]|3[01])|([1-9]|[12][0-9]|3[01])-([1-9]|[12][0-9]|3[01])) (\*|([1-9]|1[0-2])|\*\/([1-9]|1[0-2])|([1-9]|1[0-2])-([1-9]|1[0-2])) (\*|([0-6])|\*\/([0-6])|([0-6])-([0-6]))$/;
  
  return cronRegex.test(expression);
}

// Calculate next execution time for a cron expression
export function getNextExecutionTime(
  cronExpression: string,
  timezone: string = 'UTC',
  baseTime: Date = new Date()
): Date {
  // This is a simplified implementation
  // For production use, consider a library like 'cron-parser' or 'node-cron'
  
  // Parse the cron expression
  const [second, minute, hour, dayOfMonth, month, dayOfWeek] = cronExpression.split(' ');
  
  // Start with the base time
  const nextDate = new Date(baseTime);
  
  // Set to the next second, minute, hour
  if (second === '*') {
    nextDate.setSeconds(nextDate.getSeconds() + 1);
  } else {
    const secondValue = parseInt(second, 10);
    if (secondValue <= nextDate.getSeconds()) {
      nextDate.setMinutes(nextDate.getMinutes() + 1);
    }
    nextDate.setSeconds(secondValue);
  }
  
  if (minute === '*') {
    // Keep the current minute
  } else {
    const minuteValue = parseInt(minute, 10);
    if (minuteValue < nextDate.getMinutes()) {
      nextDate.setHours(nextDate.getHours() + 1);
    }
    nextDate.setMinutes(minuteValue);
  }
  
  if (hour === '*') {
    // Keep the current hour
  } else {
    const hourValue = parseInt(hour, 10);
    if (hourValue < nextDate.getHours()) {
      nextDate.setDate(nextDate.getDate() + 1);
    }
    nextDate.setHours(hourValue);
  }
  
  // Note: This is a simplified implementation
  // For production use with complex cron expressions,
  // use a comprehensive cron parsing library
  
  return nextDate;
}

// Common cron expressions
export const CronExpressions = {
  EVERY_MINUTE: '0 * * * * *',
  EVERY_HOUR: '0 0 * * * *',
  EVERY_DAY_MIDNIGHT: '0 0 0 * * *',
  EVERY_WEEK_SUNDAY: '0 0 0 * * 0',
  EVERY_MONTH_FIRST: '0 0 0 1 * *',
};

// Describe a cron expression in human-readable format
export function describeCronExpression(cronExpression: string): string {
  // Map common expressions to human-readable descriptions
  const descriptions: Record<string, string> = {
    [CronExpressions.EVERY_MINUTE]: 'Every minute',
    [CronExpressions.EVERY_HOUR]: 'Every hour',
    [CronExpressions.EVERY_DAY_MIDNIGHT]: 'Every day at midnight',
    [CronExpressions.EVERY_WEEK_SUNDAY]: 'Every Sunday at midnight',
    [CronExpressions.EVERY_MONTH_FIRST]: 'First day of every month at midnight',
  };
  
  return descriptions[cronExpression] || 'Custom schedule';
}
