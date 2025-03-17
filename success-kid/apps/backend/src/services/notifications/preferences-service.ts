/**
 * Notification Preferences Service
 * 
 * Handles user notification preferences
 */
import { 
  NotificationPreferences,
  NotificationChannel
} from '../../models/notification';
import { NotificationPreferencesRepository } from '../../repositories/notification-preferences-repository';
import { logger } from '../../lib/logger';

/**
 * Service for managing notification preferences
 */
export class NotificationPreferencesService {
  constructor(private preferencesRepository: NotificationPreferencesRepository) {}

  /**
   * Get user's notification preferences
   * 
   * @param userId User ID
   * @returns User preferences
   */
  async getPreferences(userId: string): Promise<NotificationPreferences> {
    try {
      return await this.preferencesRepository.getPreferences(userId);
    } catch (error) {
      logger.error('Error getting notification preferences', { error, userId });
      throw error;
    }
  }

  /**
   * Update channel preferences
   * 
   * @param userId User ID
   * @param channels Channel preferences
   * @returns Updated preferences
   */
  async updateChannelPreferences(
    userId: string,
    channels: Partial<Record<NotificationChannel, boolean>>
  ): Promise<NotificationPreferences> {
    try {
      const current = await this.preferencesRepository.getPreferences(userId);
      
      // Update channel preferences
      const updatedChannels = {
        ...current.channels,
        ...channels
      };
      
      return await this.preferencesRepository.updatePreferences(userId, {
        channels: updatedChannels
      });
    } catch (error) {
      logger.error('Error updating channel preferences', { error, userId, channels });
      throw error;
    }
  }

  /**
   * Update category preferences
   * 
   * @param userId User ID
   * @param category Category name
   * @param enabled Whether category is enabled
   * @param channelPreferences Optional channel-specific preferences
   * @returns Updated preferences
   */
  async updateCategoryPreferences(
    userId: string,
    category: string,
    enabled: boolean,
    channelPreferences?: Partial<Record<NotificationChannel, boolean>>
  ): Promise<NotificationPreferences> {
    try {
      const current = await this.preferencesRepository.getPreferences(userId);
      
      // Get current category settings
      const currentCategory = current.categories[category] || {
        enabled: true,
        channels: {}
      };
      
      // Update category settings
      const updatedCategory = {
        enabled,
        channels: {
          ...currentCategory.channels,
          ...channelPreferences
        }
      };
      
      // Update categories object
      const updatedCategories = {
        ...current.categories,
        [category]: updatedCategory
      };
      
      return await this.preferencesRepository.updatePreferences(userId, {
        categories: updatedCategories
      });
    } catch (error) {
      logger.error('Error updating category preferences', { 
        error, 
        userId, 
        category, 
        enabled, 
        channelPreferences 
      });
      throw error;
    }
  }

  /**
   * Update quiet hours settings
   * 
   * @param userId User ID
   * @param quietHours Quiet hours settings
   * @returns Updated preferences
   */
  async updateQuietHours(
    userId: string,
    quietHours: {
      enabled: boolean;
      start?: string;
      end?: string;
      timezone?: string;
    }
  ): Promise<NotificationPreferences> {
    try {
      const current = await this.preferencesRepository.getPreferences(userId);
      
      // Update quiet hours settings
      const updatedQuietHours = {
        ...current.quietHours,
        enabled: quietHours.enabled
      };
      
      // Update optional fields if provided
      if (quietHours.start) {
        updatedQuietHours.start = quietHours.start;
      }
      
      if (quietHours.end) {
        updatedQuietHours.end = quietHours.end;
      }
      
      if (quietHours.timezone) {
        updatedQuietHours.timezone = quietHours.timezone;
      }
      
      return await this.preferencesRepository.updatePreferences(userId, {
        quietHours: updatedQuietHours
      });
    } catch (error) {
      logger.error('Error updating quiet hours', { error, userId, quietHours });
      throw error;
    }
  }

  /**
   * Reset notification preferences to default
   * 
   * @param userId User ID
   * @returns Reset preferences
   */
  async resetPreferences(userId: string): Promise<NotificationPreferences> {
    try {
      return await this.preferencesRepository.resetPreferences(userId);
    } catch (error) {
      logger.error('Error resetting notification preferences', { error, userId });
      throw error;
    }
  }

  /**
   * Check if notification is enabled for a specific channel and type
   * 
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
      return await this.preferencesRepository.isNotificationEnabled(userId, type, channel);
    } catch (error) {
      logger.error('Error checking if notification is enabled', { error, userId, type, channel });
      
      // Default to enabled if there's an error
      return true;
    }
  }
}
