/**
 * Cache Service Module
 * 
 * Provides a comprehensive caching system for optimizing API performance
 * and reducing database load.
 */

// Export cache service
export * from './cache-service';

// Export cache middleware 
export * from './cache-middleware';

// Export cache invalidation
export * from './cache-invalidation';

// Import modules for default export
import cacheService from './cache-service';
import cacheMiddleware from './cache-middleware';
import cacheInvalidation from './cache-invalidation';

// Utility function to warm up cache with critical data
export async function warmCache(): Promise<void> {
  // Cache warming logic to be implemented
  // This should prefetch commonly accessed data after service start
}

// Export default object with all caching utilities
export default {
  cacheService,
  cacheMiddleware,
  cacheInvalidation,
  warmCache
};
