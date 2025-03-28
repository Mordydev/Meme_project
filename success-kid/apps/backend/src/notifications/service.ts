/**
 * Notification Service
 * 
 * Central service for handling notification creation and delivery across channels.
 */
import { v4 as uuid } from 'uuid';
import {
  Notification,
  NotificationFilter,
  NotificationChannel,
  NotificationStatus,
  CreateNotificationDto,
  DeliveryResult,
} from './models';
import { notificationRepository } from './repository';
import { inAppChannel } from './channels/inapp';
import { emailChannel } from './channels/email';
import { pushChannel } from './channels/push';
import { preferencesService } from './preferences/service';
import { templateService } from './templates/service';
import { logger } from '../lib/logger';
import { eventBus, EventType } from '../lib/event-bus';

/**
 * Notification Service class
 */
export class NotificationService {
  private channels: Record<NotificationChannel, any> = {
    [NotificationChannel.INAPP]: inAppChannel,
    [NotificationChannel.EMAIL]: emailChannel,
    [NotificationChannel.PUSH]: pushChannel,
  };

  /**
   * Create a new notification
   * 
   * @param notification Notification data to create
   * @returns Created notification
   */
  async createNotification(notification: CreateNotificationDto): Promise<Notification> {
    try {
      // Create notification record
      const created = await notificationRepository.create(notification);
      
      // Emit event for real-time updates
      eventBus.publish(EventType.NOTIFICATION_CREATED, {
        notificationId: created.id,
        userId: created.user_id,
        type: created.type
      });
      
      // Queue for delivery (async)
      this.queueNotificationForDelivery(created);
      
      logger.debug('Notification created', { 
        id: created.id, 
        userId: created.user_id, 
        type: created.type 
      });
      
      return created;
    } catch (error) {
      logger.error('Failed to create notification', { error, userId: notification.userId });
      throw new Error('Failed to create notification');
    }
  }

  /**
   * Queue notification for delivery
   * 
   * @param notification Notification to deliver
   */
  private async queueNotificationForDelivery(notification: Notification): Promise<void> {
    try {
      // Don't process expired notifications
      if (notification.expires_at && notification.expires_at < new Date()) {
        await notificationRepository.update(notification.id, { 
          status: NotificationStatus.EXPIRED 
        });
        return;
      }

      // Process async for better performance
      setImmediate(async () => {
        await this.processNotificationDelivery(notification);
      });
    } catch (error) {
      logger.error('Failed to queue notification for delivery', { 
        error, 
        notificationId: notification.id 
      });
    }
  }

  /**
   * Process notification delivery to all channels
   * 
   * @param notification Notification to deliver
   */
  private async processNotificationDelivery(notification: Notification): Promise<void> {
    try {
      const userId = notification.user_id;
      const preferences = await preferencesService.getPreferences(userId);
      const results: Record<string, DeliveryResult> = {};
      
      // Process each enabled channel
      for (const channel of notification.channels) {
        // Skip if channel is disabled in user preferences
        if (!this.isChannelEnabled(preferences, notification.type, channel)) {
          results[channel] = {
            channel,
            success: false,
            timestamp: new Date(),
            error: 'Channel disabled by user preferences',
            retryCount: 0
          };
          continue;
        }
        
        try {
          // Get template for this channel and notification type
          const template = await templateService.getTemplate(notification.type, channel);
          
          // Skip if no template for this channel
          if (!template) {
            results[channel] = {
              channel,
              success: false,
              timestamp: new Date(),
              error: 'No template available for this channel',
              retryCount: 0
            };
            continue;
          }
          
          // Render template with notification data
          const renderedContent = await templateService.renderTemplate(
            template,
            {
              ...notification.data,
              title: notification.title,
              body: notification.body,
              userId: notification.user_id
            },
            channel
          );
          
          // Send to channel
          const channelResult = await this.channels[channel].send(
            userId,
            renderedContent,
            notification
          );
          
          results[channel] = {
            ...channelResult,
            channel,
            timestamp: new Date()
          };
        } catch (error) {
          logger.error(`Error delivering notification to ${channel}`, { 
            error, 
            notificationId: notification.id,
            userId
          });
          
          results[channel] = {
            channel,
            success: false,
            timestamp: new Date(),
            error: error.message || 'Delivery failed',
            retryCount: 0
          };
        }
      }
      
      // Determine overall status
      const allFailed = Object.values(results).every(r => !r.success);
      const someSucceeded = Object.values(results).some(r => r.success);
      
      const newStatus = allFailed 
        ? NotificationStatus.FAILED 
        : (someSucceeded ? NotificationStatus.DELIVERED : NotificationStatus.PENDING);
      
      // Update notification with delivery results
      await notificationRepository.update(notification.id, {
        status: newStatus,
        deliveryStatus: results
      });
      
      // Emit event for successful delivery
      if (someSucceeded) {
        eventBus.publish(EventType.NOTIFICATION_DELIVERED, {
          notificationId: notification.id,
          userId: notification.user_id,
          type: notification.type,
          channels: Object.keys(results).filter(channel => results[channel].success)
        });
      }
      
      logger.debug('Notification delivery processed', { 
        id: notification.id, 
        userId: notification.user_id, 
        results: Object.keys(results).map(k => `${k}: ${results[k].success}`)
      });
    } catch (error) {
      logger.error('Failed to process notification delivery', { 
        error, 
        notificationId: notification.id 
      });
    }
  }

