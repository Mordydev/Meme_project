import { formatDistanceToNowStrict, format as dateFormat, formatDistance } from 'date-fns';

/**
 * Format a date as a relative time (e.g. "5 minutes ago")
 */
export function formatRelativeTime(date: Date | string | number): string {
  if (!date) return '';
  
  const dateObj = date instanceof Date ? date : new Date(date);
  
  // For recent times (< 1 hour), use more specific formatting
  const diffMs = Date.now() - dateObj.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  
  if (diffSeconds < 5) {
    return 'just now';
  } else if (diffSeconds < 60) {
    return `${diffSeconds} seconds ago`;
  } else if (diffSeconds < 3600) {
    const minutes = Math.floor(diffSeconds / 60);
    return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
  }
  
  // For older times, use the library
  try {
    return formatDistanceToNowStrict(dateObj, { addSuffix: true });
  } catch (error) {
    console.error('Date formatting error:', error);
    return 'unknown time';
  }
}

/**
 * Format a date in a readable format based on how recent it is
 */
export function formatDynamicDate(date: Date | string | number): string {
  if (!date) return '';
  
  const dateObj = date instanceof Date ? date : new Date(date);
  const now = new Date();
  
  // If today, show time
  if (dateObj.toDateString() === now.toDateString()) {
    return dateFormat(dateObj, 'h:mm a');
  }
  
  // If this year, show month and day
  if (dateObj.getFullYear() === now.getFullYear()) {
    return dateFormat(dateObj, 'MMM d');
  }
  
  // Otherwise show month, day, year
  return dateFormat(dateObj, 'MMM d, yyyy');
}

/**
 * Format a duration (in seconds) in a readable format
 */
export function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${seconds} ${seconds === 1 ? 'second' : 'seconds'}`;
  } else if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`;
  } else if (seconds < 86400) {
    const hours = Math.floor(seconds / 3600);
    return `${hours} ${hours === 1 ? 'hour' : 'hours'}`;
  } else {
    const days = Math.floor(seconds / 86400);
    return `${days} ${days === 1 ? 'day' : 'days'}`;
  }
}

/**
 * Format a monetary value as a currency string
 */
export function formatCurrency(
  value: number,
  currency: string = 'USD',
  options: Intl.NumberFormatOptions = {}
): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    ...options,
  }).format(value);
}

/**
 * Format a distance between dates in a readable way (e.g. "5 days")
 */
export function formatTimeDistance(
  dateA: Date | number,
  dateB: Date | number = new Date()
): string {
  return formatDistance(dateA, dateB, { addSuffix: false });
}

/**
 * Format a date in a standard format (e.g. "Jan 5, 2023")
 */
export const format = dateFormat;
