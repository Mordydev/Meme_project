/**
 * Rate Limiter
 * 
 * This utility manages rate limiting for external API providers.
 */
import { redisClient } from '../../lib/redis-client';
import { logger } from '../../lib/logger';

/**
 * Rate limit configuration
 */
export interface RateLimitConfig {
  requests: number;  // Maximum requests
  period: number;    // Time period in seconds
  burst?: number;    // Burst allowance
}

/**
 * Rate limit check result
 */
export interface RateLimitCheckResult {
  allowed: boolean;        // Whether the request is allowed
  remaining: number;       // Remaining requests in this period
  resetAt?: Date;          // When the rate limit will reset
  retryAfter?: number;     // Seconds to wait before retrying (if not allowed)
}

/**
 * Manager for rate limiting API requests to external providers
 */
export class RateLimiterManager {
  // Default rate limit settings
  private static readonly DEFAULT_RATE_LIMIT: RateLimitConfig = {
    requests: 30,
    period: 60,
    burst: 5
  };
  
  // Rate limit configurations by provider
  private rateLimits: Map<string, RateLimitConfig> = new Map();
  
  /**
   * Create a new rate limiter manager
   */
  constructor() {}
  
  /**
   * Set rate limit configuration for a provider
   * 
   * @param provider Provider identifier
   * @param config Rate limit configuration
   */
  setRateLimit(provider: string, config: RateLimitConfig): void {
    this.rateLimits.set(provider, config);
    logger.info(`Rate limit set for ${provider}`, config);
  }
  
  /**
   * Get rate limit configuration for a provider
   * 
   * @param provider Provider identifier
   * @returns Rate limit configuration
   */
  getRateLimit(provider: string): RateLimitConfig {
    return this.rateLimits.get(provider) || RateLimiterManager.DEFAULT_RATE_LIMIT;
  }
  
  /**
   * Check if a request is allowed under rate limits
   * 
   * @param provider Provider identifier
   * @param key Optional sub-key for more granular limits (e.g., endpoint)
   * @returns Rate limit check result
   */
  async checkRateLimit(provider: string, key?: string): Promise<RateLimitCheckResult> {
    const rateLimit = this.getRateLimit(provider);
    const redisKey = `ratelimit:${provider}${key ? `:${key}` : ''}`;
    
    try {
      // Get current usage count
      const count = await redisClient.get(redisKey);
      const currentCount = count ? parseInt(count, 10) : 0;
      
      // Get TTL for key (time to reset)
      const ttl = await redisClient.client.ttl(`${redisClient.prefixKey(redisKey)}`);
      const resetAt = ttl > 0 ? new Date(Date.now() + ttl * 1000) : new Date();
      
      // Calculate effective limit (including burst if allowed)
      const effectiveLimit = rateLimit.requests + (rateLimit.burst || 0);
      
      // Check if limit exceeded
      if (currentCount >= effectiveLimit) {
        return {
          allowed: false,
          remaining: 0,
          resetAt,
          retryAfter: ttl > 0 ? ttl : rateLimit.period
        };
      }
      
      // Calculate remaining requests
      const remaining = effectiveLimit - currentCount - 1;
      
      // Increment counter
      if (currentCount === 0) {
        // Set new counter with expiration
        await redisClient.set(redisKey, '1', rateLimit.period);
      } else {
        // Increment existing counter
        await redisClient.client.incr(`${redisClient.prefixKey(redisKey)}`);
      }
      
      return {
        allowed: true,
        remaining,
        resetAt
      };
    } catch (error) {
      // Log error but allow request (fail open for rate limiting)
      logger.error('Rate limit check failed', { provider, key, error });
      
      return {
        allowed: true,
        remaining: 1
      };
    }
  }
  
  /**
   * Consume a rate limit token (for manual tracking)
   * 
   * @param provider Provider identifier
   * @param key Optional sub-key for more granular limits
   * @returns Rate limit check result
   */
  async consumeRateLimit(provider: string, key?: string): Promise<RateLimitCheckResult> {
    const result = await this.checkRateLimit(provider, key);
    
    // Log if we're running low on remaining requests
    if (result.allowed && result.remaining < 5) {
      logger.warn(`Rate limit running low for ${provider}${key ? `:${key}` : ''}`, {
        remaining: result.remaining,
        resetAt: result.resetAt
      });
    }
    
    return result;
  }
  
  /**
   * Reset rate limit counter for a provider (for testing or recovery)
   * 
   * @param provider Provider identifier
   * @param key Optional sub-key for more granular limits
   */
  async resetRateLimit(provider: string, key?: string): Promise<void> {
    const redisKey = `ratelimit:${provider}${key ? `:${key}` : ''}`;
    
    try {
      await redisClient.del(redisKey);
      logger.info(`Rate limit reset for ${provider}${key ? `:${key}` : ''}`);
    } catch (error) {
      logger.error('Rate limit reset failed', { provider, key, error });
    }
  }
}

// Export singleton instance
export const rateLimiter = new RateLimiterManager();
