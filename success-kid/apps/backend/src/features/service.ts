/**
 * Feature Flag Service
 * 
 * This service provides feature flag functionality using Redis
 * for storage and distribution across instances.
 */
import Redis from 'ioredis';
import { logger } from '../lib/logger';

/**
 * Feature Flag Service interface
 */
export interface FeatureFlagService {
  isEnabled(featureName: string, userId?: string): Promise<boolean>;
  setFeatureFlag(featureName: string, enabled: boolean): Promise<void>;
  setUserFeatureFlag(featureName: string, userId: string, enabled: boolean): Promise<void>;
  removeUserFeatureFlag(featureName: string, userId: string): Promise<void>;
  listFeatureFlags(): Promise<Record<string, boolean>>;
  listUserFeatureFlags(userId: string): Promise<Record<string, boolean>>;
}

/**
 * Redis-based implementation of Feature Flag Service
 */
export class RedisFeatureFlagService implements FeatureFlagService {
  private readonly keyPrefix = 'feature:';
  private readonly defaultTtl = 86400 * 30; // 30 days for user overrides
  
  constructor(private redis: Redis) {}
  
  /**
   * Check if a feature is enabled
   * If userId is provided, checks for user-specific override first
   */
  async isEnabled(featureName: string, userId?: string): Promise<boolean> {
    try {
      // Check user-specific override
      if (userId) {
        const userKey = `${this.keyPrefix}${featureName}:user:${userId}`;
        const userOverride = await this.redis.get(userKey);
        if (userOverride !== null) {
          return userOverride === 'true';
        }
      }
      
      // Check global flag
      const globalKey = `${this.keyPrefix}${featureName}`;
      const globalFlag = await this.redis.get(globalKey);
      
      // Default to false if not found
      return globalFlag === 'true';
    } catch (error) {
      logger.error({ err: error, featureName, userId }, 'Error checking feature flag');
      return false; // Fail safe (disabled) on error
    }
  }
  
  /**
   * Set global feature flag
   */
  async setFeatureFlag(featureName: string, enabled: boolean): Promise<void> {
    try {
      const key = `${this.keyPrefix}${featureName}`;
      await this.redis.set(key, enabled ? 'true' : 'false');
      logger.info({ featureName, enabled }, 'Feature flag updated');
    } catch (error) {
      logger.error({ err: error, featureName, enabled }, 'Error setting feature flag');
      throw error;
    }
  }
  
  /**
   * Set user-specific feature flag override
   */
  async setUserFeatureFlag(featureName: string, userId: string, enabled: boolean): Promise<void> {
    try {
      const key = `${this.keyPrefix}${featureName}:user:${userId}`;
      await this.redis.set(key, enabled ? 'true' : 'false', 'EX', this.defaultTtl);
      logger.info({ featureName, userId, enabled }, 'User feature flag updated');
    } catch (error) {
      logger.error({ err: error, featureName, userId, enabled }, 'Error setting user feature flag');
      throw error;
    }
  }
  
  /**
   * Remove user-specific feature flag override
   */
  async removeUserFeatureFlag(featureName: string, userId: string): Promise<void> {
    try {
      const key = `${this.keyPrefix}${featureName}:user:${userId}`;
      await this.redis.del(key);
      logger.info({ featureName, userId }, 'User feature flag removed');
    } catch (error) {
      logger.error({ err: error, featureName, userId }, 'Error removing user feature flag');
      throw error;
    }
  }
  
  /**
   * List all feature flags and their values
   */
  async listFeatureFlags(): Promise<Record<string, boolean>> {
    try {
      const keys = await this.redis.keys(`${this.keyPrefix}*`);
      
      // Filter out user-specific overrides
      const globalKeys = keys.filter(key => !key.includes(':user:'));
      
      if (globalKeys.length === 0) {
        return {};
      }
      
      // Get all values
      const values = await this.redis.mget(...globalKeys);
      
      // Create result object
      const result: Record<string, boolean> = {};
      globalKeys.forEach((key, index) => {
        const featureName = key.replace(this.keyPrefix, '');
        result[featureName] = values[index] === 'true';
      });
      
      return result;
    } catch (error) {
      logger.error({ err: error }, 'Error listing feature flags');
      return {};
    }
  }
  
  /**
   * List all feature flags specific to a user
   */
  async listUserFeatureFlags(userId: string): Promise<Record<string, boolean>> {
    try {
      const keys = await this.redis.keys(`${this.keyPrefix}*:user:${userId}`);
      
      if (keys.length === 0) {
        return {};
      }
      
      // Get all values
      const values = await this.redis.mget(...keys);
      
      // Create result object
      const result: Record<string, boolean> = {};
      keys.forEach((key, index) => {
        // Extract feature name from key
        const featureName = key.replace(`${this.keyPrefix}`, '').replace(`:user:${userId}`, '');
        result[featureName] = values[index] === 'true';
      });
      
      return result;
    } catch (error) {
      logger.error({ err: error, userId }, 'Error listing user feature flags');
      return {};
    }
  }
}
