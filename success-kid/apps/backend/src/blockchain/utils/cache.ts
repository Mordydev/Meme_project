/**
 * Blockchain Cache Utility
 * 
 * Provides caching functionality for blockchain data with TTL support.
 */
import Redis from 'ioredis';
import { config } from '../../config';
import { logger } from '../../lib/logger';

/**
 * Cache entry with TTL
 */
interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

/**
 * In-memory cache map for situations where Redis is unavailable
 */
class InMemoryCache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  
  /**
   * Set a value in the cache with TTL
   * 
   * @param key Cache key
   * @param value Value to cache
   * @param ttl TTL in milliseconds
   */
  async set<T>(key: string, value: T, ttl: number): Promise<void> {
    const expiresAt = Date.now() + ttl;
    this.cache.set(key, { value, expiresAt });
    
    // Schedule cleanup after TTL
    setTimeout(() => {
      const entry = this.cache.get(key);
      if (entry && entry.expiresAt <= Date.now()) {
        this.cache.delete(key);
      }
    }, ttl);
  }
  
  /**
   * Get a value from the cache
   * 
   * @param key Cache key
   * @returns Cached value or null if not found or expired
   */
  async get<T>(key: string): Promise<T | null> {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }
    
    // Check if entry has expired
    if (entry.expiresAt <= Date.now()) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.value as T;
  }
  
  /**
   * Delete a value from the cache
   * 
   * @param key Cache key
   */
  async del(key: string): Promise<void> {
    this.cache.delete(key);
  }
  
  /**
   * Clear all entries from the cache
   */
  async clear(): Promise<void> {
    this.cache.clear();
  }
}

/**
 * Blockchain data cache
 * 
 * Provides caching functionality for blockchain data with Redis backing
 * and fallback to in-memory cache.
 */
export class BlockchainCache {
  private redisClient: Redis | null = null;
  private memoryCache: InMemoryCache;
  private keyPrefix = 'blockchain:cache:';
  
  /**
   * Create blockchain cache
   */
  constructor() {
    this.memoryCache = new InMemoryCache();
    this.initRedis();
  }
  
  /**
   * Initialize Redis connection
   */
  private initRedis(): void {
    try {
      // Only connect to Redis if configured
      if (config.redis.enabled) {
        this.redisClient = new Redis({
          host: config.redis.host,
          port: config.redis.port,
          password: config.redis.password,
          keyPrefix: this.keyPrefix
        });
        
        this.redisClient.on('error', (error) => {
          logger.error('Redis connection error', { error });
          this.redisClient = null;
        });
        
        logger.info('Initialized Redis cache for blockchain data');
      }
    } catch (error) {
      logger.error('Failed to initialize Redis cache', { error });
      this.redisClient = null;
    }
  }
  
  /**
   * Set a value in the cache
   * 
   * @param key Cache key
   * @param value Value to cache
   * @param ttl TTL in milliseconds
   */
  async set<T>(key: string, value: T, ttl: number): Promise<void> {
    try {
      // Serialize value to JSON
      const serialized = JSON.stringify(value);
      
      // Try Redis first if available
      if (this.redisClient) {
        await this.redisClient.set(key, serialized, 'PX', ttl);
      } else {
        // Fallback to in-memory cache
        await this.memoryCache.set(key, value, ttl);
      }
    } catch (error) {
      // Log error but don't fail the operation
      logger.error('Failed to set cache value', { key, error });
      
      // Try in-memory cache as fallback
      try {
        await this.memoryCache.set(key, value, ttl);
      } catch (memoryError) {
        logger.error('Failed to set in-memory cache value', { key, error: memoryError });
      }
    }
  }
  
  /**
   * Get a value from the cache
   * 
   * @param key Cache key
   * @returns Cached value or null if not found or expired
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      // Try Redis first if available
      if (this.redisClient) {
        const value = await this.redisClient.get(key);
        if (value) {
          return JSON.parse(value) as T;
        }
      }
      
      // Fallback to in-memory cache
      return await this.memoryCache.get<T>(key);
    } catch (error) {
      // Log error but don't fail the operation
      logger.error('Failed to get cache value', { key, error });
      
      // Try in-memory cache as fallback
      try {
        return await this.memoryCache.get<T>(key);
      } catch (memoryError) {
        logger.error('Failed to get in-memory cache value', { key, error: memoryError });
        return null;
      }
    }
  }
  
  /**
   * Delete a value from the cache
   * 
   * @param key Cache key
   */
  async del(key: string): Promise<void> {
    try {
      // Try Redis first if available
      if (this.redisClient) {
        await this.redisClient.del(key);
      }
      
      // Also remove from in-memory cache
      await this.memoryCache.del(key);
    } catch (error) {
      // Log error but don't fail the operation
      logger.error('Failed to delete cache value', { key, error });
    }
  }
  
  /**
   * Clear all blockchain cache entries
   */
  async clear(): Promise<void> {
    try {
      // Clear Redis cache if available
      if (this.redisClient) {
        const keys = await this.redisClient.keys(`${this.keyPrefix}*`);
        if (keys.length) {
          await this.redisClient.del(...keys);
        }
      }
      
      // Clear in-memory cache
      await this.memoryCache.clear();
      
      logger.info('Cleared blockchain cache');
    } catch (error) {
      logger.error('Failed to clear blockchain cache', { error });
    }
  }
}
