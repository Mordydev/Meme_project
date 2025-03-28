import { redisClient } from './redis/client'; // Import the RedisClient instance
import { Logger } from 'pino';

// Placeholder for logger import (adjust path as needed)
let logger: Logger;
try {
  const loggerModule = require('./logger.js'); // Using require for CommonJS, assuming logger is in ./lib
  logger = loggerModule.logger;
} catch (e) {
  console.warn("Logger module not found at './logger.js', using console.", e);
  logger = console as any;
}

export interface CacheOptions {
  ttl?: number; // Time-to-live in seconds
  namespace?: string; // Optional namespace for cache keys
  staleWhileRevalidate?: boolean; // Enable stale-while-revalidate pattern
}

/**
 * Provides a layer for interacting with the Redis cache,
 * including type safety, namespacing, and stale-while-revalidate.
 */
export class CacheService {
  // Default TTL values (can be adjusted)
  private static readonly DEFAULT_TTL = 300; // 5 minutes
  private static readonly DEFAULT_STALE_TTL = 60 * 60 * 24; // 1 day for stale data

  // Common namespaces (can be expanded)
  private static readonly NAMESPACES = {
    user: 'user',
    content: 'content',
    points: 'points',
    leaderboard: 'leaderboard',
    market: 'market',
    // Add more namespaces as needed
  };

  /**
   * Retrieves data from the cache.
   * @param key The cache key.
   * @param options Optional cache settings (namespace).
   * @returns The cached data (parsed as T) or null if not found or error occurs.
   */
  async get<T>(key: string, options?: Pick<CacheOptions, 'namespace'>): Promise<T | null> {
    const prefixedKey = this.getPrefixedKey(key, options?.namespace);
    try {
      if (!redisClient.isConnected()) {
          logger.warn('Cache get skipped: Redis not connected', { key: prefixedKey });
          return null;
      }
      const data = await redisClient.getClient().get(prefixedKey);
      if (!data) {
          logger.debug('Cache miss', { key: prefixedKey });
          return null;
      }
      logger.debug('Cache hit', { key: prefixedKey });
      return JSON.parse(data) as T; // Assumes data is stored as JSON
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      logger.error('Cache get error', { key: prefixedKey, error: errorMsg });
      return null; // Return null on error to avoid breaking application flow
    }
  }

  /**
   * Stores data in the cache.
   * @param key The cache key.
   * @param value The data to store (will be JSON.stringify'd).
   * @param options Optional cache settings (ttl, namespace).
   */
  async set<T>(
    key: string,
    value: T,
    options?: Pick<CacheOptions, 'ttl' | 'namespace'>
  ): Promise<void> {
    const prefixedKey = this.getPrefixedKey(key, options?.namespace);
    const ttl = options?.ttl ?? CacheService.DEFAULT_TTL;
    try {
       if (!redisClient.isConnected()) {
          logger.warn('Cache set skipped: Redis not connected', { key: prefixedKey });
          return;
       }
      const serializedValue = JSON.stringify(value);
      await redisClient.getClient().set(prefixedKey, serializedValue, 'EX', ttl);
      logger.debug('Cache set successfully', { key: prefixedKey, ttl });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      logger.error('Cache set error', { key: prefixedKey, ttl, error: errorMsg });
      // Decide if error should be thrown or just logged
    }
  }

  /**
   * Retrieves data from cache, or fetches/sets it using a callback if not found.
   * Supports stale-while-revalidate pattern.
   * @param key The cache key.
   * @param callback A function that fetches the data if it's not in the cache.
   * @param options Optional cache settings (ttl, namespace, staleWhileRevalidate).
   * @returns The data (either cached or freshly fetched).
   */
  async getOrSet<T>(
    key: string,
    callback: () => Promise<T>,
    options?: CacheOptions
  ): Promise<T | null> { // Return null if fetch fails and no stale data
    const prefixedKey = this.getPrefixedKey(key, options?.namespace);
    const ttl = options?.ttl ?? CacheService.DEFAULT_TTL;
    const staleTtl = CacheService.DEFAULT_STALE_TTL; // TTL for stale data marker

    try {
      if (!redisClient.isConnected()) {
          logger.warn('Cache getOrSet using fetch callback directly: Redis not connected', { key: prefixedKey });
          return await callback(); // Fetch directly if Redis is down
      }

      // Try to get from cache
      const cachedValue = await this.get<T>(prefixedKey); // Use internal get without namespace prefix again

      if (cachedValue !== null) {
        logger.debug('Cache getOrSet hit', { key: prefixedKey });
        // If stale-while-revalidate is enabled, check if data is stale and revalidate
        if (options?.staleWhileRevalidate) {
            // Check for a separate 'stale' marker key
            const staleMarkerKey = `${prefixedKey}:stale`;
            const isStale = await redisClient.getClient().get(staleMarkerKey);
            if (!isStale) { // If not marked as stale, mark it and revalidate in background
                 await redisClient.getClient().set(staleMarkerKey, '1', 'EX', ttl); // Mark as stale for TTL duration
                 this.revalidateInBackground(prefixedKey, callback, ttl, staleTtl);
            }
        }
        return cachedValue;
      }

      // --- Cache Miss ---
      logger.debug('Cache getOrSet miss, fetching data...', { key: prefixedKey });
      const result = await callback();

      // Store in cache if result is valid
      if (result !== null && result !== undefined) {
        await this.set(prefixedKey, result, { ttl }); // Use internal set without namespace prefix again

        // If stale-while-revalidate, set the stale marker immediately
        if (options?.staleWhileRevalidate) {
            const staleMarkerKey = `${prefixedKey}:stale`;
            await redisClient.getClient().set(staleMarkerKey, '1', 'EX', ttl);
        }
      }

      return result;

    } catch (fetchError) {
        // Handle errors during the fetch callback
        const errorMsg = fetchError instanceof Error ? fetchError.message : String(fetchError);
        logger.error('Cache getOrSet fetch callback failed', { key: prefixedKey, error: errorMsg });
        // Optionally, try to return stale data if available (requires more complex logic)
        return null; // Return null if fetch fails
    }
  }

