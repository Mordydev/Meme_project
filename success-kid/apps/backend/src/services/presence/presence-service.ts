/**
 * Presence Service
 * 
 * Manages user presence and activity status across the platform
 */
import { Pool } from 'pg';
import { Redis } from 'ioredis';
import { logger } from '../../lib/logger';
import { PresenceStatus } from '../../models/presence';

/**
 * Presence update data
 */
export interface PresenceUpdate {
  /**
   * Presence status
   */
  status: PresenceStatus;
  
  /**
   * Additional metadata
   */
  metadata?: Record<string, any>;
  
  /**
   * Whether to store presence in database
   * Default: true
   */
  persist?: boolean;
  
  /**
   * Room ID if in a room
   */
  roomId?: string;
}

/**
 * Presence data
 */
export interface PresenceData {
  /**
   * User ID
   */
  userId: string;
  
  /**
   * Presence status
   */
  status: PresenceStatus;
  
  /**
   * Last activity timestamp
   */
  lastActivity: Date;
  
  /**
   * Additional metadata
   */
  metadata: Record<string, any>;
  
  /**
   * Room ID if in a room
   */
  roomId?: string;
}

/**
 * Cache key for presence data
 * @param userId User ID
 * @returns Redis key
 */
const presenceKey = (userId: string) => `presence:${userId}`;

/**
 * Room members key
 * @param roomId Room ID
 * @returns Redis key
 */
const roomMembersKey = (roomId: string) => `room:${roomId}:members`;

/**
 * Presence service for tracking user online status
 */
export class PresenceService {
  /**
   * Create presence service
   * @param db Database connection
   * @param redis Redis client
   */
  constructor(
    private readonly db: Pool,
    private readonly redis: Redis
  ) {}
  
  /**
   * Update user presence
   * @param userId User ID
   * @param update Presence update data
   * @returns Success flag
   */
  async updatePresence(userId: string, update: PresenceUpdate): Promise<boolean> {
    try {
      const now = new Date();
      const key = presenceKey(userId);
      
      // Create presence data
      const presenceData: PresenceData = {
        userId,
        status: update.status,
        lastActivity: now,
        metadata: update.metadata || {}
      };
      
      // Add room ID if provided
      if (update.roomId) {
        presenceData.roomId = update.roomId;
      }
      
      // Store in Redis
      await this.redis.set(
        key,
        JSON.stringify(presenceData),
        'EX',
        60 * 30 // 30 minutes
      );
      
      // Update room presence if room ID provided
      if (update.roomId) {
        const roomKey = roomMembersKey(update.roomId);
        
        if (update.status === PresenceStatus.ONLINE) {
          // Add to room members
          await this.redis.sadd(roomKey, userId);
          
          // Set expiry on room members set
          await this.redis.expire(roomKey, 60 * 60 * 24); // 24 hours
        } else if (
          update.status === PresenceStatus.OFFLINE ||
          update.status === PresenceStatus.AWAY
        ) {
          // Remove from room members
          await this.redis.srem(roomKey, userId);
        }
      }
      
      // Persist to database if enabled
      if (update.persist !== false) {
        await this.persistPresence(userId, update.status, now, update.metadata);
      }
      
      logger.debug(`Updated presence for user ${userId}`, {
        status: update.status,
        hasMetadata: !!update.metadata,
        roomId: update.roomId
      });
      
      return true;
    } catch (error) {
      logger.error('Error updating presence', { error, userId });
      return false;
    }
  }
  
  /**
   * Get user presence
   * @param userId User ID
   * @returns Presence data or null if not found
   */
  async getPresence(userId: string): Promise<PresenceData | null> {
    try {
      const key = presenceKey(userId);
      
      // Try to get from Redis
      const data = await this.redis.get(key);
      
      if (data) {
        // Parse and return
        return JSON.parse(data) as PresenceData;
      }
      
      // Try to get from database
      const result = await this.db.query(`
        SELECT user_id, status, last_activity, metadata
        FROM user_presence
        WHERE user_id = $1
      `, [userId]);
      
      if (result.rows.length > 0) {
        const row = result.rows[0];
        
        // Create presence data
        const presenceData: PresenceData = {
          userId: row.user_id,
          status: row.status as PresenceStatus,
          lastActivity: row.last_activity,
          metadata: row.metadata || {}
        };
        
        // Cache in Redis
        await this.redis.set(
          key,
          JSON.stringify(presenceData),
          'EX',
          60 * 30 // 30 minutes
        );
        
        return presenceData;
      }
      
      // Not found
      return null;
    } catch (error) {
      logger.error('Error getting presence', { error, userId });
      return null;
    }
  }
  
