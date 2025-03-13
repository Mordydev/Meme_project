/**
 * Notification Types for the Success Kid Community Platform
 */

/**
 * Notification Categories
 */
export type NotificationType = 
  | 'achievement' 
  | 'social' 
  | 'system' 
  | 'content' 
  | 'market'
  | 'points'
  | 'all';

/**
 * Notification Action
 */
export interface NotificationAction {
  label: string;
  action: string;
  url?: string;
}

/**
 * Notification Interface
 */
export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  data?: any;
  actions?: NotificationAction[];
}

/**
 * Notification Settings
 */
export interface NotificationSettings {
  categories: {
    [key in Exclude<NotificationType, 'all'>]: boolean;
  };
  delivery: {
    inApp: boolean;
    email: boolean;
    push: boolean;
  };
  frequency: 'immediate' | 'batched' | 'daily';
  quietHours: {
    enabled: boolean;
    start: string; // HH:MM format
    end: string;   // HH:MM format
    timezone: string;
  };
}

/**
 * Default Notification Settings
 */
export const defaultNotificationSettings: NotificationSettings = {
  categories: {
    achievement: true,
    social: true,
    system: true,
    content: true,
    market: true,
    points: true
  },
  delivery: {
    inApp: true,
    email: false,
    push: false
  },
  frequency: 'immediate',
  quietHours: {
    enabled: false,
    start: '22:00',
    end: '08:00',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
  }
};

/**
 * Grouped Notifications
 */
export interface GroupedNotifications {
  [date: string]: Notification[];
}