  /**
   * Revalidates cache data in the background (for stale-while-revalidate).
   * @param prefixedKey The full cache key (including namespace).
   * @param callback Function to fetch fresh data.
   * @param ttl TTL for the fresh data.
   * @param staleTtl TTL for the stale marker.
   */
  private revalidateInBackground<T>(
    prefixedKey: string,
    callback: () => Promise<T>,
    ttl: number,
    staleTtl: number
  ): void {
    // Run async without awaiting
    (async () => {
      try {
        logger.debug('Background cache revalidation started', { key: prefixedKey });
        const result = await callback();
        if (result !== null && result !== undefined) {
          // Overwrite existing cache entry with fresh data and new TTL
          await this.set(prefixedKey, result, { ttl }); // Use internal set

          // Reset the stale marker with a longer TTL to prevent immediate re-revalidation
          const staleMarkerKey = `${prefixedKey}:stale`;
          await redisClient.getClient().set(staleMarkerKey, '1', 'EX', staleTtl);

          logger.debug('Background cache revalidation complete', { key: prefixedKey });
        } else {
            logger.warn('Background cache revalidation fetch returned null/undefined', { key: prefixedKey });
            // Optionally delete the key if fetch consistently fails?
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        logger.error('Background cache revalidation failed', { key: prefixedKey, error: errorMsg });
        // Consider removing the stale marker on persistent failure?
        // await redisClient.getClient().del(`${prefixedKey}:stale`);
      }
    })();
  }

  /**
   * Deletes a specific key from the cache.
   * @param key The cache key.
   * @param options Optional cache settings (namespace).
   * @returns True if the key was deleted, false otherwise.
   */
  async delete(key: string, options?: Pick<CacheOptions, 'namespace'>): Promise<boolean> {
    const prefixedKey = this.getPrefixedKey(key, options?.namespace);
    try {
       if (!redisClient.isConnected()) {
          logger.warn('Cache delete skipped: Redis not connected', { key: prefixedKey });
          return false;
       }
      const result = await redisClient.getClient().del(prefixedKey);
      logger.debug('Cache delete executed', { key: prefixedKey, deletedCount: result });
      return result > 0;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      logger.error('Cache delete error', { key: prefixedKey, error: errorMsg });
      return false;
    }
  }

  /**
   * Deletes multiple cache keys matching a pattern (use with caution).
   * @param pattern The pattern to match keys against (e.g., 'user:123:*').
   * @returns The number of keys deleted.
   */
  async deleteByPattern(pattern: string): Promise<number> {
    // Ensure pattern includes namespace if applicable, or handle namespace separately
    logger.warn('Attempting cache deletion by pattern (use with caution)', { pattern });
    try {
       if (!redisClient.isConnected()) {
          logger.warn('Cache deleteByPattern skipped: Redis not connected', { pattern });
          return 0;
       }
      // Use SCAN instead of KEYS for production environments to avoid blocking
      let cursor = '0';
      let deletedCount = 0;
      do {
        const [nextCursor, keys] = await redisClient.getClient().scan(cursor, 'MATCH', pattern, 'COUNT', 100);
        cursor = nextCursor;
        if (keys.length > 0) {
          deletedCount += await redisClient.getClient().del(...keys);
        }
      } while (cursor !== '0');

      logger.info('Cache deleteByPattern complete', { pattern, deletedCount });
      return deletedCount;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      logger.error('Cache deleteByPattern error', { pattern, error: errorMsg });
      return 0;
    }
  }

  /**
   * Helper function to construct the full cache key with namespace.
   * @param key The base cache key.
   * @param namespace Optional namespace string.
   * @returns The prefixed cache key.
   */
  private getPrefixedKey(key: string, namespace?: string): string {
    if (!namespace) {
      return key; // Or perhaps add a default namespace like 'default:'
    }
    // Ensure namespace exists in predefined list or handle dynamic namespaces
    const validNamespace = CacheService.NAMESPACES[namespace as keyof typeof CacheService.NAMESPACES];
    if (!validNamespace) {
        logger.warn(`Using potentially dynamic namespace: ${namespace}`);
        return `${namespace}:${key}`;
    }
    return `${validNamespace}:${key}`;
  }
}

// Export a singleton instance for easy use
export const cacheService = new CacheService();
