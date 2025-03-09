import { NotificationRepository } from '../repositories/notification-repository';
import { EventEmitter, EventType } from '../lib/events';
import { NotFoundError } from '../lib/errors';
import { WebSocketService } from '../websockets/websocket-service';

/**
 * Service for managing notifications with real-time delivery
 */
export class NotificationService {
  private websocketService?: WebSocketService;
  
  constructor(
    private notificationRepository: NotificationRepository,
    private eventEmitter: EventEmitter
  ) {}
  
  /**
   * Set WebSocket service for real-time notifications
   * This is called after the WebSocket service is initialized
   */
  setWebSocketService(websocketService: WebSocketService): void {
    this.websocketService = websocketService;
  }

  /**
   * Register event handlers for this service
   */
  registerEventHandlers(): void {
    // Achievement notifications
    this.eventEmitter.on(EventType.ACHIEVEMENT_UNLOCKED, async (data) => {
      await this.createNotification({
        userId: data.userId,
        type: 'achievement',
        title: 'Achievement Unlocked!',
        body: `You've earned the ${data.achievementTitle} achievement.`,
        data: { achievementId: data.achievementId }
      });
    });

    // Battle notifications
    this.eventEmitter.on(EventType.BATTLE_CREATED, async (data) => {
      // In a real implementation, we would notify relevant users
      // based on their interests and preferences
    });

    this.eventEmitter.on(EventType.BATTLE_COMPLETED, async (data) => {
      // Notify participants of battle completion
      // In a real implementation, we would look up participants
    });

    // Content notifications
    this.eventEmitter.on(EventType.CONTENT_COMMENT_ADDED, async (data) => {
      // Notify content creator of new comment
      // In a real implementation, we would look up content creator
    });

    // Follow notifications
    this.eventEmitter.on(EventType.USER_FOLLOWED, async (data) => {
      await this.createNotification({
        userId: data.followedId,
        type: 'follow',
        title: 'New Follower',
        body: `Someone new is following you!`,
        data: { followerId: data.followerId }
      });
    });

    // Token notifications
    this.eventEmitter.on(EventType.TOKEN_MILESTONE_REACHED, async (data) => {
      // In a real implementation, we would notify all users or
      // users who have opted in for token notifications
    });
  }

  /**
   * Get notifications for a user
   */
  async getUserNotifications(
    userId: string,
    limit = 20,
    cursor?: string,
    includeRead = false
  ) {
    return this.notificationRepository.getUserNotifications(
      userId,
      limit,
      cursor,
      includeRead
    );
  }

  /**
   * Create a new notification
   */
  async createNotification(notification: {
    userId: string;
    type: 'achievement' | 'battle' | 'content' | 'follow' | 'token' | 'system';
    title: string;
    body: string;
    image?: string;
    data?: any;
  }) {
    const newNotification = await this.notificationRepository.createNotification(notification);
    
    // Emit notification created event
    await this.eventEmitter.emit(EventType.NOTIFICATION_CREATED, {
      notificationId: newNotification.id,
      userId: newNotification.userId,
      type: newNotification.type,
      timestamp: new Date().toISOString()
    });
    
    // Send real-time notification via WebSocket if available
    if (this.websocketService) {
      this.websocketService.sendToUser(notification.userId, 'notification', {
        id: newNotification.id,
        type: newNotification.type,
        title: newNotification.title,
        body: newNotification.body,
        data: newNotification.data,
        createdAt: newNotification.createdAt
      });
      
      // Also update notification badge count
      const unreadCount = await this.notificationRepository.count({
        userId: notification.userId,
        read: false
      });
      
      this.websocketService.sendToUser(notification.userId, 'notification_count', {
        unreadCount
      });
    }
    
    return newNotification;
  }

  /**
   * Mark a notification as read
   */
  async markNotificationAsRead(notificationId: string) {
    const notification = await this.notificationRepository.markAsRead(notificationId);
    
    // Emit notification read event
    await this.eventEmitter.emit(EventType.NOTIFICATION_READ, {
      notificationId: notification.id,
      userId: notification.userId,
      timestamp: new Date().toISOString()
    });
    
    // Update notification badge count via WebSocket if available
    if (this.websocketService) {
      const unreadCount = await this.notificationRepository.count({
        userId: notification.userId,
        read: false
      });
      
      this.websocketService.sendToUser(notification.userId, 'notification_count', {
        unreadCount
      });
    }
    
    return notification;
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllNotificationsAsRead(userId: string) {
    const count = await this.notificationRepository.markAllAsRead(userId);
    
    // Emit notification read event for analytics
    await this.eventEmitter.emit(EventType.NOTIFICATION_READ, {
      userId,
      count,
      allMarkedRead: true,
      timestamp: new Date().toISOString()
    } as any);
    
    // Update notification badge count via WebSocket if available
    if (this.websocketService) {
      this.websocketService.sendToUser(userId, 'notification_count', {
        unreadCount: 0
      });
    }
    
    return { count };
  }

  /**
   * Delete a notification
   */
  async deleteNotification(notificationId: string, userId: string) {
    // Get notification to verify ownership
    const notification = await this.notificationRepository.findById(notificationId);
    
    if (!notification) {
      throw new NotFoundError('notification', notificationId);
    }
    
    // Verify ownership
    if (notification.userId !== userId) {
      throw new NotFoundError('notification', notificationId);
    }
    
    // Delete notification
    await this.notificationRepository.delete(notificationId);
    
    // Emit event
    await this.eventEmitter.emit(EventType.NOTIFICATION_DELETED, {
      notificationId,
      userId,
      timestamp: new Date().toISOString()
    });
    
    // Update notification badge count via WebSocket if available
    if (this.websocketService) {
      const unreadCount = await this.notificationRepository.count({
        userId,
        read: false
      });
      
      this.websocketService.sendToUser(userId, 'notification_count', {
        unreadCount
      });
    }
    
    return { success: true };
  }

  /**
   * Clean up old notifications
   * This would be called by a scheduled job
   */
  async cleanupOldNotifications(olderThan = 30) {
    const count = await this.notificationRepository.cleanupOldNotifications(olderThan);
    
    return { count };
  }
}
