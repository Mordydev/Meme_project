import { FastifyInstance } from 'fastify';
import { Redis } from 'ioredis';
import { config } from '../../config';
import { Logger } from 'pino';
import { MetricsService } from './metrics-service';

/**
 * Cache options for get/set operations
 */
export interface CacheOptions {
  /**
   * Use fixed TTL instead of adaptive TTL
   */
  fixedTtl?: boolean;
  
  /**
   * Cache region for partitioning
   */
  region?: string;
  
  /**
   * Tags for cache invalidation
   */
  tags?: string[];
}

/**
 * Service for caching data using Redis
 */
export class CacheService {
  private redis: Redis;
  private logger: Logger;
  private prefix: string;
  private metricsService: MetricsService;
  private fastify: FastifyInstance;
  
  constructor(fastify: FastifyInstance, prefix = 'cache:') {
    this.fastify = fastify;
    this.redis = fastify.redis;
    this.logger = fastify.log;
    this.prefix = prefix;
    this.metricsService = fastify.metrics;
  }

  /**
   * Get cached data
   * @param key Cache key
   * @param options Cache options
   * @returns Cached data or null if not found
   */
  async get<T>(key: string, options: CacheOptions = {}): Promise<T | null> {
    const cacheKey = this.buildKey(key, options);
    const timer = this.metricsService.startTimer();
    
    try {
      // Get from cache
      const cached = await this.redis.get(cacheKey);
      
      if (!cached) {
        this.metricsService.increment('cache.miss', 1);
        return null;
      }
      
      this.metricsService.increment('cache.hit', 1);
      const duration = timer();
      this.metricsService.timing('cache.get.time', duration);
      
      return JSON.parse(cached) as T;
    } catch (error) {
      // Log error but don't fail request
      this.logger.error({ error, key }, 'Failed to get cached data');
      this.metricsService.increment('cache.error', 1);
      return null;
    }
  }

  /**
   * Set data in cache
   * @param key Cache key
   * @param data Data to cache
   * @param ttlSeconds TTL in seconds (default: 300)
   * @param options Cache options
   * @returns true if successful
   */
  async set<T>(
    key: string, 
    data: T, 
    ttlSeconds = 300,
    options: CacheOptions = {}
  ): Promise<boolean> {
    const cacheKey = this.buildKey(key, options);
    const timer = this.metricsService.startTimer();
    
    try {
      // Get adaptive TTL based on system load
      const effectiveTtl = await this.getAdaptiveTtl(ttlSeconds, options);
      
      // Set with expiration
      await this.redis.set(
        cacheKey,
        JSON.stringify(data),
        'EX',
        effectiveTtl
      );
      
      // Store tags if provided for later invalidation
      if (options.tags && options.tags.length > 0) {
        await this.storeTags(cacheKey, options.tags);
      }
      
      const duration = timer();
      this.metricsService.timing('cache.set.time', duration);
      this.metricsService.increment('cache.set', 1);
      this.metricsService.gauge('cache.ttl', effectiveTtl);
      
      return true;
    } catch (error) {
      // Log error but don't fail request
      this.logger.error({ error, key }, 'Failed to set cached data');
      this.metricsService.increment('cache.error', 1);
      return false;
    }
  }

  /**
   * Delete cached data
   * @param key Cache key
   * @param options Cache options
   * @returns true if successful
   */
  async delete(key: string, options: CacheOptions = {}): Promise<boolean> {
    try {
      const cacheKey = this.buildKey(key, options);
      await this.redis.del(cacheKey);
      
      this.metricsService.increment('cache.delete', 1);
      return true;
    } catch (error) {
      this.logger.error({ error, key }, 'Failed to delete cached data');
      this.metricsService.increment('cache.error', 1);
      return false;
    }
  }

  /**
   * Delete cached data by pattern
   * @param pattern Cache key pattern
   * @param options Cache options
   * @returns true if successful
   */
  async deleteByPattern(pattern: string, options: CacheOptions = {}): Promise<boolean> {
    try {
      const cachePattern = this.buildKey(pattern, options);
      
      // Find keys matching pattern
      const keys = await this.redis.keys(cachePattern);
      
      if (keys.length === 0) return true;
      
      // Delete all matched keys
      await this.redis.del(...keys);
      
      this.metricsService.increment('cache.delete_pattern', 1);
      this.metricsService.gauge('cache.keys_deleted', keys.length);
      
      return true;
    } catch (error) {
      this.logger.error({ error, pattern }, 'Failed to delete cached data by pattern');
      this.metricsService.increment('cache.error', 1);
      return false;
    }
  }
  
