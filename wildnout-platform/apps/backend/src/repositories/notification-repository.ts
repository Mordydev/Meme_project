import { FastifyInstance } from 'fastify';
import { BaseRepository } from './core/base-repository';

/**
 * Notification model interface
 */
export interface NotificationModel {
  id: string;
  userId: string;
  type: 'achievement' | 'battle' | 'content' | 'follow' | 'token' | 'system';
  title: string;
  body: string;
  image?: string;
  data?: any;
  read: boolean;
  readAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Repository for handling Notifications
 */
export class NotificationRepository extends BaseRepository<NotificationModel> {
  constructor(fastify: FastifyInstance) {
    super(fastify, 'notifications');
  }

  /**
   * Get notifications for a user
   */
  async getUserNotifications(
    userId: string, 
    limit = 20, 
    cursor?: string,
    includeRead = false
  ): Promise<{
    notifications: NotificationModel[];
    hasMore: boolean;
    cursor?: string;
    unreadCount: number;
  }> {
    // Build filter
    const filter: any = { userId };
    
    if (!includeRead) {
      filter.read = false;
    }
    
    // Get paginated notifications
    const result = await this.findManyWithPagination(
      filter,
      { limit, cursor, cursorField: 'createdAt' }
    );
    
    // Get unread count
    const unreadCount = await this.count({ userId, read: false });
    
    return {
      notifications: result.data,
      hasMore: result.hasMore,
      cursor: result.cursor,
      unreadCount
    };
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string): Promise<NotificationModel> {
    const { data, error } = await this.db
      .from(this.tableName)
      .update({
        read: true,
        readAt: new Date(),
        updatedAt: new Date()
      })
      .eq('id', notificationId)
      .select()
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        throw new Error(`Notification not found: ${notificationId}`);
      }
      
      this.logger.error(error, `Failed to mark notification ${notificationId} as read`);
      throw new Error(`Failed to mark notification ${notificationId} as read`);
    }
    
    return data;
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string): Promise<number> {
    const { data, error } = await this.db
      .from(this.tableName)
      .update({
        read: true,
        readAt: new Date(),
        updatedAt: new Date()
      })
      .eq('userId', userId)
      .eq('read', false);
    
    if (error) {
      this.logger.error(error, `Failed to mark all notifications as read for user ${userId}`);
      throw new Error(`Failed to mark all notifications as read for user ${userId}`);
    }
    
    return data?.length || 0;
  }

  /**
   * Create a notification
   */
  async createNotification(notification: Omit<NotificationModel, 'id' | 'read' | 'createdAt' | 'updatedAt'>): Promise<NotificationModel> {
    const { data, error } = await this.db
      .from(this.tableName)
      .insert({
        ...notification,
        read: false,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .select()
      .single();
    
    if (error) {
      this.logger.error(error, 'Failed to create notification');
      throw new Error('Failed to create notification');
    }
    
    return data;
  }

  /**
   * Delete old read notifications
   */
  async cleanupOldNotifications(olderThan = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThan);
    
    const { data, error } = await this.db
      .from(this.tableName)
      .delete()
      .lt('createdAt', cutoffDate.toISOString())
      .eq('read', true);
    
    if (error) {
      this.logger.error(error, 'Failed to clean up old notifications');
      throw new Error('Failed to clean up old notifications');
    }
    
    return data?.length || 0;
  }
}
