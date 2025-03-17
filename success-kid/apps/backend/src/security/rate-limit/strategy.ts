/**
 * Rate Limiting Strategies
 * 
 * This module provides different rate limiting algorithms.
 */

import { logger } from '../../lib/logger';
import { RateLimitStore } from './store';

/**
 * Rate limit result
 */
export interface RateLimitResult {
  allowed: boolean;     // Whether the request is allowed
  limit: number;        // Maximum allowed requests
  remaining: number;    // Remaining requests
  current: number;      // Current usage
  resetTime: number;    // When the rate limit resets (unix timestamp)
}

/**
 * Rate limit strategy interface
 */
export interface RateLimitStrategy {
  /**
   * Consume points from a rate limit
   */
  consume(key: string, points: number, limit: number, windowSeconds: number): Promise<RateLimitResult>;
  
  /**
   * Get rate limit status
   */
  getStatus(key: string, limit: number, windowSeconds: number): Promise<RateLimitResult>;
}

/**
 * Fixed Window strategy
 * 
 * This strategy uses a fixed time window for rate limiting.
 * All requests within the window count towards the limit.
 * The window resets at fixed intervals.
 */
export class FixedWindowStrategy implements RateLimitStrategy {
  private store: RateLimitStore;
  
  constructor(store: RateLimitStore) {
    this.store = store;
  }
  
  /**
   * Consume points from a rate limit
   */
  async consume(key: string, points: number, limit: number, windowSeconds: number): Promise<RateLimitResult> {
    try {
      // Generate window key
      const timestamp = Math.floor(Date.now() / 1000);
      const windowStart = timestamp - (timestamp % windowSeconds);
      const windowKey = `${key}:${windowStart}`;
      
      // Get current counter
      const current = await this.store.get(windowKey);
      
      // Calculate remaining points
      const remaining = limit - current - points;
      
      // If limit exceeded, return denied result
      if (remaining < 0) {
        return {
          allowed: false,
          limit,
          remaining: 0,
          current: current + points,
          resetTime: windowStart + windowSeconds
        };
      }
      
      // Otherwise, increment counter and allow
      await this.store.increment(windowKey, points, windowSeconds);
      
      return {
        allowed: true,
        limit,
        remaining,
        current: current + points,
        resetTime: windowStart + windowSeconds
      };
    } catch (error) {
      logger.error('Fixed window consume error', { error, key });
      
      // Default to allowed in case of errors
      return {
        allowed: true,
        limit,
        remaining: limit - points,
        current: points,
        resetTime: Math.floor(Date.now() / 1000) + windowSeconds
      };
    }
  }
  
  /**
   * Get rate limit status
   */
  async getStatus(key: string, limit: number, windowSeconds: number): Promise<RateLimitResult> {
    try {
      // Generate window key
      const timestamp = Math.floor(Date.now() / 1000);
      const windowStart = timestamp - (timestamp % windowSeconds);
      const windowKey = `${key}:${windowStart}`;
      
      // Get current counter
      const current = await this.store.get(windowKey);
      
      // Calculate remaining points
      const remaining = Math.max(0, limit - current);
      
      return {
        allowed: remaining > 0,
        limit,
        remaining,
        current,
        resetTime: windowStart + windowSeconds
      };
    } catch (error) {
      logger.error('Fixed window getStatus error', { error, key });
      
      // Default to allowed in case of errors
      return {
        allowed: true,
        limit,
        remaining: limit,
        current: 0,
        resetTime: Math.floor(Date.now() / 1000) + windowSeconds
      };
    }
  }
}

/**
 * Sliding Window strategy
 * 
 * This strategy uses a sliding time window for rate limiting.
 * It tracks requests in the current window and a portion of the previous window.
 * This provides a smoother rate limiting experience than fixed windows.
 */
export class SlidingWindowStrategy implements RateLimitStrategy {
  private store: RateLimitStore;
  
