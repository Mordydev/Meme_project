/**
 * Redis client singleton for the application
 */
import Redis from 'ioredis';
import { redisConfig } from '../config/redis';
import { logger } from './logger';

/**
 * Create Redis client instance with configuration
 */
export const createRedisClient = (): Redis => {
  const redis = new Redis(redisConfig.url, {
    ...redisConfig.options,
    keyPrefix: redisConfig.keyPrefix,
  });

  // Register event handlers
  redis.on('connect', () => {
    logger.info('Redis client connected');
  });

  redis.on('error', (error) => {
    logger.error('Redis client error', { error });
  });

  return redis;
};

// Export a singleton instance
export const redis = createRedisClient();

// Helper functions for common Redis operations
export const redisHelpers = {
  /**
   * Get a value with automatic JSON parsing
   */
  async getJson<T>(key: string): Promise<T | null> {
    const value = await redis.get(key);
    if (!value) return null;
    
    try {
      return JSON.parse(value) as T;
    } catch (error) {
      logger.error('Error parsing Redis JSON value', { key, error });
      return null;
    }
  },
  
  /**
   * Set a value with automatic JSON stringification
   */
  async setJson<T>(key: string, value: T, expireSeconds?: number): Promise<'OK'> {
    const jsonValue = JSON.stringify(value);
    
    if (expireSeconds) {
      return redis.set(key, jsonValue, 'EX', expireSeconds);
    }
    
    return redis.set(key, jsonValue);
  },
  
  /**
   * Delete a key
   */
  async delete(key: string): Promise<number> {
    return redis.del(key);
  },
  
  /**
   * Check if a key exists
   */
  async exists(key: string): Promise<boolean> {
    const result = await redis.exists(key);
    return result === 1;
  },
  
  /**
   * Set a key with expiration if it doesn't exist
   * Returns true if the key was set, false otherwise
   */
  async setNX(key: string, value: string, expireSeconds: number): Promise<boolean> {
    const result = await redis.set(key, value, 'EX', expireSeconds, 'NX');
    return result === 'OK';
  }
};
