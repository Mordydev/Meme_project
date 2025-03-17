/**
 * Presence Service
 * 
 * Handles user presence management and real-time status updates
 */
import { 
  PresenceData, 
  PresenceStatus,
  PresencePreferences,
  PresenceVisibility,
  UpdatePresenceDto,
  UpdatePresencePreferencesDto,
  PresenceEventType
} from '../../models/presence';
import { PresenceRepository } from '../../repositories/presence-repository';
import { WebSocketService } from '../../websockets/websocket-service';
import { eventBus, EventType } from '../../lib/event-bus';
import { logger } from '../../lib/logger';

/**
 * Service for managing user presence
 */
export class PresenceService {
  private webSocketService?: WebSocketService;
  
  /**
   * Create presence service
   * @param presenceRepository Repository for presence data
   * @param webSocketService Optional WebSocket service for real-time updates
   */
  constructor(
    private presenceRepository: PresenceRepository,
    webSocketService?: WebSocketService
  ) {
    this.webSocketService = webSocketService;
  }

  /**
   * Update user presence
   * 
   * @param userId User ID
   * @param data Presence update data
   * @returns Updated presence data
   */
  async updatePresence(userId: string, data: UpdatePresenceDto): Promise<PresenceData> {
    try {
      // Update presence in database
      const presence = await this.presenceRepository.updatePresence(userId, data);
      
      // Publish event for real-time updates
      await eventBus.publish(EventType.PRESENCE_UPDATED, {
        userId,
        status: presence.status,
        lastActive: presence.lastActive
      });
      
      // Send WebSocket update
      if (this.webSocketService) {
        // Get user's presence preferences
        const preferences = await this.getPresencePreferences(userId);
        
        if (preferences.showStatus) {
          // Broadcast presence update to followers via WebSocket
          // This would need a follow/follower repository in a real implementation
          
          // For now, just send to user's own connections
          this.webSocketService.sendToUser(userId, {
            type: PresenceEventType.STATUS_CHANGED,
            data: {
              userId,
              status: presence.status,
              lastActive: presence.lastActive.toISOString()
            },
            timestamp: new Date().toISOString()
          });
        }
      }
      
      return presence;
    } catch (error) {
      logger.error('Error updating user presence', { error, userId, data });
      throw error;
    }
  }

  /**
   * Get user presence
   * 
   * @param userId User ID
   * @returns Presence data
   */
  async getUserPresence(userId: string): Promise<PresenceData | null> {
    try {
      return await this.presenceRepository.getUserPresence(userId);
    } catch (error) {
      logger.error('Error getting user presence', { error, userId });
      throw error;
    }
  }

  /**
   * Get presence for multiple users
   * 
   * @param userIds User IDs
   * @returns Map of user IDs to presence data
   */
  async getUsersPresence(userIds: string[]): Promise<Record<string, PresenceData>> {
    try {
      return await this.presenceRepository.getUsersPresence(userIds);
    } catch (error) {
      logger.error('Error getting users presence', { error, userIds });
      throw error;
    }
  }

  /**
   * Get users with specific status
   * 
   * @param status Presence status
   * @param limit Maximum number of users to return
   * @returns Array of presence data
   */
  async getUsersByStatus(status: PresenceStatus, limit = 100): Promise<PresenceData[]> {
    try {
      return await this.presenceRepository.getUsersByStatus(status, limit);
    } catch (error) {
      logger.error('Error getting users by status', { error, status, limit });
      throw error;
    }
  }

  /**
   * Get presence preferences
   * 
   * @param userId User ID
   * @returns Presence preferences
   */
  async getPresencePreferences(userId: string): Promise<PresencePreferences> {
    try {
      // This could be implemented in the presence repository
      // For now, we'll return a default preferences object
      
      return {
        userId,
        visibility: PresenceVisibility.EVERYONE,
        showStatus: true,
        showLastActive: true,
        updatedAt: new Date()
      };
    } catch (error) {
      logger.error('Error getting presence preferences', { error, userId });
      throw error;
    }
  }

  /**
   * Update presence preferences
   * 
   * @param userId User ID
   * @param updates Preference updates
   * @returns Updated preferences
   */
  async updatePresencePreferences(
    userId: string,
    updates: UpdatePresencePreferencesDto
  ): Promise<PresencePreferences> {
    try {
      // This could be implemented in the presence repository
      // For now, we'll return a default preferences object with updates
      
      const preferences = await this.getPresencePreferences(userId);
      
      const updatedPreferences = {
        ...preferences,
        ...updates,
        updatedAt: new Date()
      };
      
      return updatedPreferences;
    } catch (error) {
      logger.error('Error updating presence preferences', { error, userId, updates });
      throw error;
    }
  }

  /**
   * Subscribe user to presence updates for other users
   * 
   * @param userId User ID
   * @param targetIds Target user IDs
   * @returns Success status
   */
  async subscribeToPresence(userId: string, targetIds: string[]): Promise<boolean> {
    try {
      if (!this.webSocketService) {
        return false;
      }
      
      // Get current presence data for targets
      const presenceData = await this.presenceRepository.getUsersPresence(targetIds);
      
      // Send initial presence data
      this.webSocketService.sendToUser(userId, {
        type: PresenceEventType.BATCH_UPDATE,
        data: {
          presences: Object.entries(presenceData).reduce((acc, [targetId, data]) => {
            acc[targetId] = {
              status: data.status,
              lastActive: data.lastActive.toISOString(),
              metadata: data.metadata
            };
            return acc;
          }, {})
        },
        timestamp: new Date().toISOString()
      });
      
      // Subscribe to updates
      // In a real implementation, this would store subscription state
      
      return true;
    } catch (error) {
      logger.error('Error subscribing to presence updates', { error, userId, targetIds });
      throw error;
    }
  }

  /**
   * Clean up stale presence data
   * 
   * @param olderThan Date threshold
   * @returns Number of records updated
   */
  async cleanupStalePresence(olderThan: Date): Promise<number> {
    try {
      return await this.presenceRepository.deleteStalePresence(olderThan);
    } catch (error) {
      logger.error('Error cleaning up stale presence data', { error, olderThan });
      throw error;
    }
  }
}
