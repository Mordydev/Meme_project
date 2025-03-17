/**
 * Notification Repository
 * 
 * Handles data access for notifications
 */
import { Pool, PoolClient } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import { 
  Notification, 
  CreateNotificationDto, 
  NotificationType, 
  NotificationPriority,
  NotificationOptions,
  NotificationPage
} from '../models/notification';
import { logger } from '../lib/logger';
import { BaseRepository } from './base-repository';
import { camelToSnakeCase, snakeToCamelCase } from '../lib/db-sanitizer';

/**
 * Repository for notification data access
 */
export class NotificationRepository extends BaseRepository {
  /**
   * Create notification repository
   * @param db Database connection pool
   */
  constructor(db: Pool) {
    super(db);
  }

  /**
   * Create a new notification
   * @param params Notification creation parameters
   * @param client Optional database client for transactions
   * @returns Created notification
   */
  async createNotification(
    params: CreateNotificationDto,
    client?: PoolClient
  ): Promise<Notification> {
    try {
      const id = uuidv4();
      const now = new Date();

      const query = `
        INSERT INTO notifications (
          id, user_id, type, title, message,
          data, priority, created_at, updated_at, read, expires_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *;
      `;

      const values = [
        id,
        params.userId,
        params.type,
        params.title,
        params.message,
        params.data ? JSON.stringify(params.data) : null,
        params.priority || NotificationPriority.NORMAL,
        now,
        now,
        false,
        params.expiresAt || null
      ];

      const executor = client || this.db;
      const result = await executor.query(query, values);

      return this.mapNotificationFromDb(result.rows[0]);
    } catch (error) {
      logger.error('Error creating notification', { error, params });
      throw error;
    }
  }

  /**
   * Get user's notifications with pagination and filtering
   * @param userId User ID
   * @param options Query options
   * @returns Paginated notifications with total count
   */
  async getUserNotifications(
    userId: string,
    options: NotificationOptions = {}
  ): Promise<NotificationPage> {
    try {
      const { 
        limit = 20, 
        offset = 0, 
        unreadOnly = false, 
        types,
        startDate,
        endDate
      } = options;

      // Build query conditions
      let conditions = ['user_id = $1'];
      let params: any[] = [userId];
      let paramIndex = 2;

      if (unreadOnly) {
        conditions.push('read = false');
      }

      if (types?.length) {
        conditions.push(`type = ANY($${paramIndex})`);
        params.push(types);
        paramIndex++;
      }

      if (startDate) {
        conditions.push(`created_at >= $${paramIndex}`);
        params.push(startDate);
        paramIndex++;
      }

      if (endDate) {
        conditions.push(`created_at <= $${paramIndex}`);
        params.push(endDate);
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

      const result = await this.db.query(
        query,
        [...params, limit, offset]
      );

      // Get total count
      const countQuery = `
        SELECT COUNT(*) as total
        FROM notifications
        ${whereClause}
      `;

      const countResult = await this.db.query(
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

      const unreadResult = await this.db.query(
        unreadQuery,
        [userId]
      );

      return {
        notifications: result.rows.map(row => this.mapNotificationFromDb(row)),
        total: parseInt(countResult.rows[0].total),
        unreadCount: parseInt(unreadResult.rows[0].count)
      };
    } catch (error) {
      logger.error('Error getting user notifications', { error, userId, options });
      throw error;
    }
  }

  /**
   * Get a notification by ID
   * @param id Notification ID
   * @returns Notification or null if not found
   */
  async getNotificationById(id: string): Promise<Notification | null> {
    try {
      const query = `
        SELECT *
        FROM notifications
        WHERE id = $1
      `;

      const result = await this.db.query(query, [id]);

      if (result.rows.length === 0) {
        return null;
      }

      return this.mapNotificationFromDb(result.rows[0]);
    } catch (error) {
      logger.error('Error getting notification by ID', { error, id });
      throw error;
    }
  }

  /**
   * Mark a notification as read
   * @param id Notification ID
   * @returns True if successful
   */
  async markAsRead(id: string): Promise<boolean> {
    try {
      const now = new Date();
      const query = `
        UPDATE notifications
        SET read = true, read_at = $1, updated_at = $1
        WHERE id = $2
        RETURNING id
      `;

      const result = await this.db.query(query, [now, id]);
      return result.rowCount > 0;
    } catch (error) {
      logger.error('Error marking notification as read', { error, id });
      throw error;
    }
  }

  /**
   * Mark all notifications as read for a user
   * @param userId User ID
   * @returns Number of notifications marked as read
   */
  async markAllAsRead(userId: string): Promise<number> {
    try {
      const now = new Date();
      const query = `
        UPDATE notifications
        SET read = true, read_at = $1, updated_at = $1
        WHERE user_id = $2 AND read = false
        RETURNING id
      `;

      const result = await this.db.query(query, [now, userId]);
      return result.rowCount;
    } catch (error) {
      logger.error('Error marking all notifications as read', { error, userId });
      throw error;
    }
  }

  /**
   * Delete a notification
   * @param id Notification ID
   * @returns True if successful
   */
  async deleteNotification(id: string): Promise<boolean> {
    try {
      const query = `
        DELETE FROM notifications
        WHERE id = $1
        RETURNING id
      `;

      const result = await this.db.query(query, [id]);
      return result.rowCount > 0;
    } catch (error) {
      logger.error('Error deleting notification', { error, id });
      throw error;
    }
  }

  /**
   * Delete expired notifications
   * @returns Number of deleted notifications
   */
  async deleteExpiredNotifications(): Promise<number> {
    try {
      const query = `
        DELETE FROM notifications
        WHERE expires_at IS NOT NULL AND expires_at < NOW()
        RETURNING id
      `;

      const result = await this.db.query(query);
      return result.rowCount;
    } catch (error) {
      logger.error('Error deleting expired notifications', { error });
      throw error;
    }
  }

  /**
   * Map a notification row from the database to the model
   * @param row Database row
   * @returns Notification model
   */
  private mapNotificationFromDb(row: any): Notification {
    return {
      id: row.id,
      userId: row.user_id,
      type: row.type as NotificationType,
      title: row.title,
      message: row.message,
      data: row.data,
      priority: row.priority as NotificationPriority,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      read: row.read,
      readAt: row.read_at,
      expiresAt: row.expires_at
    };
  }
}
