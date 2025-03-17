/**
 * Notification Models
 * Defines the data structures for notifications throughout the platform.
 */

/**
 * Notification priority levels
 */
export enum NotificationPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent'
}

/**
 * Notification types
 */
export enum NotificationType {
  POINTS_EARNED = 'points_earned',
  POINTS_REDEEMED = 'points_redeemed',
  ACHIEVEMENT_UNLOCKED = 'achievement_unlocked',
  LEVEL_UP = 'level_up',
  WALLET_CONNECTED = 'wallet_connected',
  CONTENT_REACTION = 'content_reaction',
  CONTENT_COMMENT = 'content_comment',
  CONTENT_MENTION = 'content_mention',
  REFERRAL_SUCCESSFUL = 'referral_successful',
  MILESTONE_REACHED = 'milestone_reached',
  SYSTEM_ANNOUNCEMENT = 'system_announcement'
}

/**
 * Notification delivery channels
 */
export enum NotificationChannel {
  INAPP = 'inapp',
  EMAIL = 'email',
  PUSH = 'push'
}

/**
 * Maps notification types to relevant categories for preference filtering
 */
export const NOTIFICATION_TYPE_TO_CATEGORY: Record<NotificationType, string> = {
  [NotificationType.POINTS_EARNED]: 'points',
  [NotificationType.POINTS_REDEEMED]: 'points',
  [NotificationType.ACHIEVEMENT_UNLOCKED]: 'achievements',
  [NotificationType.LEVEL_UP]: 'achievements',
  [NotificationType.WALLET_CONNECTED]: 'system',
  [NotificationType.CONTENT_REACTION]: 'content',
  [NotificationType.CONTENT_COMMENT]: 'content',
  [NotificationType.CONTENT_MENTION]: 'content',
  [NotificationType.REFERRAL_SUCCESSFUL]: 'system',
  [NotificationType.MILESTONE_REACHED]: 'system',
  [NotificationType.SYSTEM_ANNOUNCEMENT]: 'system'
};

/**
 * Core notification interface
 */
export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  priority: NotificationPriority;
  createdAt: Date;
  updatedAt: Date;
  read: boolean;
  readAt?: Date;
  expiresAt?: Date;
}

/**
 * Interface for creating a new notification
 */
export interface CreateNotificationDto {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  priority?: NotificationPriority;
  expiresAt?: Date;
}

/**
 * Notification template interface
 */
export interface NotificationTemplate {
  id: string;
  type: NotificationType;
  titleTemplate: string;
  bodyTemplate: string;
  emailSubjectTemplate?: string;
  emailBodyTemplate?: string;
  pushTitleTemplate?: string;
  pushBodyTemplate?: string;
  dataSchema?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  version: number;
}

/**
 * Interface for creating a notification template
 */
export interface CreateTemplateDto {
  type: NotificationType;
  titleTemplate: string;
  bodyTemplate: string;
  emailSubjectTemplate?: string;
  emailBodyTemplate?: string;
  pushTitleTemplate?: string;
  pushBodyTemplate?: string;
  dataSchema?: Record<string, any>;
  version?: number;
}

/**
 * Notification delivery tracking
 */
export interface NotificationDelivery {
  id: string;
  notificationId: string;
  channel: NotificationChannel;
  status: NotificationDeliveryStatus;
  attempts: number;
  lastAttemptAt?: Date;
  deliveredAt?: Date;
  errorDetails?: string;
  externalId?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Notification delivery status
 */
export enum NotificationDeliveryStatus {
  PENDING = 'pending',
  DELIVERED = 'delivered',
  FAILED = 'failed',
  REJECTED = 'rejected',
  RETRYING = 'retrying'
}

/**
 * User notification preferences
 */
export interface NotificationPreferences {
  userId: string;
  channels: {
    [key in NotificationChannel]: boolean;
  };
  categories: {
    [category: string]: {
      enabled: boolean;
      channels: {
        [key in NotificationChannel]?: boolean;
      };
    };
  };
  quietHours: {
    enabled: boolean;
    start: string; // Format: "HH:MM"
    end: string; // Format: "HH:MM"
    timezone: string; // IANA timezone
  };
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Rendered notification content
 */
export interface RenderedNotification {
  title: string;
  body: string;
  emailSubject?: string;
  emailBody?: string;
  pushTitle?: string;
  pushBody?: string;
  data?: Record<string, any>;
}

/**
 * Notification delivery result
 */
export interface DeliveryResult {
  success: boolean;
  channel: NotificationChannel;
  deliveryId?: string;
  externalId?: string;
  errorMessage?: string;
  timestamp: Date;
}

/**
 * Options for fetching notifications
 */
export interface NotificationOptions {
  limit?: number;
  offset?: number;
  unreadOnly?: boolean;
  types?: NotificationType[];
  startDate?: Date;
  endDate?: Date;
}

/**
 * Result for paginated notification queries
 */
export interface NotificationPage {
  notifications: Notification[];
  total: number;
  unreadCount: number;
}
