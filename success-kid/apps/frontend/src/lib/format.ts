/**
 * Formatting utilities for market data
 */

/**
 * Format a number as currency (USD)
 * @param value The number to format
 * @param maximumFractionDigits Maximum number of fraction digits to display
 * @returns Formatted currency string
 */
export function formatCurrency(value: number | string | null | undefined, maximumFractionDigits: number = 2): string {
  // Handle undefined, null, or non-numeric values
  if (value === undefined || value === null) return '$0.00';
  
  // Convert string to number if needed
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  // Check if numValue is not a valid number
  if (isNaN(numValue)) return '$0.00';
  
  // Determine the appropriate formatting based on the value magnitude
  if (numValue >= 1000000000) {
    // For billions, show with B suffix
    return `$${(numValue / 1000000000).toFixed(1)}B`;
  } else if (numValue >= 1000000) {
    // For millions, show with M suffix
    return `$${(numValue / 1000000).toFixed(1)}M`;
  } else if (numValue >= 1000) {
    // For thousands, show with K suffix
    return `$${(numValue / 1000).toFixed(1)}K`;
  } else if (numValue < 0.01 && numValue > 0) {
    // For very small numbers, increase precision
    return `$${numValue.toFixed(4)}`;
  } else {
    // Standard formatting for other numbers
    return `$${numValue.toFixed(maximumFractionDigits)}`;
  }
}

/**
 * Format a percentage value
 * @param value The number to format as percentage
 * @param plusSign Whether to include a plus sign for positive values
 * @returns Formatted percentage string
 */
export function formatPercentage(value: number, plusSign: boolean = true): string {
  // Handle undefined or null values
  if (value === undefined || value === null) return '0%';
  
  // Determine the sign for positive values
  const sign = value > 0 && plusSign ? '+' : '';
  
  // Format with 2 decimal places for most cases
  if (Math.abs(value) < 0.1) {
    // Higher precision for very small values
    return `${sign}${value.toFixed(3)}%`;
  } else {
    return `${sign}${value.toFixed(2)}%`;
  }
}

/**
 * Format a number with appropriate separators
 * @param value The number to format
 * @param maximumFractionDigits Maximum number of fraction digits to display
 * @returns Formatted number string
 */
export function formatNumber(value: number, maximumFractionDigits: number = 0): string {
  // Handle undefined or null values
  if (value === undefined || value === null) return '0';
  
  // Determine the appropriate formatting based on the value magnitude
  if (value >= 1000000000) {
    // For billions, show with B suffix
    return `${(value / 1000000000).toFixed(1)}B`;
  } else if (value >= 1000000) {
    // For millions, show with M suffix
    return `${(value / 1000000).toFixed(1)}M`;
  } else if (value >= 1000) {
    // For thousands, show with K suffix
    return `${(value / 1000).toFixed(1)}K`;
  } else {
    // Standard formatting for other numbers
    return value.toFixed(maximumFractionDigits);
  }
}

/**
 * Format a wallet address for display (truncated)
 * @param address The wallet address to format
 * @returns Truncated wallet address
 */
export function formatWalletAddress(address: string): string {
  if (!address || address.length < 10) return address || '';
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
}

/**
 * Format a timestamp as relative time (e.g., "5 mins ago")
 * @param timestamp The timestamp (Date or string)
 * @returns Relative time string
 */
export function formatRelativeTime(timestamp: Date | string | number): string {
  const now = new Date();
  const date = typeof timestamp === 'string' || typeof timestamp === 'number' 
    ? new Date(timestamp) 
    : timestamp;
  
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (seconds < 60) {
    return `${seconds} sec${seconds !== 1 ? 's' : ''} ago`;
  }
  
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes} min${minutes !== 1 ? 's' : ''} ago`;
  }
  
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  }
  
  const days = Math.floor(hours / 24);
  if (days < 30) {
    return `${days} day${days !== 1 ? 's' : ''} ago`;
  }
  
  const months = Math.floor(days / 30);
  if (months < 12) {
    return `${months} month${months !== 1 ? 's' : ''} ago`;
  }
  
  const years = Math.floor(months / 12);
  return `${years} year${years !== 1 ? 's' : ''} ago`;
}

/**
 * Format a date for display
 * @param date The date to format
 * @param options Formatting options
 * @returns Formatted date string
 */
export function formatDate(date: Date | string, options: Intl.DateTimeFormatOptions = {}): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  // Default options for date formatting
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options
  };
  
  return new Intl.DateTimeFormat('en-US', defaultOptions).format(dateObj);
}

/**
 * Format a date and time for display
 * @param date The date to format
 * @returns Formatted date and time string
 */
export function formatDateTime(date: Date | string): string {
  return formatDate(date, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Determine the color class based on value comparison
 * @param value The value to check
 * @param isPositiveGood Whether positive values are considered good
 * @returns CSS class name
 */
export function getValueColorClass(value: number, isPositiveGood: boolean = true): string {
  if (value === 0) {
    return 'text-neutral-500';
  }
  
  const isPositive = value > 0;
  const isGood = isPositiveGood ? isPositive : !isPositive;
  
  return isGood ? 'text-accent-500' : 'text-alert-500';
}