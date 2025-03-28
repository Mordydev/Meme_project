/**
 * Rate Limiting Service
 * 
 * This module provides a service for rate limiting requests.
 */

import { logger } from '../../lib/logger';
import { MemoryStore, RateLimitStore } from './store';
import { 
  FixedWindowStrategy, 
  SlidingWindowStrategy, 
  TokenBucketStrategy, 
  RateLimitStrategy,
  RateLimitResult 
} from './strategy';

/**
 * Rate limit configuration
 */
export interface RateLimitConfig {
  max: number;
  timeWindow: string | number;
  strategy: 'fixed-window' | 'sliding-window' | 'token-bucket';
}

/**
 * Parse time window from string or number
 */
export function parseTimeWindow(timeWindow: string | number): number {
  if (typeof timeWindow === 'number') {
    return timeWindow;
  }
  
  const match = timeWindow.match(/^(\d+)\s*(\w+)$/);
  
  if (!match) {
    return 60; // Default to 60 seconds
  }
  
  const value = parseInt(match[1], 10);
  const unit = match[2].toLowerCase();
  
  switch (unit) {
    case 'second':
    case 'seconds':
      return value;
    case 'minute':
    case 'minutes':
      return value * 60;
    case 'hour':
    case 'hours':
      return value * 60 * 60;
    case 'day':
    case 'days':
      return value * 24 * 60 * 60;
    default:
      return 60; // Default to 60 seconds
  }
}

/**
 * Rate Limiting Service
 */
export class RateLimitService {
  private strategies: Map<string, RateLimitStrategy>;
  private store: RateLimitStore;
  
  /**
   * Create a new rate limit service
   */
  constructor(store?: RateLimitStore) {
    this.store = store || new MemoryStore();
    
    // Initialize strategies
    this.strategies = new Map();
    this.strategies.set('fixed-window', new FixedWindowStrategy(this.store));
    this.strategies.set('sliding-window', new SlidingWindowStrategy(this.store));
    this.strategies.set('token-bucket', new TokenBucketStrategy(this.store));
    
    logger.info('Rate limit service initialized');
  }
  
  /**
   * Consume points from a rate limit
   */
  async consume(key: string, points: number, config: RateLimitConfig): Promise<RateLimitResult> {
    try {
      const strategy = this.strategies.get(config.strategy);
      
      if (!strategy) {
        throw new Error(`Unknown rate limit strategy: ${config.strategy}`);
      }
      
      const timeWindowSeconds = parseTimeWindow(config.timeWindow);
      
      return await strategy.consume(key, points, config.max, timeWindowSeconds);
    } catch (error) {
      logger.error('Error consuming rate limit', { error, key, points });
      
      // Default to allowed in case of errors
      return {
        allowed: true,
        limit: config.max,
        remaining: config.max - points,
        current: points,
        resetTime: Math.floor(Date.now() / 1000) + parseTimeWindow(config.timeWindow)
      };
    }
  }
  
  /**
   * Reset rate limit for a key
   */
  async reset(key: string): Promise<void> {
    try {
      await this.store.delete(key);
    } catch (error) {
      logger.error('Error resetting rate limit', { error, key });
    }
  }
  
  /**
   * Get rate limit status
   */
  async getStatus(key: string, config: RateLimitConfig): Promise<RateLimitResult> {
    try {
      const strategy = this.strategies.get(config.strategy);
      
      if (!strategy) {
        throw new Error(`Unknown rate limit strategy: ${config.strategy}`);
      }
      
      const timeWindowSeconds = parseTimeWindow(config.timeWindow);
      
      return await strategy.getStatus(key, config.max, timeWindowSeconds);
    } catch (error) {
      logger.error('Error getting rate limit status', { error, key });
      
      // Default response in case of errors
      return {
        allowed: true,
        limit: config.max,
        remaining: config.max,
        current: 0,
        resetTime: Math.floor(Date.now() / 1000) + parseTimeWindow(config.timeWindow)
      };
    }
  }
}

// Export singleton instance
export const rateLimitService = new RateLimitService();
