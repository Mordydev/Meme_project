/**
 * Rate Limiting Service
 * 
 * Implements rate limiting using a sliding window algorithm
 */
import { redis } from '../../lib/redis';
import { logger } from '../../lib/logger';

/**
 * Rate limit configuration
 */
export interface RateLimitConfig {
  points: number;        // Maximum points allowed
  duration: number;      // Time window in seconds
  blockDuration?: number; // Block duration if exceeded (in seconds)
  keyPrefix?: string;    // Key prefix for storage
}

/**
 * Rate limit result
 */
export interface RateLimitResult {
  success: boolean;      // Whether points were consumed
  remaining: number;     // Remaining points
  resetTime: number;     // Time until reset (milliseconds)
  blocked: boolean;      // Whether key is blocked
  blockExpires?: number; // When block expires (if blocked)
}

/**
 * Default key prefix for rate limiting
 */
const DEFAULT_KEY_PREFIX = 'ratelimit:';

/**
 * Rate Limiting Service class
 */
export class RateLimitService {
  /**
   * Consume points from a rate limit
   * 
   * @param key The key to rate limit (e.g. user ID, IP address)
   * @param points Number of points to consume (default: 1)
   * @param config Rate limit configuration
   * @returns Rate limit result
   */
  async consume(
    key: string,
    points: number = 1,
    config: RateLimitConfig
  ): Promise<RateLimitResult> {
    const { points: limit, duration, blockDuration = 0, keyPrefix = DEFAULT_KEY_PREFIX } = config;
    
    // Create Redis keys
    const windowKey = `${keyPrefix}${key}`;
    const blockKey = `${keyPrefix}${key}:blocked`;
    
    try {
      // Check if the key is blocked
      const blockTtl = await redis.ttl(blockKey);
      if (blockTtl > 0) {
        return {
          success: false,
          remaining: 0,
          resetTime: blockTtl * 1000,
          blocked: true,
          blockExpires: Date.now() + blockTtl * 1000
        };
      }
      
      // Get current timestamp in seconds
      const now = Math.floor(Date.now() / 1000);
      
      // Clean up old entries and get current count
      const cleanupTime = now - duration;
      
      // Use Redis pipeline for efficiency
      const pipeline = redis.pipeline();
      
      // Remove entries older than the time window
      pipeline.zremrangebyscore(windowKey, 0, cleanupTime);
      
      // Add current request with score as timestamp
      pipeline.zadd(windowKey, now, `${now}:${points}`);
      
      // Set expiration on the whole set
      pipeline.expire(windowKey, duration);
      
      // Get total points in the current window
      pipeline.zrange(windowKey, 0, -1, 'WITHSCORES');
      
      const results = await pipeline.exec();
      
      // Parse the results to calculate current points
      // Last result contains the zrange result
      const rangeResult = results?.[3]?.[1] as string[];
      
      // Calculate total points in window
      let totalPoints = 0;
      for (let i = 0; i < rangeResult.length; i += 2) {
        const entry = rangeResult[i];
        totalPoints += Number(entry.split(':')[1]);
      }
      
      // Check if limit is exceeded including this request
      if (totalPoints > limit) {
        // If a block duration is specified, block the key
        if (blockDuration > 0) {
          await redis.setex(blockKey, blockDuration, '1');
        }
        
        // Calculate reset time - oldest entry plus duration
        let resetTime = 0;
        if (rangeResult.length >= 2) {
          const oldestEntryTime = Number(rangeResult[1]);
          resetTime = Math.max(0, (oldestEntryTime + duration - now) * 1000);
        }
        
        return {
          success: false,
          remaining: 0,
          resetTime,
          blocked: blockDuration > 0,
          blockExpires: blockDuration > 0 ? Date.now() + blockDuration * 1000 : undefined
        };
      }
      
      // Success - return remaining points
      return {
        success: true,
        remaining: limit - totalPoints,
        resetTime: duration * 1000,
        blocked: false
      };
    } catch (error) {
      logger.error('Rate limit error', { error, key });
      
      // Fail open - allow the request in case of Redis error
      return {
        success: true,
        remaining: 999,
        resetTime: 0,
        blocked: false
      };
    }
  }
  
