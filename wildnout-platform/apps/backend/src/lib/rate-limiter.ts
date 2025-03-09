import Redis from 'ioredis';
import { config } from '../config';
import { RateLimitError } from './errors';
import { Logger } from 'pino';

/**
 * Rate limiter configuration for different operations
 */
interface RateLimitRule {
  /** Maximum number of requests per time window */
  limit: number;
  /** Time window in seconds */
  window: number; 
}

/**
 * Default rate limit rules for different operations
 */
const DEFAULT_RATE_LIMITS: Record<string, RateLimitRule> = {
  // WebSocket rate limits
  'ws_connection': { limit: 10, window: 60 }, // 10 connections per minute
  'ws_message': { limit: 100, window: 60 },  // 100 messages per minute per user
  'ws_channel_join': { limit: 30, window: 60 }, // 30 channel joins per minute
  
  // API rate limits
  'api_request': { limit: 100, window: 60 }, // 100 API requests per minute
  'api_auth': { limit: 10, window: 60 },     // 10 auth attempts per minute
  'api_content_creation': { limit: 30, window: 60 }, // 30 content creations per minute
  'api_battle_submission': { limit: 10, window: 60 },  // 10 battle submissions per minute
  'api_wallet_operation': { limit: 10, window: 60 },   // 10 wallet operations per minute
  
  // Default fallback
  'default': { limit: 60, window: 60 } // 60 requests per minute
};

/**
 * Service for rate limiting different operations in the application
 */
export class RateLimiter {
  private redis: Redis;
  private logger: Logger;
  private rules: Record<string, RateLimitRule>;
  
  /**
   * Create a new rate limiter
   */
  constructor(options: {
    redis?: Redis;
    logger?: Logger;
    rules?: Record<string, RateLimitRule>;
  }) {
    this.rules = { ...DEFAULT_RATE_LIMITS, ...(options.rules || {}) };
    this.logger = options.logger || console as unknown as Logger;
    
    // Use provided Redis client or create a new one
    this.redis = options.redis || new Redis(config.redis.url, {
      password: config.redis.password,
      maxRetriesPerRequest: null,
    });
  }
  
  /**
   * Check if a key is rate limited
   * @param key The key to check (usually userId or IP)
   * @param operation The operation type to check
   * @returns True if rate limited, false otherwise
   */
  async isLimited(key: string, operation: string): Promise<boolean> {
    const rule = this.rules[operation] || this.rules['default'];
    const redisKey = `ratelimit:${operation}:${key}`;
    
    try {
      // Increment counter and set expiry if it doesn't exist
      const count = await this.redis.incr(redisKey);
      if (count === 1) {
        await this.redis.expire(redisKey, rule.window);
      }
      
      return count > rule.limit;
    } catch (err) {
      this.logger.error({ err, key, operation }, 'Rate limiter Redis error');
      // If Redis fails, allow the operation (fail open for availability)
      return false;
    }
  }
  
  /**
   * Consume a rate limit token and throw an error if limited
   * @param key The key to check (usually userId or IP)
   * @param operation The operation type to check
   * @throws RateLimitError if the operation is rate limited
   */
  async consume(key: string, operation: string): Promise<void> {
    const isLimited = await this.isLimited(key, operation);
    
    if (isLimited) {
      const rule = this.rules[operation] || this.rules['default'];
      throw new RateLimitError(
        `Rate limit exceeded for ${operation}. Maximum ${rule.limit} requests per ${rule.window} seconds.`,
        { key, operation, limit: rule.limit, window: rule.window }
      );
    }
  }
  
  /**
   * Get the remaining requests allowed for a key and operation
   * @param key The key to check (usually userId or IP)
   * @param operation The operation type to check
   * @returns The number of remaining requests allowed in the current window
   */
  async getRemainingRequests(key: string, operation: string): Promise<number> {
    const rule = this.rules[operation] || this.rules['default'];
    const redisKey = `ratelimit:${operation}:${key}`;
    
    try {
      const count = await this.redis.get(redisKey);
      if (!count) {
        return rule.limit;
      }
      
      const remaining = rule.limit - parseInt(count, 10);
      return remaining > 0 ? remaining : 0;
    } catch (err) {
      this.logger.error({ err, key, operation }, 'Rate limiter Redis error');
      // If Redis fails, return a conservative estimate
      return 1;
    }
  }
  
  /**
   * Reset the rate limit counter for a key and operation
   * @param key The key to reset
   * @param operation The operation type to reset
   * @returns True if successful, false otherwise
   */
  async reset(key: string, operation: string): Promise<boolean> {
    const redisKey = `ratelimit:${operation}:${key}`;
    
    try {
      await this.redis.del(redisKey);
      return true;
    } catch (err) {
      this.logger.error({ err, key, operation }, 'Rate limiter Redis error');
      return false;
    }
  }
}
