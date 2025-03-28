/**
 * Market Data Cache Service
 * 
 * This service provides specialized caching for market data with features like
 * stale-while-revalidate and adaptive TTLs based on data volatility.
 */
import { redisClient } from '../../lib/redis-client';
import { logger } from '../../lib/logger';

/**
 * Cache options
 */
export interface CacheOptions {
  ttl?: number;  // Time to live in seconds
  staleWhileRevalidate?: boolean;  // Use stale data while fetching fresh
  staleTtl?: number;  // Additional time to keep stale data (seconds)
  namespace?: string;  // Cache namespace
}

/**
 * Default cache options
 */
const DEFAULT_CACHE_OPTIONS: CacheOptions = {
  ttl: 60, // 1 minute default
  staleWhileRevalidate: true,
  staleTtl: 300, // 5 minutes stale TTL
  namespace: 'market'
};

/**
 * Cached item with metadata
 */
interface CachedItem<T> {
  data: T;
  createdAt: number;
  expiresAt: number;
}

/**
 * Market data cache service
 */
export class MarketDataCacheService {
  // Default options
  private defaultOptions: CacheOptions;
  
  /**
   * Create a new market data cache service
   * 
   * @param options Default cache options
   */
  constructor(options: CacheOptions = {}) {
    this.defaultOptions = { ...DEFAULT_CACHE_OPTIONS, ...options };
  }
  
  /**
   * Set the default namespace
   * 
   * @param namespace Cache namespace
   */
  setNamespace(namespace: string): void {
    this.defaultOptions.namespace = namespace;
  }
  
  /**
   * Get a value from cache
   * 
   * @param key Cache key
   * @param options Cache options
   * @returns Cached value or null if not found
   */
  async get<T>(key: string, options: CacheOptions = {}): Promise<T | null> {
    const config = { ...this.defaultOptions, ...options };
    const fullKey = this.getFullKey(key, config.namespace);
    
    try {
      const cachedItem = await redisClient.get(fullKey);
      
      if (!cachedItem) {
        return null;
      }
      
      const parsedItem = JSON.parse(cachedItem) as CachedItem<T>;
      return parsedItem.data;
    } catch (error) {
      logger.error('Cache get error', { key, error });
      return null;
    }
  }
  
  /**
   * Set a value in cache
   * 
   * @param key Cache key
   * @param value Value to cache
   * @param options Cache options
   */
  async set<T>(key: string, value: T, options: CacheOptions = {}): Promise<void> {
    const config = { ...this.defaultOptions, ...options };
    const fullKey = this.getFullKey(key, config.namespace);
    const ttl = config.ttl ?? this.defaultOptions.ttl ?? 60;
    
    try {
      const now = Date.now();
      
      const cachedItem: CachedItem<T> = {
        data: value,
        createdAt: now,
        expiresAt: now + (ttl * 1000)
      };
      
      // Calculate full TTL including stale period if enabled
      const totalTtl = config.staleWhileRevalidate && config.staleTtl 
        ? ttl + config.staleTtl 
        : ttl;
      
      await redisClient.set(fullKey, JSON.stringify(cachedItem), totalTtl);
    } catch (error) {
      logger.error('Cache set error', { key, error });
    }
  }
  
  /**
   * Invalidate a cached key
   * 
   * @param key Cache key
   * @param namespace Optional namespace override
   */
  async invalidate(key: string, namespace?: string): Promise<void> {
    const fullKey = this.getFullKey(key, namespace || this.defaultOptions.namespace);
    
    try {
      await redisClient.del(fullKey);
    } catch (error) {
      logger.error('Cache invalidation error', { key, error });
    }
  }
  
  /**
   * Invalidate all keys matching a pattern
   * 
   * @param pattern Key pattern to match
   * @param namespace Optional namespace override
   * @returns Number of keys invalidated
   */
  async invalidatePattern(pattern: string, namespace?: string): Promise<number> {
    const ns = namespace || this.defaultOptions.namespace;
    const fullPattern = `${ns}:${pattern}`;
    
    try {
      // This is a simplified implementation
      // In production, you would use Redis SCAN with pattern matching
      // For now, just log that this method isn't fully implemented
      logger.warn('Cache invalidatePattern not fully implemented', { pattern });
      return 0;
    } catch (error) {
      logger.error('Cache pattern invalidation error', { pattern, error });
      return 0;
    }
  }
  
  /**
   * Get a value from cache with automatic fetch on miss
   * 
   * @param key Cache key
   * @param fetcher Function to fetch data on cache miss
   * @param options Cache options
   * @returns Data from cache or fetcher
   */
  async getWithFetch<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    const config = { ...this.defaultOptions, ...options };
    const fullKey = this.getFullKey(key, config.namespace);
    
    try {
      // Try to get from cache
      const cachedItem = await redisClient.get(fullKey);
      
      if (cachedItem) {
        const parsedItem = JSON.parse(cachedItem) as CachedItem<T>;
        const now = Date.now();
        
        // If not expired, return immediately
        if (parsedItem.expiresAt > now) {
          return parsedItem.data;
        }
        
        // If stale but within stale TTL, return stale data and trigger revalidation
        if (config.staleWhileRevalidate && 
            config.staleTtl && 
            parsedItem.expiresAt + (config.staleTtl * 1000) > now) {
          // Schedule background refresh
          this.backgroundRefresh(key, fetcher, options).catch(err => {
            logger.warn('Background refresh failed', { key, error: err.message });
          });
          
          // Return stale data
          return parsedItem.data;
        }
      }
      
      // Fetch fresh data
      const freshData = await fetcher();
      
      // Cache the result
      await this.set(key, freshData, options);
      
      return freshData;
    } catch (error) {
      logger.error('Cache fetch error', { key, error });
      throw error;
    }
  }
  
  /**
   * Perform a background refresh of a cached item
   * 
   * @param key Cache key
   * @param fetcher Function to fetch fresh data
   * @param options Cache options
   */
  private async backgroundRefresh<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<void> {
    try {
      // Set a lock to prevent multiple concurrent refreshes
      const lockKey = `lock:${this.getFullKey(key, options.namespace || this.defaultOptions.namespace)}`;
      const lockAcquired = await redisClient.set(lockKey, '1', 60, 'NX');
      
      if (!lockAcquired) {
        // Another process is already refreshing
        return;
      }
      
      // Fetch fresh data
      const freshData = await fetcher();
      
      // Update cache
      await this.set(key, freshData, options);
      
      // Release lock
      await redisClient.del(lockKey);
      
      logger.debug('Background refresh completed', { key });
    } catch (error) {
      logger.error('Background refresh error', { key, error });
      
      // Release lock on error
      const lockKey = `lock:${this.getFullKey(key, options.namespace || this.defaultOptions.namespace)}`;
      await redisClient.del(lockKey);
    }
  }
  
  /**
   * Get a full cache key with namespace
   * 
   * @param key Base key
   * @param namespace Namespace
   * @returns Full cache key
   */
  private getFullKey(key: string, namespace?: string): string {
    return namespace ? `${namespace}:${key}` : key;
  }
}

// Export singleton instance
export const marketDataCache = new MarketDataCacheService();
