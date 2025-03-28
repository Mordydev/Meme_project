/**
 * Notification Preferences Service
 * 
 * Manages user preferences for notifications.
 */
import { Pool } from 'pg';
import { z } from 'zod';
import { getDatabase } from '../../database';
import { logger } from '../../lib/logger';
import { NotificationChannel, NotificationCategory } from '../models';

/**
 * Notification preferences schema
 */
export const notificationPreferencesSchema = z.object({
  userId: z.string(),
  
  // Channel-level preferences
  channels: z.object({
    [NotificationChannel.INAPP]: z.boolean().default(true),
    [NotificationChannel.EMAIL]: z.boolean().default(true),
    [NotificationChannel.PUSH]: z.boolean().default(true),
  }).default({}),
  
  // Category-level preferences
  categories: z.record(z.object({
    enabled: z.boolean().default(true),
    channels: z.object({
      [NotificationChannel.INAPP]: z.boolean().optional(),
      [NotificationChannel.EMAIL]: z.boolean().optional(),
      [NotificationChannel.PUSH]: z.boolean().optional(),
    }).optional(),
  })).default({}),
  
  // Type-level preferences (overrides categories)
  types: z.record(z.object({
    enabled: z.boolean().default(true),
    channels: z.object({
      [NotificationChannel.INAPP]: z.boolean().optional(),
      [NotificationChannel.EMAIL]: z.boolean().optional(),
      [NotificationChannel.PUSH]: z.boolean().optional(),
    }).optional(),
  })).default({}),
  
  // Quiet hours
  quietHours: z.object({
    enabled: z.boolean().default(false),
    start: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).default('22:00'),
    end: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).default('08:00'),
    timezone: z.string().default('UTC'),
  }).default({}),
  
  // Last updated timestamp
  updatedAt: z.date().default(() => new Date()),
});

/**
 * Notification preferences type
 */
export type NotificationPreferences = z.infer<typeof notificationPreferencesSchema>;

/**
 * Default notification preferences
 */
export const defaultPreferences: NotificationPreferences = {
  userId: '',
  channels: {
    [NotificationChannel.INAPP]: true,
    [NotificationChannel.EMAIL]: true,
    [NotificationChannel.PUSH]: true,
  },
  categories: {
    [NotificationCategory.POINTS]: { enabled: true },
    [NotificationCategory.ACHIEVEMENTS]: { enabled: true },
    [NotificationCategory.CONTENT]: { enabled: true },
    [NotificationCategory.SYSTEM]: { enabled: true },
    [NotificationCategory.WALLET]: { enabled: true },
    [NotificationCategory.COMMUNITY]: { enabled: true },
    [NotificationCategory.MARKETING]: { enabled: true },
  },
  types: {},
  quietHours: {
    enabled: false,
    start: '22:00',
    end: '08:00',
    timezone: 'UTC',
  },
  updatedAt: new Date(),
};

/**
 * Notification preferences update schema
 */
export const updatePreferencesSchema = notificationPreferencesSchema.partial().omit({ userId: true });

/**
 * Notification preferences update type
 */
export type UpdatePreferencesDto = z.infer<typeof updatePreferencesSchema>;

/**
 * Notification preferences service class
 */
export class PreferencesService {
  private pool: Pool;
  
  /**
   * Create a notification preferences service instance
   */
  constructor() {
    this.pool = getDatabase().pool;
  }

  /**
   * Get a user's notification preferences
   * 
   * @param userId User ID
   * @returns Notification preferences
   */
  async getPreferences(userId: string): Promise<NotificationPreferences> {
    try {
      const query = `
        SELECT preferences
        FROM user_notification_preferences
        WHERE user_id = $1
      `;
      
      const result = await this.pool.query(query, [userId]);
      
      if (result.rows.length === 0) {
        // Return default preferences for new users
        return {
          ...defaultPreferences,
          userId,
        };
      }
      
      // Parse stored preferences
      const storedPreferences = result.rows[0].preferences;
      
      // Merge with defaults to ensure all fields exist
      return {
        ...defaultPreferences,
        ...storedPreferences,
        userId,
      };
    } catch (error) {
      logger.error('Failed to get notification preferences', { error, userId });
      
      // Return default preferences on error
      return {
        ...defaultPreferences,
        userId,
      };
    }
  }

