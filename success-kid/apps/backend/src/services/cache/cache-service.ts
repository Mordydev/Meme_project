/**
 * Cache Service
 * 
 * Provides a unified interface for caching data with multiple strategies
 * and intelligent invalidation.
 */
import { redisClient } from '../../lib/redis-client';
import { logger } from '../../lib/logger';
import { EventEmitter } from 'events';

/**
 * Cache options for storing data
 */
export interface CacheOptions {
  /** 
   * Time-to-live in seconds
   * @default 300 (5 minutes)
   */
  ttl?: number;
  
  /**
   * Cache key prefix for namespace isolation
   * @default 'cache'
   */
  prefix?: string;
  
  /**
   * Tags for targeted invalidation
   * @example ['user', 'profile', 'user:123']
   */
  tags?: string[];
  
  /**
   * Whether to ignore errors when accessing cache
   * @default false
   */
  ignoreErrors?: boolean;
}

/**
 * Default cache options
 */
const DEFAULT_OPTIONS: CacheOptions = {
  ttl: 300, // 5 minutes
  prefix: 'cache',
  tags: [],
  ignoreErrors: false
};

/**
 * Cache hit result
 */
interface CacheHit<T> {
  /** Whether cache hit was successful */
  hit: true;
  
  /** Cached data */
  data: T;
  
  /** When the data was originally cached */
  cachedAt: Date;
  
  /** When the cache will expire */
  expiresAt: Date;
}

/**
 * Cache miss result
 */
interface CacheMiss {
  /** Whether cache hit was successful */
  hit: false;
}

/**
 * Cache result (either hit or miss)
 */
type CacheResult<T> = CacheHit<T> | CacheMiss;

/**
 * Cache service for storing and retrieving data with intelligent invalidation
 */
export class CacheService {
  /** Event emitter for cache events */
  private events = new EventEmitter();
  
  /** Cache hit counter */
  private hits = 0;
  
  /** Cache miss counter */
  private misses = 0;
  
  /**
   * Initialize cache service
   */
  constructor() {
    // Set maximum event listeners to avoid memory leak warnings
    this.events.setMaxListeners(100);
    
    // Log statistics periodically
    setInterval(() => {
      const total = this.hits + this.misses;
      if (total > 0) {
        const hitRate = Math.round((this.hits / total) * 100);
        logger.debug(`Cache statistics: ${this.hits} hits, ${this.misses} misses, ${hitRate}% hit rate`);
        
        // Reset counters
        this.hits = 0;
        this.misses = 0;
      }
    }, 300000); // Every 5 minutes
  }
  
  /**
   * Generate a cache key with prefix
   * 
   * @param key Base cache key
   * @param options Cache options
   * @returns Full cache key with prefix
   */
  private getFullKey(key: string, options: CacheOptions): string {
    const { prefix } = { ...DEFAULT_OPTIONS, ...options };
    return `${prefix}:${key}`;
  }
  
  /**
   * Generate a tag key for tracking keys by tag
   * 
   * @param tag Tag name
   * @returns Tag set key
   */
  private getTagKey(tag: string): string {
    return `tags:${tag}`;
  }
  
  /**
   * Store data in cache
   * 
   * @param key Cache key
   * @param data Data to cache
   * @param options Cache options
   * @returns Promise resolving when data is cached
   */
  async set<T>(key: string, data: T, options?: CacheOptions): Promise<void> {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    const fullKey = this.getFullKey(key, opts);
    
    try {
      // Create cache entry with metadata
      const entry = {
        data,
        cachedAt: new Date(),
        expiresAt: new Date(Date.now() + (opts.ttl || 0) * 1000)
      };
      
      // Store in Redis with expiration
      await redisClient.set(
        fullKey, 
        JSON.stringify(entry), 
        opts.ttl
      );
      
      // Add key to tag sets for later invalidation
      if (opts.tags && opts.tags.length > 0) {
        for (const tag of opts.tags) {
          await redisClient.sadd(this.getTagKey(tag), fullKey);
        }
      }
      
      // Emit cache set event
      this.events.emit('set', { key, fullKey });
    } catch (error) {
      if (!opts.ignoreErrors) {
        logger.error('Cache set error', { 
          error: error instanceof Error ? error.message : String(error),
          key, 
          fullKey 
        });
        throw error;
      }
    }
  }
  
  /**
   * Retrieve data from cache
   * 
   * @param key Cache key
   * @param options Cache options
   * @returns Promise resolving to cache result
   */
  async get<T>(key: string, options?: CacheOptions): Promise<CacheResult<T>> {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    const fullKey = this.getFullKey(key, opts);
    
    try {
      // Get from Redis
      const value = await redisClient.get(fullKey);
      
      // Return miss if not found
      if (!value) {
        this.misses++;
        this.events.emit('miss', { key, fullKey });
        return { hit: false };
      }
      
      // Parse cached entry
      const entry = JSON.parse(value) as CacheHit<T>;
      
      // Convert date strings back to Date objects
      entry.cachedAt = new Date(entry.cachedAt);
      entry.expiresAt = new Date(entry.expiresAt);
      
      // Track hit
      this.hits++;
      this.events.emit('hit', { key, fullKey });
      
      return {
        hit: true,
        data: entry.data,
        cachedAt: entry.cachedAt,
        expiresAt: entry.expiresAt
      };
    } catch (error) {
      if (!opts.ignoreErrors) {
        logger.error('Cache get error', { 
          error: error instanceof Error ? error.message : String(error),
          key, 
          fullKey 
        });
        throw error;
      }
      
      // Return miss on error
      this.misses++;
      return { hit: false };
    }
  }
  