  /**
   * Invalidate cache by tag
   * @param tag Tag to invalidate
   * @returns Number of keys invalidated
   */
  async invalidateByTag(tag: string): Promise<number> {
    const tagKey = `${this.prefix}tag:${tag}`;
    
    try {
      // Get all keys with this tag
      const keys = await this.redis.smembers(tagKey);
      
      if (keys.length === 0) return 0;
      
      // Delete all keys
      await this.redis.del(...keys);
      
      // Delete the tag itself
      await this.redis.del(tagKey);
      
      this.metricsService.increment('cache.invalidate_tag', 1);
      this.metricsService.gauge('cache.keys_invalidated', keys.length);
      
      return keys.length;
    } catch (error) {
      this.logger.error({ error, tag }, 'Failed to invalidate cache by tag');
      this.metricsService.increment('cache.error', 1);
      return 0;
    }
  }
  
  /**
   * Get or compute cached data
   * @param key Cache key
   * @param compute Function to compute data if not in cache
   * @param ttlSeconds TTL in seconds (default: 300)
   * @param options Cache options
   * @returns Cached or computed data
   */
  async getOrCompute<T>(
    key: string,
    compute: () => Promise<T>,
    ttlSeconds = 300,
    options: CacheOptions & { forceFresh?: boolean } = {}
  ): Promise<T> {
    // Skip cache if force fresh is requested
    if (options.forceFresh) {
      const value = await compute();
      await this.set(key, value, ttlSeconds, options);
      return value;
    }
    
    // Try to get from cache
    const cached = await this.get<T>(key, options);
    
    if (cached !== null) {
      return cached;
    }
    
    // Compute fresh value
    try {
      const computeTimer = this.metricsService.startTimer();
      const value = await compute();
      const duration = computeTimer();
      
      this.metricsService.timing('cache.compute.time', duration);
      
      // Store in cache with provided TTL
      await this.set(key, value, ttlSeconds, options);
      
      return value;
    } catch (error) {
      this.logger.error({ error, key }, 'Failed to compute cached value');
      this.metricsService.increment('cache.compute.error', 1);
      throw error;
    }
  }

  /**
   * Build cache key with prefix and region
   */
  private buildKey(key: string, options: CacheOptions = {}): string {
    const region = options.region ? `${options.region}:` : '';
    return `${this.prefix}${region}${key}`;
  }
  
  /**
   * Store tags for a cache key
   */
  private async storeTags(cacheKey: string, tags: string[]): Promise<void> {
    try {
      // For each tag, add this key to a set of keys with that tag
      const promises = tags.map(tag => {
        const tagKey = `${this.prefix}tag:${tag}`;
        return this.redis.sadd(tagKey, cacheKey);
      });
      
      await Promise.all(promises);
    } catch (error) {
      this.logger.error({ error, cacheKey, tags }, 'Failed to store cache tags');
    }
  }
  
  /**
   * Get adaptive TTL based on system load
   */
  private async getAdaptiveTtl(baseTtl: number, options: CacheOptions = {}): Promise<number> {
    // Skip adaptive TTL if specified
    if (options.fixedTtl) {
      return baseTtl;
    }
    
    try {
      // Get system load directly from health service if available
      let loadFactor = 0.5; // Default load factor
      
      if (this.fastify && this.fastify.health) {
        loadFactor = await this.fastify.health.getSystemLoad();
      } else {
        // Fallback to metrics service if health service is not available
        const cpuUsage = await this.metricsService.getGauge('system.cpu.usage');
        const memoryUsage = await this.metricsService.getGauge('system.memory.usage');
        loadFactor = Math.max(cpuUsage || 0.5, memoryUsage || 0.5);
      }
      
      // Scale TTL based on load
      if (loadFactor > 0.8) { // High load
        return Math.min(baseTtl * 3, 86400); // Triple TTL, max 24 hours
      } else if (loadFactor > 0.6) { // Moderate-high load
        return Math.min(baseTtl * 2, 43200); // Double TTL, max 12 hours
      } else if (loadFactor > 0.4) { // Moderate load
        return Math.min(baseTtl * 1.5, 21600); // 1.5x TTL, max 6 hours
      }
      
      return baseTtl;
    } catch (error) {
      this.logger.error({ error }, 'Failed to get adaptive TTL, using base TTL');
      return baseTtl;
    }
  }
}
