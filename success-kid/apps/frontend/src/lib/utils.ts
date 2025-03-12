import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combines multiple class values into a single className string
 * using clsx and tailwind-merge to handle conflicts
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a number as currency
 * @param value - The number to format
 * @param currency - The currency code (default: USD)
 * @param locale - The locale to use for formatting (default: en-US)
 */
export function formatCurrency(
  value: number,
  currency = "USD",
  locale = "en-US"
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  }).format(value);
}

/**
 * Formats a number with compact notation (e.g., 1.2k, 5.3M)
 * @param value - The number to format
 * @param locale - The locale to use for formatting (default: en-US)
 */
export function formatCompactNumber(
  value: number,
  locale = "en-US"
): string {
  return new Intl.NumberFormat(locale, {
    notation: "compact",
  }).format(value);
}

/**
 * Truncates a string to a specified length
 * @param str - The string to truncate
 * @param maxLength - Maximum length before truncation
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength) + "...";
}

/**
 * Formats a date or timestamp into a human-readable string
 * @param date - The date to format
 * @param locale - The locale to use for formatting (default: en-US)
 */
export function formatDate(
  date: Date | string | number,
  locale = "en-US"
): string {
  const dateObj = date instanceof Date ? date : new Date(date);
  return dateObj.toLocaleDateString(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * Creates a relative time string (e.g., "5 minutes ago", "2 days ago")
 * @param date - The date to format
 * @param locale - The locale to use for formatting (default: en-US)
 */
export function timeAgo(
  date: Date | string | number,
  locale = "en-US"
): string {
  const dateObj = date instanceof Date ? date : new Date(date);
  const formatter = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);
  
  if (diffInSeconds < 60) {
    return formatter.format(-diffInSeconds, "second");
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return formatter.format(-diffInMinutes, "minute");
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return formatter.format(-diffInHours, "hour");
  }
  
  const diffInDays = Math.floor(diffInHours / 24);
  return formatter.format(-diffInDays, "day");
}
