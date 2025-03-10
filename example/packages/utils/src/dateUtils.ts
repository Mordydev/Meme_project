import { format, formatDistance, formatRelative, differenceInSeconds } from 'date-fns';

/**
 * Format a date with a specified format string
 */
export function formatDate(date: Date | number, formatString: string = 'MMM dd, yyyy'): string {
  return format(date, formatString);
}

/**
 * Format a relative time (e.g., "5 minutes ago", "in 3 days")
 */
export function formatRelativeTime(date: Date | number, baseDate: Date = new Date()): string {
  return formatDistance(date, baseDate, { addSuffix: true });
}

/**
 * Format time remaining in a human-readable format
 */
export function formatTimeRemaining(endTime: Date | number): string {
  const now = new Date();
  const end = new Date(endTime);
  
  if (end <= now) {
    return 'Ended';
  }
  
  const diffInSeconds = differenceInSeconds(end, now);
  
  if (diffInSeconds < 60) {
    return `${diffInSeconds}s remaining`;
  }
  
  if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes}m remaining`;
  }
  
  if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours}h remaining`;
  }
  
  const days = Math.floor(diffInSeconds / 86400);
  return `${days}d remaining`;
}

/**
 * Check if a date is in the past
 */
export function isPast(date: Date | number): boolean {
  return new Date(date) < new Date();
}

/**
 * Check if a date is in the future
 */
export function isFuture(date: Date | number): boolean {
  return new Date(date) > new Date();
}
