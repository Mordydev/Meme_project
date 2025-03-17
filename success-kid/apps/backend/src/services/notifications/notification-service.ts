/**
 * Enhanced Notification Service
 * 
 * Central service for creating and managing notifications across channels
 */
import { Pool, PoolClient } from 'pg';
import { 
  Notification, 
  CreateNotificationDto, 
  NotificationType, 
  NotificationPriority,
  NotificationChannel,
  DeliveryResult,
  NotificationOptions,
  NotificationPage,
  RenderedNotification,
  NOTIFICATION_TYPE_TO_CATEGORY
} from '../../models/notification';
import { NotificationRepository } from '../../repositories/notification-repository';
import { NotificationPreferencesRepository } from '../../repositories/notification-preferences-repository';
import { NotificationTemplateService } from './template-service';
import { EmailNotificationService } from './email-service';
import { PushNotificationService } from './push-service';
import { WebSocketService } from '../../websockets/websocket-service';
import { eventBus, EventType } from '../../lib/event-bus';
import { logger } from '../../lib/logger';
import { UserRepository } from '../../repositories/user-repository';

/**
 * Enhanced service for managing notifications
 */
export class NotificationService {
  constructor(
    private notificationRepository: NotificationRepository,
    private preferencesRepository: NotificationPreferencesRepository,
    private templateService: NotificationTemplateService,
    private emailService?: EmailNotificationService,
    private pushService?: PushNotificationService,
    private websocketService?: WebSocketService,
    private userRepository?: UserRepository
  ) {}

  /**
   * Create and send a notification to a user across appropriate channels
   * 
   * @param params Notification parameters
   * @returns Created notification
   */
  async createNotification(params: CreateNotificationDto): Promise<Notification> {
    try {
      // Step 1: Save notification to database
      const notification = await this.notificationRepository.createNotification(params);
      
      // Step 2: Publish creation event
      await eventBus.publish(EventType.NOTIFICATION_CREATED, {
        userId: params.userId,
        notification
      });
      
      // Step 3: Send via appropriate channels based on user preferences
      await this.deliverNotification(notification);
      
      return notification;
    } catch (error) {
      logger.error('Error creating notification', { error, params });
      throw error;
    }
  }

  /**
   * Create notification with template
   * 
   * @param userId User ID
   * @param type Notification type
   * @param data Template data
   * @param options Additional options (priority, expiration)
   * @returns Created notification
   */
  async createNotificationWithTemplate(
    userId: string,
    type: NotificationType,
    data: Record<string, any>,
    options: {
      priority?: NotificationPriority;
      expiresAt?: Date;
    } = {}
  ): Promise<Notification> {
    try {
      // Step 1: Get user information if needed for personalization
      let userData = { ...data };
      
      if (this.userRepository && (!data.name || !data.displayName)) {
        try {
          const user = await this.userRepository.getUserById(userId);
          if (user) {
            userData.name = data.name || user.displayName;
            userData.displayName = data.displayName || user.displayName;
          }
        } catch (error) {
          logger.warn('Error getting user data for notification', { error, userId });
          // Continue without user data
        }
      }
      
      // Step 2: Render notification from template
      const rendered = await this.templateService.renderNotification(type, userData);
      
      // Step 3: Create notification with rendered content
      const notificationParams: CreateNotificationDto = {
        userId,
        type,
        title: rendered.title,
        message: rendered.body,
        data: { ...data, _rendered: { emailSubject: rendered.emailSubject, emailBody: rendered.emailBody } },
        priority: options.priority || NotificationPriority.NORMAL,
        expiresAt: options.expiresAt
      };
      
      return await this.createNotification(notificationParams);
    } catch (error) {
      logger.error('Error creating notification with template', { error, userId, type, data });
      throw error;
    }
  }

  /**
   * Get user's notifications with pagination and filtering
   * 
   * @param userId User ID
   * @param options Query options
   * @returns Paginated notifications with total count
   */
  async getUserNotifications(
    userId: string,
    options: NotificationOptions = {}
  ): Promise<NotificationPage> {
    try {
      return await this.notificationRepository.getUserNotifications(userId, options);
    } catch (error) {
      logger.error('Error getting user notifications', { error, userId, options });
      throw error;
    }
  }

