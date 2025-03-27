import { ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combines multiple class values into a single string, merging Tailwind classes efficiently
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a number to a compact representation (e.g., 1000 -> 1K, 1000000 -> 1M)
 * @param num The number to format
 * @returns Formatted number string
 */
export function formatCompactNumber(num: number): string {
  if (num === undefined || num === null) return '0';
  
  // Use Intl.NumberFormat for localized number formatting with compact notation
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(num);
}

/**
 * Format a number as currency with $ symbol and appropriate formatting
 * @param num The number to format as currency
 * @param currencyCode The currency code (default: 'USD')
 * @returns Formatted currency string
 */
export function formatCurrency(num: number, currencyCode = 'USD'): string {
  if (num === undefined || num === null) return '$0';
  
  // For large numbers (above 1 million), use compact notation
  if (num >= 1_000_000) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(num);
  }
  
  // For smaller numbers, use standard currency formatting
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currencyCode,
  }).format(num);
}

/**
 * Format a date to a human-readable relative time string (e.g., '5 minutes ago')
 * @param date The date to format
 * @returns Formatted relative time string
 */
/**
 * Format a date to a readable string format
 * @param date The date to format (string or Date)
 * @returns Formatted date string
 */
export function formatDate(date: string | Date): string {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(dateObj);
}

export function timeAgo(date: Date): string {
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  // Less than a minute
  if (seconds < 60) {
    return 'just now';
  }
  
  // Less than an hour
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  }
  
  // Less than a day
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  }
  
  // Less than a week
  const days = Math.floor(hours / 24);
  if (days < 7) {
    return days === 1 ? 'yesterday' : `${days} days ago`;
  }
  
  // Less than a month
  if (days < 30) {
    const weeks = Math.floor(days / 7);
    return `${weeks} week${weeks === 1 ? '' : 's'} ago`;
  }
  
  // Less than a year
  const months = Math.floor(days / 30);
  if (months < 12) {
    return `${months} month${months === 1 ? '' : 's'} ago`;
  }
  
  // More than a year
  const years = Math.floor(days / 365);
  return `${years} year${years === 1 ? '' : 's'} ago`;
}
