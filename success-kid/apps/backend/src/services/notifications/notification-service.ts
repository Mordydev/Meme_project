/**
 * Notification Service
 * 
 * Manages in-app notifications and real-time alerts
 */
import { Pool, PoolClient } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import { Notification, NotificationType, NotificationPriority } from '../../models/notification';
import { logger } from '../../lib/logger';
import { WebSocketService } from '../../websockets/websocket-service';

export interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  priority?: NotificationPriority;
  data?: Record<string, any>;
  expiresAt?: Date;
}

export class NotificationService {
  private db: Pool;
  private websocketService?: WebSocketService;

  constructor(db: Pool, websocketService?: WebSocketService) {
    this.db = db;
    this.websocketService = websocketService;
  }

  /**
   * Create a notification
   */
  async createNotification(params: CreateNotificationParams): Promise<Notification> {
    try {
      logger.debug('Creating notification', { userId: params.userId, type: params.type });

      const notification = await this.executeTransaction(async (client) => {
        return this.createNotificationWithTransaction(client, params);
      });

      // Send real-time notification if websocket service is available
      if (this.websocketService) {
        await this.websocketService.sendToUser(params.userId, {
          type: 'notification:new',
          data: notification
        });
      }

      return notification;
    } catch (error) {
      logger.error('Error creating notification', { error, params });
      throw error;
    }
  }

  /**
   * Create a notification within a transaction
   */
  async createNotificationWithTransaction(
    client: PoolClient,
    params: CreateNotificationParams
  ): Promise<Notification> {
    try {
      const id = uuidv4();
      const now = new Date();

      const query = `
        INSERT INTO notifications (
          id, user_id, type, title, message,
          data, priority, created_at, read, expires_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *
      `;

      const values = [
        id,
        params.userId,
        params.type,
        params.title,
        params.message,
        params.data ? JSON.stringify(params.data) : null,
        params.priority || 'normal',
        now,
        false,
        params.expiresAt || null
      ];

      const result = await client.query<Notification>(query, values);
      return result.rows[0];
    } catch (error) {
      logger.error('Error creating notification with transaction', { error, params });
      throw error;
    }
  }

  /**
   * Get user's notifications
   */
  async getUserNotifications(
    userId: string,
    options: {
      limit?: number;
      offset?: number;
      unreadOnly?: boolean;
      types?: NotificationType[];
    } = {}
  ): Promise<{
    notifications: Notification[];
    total: number;
    unreadCount: number;
  }> {
    try {
      const { limit = 20, offset = 0, unreadOnly = false, types } = options;

      // Build query conditions
      let conditions = ['user_id = $1'];
      let params: any[] = [userId];
      let paramIndex = 2;

      if (unreadOnly) {
        conditions.push('read = false');
      }

      if (types && types.length > 0) {
        conditions.push(`type = ANY($${paramIndex})`);
        params.push(types);
        paramIndex++;
      }

      // Filter out expired notifications
      conditions.push(`(expires_at IS NULL OR expires_at > NOW())`);

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

      // Get notifications
      const query = `
        SELECT *
        FROM notifications
        ${whereClause}
        ORDER BY created_at DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;

      const result = await this.db.query<Notification>(
        query,
        [...params, limit, offset]
      );

      // Get total count
      const countQuery = `
        SELECT COUNT(*) as total
        FROM notifications
        ${whereClause}
      `;

      const countResult = await this.db.query<{ total: string }>(
        countQuery,
        params
      );

      // Get unread count
      const unreadQuery = `
        SELECT COUNT(*) as count
        FROM notifications
        WHERE user_id = $1 AND read = false
        AND (expires_at IS NULL OR expires_at > NOW())
      `;

      const unreadResult = await this.db.query<{ count: string }>(
        unreadQuery,
        [userId]
      );

      return {
        notifications: result.rows,
        total: parseInt(countResult.rows[0].total),
        unreadCount: parseInt(unreadResult.rows[0].count)
      };
    } catch (error) {
      logger.error('Error getting user notifications', { error, userId, options });
      throw error;
    }
  }

  /**
   * Mark notification as read
   */
  async markNotificationRead(notificationId: string): Promise<boolean> {
    try {
      const query = `
        UPDATE notifications
        SET read = true, updated_at = NOW()
        WHERE id = $1
        RETURNING id
      `;

      const result = await this.db.query(query, [notificationId]);
      return result.rowCount > 0;
    } catch (error) {
      logger.error('Error marking notification as read', { error, notificationId });
      throw error;
    }
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllNotificationsRead(userId: string): Promise<number> {
    try {
      const query = `
        UPDATE notifications
        SET read = true, updated_at = NOW()
        WHERE user_id = $1 AND read = false
        RETURNING id
      `;

      const result = await this.db.query(query, [userId]);
      return result.rowCount;
    } catch (error) {
      logger.error('Error marking all notifications as read', { error, userId });
      throw error;
    }
  }

  /**
   * Delete a notification
   */
  async deleteNotification(notificationId: string): Promise<boolean> {
    try {
      const query = `
        DELETE FROM notifications
        WHERE id = $1
        RETURNING id
      `;

      const result = await this.db.query(query, [notificationId]);
      return result.rowCount > 0;
    } catch (error) {
      logger.error('Error deleting notification', { error, notificationId });
      throw error;
    }
  }

  /**
   * Generate achievement notification data
   */
  generateAchievementNotificationData(achievement: any): Record<string, any> {
    return {
      achievementId: achievement.id,
      name: achievement.name,
      description: achievement.description,
      imageUrl: achievement.image_url || achievement.imageUrl,
      difficulty: achievement.difficulty,
      pointsAwarded: achievement.points_reward || 0,
      celebrationType: this.getCelebrationTypeForDifficulty(achievement.difficulty)
    };
  }

  /**
   * Generate celebration data for achievement notification
   */
  private getCelebrationTypeForDifficulty(difficulty: string): string {
    switch (difficulty) {
      case 'epic':
        return 'confetti';
      case 'rare':
        return 'sparkles';
      case 'uncommon':
        return 'pulse';
      case 'common':
      default:
        return 'simple';
    }
  }

  /**
   * Helper method to execute transactions
   */
  private async executeTransaction<T>(
    callback: (client: PoolClient) => Promise<T>
  ): Promise<T> {
    const client = await this.db.connect();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}