  /**
   * Mark a notification as read
   * 
   * @param id Notification ID
   * @returns True if successful
   */
  async markAsRead(id: string): Promise<boolean> {
    try {
      const result = await this.notificationRepository.markAsRead(id);
      
      if (result) {
        // Get notification to include in event
        const notification = await this.notificationRepository.getNotificationById(id);
        
        if (notification) {
          // Publish event for real-time updates
          await eventBus.publish(EventType.NOTIFICATION_READ, {
            userId: notification.userId,
            notificationId: id
          });
        }
      }
      
      return result;
    } catch (error) {
      logger.error('Error marking notification as read', { error, id });
      throw error;
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
      const count = await this.notificationRepository.markAllAsRead(userId);
      
      if (count > 0) {
        // Publish event for real-time updates
        await eventBus.publish(EventType.NOTIFICATION_ALL_READ, {
          userId,
          count
        });
      }
      
      return count;
    } catch (error) {
      logger.error('Error marking all notifications as read', { error, userId });
      throw error;
    }
  }

  /**
   * Delete a notification
   * 
   * @param id Notification ID
   * @returns True if successful
   */
  async deleteNotification(id: string): Promise<boolean> {
    try {
      return await this.notificationRepository.deleteNotification(id);
    } catch (error) {
      logger.error('Error deleting notification', { error, id });
      throw error;
    }
  }

  /**
   * Deliver notification through appropriate channels
   * 
   * @param notification Notification to deliver
   * @returns Delivery results for each channel
   */
  private async deliverNotification(
    notification: Notification
  ): Promise<Record<NotificationChannel, DeliveryResult | null>> {
    const results: Record<NotificationChannel, DeliveryResult | null> = {
      [NotificationChannel.INAPP]: null,
      [NotificationChannel.EMAIL]: null,
      [NotificationChannel.PUSH]: null
    };
    
    try {
      // Get user's notification preferences
      const preferences = await this.preferencesRepository.getPreferences(notification.userId);
      
      // Check if user is in quiet hours
      const isInQuietHours = this.isInQuietHours(preferences.quietHours);
      const isCritical = notification.priority === NotificationPriority.URGENT;
      
      // Get category for notification type
      const category = NOTIFICATION_TYPE_TO_CATEGORY[notification.type] || 'system';
      
      // Check category-level enabled status
      const isCategoryEnabled = preferences.categories[category]?.enabled !== false;
      
      // Delivery via WebSocket (always for in-app)
      if (this.websocketService && isCategoryEnabled) {
        this.websocketService.sendToUser(notification.userId, {
          type: 'notification.new',
          data: notification
        });
        
        results[NotificationChannel.INAPP] = {
          success: true,
          channel: NotificationChannel.INAPP,
          timestamp: new Date()
        };
      }
      
      // Deliver via email
      if (
        this.emailService && 
        preferences.channels[NotificationChannel.EMAIL] === true &&
        preferences.categories[category]?.channels?.[NotificationChannel.EMAIL] !== false &&
        isCategoryEnabled &&
        (!isInQuietHours || isCritical)
      ) {
        try {
          // Get user email
          const userEmail = await this.getUserEmail(notification.userId);
          
          if (userEmail) {
            // Get rendered notification for email
            let emailContent: RenderedNotification;
            
            if (notification.data?._rendered?.emailSubject && notification.data?._rendered?.emailBody) {
              // Use pre-rendered content
              emailContent = {
                title: notification.title,
                body: notification.message,
                emailSubject: notification.data._rendered.emailSubject,
                emailBody: notification.data._rendered.emailBody
              };
            } else {
              // Render from template
              emailContent = await this.templateService.renderNotification(
                notification.type,
                { ...notification.data, title: notification.title, message: notification.message }
              );
            }
            
            // Send email
            results[NotificationChannel.EMAIL] = await this.emailService.sendEmail(
              userEmail,
              emailContent,
              notification.type
            );
          }
        } catch (error) {
          logger.error('Error sending notification email', { error, notificationId: notification.id });
          
          results[NotificationChannel.EMAIL] = {
            success: false,
            channel: NotificationChannel.EMAIL,
            errorMessage: error.message || 'Unknown error sending email',
            timestamp: new Date()
          };
        }
      }
      
      // Deliver via push notification
      if (
        this.pushService && 
        preferences.channels[NotificationChannel.PUSH] === true &&
        preferences.categories[category]?.channels?.[NotificationChannel.PUSH] !== false &&
        isCategoryEnabled &&
        (!isInQuietHours || isCritical)
      ) {
        try {
          // Get rendered notification for push
          let pushContent: RenderedNotification;
          
          if (notification.data?._rendered?.pushTitle && notification.data?._rendered?.pushBody) {
            // Use pre-rendered content
            pushContent = {
              title: notification.title,
              body: notification.message,
              pushTitle: notification.data._rendered.pushTitle,
              pushBody: notification.data._rendered.pushBody
            };
          } else {
            // Render from template
            pushContent = await this.templateService.renderNotification(
              notification.type,
              { ...notification.data, title: notification.title, message: notification.message }
            );
          }
          
          // Send push notification
          results[NotificationChannel.PUSH] = await this.pushService.sendPushNotification(
            notification.userId,
            pushContent,
            notification.type
          );
        } catch (error) {
          logger.error('Error sending push notification', { error, notificationId: notification.id });
          
          results[NotificationChannel.PUSH] = {
            success: false,
            channel: NotificationChannel.PUSH,
            errorMessage: error.message || 'Unknown error sending push notification',
            timestamp: new Date()
          };
        }
      }
      
      return results;
    } catch (error) {
      logger.error('Error delivering notification', { error, notificationId: notification.id });
      throw error;
    }
  }

