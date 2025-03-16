/**
 * Caching service for market data
 * Provides multi-level caching with Redis and memory
 */
import { Redis } from 'ioredis';
import NodeCache from 'node-cache';
import { CacheOptions } from '../types';
import { logger } from '../../../lib/logger';

/**
 * Caching service interface
 */
export interface ICacheService {
  get<T>(key: string, options?: CacheOptions): Promise<T | null>;
  set<T>(key: string, value: T, options?: CacheOptions): Promise<void>;
  invalidate(key: string): Promise<void>;
  invalidatePattern(pattern: string): Promise<number>;
  getWithFetch<T>(key: string, fetcher: () => Promise<T>, options?: CacheOptions): Promise<T>;
}

/**
 * Caching service implementation
 */
export class CacheService implements ICacheService {
  private redis: Redis;
  private memoryCache: NodeCache;
  private defaultOptions: CacheOptions = {
    ttl: 60, // 1 minute
    staleWhileRevalidate: true,
    staleTtl: 300, // 5 minutes
    namespace: 'market'
  };
  
  /**
   * Create a new caching service
   * @param redis Redis client
   */
  constructor(redis: Redis) {
    this.redis = redis;
    
    // Initialize memory cache with default TTL of 30 seconds
    this.memoryCache = new NodeCache({
      stdTTL: 30,
      checkperiod: 60,
      useClones: false
    });
    
    // Log cache stats periodically
    setInterval(() => {
      const stats = this.memoryCache.getStats();
      logger.debug('Memory cache stats', { ...stats });
    }, 5 * 60 * 1000);
  }
  
  /**
   * Get a value from cache
   * @param key Cache key
   * @param options Cache options
   * @returns Cached value or null
   */
  async get<T>(key: string, options: CacheOptions = {}): Promise<T | null> {
    const config = { ...this.defaultOptions, ...options };
    const fullKey = `${config.namespace}:${key}`;
    
    // Try memory cache first
    const memValue = this.memoryCache.get<T>(fullKey);
    if (memValue !== undefined) {
      return memValue;
    }
    
    // Try Redis cache
    try {
      const redisValue = await this.redis.get(fullKey);
      if (redisValue) {
        const parsedValue = JSON.parse(redisValue);
        
        // Store in memory cache for future requests
        this.memoryCache.set(fullKey, parsedValue.data);
        
        return parsedValue.data as T;
      }
      
      return null;
    } catch (error) {
      logger.error('Redis cache retrieval error', { key, error: error.message });
      return null;
    }
  }
  
  /**
   * Set a value in cache
   * @param key Cache key
   * @param value Value to cache
   * @param options Cache options
   */
  async set<T>(key: string, value: T, options: CacheOptions = {}): Promise<void> {
    const config = { ...this.defaultOptions, ...options };
    const fullKey = `${config.namespace}:${key}`;
    
    try {
      // Create cache item with metadata
      const cacheItem = {
        data: value,
        createdAt: Date.now(),
        expiresAt: Date.now() + (config.ttl * 1000)
      };
      
      // Set in Redis
      await this.redis.set(
        fullKey,
        JSON.stringify(cacheItem),
        'EX',
        config.ttl + (config.staleWhileRevalidate ? config.staleTtl : 0)
      );
      
      // Set in memory cache
      this.memoryCache.set(fullKey, value, config.ttl);
    } catch (error) {
      logger.error('Redis cache set error', { key, error: error.message });
      
      // Still set in memory cache if Redis fails
      this.memoryCache.set(fullKey, value, config.ttl);
    }
  }
  
  /**
   * Invalidate a cached value
   * @param key Cache key
   */
  async invalidate(key: string, options: CacheOptions = {}): Promise<void> {
    const config = { ...this.defaultOptions, ...options };
    const fullKey = `${config.namespace}:${key}`;
    
    try {
      // Remove from Redis
      await this.redis.del(fullKey);
      
      // Remove from memory cache
      this.memoryCache.del(fullKey);
    } catch (error) {
      logger.error('Cache invalidation error', { key, error: error.message });
      
      // Still remove from memory cache if Redis fails
      this.memoryCache.del(fullKey);
    }
  }
  
