import { UserResource } from '@clerk/types';

/**
 * Format a user's display name based on available information
 */
export function formatDisplayName(user: UserResource | null): string {
  if (!user) return 'Anonymous User';
  
  if (user.firstName && user.lastName) {
    return `${user.firstName} ${user.lastName}`;
  }
  
  if (user.firstName) {
    return user.firstName;
  }
  
  if (user.username) {
    return user.username;
  }
  
  return `User ${user.id.substring(0, 6)}`;
}

/**
 * Format a date in a human-readable format
 */
export function formatJoinDate(date: string | Date): string {
  const joinDate = new Date(date);
  const now = new Date();
  
  // If date is within the last 24 hours
  const diffInHours = (now.getTime() - joinDate.getTime()) / (1000 * 60 * 60);
  
  if (diffInHours < 24) {
    return 'Today';
  }
  
  // If date is within the last 7 days
  const diffInDays = diffInHours / 24;
  
  if (diffInDays < 7) {
    return `${Math.floor(diffInDays)} days ago`;
  }
  
  // If date is within the current year
  if (joinDate.getFullYear() === now.getFullYear()) {
    return joinDate.toLocaleDateString(undefined, { month: 'long', day: 'numeric' });
  }
  
  // Otherwise, show full date
  return joinDate.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
}

/**
 * Get relative time (e.g., "5 minutes ago") from a timestamp
 */
export function getRelativeTime(timestamp: string): string {
  const now = new Date();
  const date = new Date(timestamp);
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 604800)}w ago`;
  
  return date.toLocaleDateString();
}

/**
 * Group a list of items by date
 */
export function groupByDate<T extends { timestamp: string }>(items: T[]): Record<string, T[]> {
  const groups: Record<string, T[]> = {};
  
  items.forEach(item => {
    const date = new Date(item.timestamp).toLocaleDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(item);
  });
  
  return groups;
}

/**
 * Get display text for a date (Today, Yesterday, or the date)
 */
export function getDateDisplayText(dateString: string): string {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  if (date.toDateString() === today.toDateString()) {
    return 'Today';
  }
  
  if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  }
  
  return date.toLocaleDateString();
}