  constructor(store: RateLimitStore) {
    this.store = store;
  }
  
  /**
   * Consume points from a rate limit
   */
  async consume(key: string, points: number, limit: number, windowSeconds: number): Promise<RateLimitResult> {
    try {
      // Generate window keys
      const timestamp = Math.floor(Date.now() / 1000);
      const currentWindowStart = timestamp - (timestamp % windowSeconds);
      const previousWindowStart = currentWindowStart - windowSeconds;
      
      const currentWindowKey = `${key}:${currentWindowStart}`;
      const previousWindowKey = `${key}:${previousWindowStart}`;
      
      // Get counters for both windows
      const currentCount = await this.store.get(currentWindowKey);
      const previousCount = await this.store.get(previousWindowKey);
      
      // Calculate elapsed part of the current window (0 to 1)
      const windowElapsed = (timestamp - currentWindowStart) / windowSeconds;
      
      // Calculate the weighted count using current and previous window
      // As the window progresses, previous window counts less and less
      const weightedCount = currentCount + previousCount * (1 - windowElapsed);
      
      // Calculate remaining points
      const remaining = Math.floor(limit - weightedCount - points);
      
      // If limit exceeded, return denied result
      if (remaining < 0) {
        return {
          allowed: false,
          limit,
          remaining: 0,
          current: Math.ceil(weightedCount) + points,
          resetTime: currentWindowStart + windowSeconds
        };
      }
      
      // Otherwise, increment counter and allow
      await this.store.increment(currentWindowKey, points, windowSeconds * 2);
      
      return {
        allowed: true,
        limit,
        remaining,
        current: Math.ceil(weightedCount) + points,
        resetTime: currentWindowStart + Math.ceil(windowSeconds * (1 - windowElapsed))
      };
    } catch (error) {
      logger.error('Sliding window consume error', { error, key });
      
      // Default to allowed in case of errors
      return {
        allowed: true,
        limit,
        remaining: limit - points,
        current: points,
        resetTime: Math.floor(Date.now() / 1000) + windowSeconds
      };
    }
  }
  
  /**
   * Get rate limit status
   */
  async getStatus(key: string, limit: number, windowSeconds: number): Promise<RateLimitResult> {
    try {
      // Generate window keys
      const timestamp = Math.floor(Date.now() / 1000);
      const currentWindowStart = timestamp - (timestamp % windowSeconds);
      const previousWindowStart = currentWindowStart - windowSeconds;
      
      const currentWindowKey = `${key}:${currentWindowStart}`;
      const previousWindowKey = `${key}:${previousWindowStart}`;
      
      // Get counters for both windows
      const currentCount = await this.store.get(currentWindowKey);
      const previousCount = await this.store.get(previousWindowKey);
      
      // Calculate elapsed part of the current window (0 to 1)
      const windowElapsed = (timestamp - currentWindowStart) / windowSeconds;
      
      // Calculate the weighted count using current and previous window
      const weightedCount = currentCount + previousCount * (1 - windowElapsed);
      
      // Calculate remaining points
      const remaining = Math.max(0, Math.floor(limit - weightedCount));
      
      return {
        allowed: remaining > 0,
        limit,
        remaining,
        current: Math.ceil(weightedCount),
        resetTime: currentWindowStart + Math.ceil(windowSeconds * (1 - windowElapsed))
      };
    } catch (error) {
      logger.error('Sliding window getStatus error', { error, key });
      
      // Default to allowed in case of errors
      return {
        allowed: true,
        limit,
        remaining: limit,
        current: 0,
        resetTime: Math.floor(Date.now() / 1000) + windowSeconds
      };
    }
  }
}

/**
 * Token Bucket strategy
 * 
 * This strategy models a bucket of tokens that refills at a constant rate.
 * Each request consumes tokens from the bucket.
 * When the bucket is empty, requests are denied.
 * This allows for bursts of traffic while maintaining a long-term rate limit.
 */
