/**
 * Unified Cache Service
 * 
 * Provides a standardized interface for caching across the application.
 * Implements multi-level caching with Redis as the primary cache.
 */
import { redis } from '../../lib/redis';
import { logger } from '../../lib/logger';
import { eventBus, EventType } from '../../lib/event-bus';

export type CacheTTL = number | {
  short: number;   // Short-lived cache (default: 30 seconds)
  medium: number;  // Medium-lived cache (default: 5 minutes)
  long: number;    // Long-lived cache (default: 30 minutes)
};

export interface CacheOptions {
  ttl?: number;
  scope?: string;
  prefix?: string;
  ignoreCacheErrors?: boolean;
}

const defaultTTL = {
  short: 30,         // 30 seconds for very volatile data
  medium: 300,       // 5 minutes for semi-volatile data
  long: 1800,        // 30 minutes for more stable data
  default: 300,      // Default TTL
};

/**
 * Key categories for different types of data with appropriate TTLs
 */
export enum CacheCategory {
  CONTENT = 'content',         // Content data (medium TTL)
  USER = 'user',               // User data (medium TTL)
  FEED = 'feed',               // Feed data (short TTL)
  LEADERBOARD = 'leaderboard', // Leaderboard data (short TTL)
  POINTS = 'points',           // Points data (short TTL)
  MARKET = 'market',           // Market data (very short TTL)
  CONFIG = 'config',           // Config data (long TTL)
  TAXONOMY = 'taxonomy',       // Categories, tags, etc. (long TTL)
  STATS = 'stats',             // Statistics (medium TTL)
}

export class CacheService {
  private defaultPrefix: string = 'cache';
  private categoryTTL: Record<CacheCategory, number> = {
    [CacheCategory.CONTENT]: defaultTTL.medium,
    [CacheCategory.USER]: defaultTTL.medium,
    [CacheCategory.FEED]: defaultTTL.short,
    [CacheCategory.LEADERBOARD]: defaultTTL.short,
    [CacheCategory.POINTS]: defaultTTL.short,
    [CacheCategory.MARKET]: 15, // Very short TTL for market data
    [CacheCategory.CONFIG]: defaultTTL.long,
    [CacheCategory.TAXONOMY]: defaultTTL.long,
    [CacheCategory.STATS]: defaultTTL.medium,
  };

  /**
   * Generate a consistent cache key with optional scoping
   */
  generateKey(
    category: CacheCategory,
    id: string | number,
    scope: string | null = null
  ): string {
    return scope
      ? `${this.defaultPrefix}:${category}:${id}:${scope}`
      : `${this.defaultPrefix}:${category}:${id}`;
  }

  /**
   * Get data from cache
   */
  async get<T>(
    category: CacheCategory, 
    id: string | number, 
    options: CacheOptions = {}
  ): Promise<T | null> {
    const key = this.generateKey(category, id, options.scope || null);
    
    try {
      const cached = await redis.get(key);
      
      if (cached) {
        logger.debug('Cache hit', { key, category });
        return JSON.parse(cached) as T;
      }
      
      logger.debug('Cache miss', { key, category });
      return null;
    } catch (error) {
      if (!options.ignoreCacheErrors) {
        logger.error('Error getting from cache', { error, key, category });
      }
      return null;
    }
  }

  /**
   * Set data in cache with appropriate TTL
   */
  async set<T>(
    category: CacheCategory, 
    id: string | number, 
    data: T, 
    options: CacheOptions = {}
  ): Promise<boolean> {
    if (data === null || data === undefined) {
      return false;
    }
    
    const key = this.generateKey(category, id, options.scope || null);
    
    // Determine TTL to use
    const ttl = options.ttl || this.categoryTTL[category] || defaultTTL.default;
    
    try {
      await redis.set(key, JSON.stringify(data), 'EX', ttl);
      logger.debug('Cache set', { key, category, ttl });
      return true;
    } catch (error) {
      if (!options.ignoreCacheErrors) {
        logger.error('Error setting in cache', { error, key, category });
      }
      return false;
    }
  }

  /**
   * Get or set cache data with automatic fetching
   */
  async getOrSet<T>(
    category: CacheCategory,
    id: string | number,
    fetchFn: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    try {
      // Try to get from cache first
      const cached = await this.get<T>(category, id, options);
      
      if (cached !== null) {
        return cached;
      }
      
      // On cache miss, fetch fresh data
      const data = await fetchFn();
      
      // Cache the result for future
      await this.set(category, id, data, options);
      
      return data;
    } catch (error) {
      logger.error('Error in getOrSet', { error, category, id });
      throw error;
    }
  }

