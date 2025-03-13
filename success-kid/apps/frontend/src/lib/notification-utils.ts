/**
 * Notification utilities
 */

import { formatDistanceToNow, isToday, isYesterday, format } from 'date-fns';
import { Notification, NotificationType } from '@/store/useNotificationStore';

/**
 * Format a notification date into a human-readable string
 * @param date The date to format
 * @returns A human-readable string representation of the date
 */
export function formatNotificationDate(date: string | Date): string {
  const notificationDate = typeof date === 'string' ? new Date(date) : date;
  
  if (isToday(notificationDate)) {
    return formatDistanceToNow(notificationDate, { addSuffix: true });
  } else if (isYesterday(notificationDate)) {
    return 'Yesterday';
  } else {
    return format(notificationDate, 'MMM d, yyyy');
  }
}

/**
 * Group notifications by date
 * @param notifications Array of notifications to group
 * @returns Object with date groups as keys and notification arrays as values
 */
export function groupNotificationsByDate(
  notifications: Notification[]
): Record<string, Notification[]> {
  const groups: Record<string, Notification[]> = {};
  
  for (const notification of notifications) {
    const date = new Date(notification.createdAt);
    
    let groupKey: string;
    
    if (isToday(date)) {
      groupKey = 'Today';
    } else if (isYesterday(date)) {
      groupKey = 'Yesterday';
    } else {
      groupKey = format(date, 'MMMM d, yyyy');
    }
    
    if (!groups[groupKey]) {
      groups[groupKey] = [];
    }
    
    groups[groupKey].push(notification);
  }
  
  return groups;
}

/**
 * Get the display name for a notification type
 * @param type Notification type
 * @returns Display name for the type
 */
export function getNotificationTypeName(type: NotificationType): string {
  switch (type) {
    case 'achievement':
      return 'Achievement';
    case 'social':
      return 'Social';
    case 'content':
      return 'Content';
    case 'market':
      return 'Market';
    case 'system':
      return 'System';
    default:
      return 'All';
  }
}

/**
 * Get the color for a notification type
 * @param type Notification type
 * @returns Tailwind color class for the type
 */
export function getNotificationTypeColor(type: NotificationType): string {
  switch (type) {
    case 'achievement':
      return 'bg-success-100 text-success-800 dark:bg-success-800/20 dark:text-success-300';
    case 'social':
      return 'bg-secondary-100 text-secondary-800 dark:bg-secondary-800/20 dark:text-secondary-300';
    case 'content':
      return 'bg-primary-100 text-primary-800 dark:bg-primary-800/20 dark:text-primary-300';
    case 'market':
      return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-800/20 dark:text-indigo-300';
    case 'system':
      return 'bg-neutral-100 text-neutral-800 dark:bg-neutral-800/20 dark:text-neutral-300';
    default:
      return 'bg-primary-100 text-primary-800 dark:bg-primary-800/20 dark:text-primary-300';
  }
}