export class TokenBucketStrategy implements RateLimitStrategy {
  private store: RateLimitStore;
  
  constructor(store: RateLimitStore) {
    this.store = store;
  }
  
  /**
   * Consume points from a rate limit
   */
  async consume(key: string, points: number, limit: number, windowSeconds: number): Promise<RateLimitResult> {
    try {
      // Calculate refill rate (tokens per second)
      const refillRate = limit / windowSeconds;
      
      // Get current bucket state
      const bucketKey = `${key}:bucket`;
      const lastUpdateKey = `${key}:last_update`;
      
      const tokens = await this.store.get(bucketKey) || limit;
      const lastUpdate = await this.store.get(lastUpdateKey) || Math.floor(Date.now() / 1000);
      
      // Calculate time elapsed since last update
      const now = Math.floor(Date.now() / 1000);
      const elapsed = Math.max(0, now - lastUpdate);
      
      // Calculate new token count after refill
      const newTokens = Math.min(limit, tokens + (elapsed * refillRate));
      
      // If not enough tokens, deny request
      if (newTokens < points) {
        // Save updated token count and timestamp
        await this.store.set(bucketKey, newTokens, windowSeconds * 2);
        await this.store.set(lastUpdateKey, now, windowSeconds * 2);
        
        // Calculate time until tokens refill
        const timeToRefill = Math.ceil((points - newTokens) / refillRate);
        
        return {
          allowed: false,
          limit,
          remaining: Math.floor(newTokens),
          current: limit - Math.floor(newTokens),
          resetTime: now + timeToRefill
        };
      }
      
      // Consume tokens and allow request
      const remainingTokens = newTokens - points;
      
      // Save updated token count and timestamp
      await this.store.set(bucketKey, remainingTokens, windowSeconds * 2);
      await this.store.set(lastUpdateKey, now, windowSeconds * 2);
      
      return {
        allowed: true,
        limit,
        remaining: Math.floor(remainingTokens),
        current: limit - Math.floor(remainingTokens),
        resetTime: now + Math.ceil((limit - remainingTokens) / refillRate)
      };
    } catch (error) {
      logger.error('Token bucket consume error', { error, key });
      
      // Default to allowed in case of errors
      return {
        allowed: true,
        limit,
        remaining: limit - points,
        current: points,
        resetTime: Math.floor(Date.now() / 1000) + windowSeconds
      };
    }
  }
  
  /**
   * Get rate limit status
   */
  async getStatus(key: string, limit: number, windowSeconds: number): Promise<RateLimitResult> {
    try {
      // Calculate refill rate (tokens per second)
      const refillRate = limit / windowSeconds;
      
      // Get current bucket state
      const bucketKey = `${key}:bucket`;
      const lastUpdateKey = `${key}:last_update`;
      
      const tokens = await this.store.get(bucketKey) || limit;
      const lastUpdate = await this.store.get(lastUpdateKey) || Math.floor(Date.now() / 1000);
      
      // Calculate time elapsed since last update
      const now = Math.floor(Date.now() / 1000);
      const elapsed = Math.max(0, now - lastUpdate);
      
      // Calculate new token count after refill
      const newTokens = Math.min(limit, tokens + (elapsed * refillRate));
      
      // Calculate time until bucket is full
      const timeToFull = Math.ceil((limit - newTokens) / refillRate);
      
      return {
        allowed: newTokens > 0,
        limit,
        remaining: Math.floor(newTokens),
        current: limit - Math.floor(newTokens),
        resetTime: now + timeToFull
      };
    } catch (error) {
      logger.error('Token bucket getStatus error', { error, key });
      
      // Default to allowed in case of errors
      return {
        allowed: true,
        limit,
        remaining: limit,
        current: 0,
        resetTime: Math.floor(Date.now() / 1000) + windowSeconds
      };
    }
  }
}
