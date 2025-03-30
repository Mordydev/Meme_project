import { logger } from '../../../lib/logger';
import { cacheService } from '../../../lib/cache';
// No database schema needed for market data currently, relies on cache and external APIs.

/**
 * Repository for market-related data.
 * Currently primarily interacts with the cache service for storing/retrieving
 * processed or fetched market data to reduce external API calls.
 * Could be expanded later to interact with a database table if needed for
 * persistent storage of historical trends, aggregated stats, or milestone status.
 */
export class MarketRepository {
    private readonly CACHE_NAMESPACE = 'market';

    constructor() {
        logger.info('MarketRepository initialized');
    }

    // Example method (can be expanded based on service needs)
    async getCachedData<T>(key: string): Promise<T | null> {
        try {
            const fullKey = `${this.CACHE_NAMESPACE}:${key}`; // Ensure consistent namespacing
            const data = await cacheService.get<T>(fullKey); // Use the key directly as namespace is handled by cacheService now
            logger.debug(`Cache lookup for key: ${fullKey}`, { found: data !== null });
            return data;
        } catch (error) {
            logger.error('Error getting data from market cache', { key, error });
            return null;
        }
    }

    async setCachedData<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
        try {
            const fullKey = `${this.CACHE_NAMESPACE}:${key}`; // Ensure consistent namespacing
            await cacheService.set(fullKey, value, { ttl: ttlSeconds }); // Use the key directly
            logger.debug(`Cache set for key: ${fullKey}`, { ttl: ttlSeconds });
        } catch (error) {
            logger.error('Error setting data in market cache', { key, error });
            // Decide if the error should be re-thrown
        }
    }

    // Add more methods as needed, e.g., for interacting with a potential future DB table
    // for market data history or milestone persistence.
}

// Export a singleton instance
export const marketRepository = new MarketRepository();
