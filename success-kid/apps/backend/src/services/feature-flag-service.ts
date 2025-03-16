/**
 * Feature Flag Service
 * 
 * Provides a flexible feature flag system for controlled feature rollout and testing.
 */
import { Redis } from 'ioredis';
import { getRedisClient } from '../lib/db-client';
import { logger } from '../lib/logger';

/**
 * Feature flag service interface
 */
export interface FeatureFlagService {
  /**
   * Check if a feature is enabled
   * 
   * @param featureName Feature flag name
   * @param userId Optional user ID for user-specific overrides
   * @returns True if the feature is enabled
   */
  isEnabled(featureName: string, userId?: string): Promise<boolean>;
  
  /**
   * Set a global feature flag
   * 
   * @param featureName Feature flag name
   * @param enabled True to enable, false to disable
   */
  setFeatureFlag(featureName: string, enabled: boolean): Promise<void>;
  
  /**
   * Set a user-specific feature flag override
   * 
   * @param featureName Feature flag name
   * @param userId User ID to apply the override for
   * @param enabled True to enable, false to disable
   */
  setUserFeatureFlag(featureName: string, userId: string, enabled: boolean): Promise<void>;
  
  /**
   * Remove a user-specific feature flag override
   * 
   * @param featureName Feature flag name
   * @param userId User ID to remove the override for
   */
  removeUserFeatureFlag(featureName: string, userId: string): Promise<void>;
  
  /**
   * List all feature flags
   * 
   * @returns Object with feature flags and their state
   */
  listFeatureFlags(): Promise<Record<string, boolean>>;
}

/**
 * Redis-based feature flag service implementation
 */
export class RedisFeatureFlagService implements FeatureFlagService {
  private redis: Redis;
  private keyPrefix: string;
  
  /**
   * Create a new RedisFeatureFlagService instance
   * 
   * @param redis Redis client to use
   * @param keyPrefix Prefix for Redis keys
   */
  constructor(redis?: Redis, keyPrefix: string = 'feature:') {
    this.redis = redis || getRedisClient();
    this.keyPrefix = keyPrefix;
  }
  
  /**
   * Check if a feature is enabled
   * 
   * @param featureName Feature flag name
   * @param userId Optional user ID for user-specific overrides
   * @returns True if the feature is enabled
   */
  async isEnabled(featureName: string, userId?: string): Promise<boolean> {
    try {
      // Sanitize feature name
      const sanitizedFeatureName = this.sanitizeKey(featureName);
      
      // Check user-specific override if user ID is provided
      if (userId) {
        const userOverrideKey = `${this.keyPrefix}${sanitizedFeatureName}:user:${userId}`;
        const userOverride = await this.redis.get(userOverrideKey);
        
        if (userOverride !== null) {
          return userOverride === 'true';
        }
      }
      
      // Check global flag
      const globalKey = `${this.keyPrefix}${sanitizedFeatureName}`;
      const globalFlag = await this.redis.get(globalKey);
      
      return globalFlag === 'true';
    } catch (error) {
      logger.error('Error checking feature flag', { 
        featureName, 
        userId, 
        error: error.message 
      });
      
      // Default to false if there's an error
      return false;
    }
  }
  
  /**
   * Set a global feature flag
   * 
   * @param featureName Feature flag name
   * @param enabled True to enable, false to disable
   */
  async setFeatureFlag(featureName: string, enabled: boolean): Promise<void> {
    try {
      // Sanitize feature name
      const sanitizedFeatureName = this.sanitizeKey(featureName);
      const key = `${this.keyPrefix}${sanitizedFeatureName}`;
      
      // Set the feature flag
      await this.redis.set(key, enabled ? 'true' : 'false');
      
      logger.info('Feature flag updated', { featureName, enabled });
    } catch (error) {
      logger.error('Error setting feature flag', { 
        featureName, 
        enabled, 
        error: error.message 
      });
      
      throw error;
    }
  }
  
  /**
   * Set a user-specific feature flag override
   * 
   * @param featureName Feature flag name
   * @param userId User ID to apply the override for
   * @param enabled True to enable, false to disable
   */
  async setUserFeatureFlag(featureName: string, userId: string, enabled: boolean): Promise<void> {
    try {
      // Sanitize feature name
      const sanitizedFeatureName = this.sanitizeKey(featureName);
      const key = `${this.keyPrefix}${sanitizedFeatureName}:user:${userId}`;
      
      // Set the user-specific feature flag
      await this.redis.set(key, enabled ? 'true' : 'false');
      
      logger.info('User feature flag override set', { featureName, userId, enabled });
    } catch (error) {
      logger.error('Error setting user feature flag', { 
        featureName, 
        userId, 
        enabled, 
        error: error.message 
      });
      
      throw error;
    }
  }
  
  /**
   * Remove a user-specific feature flag override
   * 
   * @param featureName Feature flag name
   * @param userId User ID to remove the override for
   */
  async removeUserFeatureFlag(featureName: string, userId: string): Promise<void> {
    try {
      // Sanitize feature name
      const sanitizedFeatureName = this.sanitizeKey(featureName);
      const key = `${this.keyPrefix}${sanitizedFeatureName}:user:${userId}`;
      
      // Remove the user-specific feature flag
      await this.redis.del(key);
      
      logger.info('User feature flag override removed', { featureName, userId });
    } catch (error) {
      logger.error('Error removing user feature flag', { 
        featureName, 
        userId, 
        error: error.message 
      });
      
      throw error;
    }
  }
  
  /**
   * List all feature flags
   * 
   * @returns Object with feature flags and their state
   */
  async listFeatureFlags(): Promise<Record<string, boolean>> {
    try {
      // Find all feature flag keys
      const keys = await this.redis.keys(`${this.keyPrefix}*`);
      
      // Filter out user-specific overrides
      const globalKeys = keys.filter(key => !key.includes(':user:'));
      
      // Get values for all global keys
      const result: Record<string, boolean> = {};
      
      if (globalKeys.length === 0) {
        return result;
      }
      
      // Get all values at once
      const values = await this.redis.mget(...globalKeys);
      
      // Map keys to values
      globalKeys.forEach((key, index) => {
        // Remove prefix to get feature name
        const featureName = key.replace(this.keyPrefix, '');
        // Map value to boolean
        result[featureName] = values[index] === 'true';
      });
      
      return result;
    } catch (error) {
      logger.error('Error listing feature flags', { error: error.message });
      return {};
    }
  }
  
  /**
   * Sanitize key to prevent injection
   * 
   * @param key The key to sanitize
   * @returns Sanitized key
   */
  private sanitizeKey(key: string): string {
    return key.replace(/[^a-zA-Z0-9_-]/g, '_');
  }
}

// Export a singleton instance
export const featureFlagService = new RedisFeatureFlagService();

export default featureFlagService;
