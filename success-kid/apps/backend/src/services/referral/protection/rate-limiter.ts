/**
 * Referral Rate Limiter
 * 
 * Specialized service for handling rate limiting for referral-related operations
 */
import { Redis } from 'ioredis';
import { logger } from '../../../lib/logger';
import { EventBus } from '../../../lib/event-bus';

/**
 * Rate limit result
 */
export interface RateLimitResult {
  allowed: boolean;
  limitExceeded?: boolean;
  currentCount?: number;
  limit?: number;
  resetTime?: Date;
}

/**
 * Limit configuration for different actions
 */
interface LimitConfig {
  id: string;
  limit: number;
  period: 'minute' | 'hour' | 'day' | 'week';
  errorMessage?: string;
}

/**
 * Service for rate limiting referral operations
 */
export class ReferralRateLimiter {
  /**
   * Rate limit configurations for different actions
   */
  private readonly limitConfigs: Record<string, LimitConfig[]> = {
    'referral_creation': [
      { id: 'referral_creation_minute', limit: 5, period: 'minute' },
      { id: 'referral_creation_hour', limit: 20, period: 'hour' },
      { id: 'referral_creation_day', limit: 50, period: 'day' }
    ],
    'referral_code_generation': [
      { id: 'referral_code_generation_hour', limit: 10, period: 'hour' },
      { id: 'referral_code_generation_day', limit: 20, period: 'day' }
    ],
    'referral_tracking': [
      { id: 'referral_tracking_minute', limit: 10, period: 'minute' },
      { id: 'referral_tracking_hour', limit: 100, period: 'hour' }
    ],
    'reward_redemption': [
      { id: 'reward_redemption_hour', limit: 20, period: 'hour' },
      { id: 'reward_redemption_day', limit: 100, period: 'day' },
      { id: 'reward_redemption_week', limit: 500, period: 'week' }
    ]
  };

  /**
   * Create a new ReferralRateLimiter instance
   */
  constructor(
    private redis: Redis,
    private eventBus: EventBus
  ) {}

  /**
   * Enforce rate limit for a specific action
   * 
   * @param userId User ID
   * @param actionType Action type
   * @returns Rate limit result
   */
  async enforceRateLimit(userId: string, actionType: string): Promise<RateLimitResult> {
    try {
      // Get limit configurations for this action
      const configs = this.limitConfigs[actionType];
      
      // If no configurations found, allow the action
      if (!configs || configs.length === 0) {
        return { allowed: true };
      }
      
      // Check each limit configuration
      for (const config of configs) {
        const result = await this.checkLimit(userId, config);
        
        // If any limit is exceeded, return the result
        if (!result.allowed) {
          // Log rate limit exceeded
          logger.warn(`Rate limit exceeded: ${actionType}`, {
            userId,
            actionType,
            limitId: config.id,
            current: result.currentCount,
            limit: result.limit
          });
          
          // Emit rate limit event
          await this.eventBus.publish('referral.rate_limit_exceeded', {
            userId,
            actionType,
            limitId: config.id,
            currentCount: result.currentCount,
            limit: result.limit,
            resetTime: result.resetTime
          });
          
          return result;
        }
      }
      
      // All limits passed, allow the action
      return { allowed: true };
    } catch (error) {
      logger.error('Error enforcing rate limit', {
        userId,
        actionType,
        error
      });
      
      // In case of error, allow the action (with monitoring)
      return { allowed: true };
    }
  }

  /**
   * Check a specific limit
   * 
   * @param userId User ID
   * @param config Limit configuration
   * @returns Rate limit result
   */
  private async checkLimit(userId: string, config: LimitConfig): Promise<RateLimitResult> {
    // Generate key based on user, limit ID, and current time period
    const key = this.getRateLimitKey(userId, config.id, config.period);
    
    // Get current count
    const countStr = await this.redis.get(key);
    const currentCount = countStr ? parseInt(countStr, 10) : 0;
    
    // Check if limit is exceeded
    if (currentCount >= config.limit) {
      // Get remaining time until reset
      const ttl = await this.redis.ttl(key);
      const resetTime = new Date(Date.now() + ttl * 1000);
      
      return {
        allowed: false,
        limitExceeded: true,
        currentCount,
        limit: config.limit,
        resetTime
      };
    }
    
    // Increment the counter
    await this.redis.incr(key);
    
    // Set expiry if this is a new key
    if (currentCount === 0) {
      const expirySeconds = this.getPeriodExpirySeconds(config.period);
      await this.redis.expire(key, expirySeconds);
    }
    
    // Limit not exceeded
    return {
      allowed: true,
      currentCount: currentCount + 1,
      limit: config.limit
    };
  }

