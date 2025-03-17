/**
 * Notification Models
 * 
 * Defines the data structures for notifications and related entities.
 */
import { z } from 'zod';

/**
 * Notification channel types
 */
export enum NotificationChannel {
  INAPP = 'inapp',   // In-app notifications
  EMAIL = 'email',   // Email notifications
  PUSH = 'push',     // Push notifications
}

/**
 * Notification category types
 */
export enum NotificationCategory {
  POINTS = 'points',              // Points-related notifications
  ACHIEVEMENTS = 'achievements',  // Achievement notifications
  CONTENT = 'content',            // Content and engagement notifications
  SYSTEM = 'system',              // System notifications
  WALLET = 'wallet',              // Wallet and token notifications
  COMMUNITY = 'community',        // Community-related notifications
  MARKETING = 'marketing',        // Marketing and promotional notifications
}

/**
 * Notification status types
 */
export enum NotificationStatus {
  PENDING = 'pending',      // Queued for delivery
  DELIVERED = 'delivered',  // Successfully delivered
  READ = 'read',            // Read by the user
  FAILED = 'failed',        // Delivery failed
  CANCELED = 'canceled',    // Canceled before delivery
  EXPIRED = 'expired',      // Expired before delivery or reading
}

/**
 * Notification importance levels
 */
export enum NotificationImportance {
  LOW = 'low',           // Non-critical information
  MEDIUM = 'medium',     // Important but not urgent
  HIGH = 'high',         // Important and somewhat urgent
  CRITICAL = 'critical', // Critical information requiring attention
}

/**
 * Notification schema for database
 */
export const notificationSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string(),
  type: z.string(),
  category: z.nativeEnum(NotificationCategory),
  title: z.string(),
  body: z.string(),
  image_url: z.string().optional(),
  data: z.record(z.any()).optional(),
  importance: z.nativeEnum(NotificationImportance).default(NotificationImportance.MEDIUM),
  status: z.nativeEnum(NotificationStatus).default(NotificationStatus.PENDING),
  channels: z.array(z.nativeEnum(NotificationChannel)),
  delivery_status: z.record(z.string()).optional(),
  created_at: z.date(),
  updated_at: z.date(),
  delivered_at: z.date().optional(),
  read_at: z.date().optional(),
  expires_at: z.date().optional(),
});

/**
 * Notification type
 */
export type Notification = z.infer<typeof notificationSchema>;

/**
 * Create notification DTO schema
 */
export const createNotificationDtoSchema = z.object({
  userId: z.string(),
  type: z.string(),
  category: z.nativeEnum(NotificationCategory),
  title: z.string(),
  body: z.string(),
  imageUrl: z.string().optional(),
  data: z.record(z.any()).optional(),
  importance: z.nativeEnum(NotificationImportance).default(NotificationImportance.MEDIUM),
  channels: z.array(z.nativeEnum(NotificationChannel)),
  expiresAt: z.date().optional(),
});

/**
 * Create notification DTO type
 */
export type CreateNotificationDto = z.infer<typeof createNotificationDtoSchema>;

/**
 * Notification delivery result schema
 */
export const deliveryResultSchema = z.object({
  channel: z.nativeEnum(NotificationChannel),
  success: z.boolean(),
  messageId: z.string().optional(),
  timestamp: z.date(),
  error: z.string().optional(),
  retryCount: z.number().default(0),
  nextRetry: z.date().optional(),
});

/**
 * Notification delivery result type
 */
export type DeliveryResult = z.infer<typeof deliveryResultSchema>;

/**
 * Notification filter options schema
 */
export const notificationFilterSchema = z.object({
  status: z.nativeEnum(NotificationStatus).optional(),
  category: z.nativeEnum(NotificationCategory).optional(),
  channel: z.nativeEnum(NotificationChannel).optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  limit: z.number().default(20),
  offset: z.number().default(0),
  includeRead: z.boolean().default(false),
});

/**
 * Notification filter options type
 */
export type NotificationFilter = z.infer<typeof notificationFilterSchema>;

/**
 * Notification update DTO schema
 */
export const updateNotificationDtoSchema = z.object({
  status: z.nativeEnum(NotificationStatus).optional(),
  deliveryStatus: z.record(z.string()).optional(),
  readAt: z.date().optional(),
});

/**
 * Notification update DTO type
 */
export type UpdateNotificationDto = z.infer<typeof updateNotificationDtoSchema>;
