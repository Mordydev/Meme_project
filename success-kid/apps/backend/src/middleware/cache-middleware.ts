/**
 * Cache Middleware for API Routes
 * 
 * Provides various caching strategies for API routes
 */
import { FastifyRequest, FastifyReply } from 'fastify';
import { getRedisClient } from '../lib/redis-client';

interface CacheOptions {
  ttl?: number; // Time to live in seconds
  keyPrefix?: string;
  keyGenerator?: (request: FastifyRequest) => string;
  skipCache?: (request: FastifyRequest) => boolean;
}

const DEFAULT_OPTIONS: CacheOptions = {
  ttl: 60, // Default 1 minute
  keyPrefix: 'api:cache:',
  keyGenerator: (request) => {
    // Default key is method + url + query params + auth (if present)
    const userId = (request.user as any)?.id || 'anonymous';
    const queryString = JSON.stringify(request.query || {});
    return `${request.method}:${request.url}:${queryString}:${userId}`;
  },
  skipCache: (request) => {
    // Skip cache for non-GET requests by default
    return request.method !== 'GET';
  }
};

/**
 * Create a cache middleware with the given options
 */
export function createCacheMiddleware(options: CacheOptions = {}) {
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options };
  const redis = getRedisClient();
  
  return async function cacheMiddleware(request: FastifyRequest, reply: FastifyReply) {
    // Skip cache if needed
    if (mergedOptions.skipCache && mergedOptions.skipCache(request)) {
      return;
    }
    
    // Generate cache key
    const cacheKeyGenerator = mergedOptions.keyGenerator || DEFAULT_OPTIONS.keyGenerator;
    const cacheKey = `${mergedOptions.keyPrefix}${cacheKeyGenerator!(request)}`;
    
    try {
      // Try to get from cache
      const cachedData = await redis.get(cacheKey);
      
      if (cachedData) {
        const data = JSON.parse(cachedData);
        // Add cache header in development
        if (process.env.NODE_ENV !== 'production') {
          reply.header('X-Cache', 'HIT');
        }
        return reply.send(data);
      }
      
      // If not in cache, we'll continue to the handler
      // but intercept the reply to save to cache
      const originalSend = reply.send;
      
      reply.send = function(payload) {
        // Save to cache but don't block request
        if (payload) {
          const stringPayload = typeof payload === 'string' 
            ? payload 
            : JSON.stringify(payload);
            
          redis.set(cacheKey, stringPayload, 'EX', mergedOptions.ttl)
            .catch(err => request.log.error({ 
              msg: 'Failed to set cache',
              error: err.message
            }));
        }
        
        // Add cache header in development
        if (process.env.NODE_ENV !== 'production') {
          reply.header('X-Cache', 'MISS');
        }
        
        // Call original send
        return originalSend.call(this, payload);
      };
    } catch (error) {
      // Log the error but don't fail the request
      request.log.error({
        msg: 'Cache middleware error',
        error: error instanceof Error ? error.message : String(error)
      });
      // Continue without caching
    }
  };
}

/**
 * Create a cache middleware specifically for content routes
 */
export function createContentCacheMiddleware(ttl: number = 60) {
  return createCacheMiddleware({
    ttl,
    keyPrefix: 'api:content:',
    // Skip cache for authenticated content creation/modification
    skipCache: (request) => {
      if (request.method !== 'GET') return true;
      
      // Skip cache for authenticated users looking at their own content
      const pathParts = request.url.split('/');
      if (pathParts.includes('my') || pathParts.includes('me')) {
        return true;
      }
      
      return false;
    }
  });
}

/**
 * Create a cache middleware specifically for profile data
 */
export function createProfileCacheMiddleware(ttl: number = 300) {
  return createCacheMiddleware({
    ttl,
    keyPrefix: 'api:profile:',
    // Skip cache for user's own profile
    skipCache: (request) => {
      if (request.method !== 'GET') return true;
      
      const userId = (request.user as any)?.id;
      if (!userId) return false;
      
      const pathParts = request.url.split('/');
      const profileId = pathParts[pathParts.length - 1];
      
      // Skip cache if looking at your own profile
      return profileId === userId || profileId === 'me';
    }
  });
}

/**
 * Create a cache middleware specifically for leaderboard data
 */
export function createLeaderboardCacheMiddleware(ttl: number = 300) {
  return createCacheMiddleware({
    ttl,
    keyPrefix: 'api:leaderboard:',
    skipCache: (request) => request.method !== 'GET'
  });
}

/**
 * Create a cache middleware specifically for market data
 */
export function createMarketDataCacheMiddleware(ttl: number = 30) {
  return createCacheMiddleware({
    ttl,
    keyPrefix: 'api:market:',
    skipCache: (request) => request.method !== 'GET'
  });
}

/**
 * Warm up the cache with frequently accessed data
 */
export async function warmCache() {
  // This function would pre-populate cache with common requests
  // Implementation would depend on application needs
  return Promise.resolve();
}
