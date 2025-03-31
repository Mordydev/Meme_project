import { cacheService, CacheOptions } from '../../../lib/cache'; // Assuming global cacheService
import { logger } from '../../../lib/logger';

// Define interfaces for cached data structures (match service interfaces)
interface MarketStats {
    price: number;
    priceChange24h: number;
    volume24h: number;
    marketCap: number;
}

interface PriceDataPoint {
    timestamp: number;
    price: number;
}

interface TransactionData {
    hash: string;
    timestamp: number;
    from: string;
    to: string;
    amount: number;
}

const DEFAULT_NAMESPACE = 'market';

/**
 * Repository for interacting with cached market data.
 * This primarily acts as a wrapper around the cacheService for market-specific keys and namespaces.
 */
export class MarketRepository {

    constructor(
        // Potentially inject cacheService if not using global import
    ) {}

    // --- Cache Keys ---
    private statsCacheKey = 'currentMarketStats';
    private priceHistoryCacheKey = (period: string) => `priceHistory:${period}`;
    private recentTransactionsCacheKey = (limit: number) => `recentTransactions:${limit}`;
    private completedMilestonesCacheKey = 'completedMilestones';

    // --- Cache Options ---
    private statsCacheOpts: CacheOptions = { namespace: DEFAULT_NAMESPACE, ttl: 60 }; // 1 min
    private historyCacheOpts: CacheOptions = { namespace: DEFAULT_NAMESPACE, ttl: 5 * 60 }; // 5 min
    private txCacheOpts: CacheOptions = { namespace: DEFAULT_NAMESPACE, ttl: 2 * 60 }; // 2 min
    private milestoneCacheOpts: CacheOptions = { namespace: DEFAULT_NAMESPACE, ttl: 3600 * 24 }; // 24 hours

    // --- Methods ---

    async getCurrentStats(): Promise<MarketStats | null> {
        return cacheService.get<MarketStats>(this.statsCacheKey, this.statsCacheOpts);
    }

    async setCurrentStats(stats: MarketStats): Promise<void> {
        await cacheService.set(this.statsCacheKey, stats, this.statsCacheOpts);
    }

    async getPriceHistory(period: string): Promise<PriceDataPoint[] | null> {
        return cacheService.get<PriceDataPoint[]>(this.priceHistoryCacheKey(period), this.historyCacheOpts);
    }

    async setPriceHistory(period: string, history: PriceDataPoint[]): Promise<void> {
        await cacheService.set(this.priceHistoryCacheKey(period), history, this.historyCacheOpts);
    }

    async getRecentTransactions(limit: number): Promise<TransactionData[] | null> {
        return cacheService.get<TransactionData[]>(this.recentTransactionsCacheKey(limit), this.txCacheOpts);
    }

    async setRecentTransactions(limit: number, transactions: TransactionData[]): Promise<void> {
        await cacheService.set(this.recentTransactionsCacheKey(limit), transactions, this.txCacheOpts);
    }

    async getCompletedMilestones(): Promise<number[] | null> {
        return cacheService.get<number[]>(this.completedMilestonesCacheKey, this.milestoneCacheOpts);
    }

    async setCompletedMilestones(milestones: number[]): Promise<void> {
        await cacheService.set(this.completedMilestonesCacheKey, milestones, this.milestoneCacheOpts);
    }

    /**
     * Generic getOrSet wrapper for market data.
     */
    async getOrSet<T>(
        key: string,
        fetcher: () => Promise<T | null>,
        options: CacheOptions = { namespace: DEFAULT_NAMESPACE, ttl: 300 } // Default 5 min TTL
    ): Promise<T | null> {
        return cacheService.getOrSet(key, fetcher, options);
    }
}

// Export a singleton instance (or handle instantiation in services/index.ts)
export const marketRepository = new MarketRepository();
