/**
 * Notification Preferences Repository
 * 
 * Handles data access for user notification preferences
 */
import { Pool } from 'pg';
import { 
  NotificationPreferences,
  NotificationChannel
} from '../models/notification';
import { logger } from '../lib/logger';
import { BaseRepository } from './base-repository';

/**
 * Default notification preferences
 */
const DEFAULT_PREFERENCES = {
  channels: {
    [NotificationChannel.INAPP]: true,
    [NotificationChannel.EMAIL]: true,
    [NotificationChannel.PUSH]: false
  },
  categories: {
    points: {
      enabled: true,
      channels: {
        [NotificationChannel.INAPP]: true,
        [NotificationChannel.EMAIL]: true,
        [NotificationChannel.PUSH]: false
      }
    },
    achievements: {
      enabled: true,
      channels: {
        [NotificationChannel.INAPP]: true,
        [NotificationChannel.EMAIL]: true,
        [NotificationChannel.PUSH]: true
      }
    },
    content: {
      enabled: true,
      channels: {
        [NotificationChannel.INAPP]: true,
        [NotificationChannel.EMAIL]: true,
        [NotificationChannel.PUSH]: false
      }
    },
    system: {
      enabled: true,
      channels: {
        [NotificationChannel.INAPP]: true,
        [NotificationChannel.EMAIL]: true,
        [NotificationChannel.PUSH]: false
      }
    }
  },
  quietHours: {
    enabled: false,
    start: "22:00",
    end: "08:00",
    timezone: "UTC"
  }
};

/**
 * Repository for notification preferences data access
 */
export class NotificationPreferencesRepository extends BaseRepository {
  /**
   * Create notification preferences repository
   * @param db Database connection pool
   */
  constructor(db: Pool) {
    super(db);
  }

  /**
   * Get user's notification preferences
   * @param userId User ID
   * @returns User preferences or default preferences
   */
  async getPreferences(userId: string): Promise<NotificationPreferences> {
    try {
      const query = `
        SELECT *
        FROM notification_preferences
        WHERE user_id = $1
      `;

      const result = await this.db.query(query, [userId]);

      if (result.rows.length === 0) {
        // Return default preferences if none exist
        return await this.createDefaultPreferences(userId);
      }

      return this.mapPreferencesFromDb(result.rows[0]);
    } catch (error) {
      logger.error('Error getting notification preferences', { error, userId });
      throw error;
    }
  }

  /**
   * Create default preferences for a user
   * @param userId User ID
   * @returns Created default preferences
   */
  async createDefaultPreferences(userId: string): Promise<NotificationPreferences> {
    try {
      const now = new Date();
      const query = `
        INSERT INTO notification_preferences (
          user_id, channels, categories, quiet_hours, created_at, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `;

      const values = [
        userId,
        JSON.stringify(DEFAULT_PREFERENCES.channels),
        JSON.stringify(DEFAULT_PREFERENCES.categories),
        JSON.stringify(DEFAULT_PREFERENCES.quietHours),
        now,
        now
      ];

      const result = await this.db.query(query, values);
      return this.mapPreferencesFromDb(result.rows[0]);
    } catch (error) {
      logger.error('Error creating default notification preferences', { error, userId });
      throw error;
    }
  }

  /**
   * Update notification preferences
   * @param userId User ID
   * @param updates Preference updates
   * @returns Updated preferences
   */
  async updatePreferences(
    userId: string,
    updates: Partial<Omit<NotificationPreferences, 'userId' | 'createdAt' | 'updatedAt'>>
  ): Promise<NotificationPreferences> {
    try {
      // Get current preferences
      const current = await this.getPreferences(userId);
      const now = new Date();

      // Prepare updates
      const updatedPrefs = {
        ...current,
        ...updates,
        updatedAt: now
      };

      // Apply updates to database
      const query = `
        UPDATE notification_preferences
        SET 
          channels = $1,
          categories = $2,
          quiet_hours = $3,
          updated_at = $4
        WHERE user_id = $5
        RETURNING *
      `;

      const values = [
        JSON.stringify(updatedPrefs.channels),
        JSON.stringify(updatedPrefs.categories),
        JSON.stringify(updatedPrefs.quietHours),
        now,
        userId
      ];

      const result = await this.db.query(query, values);
      
      // If no row was updated (i.e. preferences didn't exist), create default ones
      if (result.rowCount === 0) {
        return await this.createDefaultPreferences(userId);
      }

      return this.mapPreferencesFromDb(result.rows[0]);
    } catch (error) {
      logger.error('Error updating notification preferences', { error, userId, updates });
      throw error;
    }
  }

  /**
   * Reset notification preferences to default
   * @param userId User ID
   * @returns Reset preferences
   */
  async resetPreferences(userId: string): Promise<NotificationPreferences> {
    try {
      const now = new Date();
      const query = `
        UPDATE notification_preferences
        SET 
          channels = $1,
          categories = $2,
          quiet_hours = $3,
          updated_at = $4
        WHERE user_id = $5
        RETURNING *
      `;

      const values = [
        JSON.stringify(DEFAULT_PREFERENCES.channels),
        JSON.stringify(DEFAULT_PREFERENCES.categories),
        JSON.stringify(DEFAULT_PREFERENCES.quietHours),
        now,
        userId
      ];

      const result = await this.db.query(query, values);
      
      // If no row was updated (i.e. preferences didn't exist), create default ones
      if (result.rowCount === 0) {
        return await this.createDefaultPreferences(userId);
      }

      return this.mapPreferencesFromDb(result.rows[0]);
    } catch (error) {
      logger.error('Error resetting notification preferences', { error, userId });
      throw error;
    }
  }

  /**
   * Check if notification is enabled for a specific channel and type
   * @param userId User ID
   * @param type Notification type
   * @param channel Notification channel
   * @returns Whether the notification is enabled
   */
  async isNotificationEnabled(
    userId: string,
    type: string,
    channel: NotificationChannel
  ): Promise<boolean> {
    try {
      const preferences = await this.getPreferences(userId);
      
      // Check if channel is globally enabled
      if (!preferences.channels[channel]) {
        return false;
      }
      
      // Determine category for notification type
      const categoryMap: Record<string, string> = {
        'points_earned': 'points',
        'points_redeemed': 'points',
        'achievement_unlocked': 'achievements',
        'level_up': 'achievements',
        'content_reaction': 'content',
        'content_comment': 'content',
        'content_mention': 'content',
        'wallet_connected': 'system',
        'referral_successful': 'system',
        'milestone_reached': 'system',
        'system_announcement': 'system'
      };
      
      const category = categoryMap[type] || 'system';
      
      // Check if category is enabled
      if (!preferences.categories[category]?.enabled) {
        return false;
      }
      
      // Check channel preference for this category
      return preferences.categories[category]?.channels?.[channel] !== false;
    } catch (error) {
      logger.error('Error checking if notification is enabled', { error, userId, type, channel });
      throw error;
    }
  }

  /**
   * Map preferences from database to model
   * @param row Database row
   * @returns NotificationPreferences model
   */
  private mapPreferencesFromDb(row: any): NotificationPreferences {
    return {
      userId: row.user_id,
      channels: row.channels,
      categories: row.categories,
      quietHours: row.quiet_hours,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }
}