  /**
   * Check if a key is blocked
   * 
   * @param key The key to check
   * @param keyPrefix Optional key prefix
   * @returns Whether the key is blocked and when the block expires
   */
  async isBlocked(
    key: string,
    keyPrefix: string = DEFAULT_KEY_PREFIX
  ): Promise<{ blocked: boolean; expires?: number }> {
    try {
      const blockKey = `${keyPrefix}${key}:blocked`;
      const ttl = await redis.ttl(blockKey);
      
      if (ttl > 0) {
        return {
          blocked: true,
          expires: Date.now() + ttl * 1000
        };
      }
      
      return { blocked: false };
    } catch (error) {
      logger.error('Error checking if key is blocked', { error, key });
      return { blocked: false };
    }
  }
  
  /**
   * Get time until rate limit reset
   * 
   * @param key The key to check
   * @param keyPrefix Optional key prefix
   * @returns Time until reset in milliseconds
   */
  async getTimeToReset(
    key: string,
    duration: number,
    keyPrefix: string = DEFAULT_KEY_PREFIX
  ): Promise<number> {
    try {
      const windowKey = `${keyPrefix}${key}`;
      const now = Math.floor(Date.now() / 1000);
      
      // Get oldest entry in the window
      const entries = await redis.zrange(windowKey, 0, 0, 'WITHSCORES');
      
      if (entries.length >= 2) {
        const oldestEntryTime = Number(entries[1]);
        return Math.max(0, (oldestEntryTime + duration - now) * 1000);
      }
      
      return 0;
    } catch (error) {
      logger.error('Error getting time to reset', { error, key });
      return 0;
    }
  }
  
  /**
   * Block a key for a specified duration
   * 
   * @param key The key to block
   * @param duration Block duration in seconds
   * @param keyPrefix Optional key prefix
   * @returns Whether the key was successfully blocked
   */
  async blockKey(
    key: string,
    duration: number,
    keyPrefix: string = DEFAULT_KEY_PREFIX
  ): Promise<boolean> {
    try {
      const blockKey = `${keyPrefix}${key}:blocked`;
      await redis.setex(blockKey, duration, '1');
      return true;
    } catch (error) {
      logger.error('Error blocking key', { error, key, duration });
      return false;
    }
  }
  
  /**
   * Unblock a key
   * 
   * @param key The key to unblock
   * @param keyPrefix Optional key prefix
   * @returns Whether the key was successfully unblocked
   */
  async unblockKey(
    key: string,
    keyPrefix: string = DEFAULT_KEY_PREFIX
  ): Promise<boolean> {
    try {
      const blockKey = `${keyPrefix}${key}:blocked`;
      await redis.del(blockKey);
      return true;
    } catch (error) {
      logger.error('Error unblocking key', { error, key });
      return false;
    }
  }
  
  /**
   * Reset rate limit for a key
   * 
   * @param key The key to reset
   * @param keyPrefix Optional key prefix
   * @returns Whether the key was successfully reset
   */
  async resetKey(
    key: string,
    keyPrefix: string = DEFAULT_KEY_PREFIX
  ): Promise<boolean> {
    try {
      const windowKey = `${keyPrefix}${key}`;
      const blockKey = `${keyPrefix}${key}:blocked`;
      
      const pipeline = redis.pipeline();
      pipeline.del(windowKey);
      pipeline.del(blockKey);
      
      await pipeline.exec();
      return true;
    } catch (error) {
      logger.error('Error resetting key', { error, key });
      return false;
    }
  }
}

// Export singleton instance
export const rateLimitService = new RateLimitService();
