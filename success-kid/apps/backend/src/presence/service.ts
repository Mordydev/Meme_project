/**
 * Presence Service
 * 
 * Manages user online presence status.
 */
import { Redis } from 'ioredis';
import { getRedisClient } from '../lib/db-client';
import { logger } from '../lib/logger';
import { eventBus, EventType } from '../lib/event-bus';
import { connectionManager } from '../websockets/connection-manager';

/**
 * Presence status enum
 */
export enum PresenceStatus {
  ONLINE = 'online',   // User is online and active
  AWAY = 'away',       // User is online but inactive
  BUSY = 'busy',       // User is online but has set busy status
  OFFLINE = 'offline', // User is offline
}

/**
 * Privacy level enum
 */
export enum PrivacyLevel {
  EVERYONE = 'everyone',         // Anyone can see presence
  FOLLOWERS = 'followers',       // Only followers can see presence
  NOBODY = 'nobody',             // Nobody can see presence
  SELECTED_USERS = 'selected',   // Only selected users can see presence
}

/**
 * Presence data interface
 */
export interface PresenceData {
  userId: string;
  status: PresenceStatus;
  lastActive: Date;
  metadata?: Record<string, any>;
  privacyLevel?: PrivacyLevel;
  customStatus?: string;
}

/**
 * Presence service class
 */
export class PresenceService {
  private redis: Redis;
  private readonly presencePrefix = 'presence:';
  private readonly presenceTTL = 120; // 2 minutes
  private readonly presenceHeartbeatInterval = 60; // 1 minute

  /**
   * Create a presence service instance
   */
  constructor() {
    this.redis = getRedisClient();
    this.setupCleanupJob();
  }

  /**
   * Update a user's presence status
   * 
   * @param userId User ID
   * @param status Presence status
   * @param metadata Additional metadata
   * @returns Updated presence data
   */
  async updatePresence(
    userId: string,
    status: PresenceStatus = PresenceStatus.ONLINE,
    metadata: Record<string, any> = {}
  ): Promise<PresenceData> {
    try {
      // Create presence data
      const presenceData: PresenceData = {
        userId,
        status,
        lastActive: new Date(),
        metadata
      };
      
      // Store in Redis with TTL
      const key = `${this.presencePrefix}${userId}`;
      await this.redis.hset(
        key,
        {
          status,
          lastActive: presenceData.lastActive.toISOString(),
          metadata: JSON.stringify(metadata)
        }
      );
      
      // Set expiration
      await this.redis.expire(key, this.presenceTTL);
      
      // Get previous status if any
      const previousStatus = await this.getUserPresence(userId);
      
      // Only publish event if status changed
      if (!previousStatus || previousStatus.status !== status) {
        // Publish presence update event
        eventBus.publish(EventType.PRESENCE_UPDATED, {
          userId,
          status,
          previousStatus: previousStatus?.status || PresenceStatus.OFFLINE,
          timestamp: presenceData.lastActive.toISOString()
        });
        
        // Broadcast to relevant users if online
        this.broadcastPresenceUpdate(presenceData);
      }
      
      return presenceData;
    } catch (error) {
      logger.error('Failed to update presence', { error, userId, status });
      throw new Error('Failed to update presence');
    }
  }

  /**
   * Get a user's presence status
   * 
   * @param userId User ID
   * @returns Presence data or null if not found
   */
  async getUserPresence(userId: string): Promise<PresenceData | null> {
    try {
      const key = `${this.presencePrefix}${userId}`;
      const data = await this.redis.hgetall(key);
      
      if (!data || Object.keys(data).length === 0) {
        return null;
      }
      
      return {
        userId,
        status: data.status as PresenceStatus,
        lastActive: new Date(data.lastActive),
        metadata: data.metadata ? JSON.parse(data.metadata) : undefined,
        customStatus: data.customStatus,
        privacyLevel: data.privacyLevel as PrivacyLevel
      };
    } catch (error) {
      logger.error('Failed to get user presence', { error, userId });
      return null;
    }
  }

