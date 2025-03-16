/**
 * Media Cache Service
 * 
 * Implements efficient caching for media files to optimize delivery performance.
 */
import crypto from 'crypto';
import Redis from 'ioredis';
import { FastifyReply } from 'fastify';
import { storage } from '../storage';
import { mediaRepository } from '../../../repositories/media-repository';
import { logger } from '../../../lib/logger';
import { env } from '../../../config';

// Redis client for caching - uses connection from env configuration
let redisClient: Redis | null = null;

// Initialize Redis client if not in test environment
if (env.NODE_ENV !== 'test') {
  try {
    redisClient = new Redis(env.REDIS_URL);
    logger.info('Media cache Redis connection established');
  } catch (error) {
    logger.error('Failed to connect to Redis for media cache', { error });
  }
}

/**
 * Media caching configuration
 */
interface CacheConfig {
  enabled: boolean;
  ttl: {
    content: number;     // Content cache TTL in seconds
    metadata: number;    // Metadata cache TTL in seconds
    transform: number;   // Transformation cache TTL in seconds
  };
  maxSize: {
    content: number;     // Max size for content cache in bytes
    transform: number;   // Max size for transform cache in bytes
  };
}

// Default cache configuration
const DEFAULT_CACHE_CONFIG: CacheConfig = {
  enabled: env.NODE_ENV === 'production',
  ttl: {
    content: 7 * 24 * 60 * 60,   // 7 days for content
    metadata: 24 * 60 * 60,      // 1 day for metadata
    transform: 30 * 24 * 60 * 60 // 30 days for transformations
  },
  maxSize: {
    content: 5 * 1024 * 1024,     // 5MB for content items
    transform: 10 * 1024 * 1024   // 10MB for transform items
  }
};

/**
 * Media Cache Service
 */
export class MediaCacheService {
  private config: CacheConfig;
  
