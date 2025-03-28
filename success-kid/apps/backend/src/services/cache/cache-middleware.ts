/**
 * Cache Middleware
 * 
 * Provides middleware for automatically caching API responses
 * based on route configuration.
 */
import { FastifyRequest, FastifyReply } from 'fastify';
import { cacheService, CacheOptions } from './cache-service';
import { logger } from '../../lib/logger';

/**
 * Cache middleware configuration options
 */
export interface CacheMiddlewareOptions extends CacheOptions {
  /**
   * Whether to enable cache
   * @default true
   */
  enabled?: boolean;
  
  /**
   * Function to generate cache key from request
   * @default uses request method and URL
   */
  keyGenerator?: (request: FastifyRequest) => string;
  
  /**
   * Function to generate cache tags from request
   * @default empty array
   */
  tagGenerator?: (request: FastifyRequest) => string[];
  
  /**
   * Function to check if request should be cached
   * @default true for GET requests with no query params
   */
  shouldCache?: (request: FastifyRequest) => boolean;
  
  /**
   * Whether to vary cache by authenticated user
   * @default true
   */
  varyByUser?: boolean;
  
  /**
   * Whether to vary cache by query parameters
   * @default true
   */
  varyByQuery?: boolean;
  
  /**
   * Headers to indicate cache status
   * @default true
   */
  addHeaders?: boolean;
}

/**
 * Default cache middleware options
 */
const DEFAULT_OPTIONS: CacheMiddlewareOptions = {
  enabled: true,
  ttl: 300, // 5 minutes
  prefix: 'api-cache',
  varyByUser: true,
  varyByQuery: true,
  addHeaders: true,
  shouldCache: (request) => {
    // Only cache GET requests by default
    return request.method === 'GET';
  },
  keyGenerator: (request) => {
    // Generate key from method and URL by default
    return `${request.method}:${request.url}`;
  },
  tagGenerator: () => {
    // No default tags
    return [];
  }
};

/**
 * Create cache middleware for Fastify routes
 * 
 * @param options Cache middleware options
 * @returns Fastify middleware function
 */
export function createCacheMiddleware(options?: Partial<CacheMiddlewareOptions>) {
  // Merge provided options with defaults
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  // Return middleware function
  return async function cacheMiddleware(
    request: FastifyRequest, 
    reply: FastifyReply
  ) {
    // Skip if cache is disabled
    if (!opts.enabled) {
      return;
    }
    
    // Skip if request shouldn't be cached
    if (!opts.shouldCache(request)) {
      return;
    }
    
    // Generate base cache key
    let cacheKey = opts.keyGenerator(request);
    
    // Add user ID to cache key if varying by user
    if (opts.varyByUser && request.user && request.user.id) {
      cacheKey = `${cacheKey}:user:${request.user.id}`;
    }
    
    // Add query parameters to cache key if varying by query
    if (opts.varyByQuery && Object.keys(request.query || {}).length > 0) {
      cacheKey = `${cacheKey}:query:${JSON.stringify(request.query)}`;
    }
    
    // Generate tags for this request
    const tags = opts.tagGenerator(request);
    
    // Add standard tags
    if (request.params && Object.keys(request.params).length > 0) {
      for (const [key, value] of Object.entries(request.params)) {
        if (typeof value === 'string' || typeof value === 'number') {
          tags.push(`${key}:${value}`);
        }
      }
    }
    
    // Add user tag if authenticated
    if (request.user && request.user.id) {
      tags.push(`user:${request.user.id}`);
    }
    
    // Add route tag
    if (request.routerPath) {
      tags.push(`route:${request.routerPath}`);
    }
    
    try {
      // Try to get from cache
      const cacheResult = await cacheService.get(cacheKey, { ...opts, tags });
      
      // If cache hit, send cached response
      if (cacheResult.hit) {
        // Add cache headers if enabled
        if (opts.addHeaders) {
          reply.header('X-Cache', 'HIT');
          reply.header('X-Cache-Ttl', opts.ttl);
          reply.header('X-Cache-Expires', cacheResult.expiresAt.toISOString());
        }
        
        return reply.send(cacheResult.data);
      }
      
      // If cache miss, continue to handler but intercept response
      if (opts.addHeaders) {
        reply.header('X-Cache', 'MISS');
      }
      
      // Store original send function
      const originalSend = reply.send;
      
      // Override send function to cache response
      reply.send = function(payload) {
        // Only cache successful responses
        if (reply.statusCode >= 200 && reply.statusCode < 300) {
          // Cache response asynchronously (don't await to avoid blocking)
          cacheService.set(cacheKey, payload, { ...opts, tags })
            .catch(err => {
              logger.error('Failed to cache response', { 
                error: err instanceof Error ? err.message : String(err),
                cacheKey 
              });
            });
        }
        
        // Call original send with payload
        return originalSend.call(this, payload);
      };
    } catch (error) {
      // Log error but don't fail request
      logger.error('Cache middleware error', { 
        error: error instanceof Error ? error.message : String(error),
        path: request.url 
      });
      
      // Continue to handler
    }
  };
}

/**
 * Create specialized cache middleware for content API
 * 
 * @param ttl Cache time-to-live in seconds
 * @returns Fastify middleware function
 */
export function createContentCacheMiddleware(ttl: number = 60) {
  return createCacheMiddleware({
    ttl,
    prefix: 'content-cache',
    tagGenerator: (request) => {
      // Generate content-specific tags
      const tags = ['content'];
      
      // Add content type tag if available
      if (request.query && (request.query as any).type) {
        tags.push(`content-type:${(request.query as any).type}`);
      }
      
      return tags;
    }
  });
}

/**
 * Create specialized cache middleware for user profile API
 * 
 * @param ttl Cache time-to-live in seconds
 * @returns Fastify middleware function
 */
export function createProfileCacheMiddleware(ttl: number = 300) {
  return createCacheMiddleware({
    ttl,
    prefix: 'profile-cache',
    tagGenerator: (request) => {
      // Generate profile-specific tags
      const tags = ['profile'];
      
      // Add profile ID tag if available
      if (request.params && (request.params as any).id) {
        tags.push(`profile:${(request.params as any).id}`);
      }
      
      return tags;
    }
  });
}

/**
 * Create specialized cache middleware for leaderboard API
 * 
 * @param ttl Cache time-to-live in seconds
 * @returns Fastify middleware function
 */
export function createLeaderboardCacheMiddleware(ttl: number = 600) {
  return createCacheMiddleware({
    ttl,
    prefix: 'leaderboard-cache',
    varyByUser: false, // Leaderboards are the same for all users
    tagGenerator: (request) => {
      // Generate leaderboard-specific tags
      const tags = ['leaderboard'];
      
      // Add timeframe tag if available
      if (request.query && (request.query as any).timeframe) {
        tags.push(`timeframe:${(request.query as any).timeframe}`);
      }
      
      // Add category tag if available
      if (request.query && (request.query as any).category) {
        tags.push(`category:${(request.query as any).category}`);
      }
      
      return tags;
    }
  });
}

/**
 * Create specialized cache middleware for market data API
 * 
 * @param ttl Cache time-to-live in seconds
 * @returns Fastify middleware function
 */
export function createMarketDataCacheMiddleware(ttl: number = 30) {
  return createCacheMiddleware({
    ttl,
    prefix: 'market-cache',
    varyByUser: false, // Market data is the same for all users
    tagGenerator: () => ['market']
  });
}

export default {
  createCacheMiddleware,
  createContentCacheMiddleware,
  createProfileCacheMiddleware,
  createLeaderboardCacheMiddleware,
  createMarketDataCacheMiddleware
};