  /**
   * Check if current time is within quiet hours
   * 
   * @param quietHours Quiet hours settings
   * @returns Whether current time is in quiet hours
   */
  private isInQuietHours(quietHours: {
    enabled: boolean;
    start: string;
    end: string;
    timezone: string;
  }): boolean {
    if (!quietHours.enabled) {
      return false;
    }
    
    try {
      const now = new Date();
      
      // Parse quiet hours times (format: HH:MM)
      const [startHours, startMinutes] = quietHours.start.split(':').map(Number);
      const [endHours, endMinutes] = quietHours.end.split(':').map(Number);
      
      // Get current hour and minute
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      
      // Convert to minutes for easier comparison
      const currentTimeMinutes = currentHour * 60 + currentMinute;
      const startTimeMinutes = startHours * 60 + startMinutes;
      const endTimeMinutes = endHours * 60 + endMinutes;
      
      // Check if current time is within quiet hours
      if (startTimeMinutes <= endTimeMinutes) {
        // Simple case: start time is before end time (e.g., 22:00 to 08:00)
        return currentTimeMinutes >= startTimeMinutes && currentTimeMinutes <= endTimeMinutes;
      } else {
        // Complex case: start time is after end time (e.g., 22:00 to 08:00)
        return currentTimeMinutes >= startTimeMinutes || currentTimeMinutes <= endTimeMinutes;
      }
    } catch (error) {
      logger.error('Error checking quiet hours', { error, quietHours });
      return false; // Default to not in quiet hours if there's an error
    }
  }

  /**
   * Get user's email address
   * 
   * @param userId User ID
   * @returns Email address or null if not found
   */
  private async getUserEmail(userId: string): Promise<string | null> {
    try {
      if (!this.userRepository) {
        logger.warn('User repository not available for getting email address');
        return null;
      }
      
      const user = await this.userRepository.getUserById(userId);
      return user?.email || null;
    } catch (error) {
      logger.error('Error getting user email', { error, userId });
      return null;
    }
  }

  /**
   * Maintenance task: Delete expired notifications
   * 
   * @returns Number of notifications deleted
   */
  async cleanupExpiredNotifications(): Promise<number> {
    try {
      return await this.notificationRepository.deleteExpiredNotifications();
    } catch (error) {
      logger.error('Error cleaning up expired notifications', { error });
      throw error;
    }
  }
}