  /**
   * Get presence status for multiple users
   * 
   * @param userIds User IDs
   * @returns Map of user IDs to presence data
   */
  async getUsersPresence(userIds: string[]): Promise<Map<string, PresenceData>> {
    try {
      const result = new Map<string, PresenceData>();
      
      // Don't run a pipeline if no users
      if (userIds.length === 0) {
        return result;
      }
      
      // Use Redis pipeline for efficiency
      const pipeline = this.redis.pipeline();
      
      userIds.forEach(userId => {
        pipeline.hgetall(`${this.presencePrefix}${userId}`);
      });
      
      const responses = await pipeline.exec();
      
      // Process responses
      responses?.forEach((response, index) => {
        const [error, data] = response;
        
        if (error || !data || Object.keys(data).length === 0) {
          // Set offline status for users without presence data
          result.set(userIds[index], {
            userId: userIds[index],
            status: PresenceStatus.OFFLINE,
            lastActive: new Date(0)
          });
          return;
        }
        
        result.set(userIds[index], {
          userId: userIds[index],
          status: data.status as PresenceStatus,
          lastActive: new Date(data.lastActive),
          metadata: data.metadata ? JSON.parse(data.metadata) : undefined,
          customStatus: data.customStatus,
          privacyLevel: data.privacyLevel as PrivacyLevel
        });
      });
      
      return result;
    } catch (error) {
      logger.error('Failed to get users presence', { error, userCount: userIds.length });
      
      // Return offline status for all users on error
      const result = new Map<string, PresenceData>();
      
      userIds.forEach(userId => {
        result.set(userId, {
          userId,
          status: PresenceStatus.OFFLINE,
          lastActive: new Date(0)
        });
      });
      
      return result;
    }
  }

  /**
   * Subscribe a user to presence updates for other users
   * 
   * @param userId User ID
   * @param targetIds Target user IDs to subscribe to
   */
  async subscribeToPresence(userId: string, targetIds: string[]): Promise<void> {
    try {
      // In a real implementation, store subscriptions in Redis or database
      // For now, log the subscription
      logger.debug('User subscribed to presence updates', { userId, targetIds });
      
      // Return existing presence for the subscribed users
      const presenceData = await this.getUsersPresence(targetIds);
      
      // Send initial presence data to the subscriber if online
      if (connectionManager.isUserOnline(userId)) {
        const message = {
          type: 'presence.initial',
          payload: {
            presence: Array.from(presenceData.entries()).map(([id, data]) => ({
              userId: id,
              status: data.status,
              lastActive: data.lastActive.toISOString(),
              customStatus: data.customStatus
            })),
            timestamp: new Date().toISOString()
          }
        };
        
        connectionManager.sendToUser(userId, message.type, message.payload);
      }
    } catch (error) {
      logger.error('Failed to subscribe to presence', { error, userId, targetIds });
      throw new Error('Failed to subscribe to presence');
    }
  }

  /**
   * Update presence from WebSocket activity
   * 
   * @param userId User ID
   * @param metadata Optional connection metadata
   */
  async updatePresenceFromWebSocket(
    userId: string,
    metadata: Record<string, any> = {}
  ): Promise<void> {
    try {
      await this.updatePresence(userId, PresenceStatus.ONLINE, {
        ...metadata,
        source: 'websocket'
      });
    } catch (error) {
      logger.error('Failed to update presence from WebSocket', { error, userId });
    }
  }

  /**
   * Set user to offline when disconnected
   * 
   * @param userId User ID
   */
  async setUserOffline(userId: string): Promise<void> {
    try {
      // Check if user has any remaining connections
      const isOnline = connectionManager.isUserOnline(userId);
      
      if (!isOnline) {
        // Get current presence to preserve metadata
        const currentPresence = await this.getUserPresence(userId);
        const metadata = currentPresence?.metadata || {};
        
        // Update to offline
        await this.updatePresence(userId, PresenceStatus.OFFLINE, metadata);
      }
    } catch (error) {
      logger.error('Failed to set user offline', { error, userId });
    }
  }

  /**
   * Broadcast presence update to relevant users
   * 
   * @param presenceData Presence data to broadcast
   */
  private async broadcastPresenceUpdate(presenceData: PresenceData): Promise<void> {
    try {
      // In a real implementation, determine who should receive this update
      // based on privacy settings and subscriptions
      
      // For now, just broadcast to all online users
      const message = {
        type: 'presence.update',
        payload: {
          userId: presenceData.userId,
          status: presenceData.status,
          lastActive: presenceData.lastActive.toISOString(),
          customStatus: presenceData.customStatus,
          timestamp: new Date().toISOString()
        }
      };
      
      // In a real implementation, determine recipients based on
      // privacy settings and subscriptions
      // For now, only broadcast if the user is online
      if (presenceData.status === PresenceStatus.ONLINE) {
        connectionManager.sendToAll(message.type, message.payload);
      }
    } catch (error) {
      logger.error('Failed to broadcast presence update', { 
        error, 
        userId: presenceData.userId 
      });
    }
  }

  /**
   * Set up automatic cleanup of stale presence data
   */
  private setupCleanupJob(): void {
    // Redis TTL handles most cleanup automatically
    
    // Additional cleanup logic could be added here if needed
    // For example, a periodic job to check for stale presence data
    // that wasn't properly cleaned up by TTL
  }
}

// Export singleton instance
export const presenceService = new PresenceService();
