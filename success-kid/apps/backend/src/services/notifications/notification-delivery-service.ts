/**
 * Notification Delivery Service
 * 
 * Handles the delivery of notifications through multiple channels,
 * including WebSockets, in-app, push notifications, and email.
 */
import { Pool } from 'pg';
import { Redis } from 'ioredis';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../../lib/logger';
import { EventBus, EventType } from '../../lib/event-bus';
import { WebSocketService } from '../../websockets/websocket-service';
import { NotificationRepository } from '../../repositories/notification-repository';
import { NotificationPreferencesRepository } from '../../repositories/notification-preferences-repository';
import { NotificationTemplateRepository } from '../../repositories/notification-template-repository';
import { NotificationStatus } from '../../models/notification';

/**
 * Notification delivery options
 */
export interface NotificationDeliveryOptions {
  /** Prioritize notification (affects delivery speed) */
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  
  /** Notification channels to use */
  channels?: Array<'websocket' | 'in-app' | 'push' | 'email'>;
  
  /** Override user preferences */
  forceDelivery?: boolean;
  
  /** Template variables */
  variables?: Record<string, any>;
  
  /** Data to save with notification */
  data?: Record<string, any>;
  
  /** Category for grouping */
  category?: string;
  
  /** Expire time in seconds (0 for never) */
  expireIn?: number;
  
  /** Send as batch with other notifications */
  batch?: boolean;
  
  /** Collapse notifications with same key */
  collapseKey?: string;
  
  /** Additional metadata */
  metadata?: Record<string, any>;
}

/**
 * Default notification delivery options
 */
const DEFAULT_DELIVERY_OPTIONS: Required<NotificationDeliveryOptions> = {
  priority: 'normal',
  channels: ['websocket', 'in-app'],
  forceDelivery: false,
  variables: {},
  data: {},
  category: 'general',
  expireIn: 30 * 24 * 60 * 60, // 30 days
  batch: false,
  collapseKey: '',
  metadata: {}
};

/**
 * Delivery result for a notification
 */
export interface DeliveryResult {
  /** Notification ID */
  id: string;
  
  /** Whether delivery succeeded */
  success: boolean;
  
  /** Delivery status by channel */
  channels: Record<string, boolean>;
  
  /** Error message if any */
  error?: string;
}

/**
 * Service to handle notification delivery across multiple channels
 */
export class NotificationDeliveryService {
  private notificationRepository: NotificationRepository;
  private preferencesRepository: NotificationPreferencesRepository;
  private templateRepository: NotificationTemplateRepository;
  private eventBus: EventBus;
  private websocketService: WebSocketService;
  private redis: Redis;
  
  /**
   * Create notification delivery service
   * @param db Database connection pool
   * @param redis Redis client
   * @param eventBus Event bus instance
   * @param websocketService WebSocket service
   */
  constructor(
    db: Pool,
    redis: Redis,
    eventBus: EventBus,
    websocketService: WebSocketService
  ) {
    this.notificationRepository = new NotificationRepository(db);
    this.preferencesRepository = new NotificationPreferencesRepository(db);
    this.templateRepository = new NotificationTemplateRepository(db);
    this.redis = redis;
    this.eventBus = eventBus;
    this.websocketService = websocketService;
    
    // Subscribe to notification events
    this.setupEventSubscriptions();
  }
  