  /**
   * Invalidate all keys matching a pattern
   * @param pattern Key pattern to invalidate
   * @returns Number of keys invalidated
   */
  async invalidatePattern(pattern: string, options: CacheOptions = {}): Promise<number> {
    const config = { ...this.defaultOptions, ...options };
    const fullPattern = `${config.namespace}:${pattern}`;
    
    try {
      // Find all keys matching pattern
      const keys = await this.redis.keys(fullPattern);
      
      if (keys.length === 0) {
        return 0;
      }
      
      // Delete all keys
      const result = await this.redis.del(keys);
      
      // Remove matching keys from memory cache
      const memoryKeys = this.memoryCache.keys();
      for (const key of memoryKeys) {
        if (key.startsWith(config.namespace) && key.includes(pattern)) {
          this.memoryCache.del(key);
        }
      }
      
      return result;
    } catch (error) {
      logger.error('Pattern cache invalidation error', { pattern, error: error.message });
      return 0;
    }
  }
  
  /**
   * Get a value from cache or fetch it if not cached
   * @param key Cache key
   * @param fetcher Function to fetch the value if not cached
   * @param options Cache options
   * @returns Cached or fetched value
   */
  async getWithFetch<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    const config = { ...this.defaultOptions, ...options };
    const fullKey = `${config.namespace}:${key}`;
    
    try {
      // Try to get from cache
      const cachedItem = await this.redis.get(fullKey);
      
      if (cachedItem) {
        const parsedItem = JSON.parse(cachedItem);
        const now = Date.now();
        
        // If not expired, return immediately
        if (parsedItem.expiresAt > now) {
          // Store in memory cache for future requests
          this.memoryCache.set(fullKey, parsedItem.data, Math.floor((parsedItem.expiresAt - now) / 1000));
          return parsedItem.data as T;
        }
        
        // If stale but within stale TTL, return stale data and trigger revalidation
        if (config.staleWhileRevalidate && 
            parsedItem.expiresAt + (config.staleTtl * 1000) > now) {
          // Schedule background refresh
          this.backgroundRefresh(key, fetcher, options).catch(err => {
            logger.warn('Background refresh failed', { key, error: err.message });
          });
          
          return parsedItem.data as T;
        }
      }
      
      // Fetch fresh data
      const freshData = await fetcher();
      
      // Cache the result
      await this.set(key, freshData, options);
      
      return freshData;
    } catch (error) {
      logger.error('Cache fetch error', { key, error: error.message });
      throw error;
    }
  }
  
  /**
   * Refresh data in the background
   * @param key Cache key
   * @param fetcher Function to fetch the value
   * @param options Cache options
   */
  private async backgroundRefresh<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<void> {
    try {
      logger.debug(`Background refresh for ${key}`);
      
      // Use a lock to prevent multiple refreshes
      const lockKey = `lock:${options.namespace}:${key}`;
      const gotLock = await this.redis.set(lockKey, '1', 'EX', 30, 'NX');
      
      if (!gotLock) {
        logger.debug(`Background refresh already in progress for ${key}`);
        return;
      }
      
      // Fetch fresh data
      const freshData = await fetcher();
      
      // Cache the result
      await this.set(key, freshData, options);
      
      // Remove lock
      await this.redis.del(lockKey);
      
      logger.debug(`Background refresh completed for ${key}`);
    } catch (error) {
      logger.error('Background refresh error', { key, error: error.message });
      
      // Remove lock in case of error
      const lockKey = `lock:${options.namespace}:${key}`;
      await this.redis.del(lockKey).catch(() => {});
    }
  }
}
