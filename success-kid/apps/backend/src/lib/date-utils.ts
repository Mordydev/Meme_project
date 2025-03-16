/**
 * Date Utility Functions
 * 
 * Provides utilities for handling dates and times across different timezones
 */
import { differenceInHours, addHours, format, parseISO, isEqual, subDays } from 'date-fns';
import { zonedTimeToUtc, utcToZonedTime } from 'date-fns-tz';
import { UserRepository } from '../repositories/user-repository';

/**
 * Default timezone if user doesn't have a preference
 */
const DEFAULT_TIMEZONE = 'UTC';

/**
 * Get a user's timezone preference
 */
export async function getUserTimezone(userId: string): Promise<string> {
  try {
    // This would typically fetch from a UserRepository
    // For now, return default timezone
    return DEFAULT_TIMEZONE;
    
    // Real implementation would look like this:
    // const userRepository = new UserRepository();
    // const preferences = await userRepository.getUserPreferences(userId);
    // return preferences?.timezone || DEFAULT_TIMEZONE;
  } catch (error) {
    return DEFAULT_TIMEZONE;
  }
}

/**
 * Get current date in user's timezone
 */
export function getCurrentDateInTimezone(timezone: string = DEFAULT_TIMEZONE): Date {
  try {
    const nowUtc = new Date();
    return utcToZonedTime(nowUtc, timezone);
  } catch (error) {
    return new Date();
  }
}

/**
 * Get previous day in user's timezone
 */
export function getPreviousDay(date: Date, timezone: string = DEFAULT_TIMEZONE): Date {
  try {
    const previousDay = subDays(date, 1);
    return utcToZonedTime(previousDay, timezone);
  } catch (error) {
    // Fallback to simple day subtraction
    const previousDay = new Date(date);
    previousDay.setDate(previousDay.getDate() - 1);
    return previousDay;
  }
}

/**
 * Check if two dates are the same day
 */
export function isSameDay(date1: Date | null, date2: Date): boolean {
  if (!date1) return false;
  
  try {
    // Format both dates to YYYY-MM-DD to compare just the day
    const day1 = format(date1, 'yyyy-MM-dd');
    const day2 = format(date2, 'yyyy-MM-dd');
    
    return day1 === day2;
  } catch (error) {
    return false;
  }
}

/**
 * Check if date is within grace period
 */
export function isWithinGracePeriod(
  lastActivityDate: Date | null, 
  currentDate: Date,
  gracePeriodHours: number = 24
): boolean {
  if (!lastActivityDate) return false;
  
  try {
    // Check if the last activity was within the grace period
    const hoursSinceLastActivity = differenceInHours(currentDate, lastActivityDate);
    return hoursSinceLastActivity <= gracePeriodHours;
  } catch (error) {
    return false;
  }
}

/**
 * Format date to ISO string compatible with PostgreSQL
 */
export function formatDateForDb(date: Date): string {
  return format(date, "yyyy-MM-dd'T'HH:mm:ss.SSSxxx");
}

/**
 * Parse ISO string to Date
 */
export function parseIsoDate(dateString: string): Date {
  return parseISO(dateString);
}

/**
 * Get the start of day in user's timezone
 */
export function getStartOfDay(date: Date, timezone: string = DEFAULT_TIMEZONE): Date {
  try {
    // Convert to user's timezone
    const zonedDate = utcToZonedTime(date, timezone);
    
    // Set to start of day
    zonedDate.setHours(0, 0, 0, 0);
    
    // Convert back to UTC
    return zonedTimeToUtc(zonedDate, timezone);
  } catch (error) {
    // Fallback
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    return startOfDay;
  }
}

/**
 * Get the end of day in user's timezone
 */
export function getEndOfDay(date: Date, timezone: string = DEFAULT_TIMEZONE): Date {
  try {
    // Convert to user's timezone
    const zonedDate = utcToZonedTime(date, timezone);
    
    // Set to end of day
    zonedDate.setHours(23, 59, 59, 999);
    
    // Convert back to UTC
    return zonedTimeToUtc(zonedDate, timezone);
  } catch (error) {
    // Fallback
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    return endOfDay;
  }
}