  /**
   * Delete specific cache entry
   */
  async delete(
    category: CacheCategory, 
    id: string | number, 
    options: CacheOptions = {}
  ): Promise<boolean> {
    const key = this.generateKey(category, id, options.scope || null);
    
    try {
      await redis.del(key);
      logger.debug('Cache deleted', { key, category });
      return true;
    } catch (error) {
      if (!options.ignoreCacheErrors) {
        logger.error('Error deleting from cache', { error, key, category });
      }
      return false;
    }
  }

  /**
   * Delete cache entries by pattern
   */
  async deleteByPattern(pattern: string): Promise<number> {
    try {
      const keys = await redis.keys(`${this.defaultPrefix}:${pattern}`);
      
      if (keys.length === 0) {
        return 0;
      }
      
      const deleted = await redis.del(keys);
      logger.debug('Cache deleted by pattern', { pattern, deletedCount: deleted });
      
      return deleted;
    } catch (error) {
      logger.error('Error deleting from cache by pattern', { error, pattern });
      return 0;
    }
  }

  /**
   * Invalidate all caches for a category
   */
  async invalidateCategory(category: CacheCategory): Promise<number> {
    try {
      return await this.deleteByPattern(`${category}:*`);
    } catch (error) {
      logger.error('Error invalidating cache category', { error, category });
      return 0;
    }
  }

  /**
   * Warming cache for critical data
   */
  async warmCache<T>(
    category: CacheCategory, 
    id: string | number, 
    fetchFn: () => Promise<T>, 
    options: CacheOptions = {}
  ): Promise<boolean> {
    try {
      const data = await fetchFn();
      await this.set(category, id, data, options);
      return true;
    } catch (error) {
      logger.error('Error warming cache', { error, category, id });
      return false;
    }
  }

  /**
   * Set up event listeners to automatically invalidate cache
   */
  setupInvalidators(): void {
    // Content cache invalidation
    eventBus.subscribe(EventType.CONTENT_CREATED, (event) => {
      this.invalidateCategory(CacheCategory.FEED);
      this.delete(CacheCategory.CONTENT, event.contentId);
    });
    
    eventBus.subscribe(EventType.CONTENT_UPDATED, (event) => {
      this.invalidateCategory(CacheCategory.FEED);
      this.delete(CacheCategory.CONTENT, event.contentId);
    });
    
    eventBus.subscribe(EventType.CONTENT_DELETED, (event) => {
      this.invalidateCategory(CacheCategory.FEED);
      this.delete(CacheCategory.CONTENT, event.contentId);
    });
    
    // Comment cache invalidation
    eventBus.subscribe(EventType.COMMENT_CREATED, (event) => {
      this.delete(CacheCategory.CONTENT, event.contentId);
      this.deleteByPattern(`${CacheCategory.CONTENT}:${event.contentId}:comments*`);
    });
    
    // Points cache invalidation
    eventBus.subscribe(EventType.POINTS_AWARDED, (event) => {
      this.delete(CacheCategory.POINTS, event.userId);
      this.delete(CacheCategory.USER, event.userId);
      this.invalidateCategory(CacheCategory.LEADERBOARD);
    });
    
    eventBus.subscribe(EventType.POINTS_REDEEMED, (event) => {
      this.delete(CacheCategory.POINTS, event.userId);
      this.delete(CacheCategory.USER, event.userId);
    });
    
    // User cache invalidation
    eventBus.subscribe(EventType.USER_UPDATED, (event) => {
      this.delete(CacheCategory.USER, event.userId);
    });
    
    // Achievement cache invalidation
    eventBus.subscribe(EventType.ACHIEVEMENT_UNLOCKED, (event) => {
      this.delete(CacheCategory.USER, event.userId);
      this.deleteByPattern(`${CacheCategory.USER}:${event.userId}:achievements*`);
    });
  }
}

// Export singleton instance
export const cacheService = new CacheService();
cacheService.setupInvalidators();

// Decorator for class methods to add caching
export function cached<T>(
  category: CacheCategory,
  idGenerator: (args: any[]) => string | number,
  options: CacheOptions = {}
) {
  return function(
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function(...args: any[]) {
      const id = idGenerator(args);
      
      return cacheService.getOrSet<T>(
        category,
        id,
        () => originalMethod.apply(this, args),
        options
      );
    };
    
    return descriptor;
  };
}
