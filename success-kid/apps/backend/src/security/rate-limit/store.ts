/**
 * Rate Limit Store
 * 
 * This module provides storage implementations for rate limiting.
 */

import { logger } from '../../lib/logger';

/**
 * Rate limit store interface
 */
export interface RateLimitStore {
  /**
   * Increment counter for a key
   */
  increment(key: string, value?: number, expiry?: number): Promise<number>;
  
  /**
   * Get counter value for a key
   */
  get(key: string): Promise<number>;
  
  /**
   * Set counter value for a key
   */
  set(key: string, value: number, expiry?: number): Promise<void>;
  
  /**
   * Delete a key
   */
  delete(key: string): Promise<void>;
  
  /**
   * Get expiry time for a key
   */
  ttl(key: string): Promise<number>;
  
  /**
   * Check if a key exists
   */
  exists(key: string): Promise<boolean>;
}

/**
 * In-memory rate limit store implementation
 */
export class MemoryStore implements RateLimitStore {
  private data: Map<string, { value: number; expires: number }> = new Map();
  
  /**
   * Initialize cleanup interval to remove expired entries
   */
  constructor(cleanupInterval = 60000) {
    // Cleanup expired entries every minute
    setInterval(() => {
      const now = Date.now();
      
      for (const [key, entry] of this.data.entries()) {
        if (entry.expires < now) {
          this.data.delete(key);
        }
      }
    }, cleanupInterval);
  }
  
  /**
   * Increment counter for a key
   */
  async increment(key: string, value = 1, expiry = 60): Promise<number> {
    const now = Date.now();
    const expires = now + (expiry * 1000);
    
    // Get existing entry or create new one
    const entry = this.data.get(key) || { value: 0, expires };
    
    // Update entry
    entry.value += value;
    entry.expires = Math.max(entry.expires, expires);
    
    // Store updated entry
    this.data.set(key, entry);
    
    return entry.value;
  }
  
  /**
   * Get counter value for a key
   */
  async get(key: string): Promise<number> {
    const entry = this.data.get(key);
    
    if (!entry) {
      return 0;
    }
    
    // Check if expired
    if (entry.expires < Date.now()) {
      this.data.delete(key);
      return 0;
    }
    
    return entry.value;
  }
  
  /**
   * Set counter value for a key
   */
  async set(key: string, value: number, expiry = 60): Promise<void> {
    const expires = Date.now() + (expiry * 1000);
    this.data.set(key, { value, expires });
  }
  
  /**
   * Delete a key
   */
  async delete(key: string): Promise<void> {
    this.data.delete(key);
  }
  
  /**
   * Get expiry time for a key
   */
  async ttl(key: string): Promise<number> {
    const entry = this.data.get(key);
    
    if (!entry) {
      return -2; // Key does not exist
    }
    
    const ttl = Math.floor((entry.expires - Date.now()) / 1000);
    
    if (ttl <= 0) {
      this.data.delete(key);
      return -1; // Key expired
    }
    
    return ttl;
  }
  
  /**
   * Check if a key exists
   */
  async exists(key: string): Promise<boolean> {
    const entry = this.data.get(key);
    
    if (!entry) {
      return false;
    }
    
    // Check if expired
    if (entry.expires < Date.now()) {
      this.data.delete(key);
      return false;
    }
    
    return true;
  }
}

/**
 * Redis rate limit store implementation
 */
export class RedisStore implements RateLimitStore {
  private redis: any; // Redis client
  private prefix: string;
  
  /**
   * Create a new Redis store
   */
  constructor(redis: any, prefix = 'ratelimit:') {
    this.redis = redis;
    this.prefix = prefix;
    
    if (!redis) {
      logger.warn('Redis client not provided for RedisStore, falling back to memory store');
    }
  }
  
  /**
   * Increment counter for a key
   */
  async increment(key: string, value = 1, expiry = 60): Promise<number> {
    try {
      const fullKey = `${this.prefix}${key}`;
      
      // Use MULTI to ensure atomic operation
      const result = await this.redis.multi()
        .incrby(fullKey, value)
        .expire(fullKey, expiry)
        .exec();
      
      return result[0][1]; // Get value from INCRBY result
    } catch (error) {
      logger.error('Redis increment error', { error, key });
      return 0;
    }
  }
  
  /**
   * Get counter value for a key
   */
  async get(key: string): Promise<number> {
    try {
      const fullKey = `${this.prefix}${key}`;
      const value = await this.redis.get(fullKey);
      
      return value ? parseInt(value, 10) : 0;
    } catch (error) {
      logger.error('Redis get error', { error, key });
      return 0;
    }
  }
  
  /**
   * Set counter value for a key
   */
  async set(key: string, value: number, expiry = 60): Promise<void> {
    try {
      const fullKey = `${this.prefix}${key}`;
      await this.redis.set(fullKey, value, 'EX', expiry);
    } catch (error) {
      logger.error('Redis set error', { error, key });
    }
  }
  
  /**
   * Delete a key
   */
  async delete(key: string): Promise<void> {
    try {
      const fullKey = `${this.prefix}${key}`;
      await this.redis.del(fullKey);
    } catch (error) {
      logger.error('Redis delete error', { error, key });
    }
  }
  
  /**
   * Get expiry time for a key
   */
  async ttl(key: string): Promise<number> {
    try {
      const fullKey = `${this.prefix}${key}`;
      return await this.redis.ttl(fullKey);
    } catch (error) {
      logger.error('Redis ttl error', { error, key });
      return -1;
    }
  }
  
  /**
   * Check if a key exists
   */
  async exists(key: string): Promise<boolean> {
    try {
      const fullKey = `${this.prefix}${key}`;
      const result = await this.redis.exists(fullKey);
      return result === 1;
    } catch (error) {
      logger.error('Redis exists error', { error, key });
      return false;
    }
  }
}