  /**
   * Create a new media cache service
   * @param config Cache configuration
   */
  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      ...DEFAULT_CACHE_CONFIG,
      ...config
    };
    
    // Disable caching if Redis is not available
    if (!redisClient) {
      this.config.enabled = false;
      logger.warn('Media caching disabled due to missing Redis connection');
    }
  }
  
  /**
   * Cache media content
   * @param mediaId Media file ID
   * @param buffer Buffer to cache
   * @param options Cache options
   * @returns Success indication
   */
  async cacheMedia(
    mediaId: string,
    buffer: Buffer,
    options: {
      variant?: string;
      transform?: string;
      ttl?: number;
    } = {}
  ): Promise<boolean> {
    if (!this.config.enabled || !redisClient) {
      return false;
    }
    
    try {
      // Skip if buffer is too large
      const maxSize = options.transform 
        ? this.config.maxSize.transform 
        : this.config.maxSize.content;
        
      if (buffer.length > maxSize) {
        logger.debug(`Skipping cache for ${mediaId} - exceeds max size`, { 
          size: buffer.length, 
          maxSize 
        });
        return false;
      }
      
      // Generate cache key
      const cacheKey = this.generateCacheKey(mediaId, options);
      
      // Set TTL based on type
      const ttl = options.ttl || (options.transform 
        ? this.config.ttl.transform 
        : this.config.ttl.content);
      
      // Store in Redis
      await redisClient.set(
        cacheKey,
        buffer.toString('base64'),
        'EX',
        ttl
      );
      
      logger.debug(`Cached media ${mediaId}`, { 
        variant: options.variant, 
        transform: options.transform,
        size: buffer.length
      });
      
      return true;
    } catch (error) {
      logger.error(`Error caching media ${mediaId}`, { error });
      return false;
    }
  }
  
  /**
   * Get cached media content
   * @param mediaId Media file ID
   * @param options Cache options
   * @returns Cached buffer or null if not found
   */
  async getCachedMedia(
    mediaId: string,
    options: {
      variant?: string;
      transform?: string;
    } = {}
  ): Promise<Buffer | null> {
    if (!this.config.enabled || !redisClient) {
      return null;
    }
    
    try {
      // Generate cache key
      const cacheKey = this.generateCacheKey(mediaId, options);
      
      // Get from Redis
      const cached = await redisClient.get(cacheKey);
      if (!cached) {
        return null;
      }
      
      // Convert back to buffer
      const buffer = Buffer.from(cached, 'base64');
      
      logger.debug(`Cache hit for media ${mediaId}`, { 
        variant: options.variant, 
        transform: options.transform,
        size: buffer.length
      });
      
      return buffer;
    } catch (error) {
      logger.error(`Error getting cached media ${mediaId}`, { error });
      return null;
    }
  }
  
  /**
   * Invalidate cached media
   * @param mediaId Media file ID
   * @returns Success indication
   */
  async invalidateCache(mediaId: string): Promise<boolean> {
    if (!this.config.enabled || !redisClient) {
      return false;
    }
    
    try {
      // Pattern to match all keys for this media ID
      const pattern = `media:${mediaId}:*`;
      
      // Scan for matching keys
      const keys = await this.scanKeys(pattern);
      
      // Delete all matching keys
      if (keys.length > 0) {
        await redisClient.del(...keys);
        logger.debug(`Invalidated ${keys.length} cache entries for media ${mediaId}`);
      }
      
      return true;
    } catch (error) {
      logger.error(`Error invalidating cache for media ${mediaId}`, { error });
      return false;
    }
  }
  
  /**
   * Scan Redis for keys matching a pattern
   * @param pattern Key pattern
   * @returns Array of matching keys
   */
  private async scanKeys(pattern: string): Promise<string[]> {
    if (!redisClient) {
      return [];
    }
    
    let cursor = '0';
    const keys: string[] = [];
    
    do {
      // Get batch of keys
      const [nextCursor, batch] = await redisClient.scan(
        cursor,
        'MATCH',
        pattern,
        'COUNT',
        100
      );
      
      // Add to results
      keys.push(...batch);
      
      // Update cursor
      cursor = nextCursor;
    } while (cursor !== '0');
    
    return keys;
  }
  
  /**
   * Generate cache key for a media file
   * @param mediaId Media file ID
   * @param options Cache options
   * @returns Cache key
   */
  private generateCacheKey(
    mediaId: string, 
    options: {
      variant?: string;
      transform?: string;
    } = {}
  ): string {
    if (options.transform) {
      return `media:${mediaId}:transform:${options.transform}`;
    }
    
    if (options.variant) {
      return `media:${mediaId}:variant:${options.variant}`;
    }
    
    return `media:${mediaId}:original`;
  }
  
  /**
   * Generate a transformation hash for cache key
   * @param options Transformation options
   * @returns Hash string
   */
  generateTransformHash(options: Record<string, any>): string {
    // Sort keys to ensure consistent order
    const sortedOptions = Object.keys(options)
      .sort()
      .reduce((obj, key) => {
        obj[key] = options[key];
        return obj;
      }, {} as Record<string, any>);
    
    // Create hash of options
    return crypto
      .createHash('md5')
      .update(JSON.stringify(sortedOptions))
      .digest('hex');
  }
  
  /**
   * Set cache headers for a response
   * @param response Fastify response
   * @param mediaType Media type
   * @param options Cache options
   */
  setCacheHeaders(
    response: FastifyReply,
    mediaType: string,
    options: {
      maxAge?: number;
      isPublic?: boolean;
      isTransformed?: boolean;
    } = {}
  ): void {
    // Default max age based on media type and environment
    let maxAge = options.maxAge;
    
    if (!maxAge) {
      if (options.isTransformed) {
        maxAge = this.config.ttl.transform;
      } else if (mediaType.startsWith('image/')) {
        maxAge = this.config.ttl.content;
      } else {
        maxAge = 3600; // 1 hour default
      }
      
      // Reduce cache time in development
      if (env.NODE_ENV !== 'production') {
        maxAge = Math.min(maxAge, 3600);
      }
    }
    
    // Set cache control header
    const directive = options.isPublic !== false ? 'public' : 'private';
    response.header('Cache-Control', `${directive}, max-age=${maxAge}`);
    
    // Set expires header
    const expires = new Date();
    expires.setSeconds(expires.getSeconds() + maxAge);
    response.header('Expires', expires.toUTCString());
    
    // Set last modified header if not already set
    if (!response.getHeader('Last-Modified')) {
      response.header('Last-Modified', new Date().toUTCString());
    }
  }
  
  /**
   * Optimize cache storage by removing least recently used items
   * This would be run periodically as a maintenance task
   */
  async optimizeCacheStorage(): Promise<void> {
    // In a full implementation, this would use Redis memory analysis
    // to identify and remove least recently used cache items
    // For now, just log that it was called
    logger.info('Cache storage optimization called');
  }
}

// Create and export service instance
export const mediaCacheService = new MediaCacheService();