  /**
   * Get presence for multiple users
   * @param userIds User IDs
   * @returns Map of user IDs to presence data
   */
  async getMultiplePresence(userIds: string[]): Promise<Map<string, PresenceData>> {
    try {
      const result = new Map<string, PresenceData>();
      
      if (userIds.length === 0) {
        return result;
      }
      
      // Get from Redis in batch
      const keys = userIds.map(presenceKey);
      const values = await this.redis.mget(...keys);
      
      // Process results
      const missingUserIds: string[] = [];
      
      for (let i = 0; i < userIds.length; i++) {
        const userId = userIds[i];
        const value = values[i];
        
        if (value) {
          // Parse and add to result
          result.set(userId, JSON.parse(value) as PresenceData);
        } else {
          // Add to missing list
          missingUserIds.push(userId);
        }
      }
      
      // If any missing, get from database
      if (missingUserIds.length > 0) {
        const dbResult = await this.db.query(`
          SELECT user_id, status, last_activity, metadata
          FROM user_presence
          WHERE user_id = ANY($1)
        `, [missingUserIds]);
        
        // Process database results
        for (const row of dbResult.rows) {
          const userId = row.user_id;
          
          // Create presence data
          const presenceData: PresenceData = {
            userId,
            status: row.status as PresenceStatus,
            lastActivity: row.last_activity,
            metadata: row.metadata || {}
          };
          
          // Add to result
          result.set(userId, presenceData);
          
          // Cache in Redis
          await this.redis.set(
            presenceKey(userId),
            JSON.stringify(presenceData),
            'EX',
            60 * 30 // 30 minutes
          );
        }
      }
      
      return result;
    } catch (error) {
      logger.error('Error getting multiple presence', { error, userCount: userIds.length });
      return new Map();
    }
  }
  
  /**
   * Get users in a room
   * @param roomId Room ID
   * @returns Array of user IDs in the room
   */
  async getRoomUsers(roomId: string): Promise<string[]> {
    try {
      const key = roomMembersKey(roomId);
      
      // Get members from Redis
      const members = await this.redis.smembers(key);
      
      return members;
    } catch (error) {
      logger.error('Error getting room users', { error, roomId });
      return [];
    }
  }
  
  /**
   * Get presence for all users in a room
   * @param roomId Room ID
   * @returns Map of user IDs to presence data
   */
  async getRoomPresence(roomId: string): Promise<Map<string, PresenceData>> {
    try {
      // Get users in room
      const userIds = await this.getRoomUsers(roomId);
      
      // Get presence for these users
      return this.getMultiplePresence(userIds);
    } catch (error) {
      logger.error('Error getting room presence', { error, roomId });
      return new Map();
    }
  }
  
  /**
   * Clean up stale presence data
   * @param threshold Threshold date (presence older than this will be removed)
   * @returns Number of records cleaned up
   */
  async cleanupStalePresence(threshold: Date): Promise<number> {
    try {
      // Clean up database
      const result = await this.db.query(`
        DELETE FROM user_presence
        WHERE last_activity < $1
        RETURNING user_id
      `, [threshold]);
      
      const removedCount = result.rowCount || 0;
      
      if (removedCount > 0) {
        logger.info(`Cleaned up ${removedCount} stale presence records`);
      }
      
      return removedCount;
    } catch (error) {
      logger.error('Error cleaning up stale presence', { error });
      return 0;
    }
  }
  
  /**
   * Persist presence to database
   * @param userId User ID
   * @param status Presence status
   * @param timestamp Timestamp
   * @param metadata Additional metadata
   */
  private async persistPresence(
    userId: string,
    status: PresenceStatus,
    timestamp: Date,
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      // Insert or update presence record
      await this.db.query(`
        INSERT INTO user_presence (
          user_id, status, last_activity, metadata
        )
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (user_id) 
        DO UPDATE SET 
          status = EXCLUDED.status,
          last_activity = EXCLUDED.last_activity,
          metadata = EXCLUDED.metadata
      `, [
        userId,
        status,
        timestamp,
        metadata ? JSON.stringify(metadata) : null
      ]);
    } catch (error) {
      logger.error('Error persisting presence', { error, userId });
    }
  }
}