  /**
   * Check if a notification channel is enabled based on user preferences
   * 
   * @param preferences User preferences
   * @param notificationType Notification type
   * @param channel Channel to check
   * @returns Whether the channel is enabled
   */
  private isChannelEnabled(
    preferences: any,
    notificationType: string,
    channel: NotificationChannel
  ): boolean {
    // Check master switch for the channel
    if (!preferences.channels?.[channel]) {
      return false;
    }
    
    // Check quiet hours
    if (this.isInQuietHours(preferences) && channel !== NotificationChannel.INAPP) {
      return false;
    }
    
    // Check notification type preferences
    const typePreference = preferences.types?.[notificationType];
    if (typePreference && typePreference.channels) {
      return !!typePreference.channels[channel];
    }
    
    // Check category preferences
    const category = this.getCategoryForType(notificationType);
    const categoryPreference = preferences.categories?.[category];
    if (categoryPreference && categoryPreference.channels) {
      return !!categoryPreference.channels[channel];
    }
    
    // Default to master switch value
    return !!preferences.channels?.[channel];
  }

  /**
   * Check if current time is within quiet hours
   * 
   * @param preferences User preferences
   * @returns Whether current time is in quiet hours
   */
  private isInQuietHours(preferences: any): boolean {
    const quietHours = preferences.quietHours;
    if (!quietHours?.enabled) {
      return false;
    }
    
    // Get current time in user timezone
    const now = new Date();
    const userTz = quietHours.timezone || 'UTC';
    const userTime = new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: 'numeric',
      hour12: false,
      timeZone: userTz
    }).format(now);
    
    // Parse start and end times
    const currentTime = this.parseTime(userTime);
    const startTime = this.parseTime(quietHours.start);
    const endTime = this.parseTime(quietHours.end);
    
    // Handle cases where end time is on the next day
    if (startTime > endTime) {
      return currentTime >= startTime || currentTime <= endTime;
    } else {
      return currentTime >= startTime && currentTime <= endTime;
    }
  }

  /**
   * Parse time string to minutes since midnight
   * 
   * @param timeStr Time string in format HH:MM
   * @returns Minutes since midnight
   */
  private parseTime(timeStr: string): number {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  }

  /**
   * Get the category for a notification type
   * 
   * @param type Notification type
   * @returns Category
   */
  private getCategoryForType(type: string): string {
    const typeToCategory: Record<string, string> = {
      'points.awarded': 'points',
      'points.redeemed': 'points',
      'achievement.unlocked': 'achievements',
      'content.created': 'content',
      'content.commented': 'content',
      'content.reaction': 'content',
      'user.levelUp': 'system',
      'wallet.connected': 'wallet',
      'milestone.reached': 'community',
      'referral.attributed': 'community',
    };
    
    return typeToCategory[type] || 'system';
  }

  /**
   * Get notifications for a user
   * 
   * @param userId User ID
   * @param filter Filter options
   * @returns List of notifications
   */
  async getUserNotifications(userId: string, filter: NotificationFilter = {}): Promise<Notification[]> {
    try {
      return await notificationRepository.getForUser(userId, filter);
    } catch (error) {
      logger.error('Failed to get user notifications', { error, userId });
      throw new Error('Failed to get notifications');
    }
  }

  /**
   * Count unread notifications for a user
   * 
   * @param userId User ID
   * @returns Count of unread notifications
   */
  async countUnreadNotifications(userId: string): Promise<number> {
    try {
      return await notificationRepository.countUnread(userId);
    } catch (error) {
      logger.error('Failed to count unread notifications', { error, userId });
      throw new Error('Failed to count unread notifications');
    }
  }

  /**
   * Mark a notification as read
   * 
   * @param notificationId Notification ID
   * @param userId User ID for verification
   * @returns Updated notification
   */
  async markAsRead(notificationId: string, userId: string): Promise<Notification | null> {
    try {
      // Get notification to verify ownership
      const notification = await notificationRepository.getById(notificationId);
      
      if (!notification) {
        return null;
      }
      
      // Verify user owns the notification
      if (notification.user_id !== userId) {
        logger.warn('User attempted to mark someone else\'s notification as read', { 
          notificationId, 
          userId, 
          ownerId: notification.user_id 
        });
        return null;
      }
      
      // Skip if already read
      if (notification.status === NotificationStatus.READ) {
        return notification;
      }
      
      // Mark as read
      const updated = await notificationRepository.markRead(notificationId);
      
      // Emit event
      if (updated) {
        eventBus.publish(EventType.NOTIFICATION_READ, {
          notificationId,
          userId,
          type: notification.type
        });
      }
      
      return updated;
    } catch (error) {
      logger.error('Failed to mark notification as read', { error, notificationId, userId });
      throw new Error('Failed to update notification');
    }
  }

  /**
   * Mark all notifications as read for a user
   * 
   * @param userId User ID
   * @returns Number of notifications marked as read
   */
  async markAllAsRead(userId: string): Promise<number> {
    try {
      const count = await notificationRepository.markAllRead(userId);
      
      // Emit event if any notifications were updated
      if (count > 0) {
        eventBus.publish(EventType.NOTIFICATIONS_CLEARED, {
          userId,
          count
        });
      }
      
      return count;
    } catch (error) {
      logger.error('Failed to mark all notifications as read', { error, userId });
      throw new Error('Failed to update notifications');
    }
  }
}

// Export singleton instance
export const notificationService = new NotificationService();
