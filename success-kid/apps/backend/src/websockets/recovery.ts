/**
 * WebSocket Connection Recovery
 * 
 * Handles connection state preservation and reconnection with state recovery.
 */
import { v4 as uuid } from 'uuid';
import { Redis } from 'ioredis';
import { getRedisClient } from '../lib/db-client';
import { logger } from '../lib/logger';

/**
 * Connection state interface
 */
export interface ConnectionState {
  connectionId: string;
  userId: string;
  subscriptions: string[];
  lastEventId?: string;
  lastSeen: Date;
  metadata: Record<string, any>;
}

/**
 * Reconnection result interface
 */
export interface ReconnectionResult {
  success: boolean;
  reason?: string;
  restoredSubscriptions?: number;
  missedEvents?: number;
}

/**
 * Connection recovery service class
 */
export class RecoveryService {
  private redis: Redis;
  private readonly stateKeyPrefix = 'ws:state:';
  private readonly stateTTL = 1800; // 30 minutes
  
  /**
   * Create a recovery service instance
   */
  constructor() {
    this.redis = getRedisClient();
  }
  
  /**
   * Generate a new connection ID
   * 
   * @returns Generated connection ID
   */
  generateConnectionId(): string {
    return uuid();
  }
  
  /**
   * Save connection state for future recovery
   * 
   * @param connectionId Connection ID
   * @param state Connection state to save
   */
  async saveConnectionState(connectionId: string, state: ConnectionState): Promise<void> {
    try {
      const key = `${this.stateKeyPrefix}${connectionId}`;
      
      // Update lastSeen
      state.lastSeen = new Date();
      
      // Save to Redis with TTL
      await this.redis.setex(
        key,
        this.stateTTL,
        JSON.stringify(state)
      );
      
      logger.debug('Saved connection state', { connectionId });
    } catch (error) {
      logger.error('Failed to save connection state', { error, connectionId });
      throw new Error('Failed to save connection state');
    }
  }
  
  /**
   * Get connection state for recovery
   * 
   * @param connectionId Connection ID
   * @returns Connection state or null if not found
   */
  async getConnectionState(connectionId: string): Promise<ConnectionState | null> {
    try {
      const key = `${this.stateKeyPrefix}${connectionId}`;
      
      // Get from Redis
      const data = await this.redis.get(key);
      
      if (!data) {
        return null;
      }
      
      // Parse state
      const state = JSON.parse(data) as ConnectionState;
      
      // Refresh TTL on access
      await this.redis.expire(key, this.stateTTL);
      
      return state;
    } catch (error) {
      logger.error('Failed to get connection state', { error, connectionId });
      return null;
    }
  }
  
  /**
   * Update connection state with a specific field
   * 
   * @param connectionId Connection ID
   * @param field Field to update
   * @param value New value
   */
  async updateConnectionState(
    connectionId: string,
    field: string,
    value: any
  ): Promise<void> {
    try {
      // Get current state
      const state = await this.getConnectionState(connectionId);
      
      if (!state) {
        logger.warn('Cannot update state, connection not found', { connectionId });
        return;
      }
      
      // Update field
      (state as any)[field] = value;
      
      // Save updated state
      await this.saveConnectionState(connectionId, state);
    } catch (error) {
      logger.error('Failed to update connection state', { error, connectionId, field });
    }
  }
  
  /**
   * Handle reconnection with state recovery
   * 
   * @param connectionId Connection ID
   * @param userId User ID for verification
   * @returns Reconnection result
   */
  async handleReconnection(
    connectionId: string,
    userId: string
  ): Promise<ReconnectionResult> {
    try {
      // Get saved state
      const state = await this.getConnectionState(connectionId);
      
      if (!state) {
        return {
          success: false,
          reason: 'state_not_found'
        };
      }
      
      // Verify user matches
      if (state.userId !== userId) {
        return {
          success: false,
          reason: 'user_mismatch'
        };
      }
      
      // Update last seen
      state.lastSeen = new Date();
      await this.saveConnectionState(connectionId, state);
      
      return {
        success: true,
        restoredSubscriptions: state.subscriptions.length,
        missedEvents: 0 // In a real implementation, we'd count missed events
      };
    } catch (error) {
      logger.error('Failed to handle reconnection', { error, connectionId, userId });
      
      return {
        success: false,
        reason: 'internal_error'
      };
    }
  }
  
  /**
   * Add a subscription to connection state
   * 
   * @param connectionId Connection ID
   * @param channel Channel to subscribe to
   */
  async addSubscription(connectionId: string, channel: string): Promise<void> {
    try {
      const state = await this.getConnectionState(connectionId);
      
      if (!state) {
        logger.warn('Cannot add subscription, connection not found', { 
          connectionId, 
          channel 
        });
        return;
      }
      
      // Add subscription if not already present
      if (!state.subscriptions.includes(channel)) {
        state.subscriptions.push(channel);
        await this.saveConnectionState(connectionId, state);
        
        logger.debug('Added subscription', { connectionId, channel });
      }
    } catch (error) {
      logger.error('Failed to add subscription', { error, connectionId, channel });
    }
  }
  
  /**
   * Remove a subscription from connection state
   * 
   * @param connectionId Connection ID
   * @param channel Channel to unsubscribe from
   */
  async removeSubscription(connectionId: string, channel: string): Promise<void> {
    try {
      const state = await this.getConnectionState(connectionId);
      
      if (!state) {
        logger.warn('Cannot remove subscription, connection not found', { 
          connectionId, 
          channel 
        });
        return;
      }
      
      // Remove subscription
      state.subscriptions = state.subscriptions.filter(s => s !== channel);
      await this.saveConnectionState(connectionId, state);
      
      logger.debug('Removed subscription', { connectionId, channel });
    } catch (error) {
      logger.error('Failed to remove subscription', { error, connectionId, channel });
    }
  }
  
  /**
   * Clean up stale connection states
   * 
   * @param maxAge Maximum age in seconds (default: 24 hours)
   * @returns Number of states cleaned up
   */
  async cleanupStaleStates(maxAge: number = 86400): Promise<number> {
    try {
      // Get keys matching pattern
      const keys = await this.redis.keys(`${this.stateKeyPrefix}*`);
      
      if (keys.length === 0) {
        return 0;
      }
      
      let cleanedCount = 0;
      
      // Use pipeline for efficiency
      const pipeline = this.redis.pipeline();
      
      for (const key of keys) {
        // Get state
        const data = await this.redis.get(key);
        
        if (!data) {
          continue;
        }
        
        try {
          const state = JSON.parse(data) as ConnectionState;
          const lastSeen = new Date(state.lastSeen);
          const ageSeconds = (Date.now() - lastSeen.getTime()) / 1000;
          
          // If older than maxAge, delete
          if (ageSeconds > maxAge) {
            pipeline.del(key);
            cleanedCount++;
          }
        } catch (error) {
          // Invalid state data, clean it up
          pipeline.del(key);
          cleanedCount++;
        }
      }
      
      // Execute pipeline
      await pipeline.exec();
      
      logger.debug('Cleaned up stale connection states', { count: cleanedCount });
      
      return cleanedCount;
    } catch (error) {
      logger.error('Failed to clean up stale connection states', { error });
      return 0;
    }
  }
}

// Export singleton instance
export const recoveryService = new RecoveryService();
