/**
 * Cache Middleware
 * 
 * Provides automatic caching for API endpoints based on request patterns.
 * Uses Redis for cache storage and implements conditional request validation.
 */
import { FastifyRequest, FastifyReply } from 'fastify';
import { 
  cacheService, 
  CacheCategory, 
  CacheOptions 
} from '../services/cache/cache-service';
import { logger } from '../lib/logger';
import { createHash } from 'crypto';

interface CacheMiddlewareOptions extends CacheOptions {
  category: CacheCategory;
  idFunction?: (request: FastifyRequest) => string;
  unless?: (request: FastifyRequest) => boolean;
  cacheNullValues?: boolean;
}

/**
 * Calculate a hash of the request to use as a cache key
 */
function calculateRequestHash(request: FastifyRequest): string {
  // Create a string representation of the request
  const requestString = JSON.stringify({
    method: request.method,
    url: request.url,
    params: request.params,
    query: request.query,
    user: request.user?.id,
  });
  
  // Create a hash of the request string
  return createHash('md5').update(requestString).digest('hex');
}

/**
 * Format a cache key for a request
 */
function formatRequestCacheKey(
  request: FastifyRequest, 
  options: CacheMiddlewareOptions
): string {
  // Use custom ID function if provided
  if (options.idFunction) {
    return options.idFunction(request);
  }
  
  // Build default cache key
  let id = request.url;
  
  // For parameterized routes, include the parameters
  if (Object.keys(request.params || {}).length > 0) {
    id = `${id}:${JSON.stringify(request.params)}`;
  }
  
  // For queries, add hash of the query
  if (Object.keys(request.query || {}).length > 0) {
    id = `${id}:${calculateRequestHash(request)}`;
  }
  
  // For authenticated routes, include the user ID
  if (request.user?.id) {
    id = `${id}:user:${request.user.id}`;
  }
  
  return id;
}

/**
 * Create middleware for caching API responses
 */
export function createCacheMiddleware(options: CacheMiddlewareOptions) {
  return async function cacheMiddleware(request: FastifyRequest, reply: FastifyReply) {
    // Skip caching for non-GET methods unless specified
    if (request.method !== 'GET' && !options.unless) {
      return;
    }
    
    // Skip based on custom condition if provided
    if (options.unless && options.unless(request)) {
      return;
    }
    
    const cacheKey = formatRequestCacheKey(request, options);
    
    try {
      // Check if we have a cached response
      const cachedResponse = await cacheService.get(
        options.category,
        cacheKey,
        {
          scope: options.scope,
          ignoreCacheErrors: true,
        }
      );
      
      if (cachedResponse) {
        // Set cache hit header
        reply.header('X-Cache', 'HIT');
        
        // Send cached response
        return reply.send(cachedResponse);
      }
      
      // Set cache miss header
      reply.header('X-Cache', 'MISS');
      
      // Store original send function to capture response
      const originalSend = reply.send;
      
      // Override send to cache the response
      reply.send = function(payload) {
        // Only cache successful responses (2xx)
        if (reply.statusCode >= 200 && reply.statusCode < 300) {
          // Don't cache null/undefined values unless specified
          if (payload !== null && payload !== undefined || options.cacheNullValues) {
            cacheService.set(
              options.category,
              cacheKey,
              payload,
              options
            ).catch(err => {
              logger.error('Failed to cache response', { err, url: request.url });
            });
          }
        }
        
        // Call original send
        return originalSend.call(this, payload);
      };
    } catch (error) {
      // Log error but continue processing the request
      logger.error('Error in cache middleware', { error, url: request.url });
      // Continue with request processing
    }
  };
}

/**
 * Middleware to clear cache for specific categories
 */
export function createClearCacheMiddleware(
  category: CacheCategory | CacheCategory[], 
  idFunction?: (request: FastifyRequest) => string
) {
  const categories = Array.isArray(category) ? category : [category];
  
  return async function clearCacheMiddleware(request: FastifyRequest, reply: FastifyReply) {
    try {
      // Store original send function to capture response
      const originalSend = reply.send;
      
      // Override send to clear cache after successful response
      reply.send = function(payload) {
        // Only clear cache on successful responses (2xx)
        if (reply.statusCode >= 200 && reply.statusCode < 300) {
          // Process all categories
          for (const cat of categories) {
            if (idFunction) {
              // Clear specific cache
              const id = idFunction(request);
              cacheService.delete(cat, id).catch(err => {
                logger.error('Failed to clear cache', { err, category: cat, id });
              });
            } else {
              // Clear entire category
              cacheService.invalidateCategory(cat).catch(err => {
                logger.error('Failed to clear cache category', { err, category: cat });
              });
            }
          }
        }
        
        // Call original send
        return originalSend.call(this, payload);
      };
    } catch (error) {
      // Log error but continue processing
      logger.error('Error in clear cache middleware', { error, url: request.url });
    }
  };
}
