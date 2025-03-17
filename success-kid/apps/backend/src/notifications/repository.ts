/**
 * Notification Repository
 * 
 * Handles database operations for notifications.
 */
import { Pool } from 'pg';
import { getDatabase } from '../database';
import { logger } from '../lib/logger';
import {
  Notification,
  NotificationFilter,
  NotificationStatus,
  CreateNotificationDto,
  UpdateNotificationDto,
} from './models';

/**
 * Notification Repository class
 */
export class NotificationRepository {
  private pool: Pool;

  /**
   * Create a notification repository instance
   */
  constructor() {
    this.pool = getDatabase().pool;
  }

  /**
   * Create a new notification
   * 
   * @param notification Notification data to create
   * @returns Created notification
   */
  async create(notification: CreateNotificationDto): Promise<Notification> {
    const now = new Date();
    
    const query = `
      INSERT INTO notifications (
        user_id, type, category, title, body, image_url, data, importance,
        status, channels, created_at, updated_at, expires_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `;
    
    const values = [
      notification.userId,
      notification.type,
      notification.category,
      notification.title,
      notification.body,
      notification.imageUrl || null,
      notification.data || {},
      notification.importance,
      NotificationStatus.PENDING,
      JSON.stringify(notification.channels),
      now,
      now,
      notification.expiresAt || null,
    ];
    
    try {
      const result = await this.pool.query(query, values);
      return this.mapRowToNotification(result.rows[0]);
    } catch (error) {
      logger.error('Failed to create notification', { error, userId: notification.userId });
      throw new Error('Failed to create notification');
    }
  }