  /**
   * Send a notification to a user
   * @param userId User ID to notify
   * @param type Notification type
   * @param options Delivery options
   * @returns Delivery result
   */
  async notify(
    userId: string,
    type: string,
    options: NotificationDeliveryOptions = {}
  ): Promise<DeliveryResult> {
    try {
      // Merge options with defaults
      const fullOptions: Required<NotificationDeliveryOptions> = {
        ...DEFAULT_DELIVERY_OPTIONS,
        ...options
      };
      
      // Generate notification ID
      const notificationId = uuidv4();
      
      // Check user preferences if not forcing delivery
      if (!fullOptions.forceDelivery) {
        const shouldNotify = await this.shouldNotifyUser(userId, type);
        if (!shouldNotify) {
          return {
            id: notificationId,
            success: false,
            channels: {},
            error: 'User has disabled this notification type'
          };
        }
      }
      
      // Get notification content from template
      const content = await this.formatNotificationContent(type, fullOptions.variables);
      
      // Initialize delivery status by channel
      const channelStatus: Record<string, boolean> = {};
      let anyChannelSucceeded = false;
      
      // Create notification record
      const notification = await this.notificationRepository.createNotification({
        id: notificationId,
        userId,
        type,
        title: content.title,
        body: content.body,
        data: fullOptions.data,
        priority: fullOptions.priority,
        category: fullOptions.category,
        status: NotificationStatus.PENDING,
        createdAt: new Date(),
        expiresAt: fullOptions.expireIn > 0 
          ? new Date(Date.now() + fullOptions.expireIn * 1000)
          : undefined,
        metadata: {
          ...fullOptions.metadata,
          collapseKey: fullOptions.collapseKey,
          channels: fullOptions.channels
        }
      });
      
      // Attempt delivery via each channel
      for (const channel of fullOptions.channels) {
        try {
          let channelSuccess = false;
          
          switch (channel) {
            case 'websocket':
              // Deliver via WebSocket
              channelSuccess = await this.deliverViaWebSocket(userId, notification);
              break;
              
            case 'in-app':
              // Mark as delivered for in-app
              // (In-app notifications are just stored and retrieved by the client)
              channelSuccess = true;
              break;
            
            case 'push':
              // Deliver via push notification (implementation omitted)
              // This would use a push notification service like Firebase or OneSignal
              channelSuccess = false; // Not implemented yet
              break;
            
            case 'email':
              // Deliver via email (implementation omitted)
              // This would send an email using an email delivery service
              channelSuccess = false; // Not implemented yet
              break;
          }
          
          // Update channel status
          channelStatus[channel] = channelSuccess;
          
          // Mark as successful if any channel succeeded
          if (channelSuccess) {
            anyChannelSucceeded = true;
          }
        } catch (error) {
          logger.error(`Error delivering notification via ${channel}`, {
            error, userId, notificationId, type
          });
          channelStatus[channel] = false;
        }
      }
      
      // Update notification status
      const newStatus = anyChannelSucceeded 
        ? NotificationStatus.DELIVERED 
        : NotificationStatus.FAILED;
        
      await this.notificationRepository.updateNotificationStatus(
        notificationId,
        newStatus
      );
      
      // Publish notification created event
      this.eventBus.publish(EventType.NOTIFICATION_CREATED, {
        userId,
        notification: {
          id: notificationId,
          type,
          title: content.title,
          body: content.body,
          data: fullOptions.data,
          status: newStatus
        }
      });
      
      // Return delivery result
      return {
        id: notificationId,
        success: anyChannelSucceeded,
        channels: channelStatus
      };
    } catch (error) {
      logger.error('Failed to deliver notification', { error, userId, type });
      
      return {
        id: uuidv4(), // Generate ID even for failed notifications
        success: false,
        channels: {},
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  /**
   * Mark notification as read
   * @param notificationId Notification ID
   * @param userId User ID
   * @returns Whether update was successful
   */
  async markAsRead(notificationId: string, userId: string): Promise<boolean> {
    try {
      // Check if notification belongs to user
      const notification = await this.notificationRepository.getNotificationById(notificationId);
      
      if (!notification || notification.userId !== userId) {
        return false;
      }
      
      // Update status to read
      await this.notificationRepository.updateNotificationStatus(
        notificationId,
        NotificationStatus.READ
      );
      
      // Publish notification read event
      this.eventBus.publish(EventType.NOTIFICATION_READ, {
        userId,
        notificationId
      });
      
      return true;
    } catch (error) {
      logger.error('Failed to mark notification as read', { error, notificationId, userId });
      return false;
    }
  }
  
  /**
   * Mark all notifications as read for a user
   * @param userId User ID
   * @returns Number of notifications marked as read
   */
  async markAllAsRead(userId: string): Promise<number> {
    try {
      // Update all unread notifications to read
      const count = await this.notificationRepository.markAllAsRead(userId);
      
      // Publish all read event
      this.eventBus.publish(EventType.NOTIFICATION_ALL_READ, {
        userId,
        count
      });
      
      return count;
    } catch (error) {
      logger.error('Failed to mark all notifications as read', { error, userId });
      return 0;
    }
  }
  
  /**
   * Check if user should receive a notification type
   * @param userId User ID
   * @param type Notification type
   * @returns Whether user should be notified
   */
  private async shouldNotifyUser(userId: string, type: string): Promise<boolean> {
    try {
      // Get user preferences for this notification type
      const preferences = await this.preferencesRepository.getUserPreferences(userId);
      
      // If no preferences found, default to true
      if (!preferences) {
        return true;
      }
      
      // Check if this type is explicitly disabled
      if (preferences.disabledTypes && preferences.disabledTypes.includes(type)) {
        return false;
      }
      
      // Check if categories are disabled
      if (preferences.disabledCategories) {
        // Get template for this notification type
        const template = await this.templateRepository.getTemplateByType(type);
        
        // If template exists and its category is disabled, don't notify
        if (template && template.category && 
            preferences.disabledCategories.includes(template.category)) {
          return false;
        }
      }
      
      // Default to allowing notification
      return true;
    } catch (error) {
      logger.error('Error checking notification preferences', { error, userId, type });
      
      // Default to true on error
      return true;
    }
  }
  
  /**
   * Format notification content using template
   * @param type Notification type
   * @param variables Template variables
   * @returns Formatted title and body
   */
  private async formatNotificationContent(
    type: string,
    variables: Record<string, any> = {}
  ): Promise<{ title: string; body: string }> {
    try {
      // Get template for this notification type
      const template = await this.templateRepository.getTemplateByType(type);
      
      // If no template found, return generic content
      if (!template) {
        return {
          title: 'New Notification',
          body: `You have a new ${type} notification`
        };
      }
      
      // Apply template variables
      let title = template.title;
      let body = template.body;
      
      // Simple variable replacement (in production, use a proper template engine)
      Object.entries(variables).forEach(([key, value]) => {
        const placeholder = `{{${key}}}`;
        title = title.replace(new RegExp(placeholder, 'g'), String(value));
        body = body.replace(new RegExp(placeholder, 'g'), String(value));
      });
      
      return { title, body };
    } catch (error) {
      logger.error('Error formatting notification content', { error, type });
      
      // Return generic content on error
      return {
        title: 'New Notification',
        body: `You have a new ${type} notification`
      };
    }
  }
  
  /**
   * Deliver notification via WebSocket
   * @param userId User ID
   * @param notification Notification object
   * @returns Whether delivery was successful
   */
  private async deliverViaWebSocket(userId: string, notification: any): Promise<boolean> {
    try {
      // Send notification via WebSocket
      const sentCount = this.websocketService.sendToUser(userId, {
        type: 'notification.new',
        data: {
          id: notification.id,
          type: notification.type,
          title: notification.title,
          body: notification.body,
          priority: notification.priority,
          data: notification.data,
          createdAt: notification.createdAt
        }
      });
      
      // Consider successful if sent to at least one connection
      return sentCount > 0;
    } catch (error) {
      logger.error('Failed to deliver notification via WebSocket', { 
        error, userId, notificationId: notification.id
      });
      return false;
    }
  }
  
  /**
   * Set up event subscriptions
   */
  private setupEventSubscriptions(): void {
    // Subscribe to events that should generate notifications
    this.eventBus.subscribe(EventType.ACHIEVEMENT_UNLOCKED, async (data) => {
      try {
        await this.notify(data.userId, 'achievement.unlocked', {
          variables: {
            achievement: data.achievement.name,
            description: data.achievement.description
          },
          data: {
            achievementId: data.achievement.id,
            icon: data.achievement.icon
          },
          category: 'achievements',
          priority: 'high'
        });
      } catch (error) {
        logger.error('Failed to create achievement notification', { error, data });
      }
    });
    
    this.eventBus.subscribe(EventType.POINTS_AWARDED, async (data) => {
      try {
        await this.notify(data.userId, 'points.awarded', {
          variables: {
            amount: data.amount,
            source: data.source
          },
          data: {
            amount: data.amount,
            source: data.source
          },
          category: 'points',
          priority: 'normal',
          // Use collapseKey to prevent notification spam
          collapseKey: `points-${data.source}-${Math.floor(Date.now() / (5 * 60 * 1000))}`
        });
      } catch (error) {
        logger.error('Failed to create points notification', { error, data });
      }
    });
    
    this.eventBus.subscribe(EventType.MILESTONE_REACHED, async (data) => {
      try {
        // For global milestones, notify all users
        // (In practice, you'd want to batch these or be more selective)
        if (data.global) {
          // TODO: Implement notification to all users
          logger.info('Global milestone reached, should notify all users', { milestone: data.milestone });
        }
      } catch (error) {
        logger.error('Failed to create milestone notification', { error, data });
      }
    });
  }
  
  /**
   * Get notification statistics
   * @returns Statistics about notifications
   */
  async getNotificationStats(): Promise<{
    totalCount: number;
    unreadCount: number;
    deliverySuccess: number;
    topCategories: Array<{ category: string; count: number }>;
  }> {
    try {
      return await this.notificationRepository.getNotificationStats();
    } catch (error) {
      logger.error('Failed to get notification stats', { error });
      return {
        totalCount: 0,
        unreadCount: 0,
        deliverySuccess: 0,
        topCategories: []
      };
    }
  }
}