  /**
   * Get data from cache or compute and store if not found
   * 
   * @param key Cache key
   * @param fetcher Function to fetch data if not in cache
   * @param options Cache options
   * @returns Promise resolving to the data
   */
  async getOrSet<T>(
    key: string, 
    fetcher: () => Promise<T>, 
    options?: CacheOptions
  ): Promise<T> {
    // Try to get from cache
    const cacheResult = await this.get<T>(key, options);
    
    // Return cached data if found
    if (cacheResult.hit) {
      return cacheResult.data;
    }
    
    // Otherwise fetch data
    const data = await fetcher();
    
    // Store in cache (don't await to avoid blocking)
    this.set(key, data, options).catch(err => {
      logger.error('Failed to cache data after fetching', { 
        error: err instanceof Error ? err.message : String(err),
        key 
      });
    });
    
    return data;
  }
  
  /**
   * Remove data from cache
   * 
   * @param key Cache key
   * @param options Cache options
   * @returns Promise resolving when data is removed
   */
  async del(key: string, options?: CacheOptions): Promise<void> {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    const fullKey = this.getFullKey(key, opts);
    
    try {
      // Delete from Redis
      await redisClient.del(fullKey);
      
      // Emit delete event
      this.events.emit('del', { key, fullKey });
    } catch (error) {
      if (!opts.ignoreErrors) {
        logger.error('Cache del error', { 
          error: error instanceof Error ? error.message : String(error),
          key, 
          fullKey 
        });
        throw error;
      }
    }
  }
  
  /**
   * Invalidate all cache entries with a specific tag
   * 
   * @param tag Tag to invalidate
   * @returns Promise resolving to the number of invalidated entries
   */
  async invalidateByTag(tag: string): Promise<number> {
    try {
      const tagKey = this.getTagKey(tag);
      
      // Get all keys for this tag
      const keys = await redisClient.smembers(tagKey);
      
      if (keys.length === 0) {
        return 0;
      }
      
      // Delete all keys
      for (const key of keys) {
        await redisClient.del(key);
      }
      
      // Delete the tag set itself
      await redisClient.del(tagKey);
      
      // Emit invalidate event
      this.events.emit('invalidateTag', { tag, count: keys.length });
      
      logger.debug(`Invalidated ${keys.length} cache entries with tag ${tag}`);
      
      return keys.length;
    } catch (error) {
      logger.error('Cache invalidateByTag error', { 
        error: error instanceof Error ? error.message : String(error),
        tag 
      });
      return 0;
    }
  }
  
  /**
   * Invalidate cache entries matching a pattern
   * 
   * @param pattern Pattern to match (e.g., "user:*")
   * @returns Promise resolving to the number of invalidated entries
   */
  async invalidateByPattern(pattern: string): Promise<number> {
    try {
      // Find keys matching pattern
      // Note: KEYS is not recommended for production with large datasets
      // Consider using SCAN for large datasets
      const keys = await redisClient.client.keys(pattern);
      
      if (keys.length === 0) {
        return 0;
      }
      
      // Delete all matching keys
      for (const key of keys) {
        await redisClient.del(key);
      }
      
      // Emit invalidate event
      this.events.emit('invalidatePattern', { pattern, count: keys.length });
      
      logger.debug(`Invalidated ${keys.length} cache entries matching pattern ${pattern}`);
      
      return keys.length;
    } catch (error) {
      logger.error('Cache invalidateByPattern error', { 
        error: error instanceof Error ? error.message : String(error),
        pattern 
      });
      return 0;
    }
  }
  
  /**
   * Subscribe to cache events
   * 
   * @param event Event name
   * @param listener Event handler
   * @returns The cache service instance for chaining
   */
  on(
    event: 'set' | 'get' | 'hit' | 'miss' | 'del' | 'invalidateTag' | 'invalidatePattern', 
    listener: (data: any) => void
  ): this {
    this.events.on(event, listener);
    return this;
  }
  
  /**
   * Unsubscribe from cache events
   * 
   * @param event Event name
   * @param listener Event handler
   * @returns The cache service instance for chaining
   */
  off(
    event: 'set' | 'get' | 'hit' | 'miss' | 'del' | 'invalidateTag' | 'invalidatePattern',
    listener: (data: any) => void
  ): this {
    this.events.off(event, listener);
    return this;
  }
}

// Export singleton instance
export const cacheService = new CacheService();

// Export default for convenience
export default cacheService;