  /**
   * Get a notification by ID
   * 
   * @param id Notification ID
   * @returns Notification or null if not found
   */
  async getById(id: string): Promise<Notification | null> {
    const query = `
      SELECT * FROM notifications
      WHERE id = $1
    `;
    
    try {
      const result = await this.pool.query(query, [id]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return this.mapRowToNotification(result.rows[0]);
    } catch (error) {
      logger.error('Failed to get notification by ID', { error, id });
      throw new Error('Failed to get notification');
    }
  }

  /**
   * Get notifications for a specific user
   * 
   * @param userId User ID
   * @param filter Filter options
   * @returns List of notifications
   */
  async getForUser(userId: string, filter: NotificationFilter): Promise<Notification[]> {
    let query = `
      SELECT * FROM notifications
      WHERE user_id = $1
    `;
    
    const values: any[] = [userId];
    let paramCount = 1;
    
    // Apply filters
    if (filter.status) {
      paramCount++;
      query += ` AND status = $${paramCount}`;
      values.push(filter.status);
    } else if (!filter.includeRead) {
      paramCount++;
      query += ` AND status != $${paramCount}`;
      values.push(NotificationStatus.READ);
    }
    
    if (filter.category) {
      paramCount++;
      query += ` AND category = $${paramCount}`;
      values.push(filter.category);
    }
    
    if (filter.channel) {
      paramCount++;
      query += ` AND $${paramCount} = ANY(channels)`;
      values.push(filter.channel);
    }
    
    if (filter.startDate) {
      paramCount++;
      query += ` AND created_at >= $${paramCount}`;
      values.push(filter.startDate);
    }
    
    if (filter.endDate) {
      paramCount++;
      query += ` AND created_at <= $${paramCount}`;
      values.push(filter.endDate);
    }
    
    // Order and pagination
    query += ` ORDER BY created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    values.push(filter.limit, filter.offset);
    
    try {
      const result = await this.pool.query(query, values);
      return result.rows.map(row => this.mapRowToNotification(row));
    } catch (error) {
      logger.error('Failed to get notifications for user', { error, userId });
      throw new Error('Failed to get notifications');
    }
  }

  /**
   * Count unread notifications for a user
   * 
   * @param userId User ID
   * @returns Count of unread notifications
   */
  async countUnread(userId: string): Promise<number> {
    const query = `
      SELECT COUNT(*) as count
      FROM notifications
      WHERE user_id = $1 AND status = $2
    `;
    
    try {
      const result = await this.pool.query(query, [userId, NotificationStatus.DELIVERED]);
      return parseInt(result.rows[0].count, 10);
    } catch (error) {
      logger.error('Failed to count unread notifications', { error, userId });
      throw new Error('Failed to count unread notifications');
    }
  }

  /**
   * Update a notification
   * 
   * @param id Notification ID
   * @param update Update data
   * @returns Updated notification
   */
  async update(id: string, update: UpdateNotificationDto): Promise<Notification | null> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;
    
    // Build update query dynamically
    if (update.status !== undefined) {
      updates.push(`status = $${paramCount}`);
      values.push(update.status);
      paramCount++;
    }
    
    if (update.deliveryStatus !== undefined) {
      updates.push(`delivery_status = $${paramCount}`);
      values.push(JSON.stringify(update.deliveryStatus));
      paramCount++;
    }
    
    if (update.readAt !== undefined) {
      updates.push(`read_at = $${paramCount}`);
      values.push(update.readAt);
      paramCount++;
    }
    
    // Always update the updated_at field
    updates.push(`updated_at = $${paramCount}`);
    values.push(new Date());
    paramCount++;
    
    // Return if no updates
    if (updates.length === 0) {
      const notification = await this.getById(id);
      return notification;
    }
    
    // Construct query
    const query = `
      UPDATE notifications
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;
    
    values.push(id);
    
    try {
      const result = await this.pool.query(query, values);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return this.mapRowToNotification(result.rows[0]);
    } catch (error) {
      logger.error('Failed to update notification', { error, id });
      throw new Error('Failed to update notification');
    }
  }

  /**
   * Mark a notification as delivered
   * 
   * @param id Notification ID
   * @param deliveryResults Delivery results per channel
   * @returns Updated notification
   */
  async markDelivered(id: string, deliveryResults: Record<string, any>): Promise<Notification | null> {
    const query = `
      UPDATE notifications
      SET status = $1, delivered_at = $2, delivery_status = $3, updated_at = $4
      WHERE id = $5
      RETURNING *
    `;
    
    const values = [
      NotificationStatus.DELIVERED,
      new Date(),
      JSON.stringify(deliveryResults),
      new Date(),
      id,
    ];
    
    try {
      const result = await this.pool.query(query, values);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return this.mapRowToNotification(result.rows[0]);
    } catch (error) {
      logger.error('Failed to mark notification as delivered', { error, id });
      throw new Error('Failed to update notification status');
    }
  }

  /**
   * Mark a notification as read
   * 
   * @param id Notification ID
   * @returns Updated notification
   */
  async markRead(id: string): Promise<Notification | null> {
    const query = `
      UPDATE notifications
      SET status = $1, read_at = $2, updated_at = $3
      WHERE id = $4
      RETURNING *
    `;
    
    const values = [NotificationStatus.READ, new Date(), new Date(), id];
    
    try {
      const result = await this.pool.query(query, values);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return this.mapRowToNotification(result.rows[0]);
    } catch (error) {
      logger.error('Failed to mark notification as read', { error, id });
      throw new Error('Failed to update notification status');
    }
  }

  /**
   * Mark all notifications as read for a user
   * 
   * @param userId User ID
   * @returns Number of notifications updated
   */
  async markAllRead(userId: string): Promise<number> {
    const query = `
      UPDATE notifications
      SET status = $1, read_at = $2, updated_at = $3
      WHERE user_id = $4 AND status = $5
    `;
    
    const values = [
      NotificationStatus.READ,
      new Date(),
      new Date(),
      userId,
      NotificationStatus.DELIVERED,
    ];
    
    try {
      const result = await this.pool.query(query, values);
      return result.rowCount;
    } catch (error) {
      logger.error('Failed to mark all notifications as read', { error, userId });
      throw new Error('Failed to update notification status');
    }
  }

  /**
   * Delete notifications older than a certain date
   * 
   * @param olderThan Date threshold
   * @param status Optional status filter
   * @returns Number of notifications deleted
   */
  async deleteOlderThan(olderThan: Date, status?: NotificationStatus): Promise<number> {
    let query = `
      DELETE FROM notifications
      WHERE created_at < $1
    `;
    
    const values: any[] = [olderThan];
    
    if (status) {
      query += ` AND status = $2`;
      values.push(status);
    }
    
    try {
      const result = await this.pool.query(query, values);
      return result.rowCount;
    } catch (error) {
      logger.error('Failed to delete old notifications', { error, olderThan });
      throw new Error('Failed to delete notifications');
    }
  }

  /**
   * Map database row to Notification object
   * 
   * @param row Database row
   * @returns Notification object
   */
  private mapRowToNotification(row: any): Notification {
    return {
      id: row.id,
      user_id: row.user_id,
      type: row.type,
      category: row.category,
      title: row.title,
      body: row.body,
      image_url: row.image_url,
      data: row.data || {},
      importance: row.importance,
      status: row.status,
      channels: Array.isArray(row.channels) ? row.channels : JSON.parse(row.channels),
      delivery_status: row.delivery_status ? JSON.parse(row.delivery_status) : undefined,
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at),
      delivered_at: row.delivered_at ? new Date(row.delivered_at) : undefined,
      read_at: row.read_at ? new Date(row.read_at) : undefined,
      expires_at: row.expires_at ? new Date(row.expires_at) : undefined,
    };
  }
}

// Export singleton instance
export const notificationRepository = new NotificationRepository();
