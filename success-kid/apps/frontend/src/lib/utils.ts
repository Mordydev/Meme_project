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