  /**
   * Generate a rate limit key
   * 
   * @param userId User ID
   * @param limitId Limit ID
   * @param period Time period
   * @returns Redis key
   */
  private getRateLimitKey(
    userId: string, 
    limitId: string, 
    period: 'minute' | 'hour' | 'day' | 'week'
  ): string {
    const now = new Date();
    let timeBucket: string;
    
    switch (period) {
      case 'minute':
        timeBucket = `${now.getUTCFullYear()}-${now.getUTCMonth()}-${now.getUTCDate()}-${now.getUTCHours()}-${now.getUTCMinutes()}`;
        break;
      case 'hour':
        timeBucket = `${now.getUTCFullYear()}-${now.getUTCMonth()}-${now.getUTCDate()}-${now.getUTCHours()}`;
        break;
      case 'day':
        timeBucket = `${now.getUTCFullYear()}-${now.getUTCMonth()}-${now.getUTCDate()}`;
        break;
      case 'week':
        // Calculate week number (approximate)
        const weekNumber = Math.floor(now.getUTCDate() / 7);
        timeBucket = `${now.getUTCFullYear()}-${now.getUTCMonth()}-${weekNumber}`;
        break;
      default:
        timeBucket = `${now.getUTCFullYear()}-${now.getUTCMonth()}-${now.getUTCDate()}`;
    }
    
    return `rate_limit:${userId}:${limitId}:${timeBucket}`;
  }

  /**
   * Get expiry seconds for a period
   * 
   * @param period Time period
   * @returns Expiry seconds
   */
  private getPeriodExpirySeconds(period: 'minute' | 'hour' | 'day' | 'week'): number {
    switch (period) {
      case 'minute':
        return 60;
      case 'hour':
        return 60 * 60;
      case 'day':
        return 24 * 60 * 60;
      case 'week':
        return 7 * 24 * 60 * 60;
      default:
        return 24 * 60 * 60;
    }
  }

  /**
   * Reset rate limits for a user
   * 
   * @param userId User ID
   * @param actionType Optional action type (if not provided, all limits are reset)
   * @returns Whether reset was successful
   */
  async resetLimits(userId: string, actionType?: string): Promise<boolean> {
    try {
      let pattern: string;
      
      if (actionType) {
        // Get limit IDs for this action
        const configs = this.limitConfigs[actionType] || [];
        const limitIds = configs.map(config => config.id);
        
        // Build patterns for each limit ID
        for (const limitId of limitIds) {
          pattern = `rate_limit:${userId}:${limitId}:*`;
          const keys = await this.redis.keys(pattern);
          
          if (keys.length > 0) {
            await this.redis.del(...keys);
          }
        }
      } else {
        // Reset all limits
        pattern = `rate_limit:${userId}:*`;
        const keys = await this.redis.keys(pattern);
        
        if (keys.length > 0) {
          await this.redis.del(...keys);
        }
      }
      
      // Log reset
      logger.info(`Rate limits reset for user ${userId}${actionType ? ` (${actionType})` : ''}`);
      
      return true;
    } catch (error) {
      logger.error('Failed to reset rate limits', {
        userId,
        actionType,
        error
      });
      
      return false;
    }
  }

  /**
   * Get current rate limit status for a user
   * 
   * @param userId User ID
   * @param actionType Optional action type (if not provided, all limits are checked)
   * @returns Rate limit status
   */
  async getLimitStatus(
    userId: string, 
    actionType?: string
  ): Promise<{
    actionType: string;
    limitId: string;
    currentCount: number;
    limit: number;
    remaining: number;
    resetTime: Date;
  }[]> {
    try {
      const results = [];
      
      // Determine which actions to check
      const actionTypes = actionType 
        ? [actionType] 
        : Object.keys(this.limitConfigs);
      
      // Check each action
      for (const action of actionTypes) {
        const configs = this.limitConfigs[action] || [];
        
        // Check each limit for this action
        for (const config of configs) {
          const key = this.getRateLimitKey(userId, config.id, config.period);
          
          // Get current count and TTL
          const countStr = await this.redis.get(key);
          const currentCount = countStr ? parseInt(countStr, 10) : 0;
          
          if (currentCount > 0) {
            const ttl = await this.redis.ttl(key);
            const resetTime = new Date(Date.now() + ttl * 1000);
            
            results.push({
              actionType: action,
              limitId: config.id,
              currentCount,
              limit: config.limit,
              remaining: Math.max(0, config.limit - currentCount),
              resetTime
            });
          }
        }
      }
      
      return results;
    } catch (error) {
      logger.error('Failed to get limit status', {
        userId,
        actionType,
        error
      });
      
      return [];
    }
  }
}