  /**
   * Update a user's notification preferences
   * 
   * @param userId User ID
   * @param updates Preference updates
   * @returns Updated preferences
   */
  async updatePreferences(
    userId: string,
    updates: UpdatePreferencesDto
  ): Promise<NotificationPreferences> {
    try {
      // Get current preferences
      const current = await this.getPreferences(userId);
      
      // Merge updates with current preferences
      const updated = this.deepMerge(current, updates) as NotificationPreferences;
      updated.updatedAt = new Date();
      
      // Save to database
      const query = `
        INSERT INTO user_notification_preferences (user_id, preferences)
        VALUES ($1, $2)
        ON CONFLICT (user_id)
        DO UPDATE SET preferences = $2
        RETURNING preferences
      `;
      
      const result = await this.pool.query(query, [
        userId,
        updated,
      ]);
      
      // Return updated preferences
      return {
        ...defaultPreferences,
        ...result.rows[0].preferences,
        userId,
      };
    } catch (error) {
      logger.error('Failed to update notification preferences', { error, userId });
      throw new Error('Failed to update notification preferences');
    }
  }

  /**
   * Reset a user's notification preferences to defaults
   * 
   * @param userId User ID
   * @returns Default preferences
   */
  async resetPreferences(userId: string): Promise<NotificationPreferences> {
    try {
      const defaults = {
        ...defaultPreferences,
        userId,
        updatedAt: new Date(),
      };
      
      // Save to database
      const query = `
        INSERT INTO user_notification_preferences (user_id, preferences)
        VALUES ($1, $2)
        ON CONFLICT (user_id)
        DO UPDATE SET preferences = $2
        RETURNING preferences
      `;
      
      await this.pool.query(query, [userId, defaults]);
      
      return defaults;
    } catch (error) {
      logger.error('Failed to reset notification preferences', { error, userId });
      throw new Error('Failed to reset notification preferences');
    }
  }

  /**
   * Check if a specific notification type is enabled for a channel
   * 
   * @param userId User ID
   * @param notificationType Notification type
   * @param channel Channel to check
   * @returns Whether the notification is enabled
   */
  async isNotificationEnabled(
    userId: string,
    notificationType: string,
    channel: NotificationChannel
  ): Promise<boolean> {
    try {
      const preferences = await this.getPreferences(userId);
      
      // Check master switch for the channel
      if (!preferences.channels[channel]) {
        return false;
      }
      
      // Check quiet hours
      if (this.isInQuietHours(preferences) && channel !== NotificationChannel.INAPP) {
        return false;
      }
      
      // Check notification type preferences
      const typePreference = preferences.types[notificationType];
      if (typePreference) {
        if (!typePreference.enabled) {
          return false;
        }
        
        if (typePreference.channels && typePreference.channels[channel] !== undefined) {
          return typePreference.channels[channel];
        }
      }
      
      // Check category preferences
      const category = this.getCategoryForType(notificationType);
      const categoryPreference = preferences.categories[category];
      if (categoryPreference) {
        if (!categoryPreference.enabled) {
          return false;
        }
        
        if (categoryPreference.channels && categoryPreference.channels[channel] !== undefined) {
          return categoryPreference.channels[channel];
        }
      }
      
      // Default to master switch value
      return !!preferences.channels[channel];
    } catch (error) {
      logger.error('Failed to check if notification is enabled', { 
        error, 
        userId, 
        notificationType, 
        channel 
      });
      
      // Default to true on error (fail open)
      return true;
    }
  }

  /**
   * Check if current time is within quiet hours
   * 
   * @param preferences User preferences
   * @returns Whether current time is in quiet hours
   */
  private isInQuietHours(preferences: NotificationPreferences): boolean {
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
  private getCategoryForType(type: string): NotificationCategory {
    const typeToCategory: Record<string, NotificationCategory> = {
      'points.awarded': NotificationCategory.POINTS,
      'points.redeemed': NotificationCategory.POINTS,
      'achievement.unlocked': NotificationCategory.ACHIEVEMENTS,
      'content.created': NotificationCategory.CONTENT,
      'content.commented': NotificationCategory.CONTENT,
      'content.reaction': NotificationCategory.CONTENT,
      'user.levelUp': NotificationCategory.SYSTEM,
      'wallet.connected': NotificationCategory.WALLET,
      'milestone.reached': NotificationCategory.COMMUNITY,
      'referral.attributed': NotificationCategory.COMMUNITY,
    };
    
    return typeToCategory[type] || NotificationCategory.SYSTEM;
  }

  /**
   * Deep merge two objects
   * 
   * @param target Target object
   * @param source Source object
   * @returns Merged object
   */
  private deepMerge(target: any, source: any): any {
    if (!source) {
      return target;
    }
    
    const output = { ...target };
    
    Object.keys(source).forEach(key => {
      if (source[key] === undefined) {
        return;
      }
      
      if (
        source[key] &&
        typeof source[key] === 'object' &&
        !Array.isArray(source[key])
      ) {
        output[key] = this.deepMerge(output[key] || {}, source[key]);
      } else {
        output[key] = source[key];
      }
    });
    
    return output;
  }
}

// Export singleton instance
export const preferencesService = new PreferencesService();
