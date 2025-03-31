import { logger } from '../../lib/logger';
// cacheService is used via MarketRepository now
// import { cacheService } from '../../lib/cache';
import { EventBus, EventType } from '../../lib/event-bus';
import { priceProvider, PriceProvider, PriceData, StatsData } from './providers/price-provider'; // Import provider and types
import { transactionProvider, TransactionProvider, TransactionData } from './providers/transaction-provider'; // Import provider and types
import { milestoneTracker, MilestoneTracker, MilestoneProgress } from './milestone-tracker'; // Import tracker and type
import { marketRepository, MarketRepository } from './repository/market-repository'; // Import repository

// TODO: Move this to environment configuration
const SKC_TOKEN_PAIR_ADDRESS = 'SuccessKidTokenPairAddressOnRaydium'; // Replace with actual address

// Interfaces are now imported from their respective provider/tracker files
// Re-define MarketStats locally for now as it combines data
interface MarketStats {
    price: number;
    priceChange24h: number;
    volume24h: number;
    marketCap: number;
}
// Re-define PriceDataPoint locally as it's used in the return type
interface PriceDataPoint {
    timestamp: number;
    price: number;
}


/**
 * Service for fetching and managing market data (price, stats, milestones, transactions).
 */
export class MarketService {
    constructor(
        private eventBus: EventBus,
        private priceProvider: PriceProvider,
        private transactionProvider: TransactionProvider,
        private milestoneTracker: MilestoneTracker,
        private marketRepository: MarketRepository
    ) {}

    /**
     * Get current market statistics (price, volume, market cap). Combines price and stats.
     * Uses caching via MarketRepository.
     */
    async getCurrentStats(): Promise<MarketStats | null> {
        logger.debug('Fetching current market stats...');
        const cacheKey = 'currentMarketStats'; // Key defined in repository

        try {
            // Use repository's getOrSet which wraps cacheService
            const stats = await this.marketRepository.getOrSet<MarketStats>(
                cacheKey,
                async () => {
                    logger.info('Fetching fresh market stats (cache miss)');
                    // Fetch price and stats data concurrently
                    const [priceResult, statsResult] = await Promise.allSettled([
                        this.priceProvider.getCurrentPrice(SKC_TOKEN_PAIR_ADDRESS),
                        this.priceProvider.getStats(SKC_TOKEN_PAIR_ADDRESS)
                    ]);

                    const priceData = priceResult.status === 'fulfilled' ? priceResult.value : null;
                    const statsData = statsResult.status === 'fulfilled' ? statsResult.value : null;

                    if (!priceData || !statsData) {
                        logger.error('Failed to fetch all required market data for stats');
                        // Optionally return partial data or null based on requirements
                        return null;
                    }

                    // Combine results into MarketStats structure
                    return {
                        price: priceData.price,
                        priceChange24h: priceData.priceChange24h,
                        volume24h: statsData.volume24h,
                        marketCap: statsData.marketCap,
                    };
                },
                { namespace: 'market', ttl: 60 } // Pass cache options
            );
            // Trigger milestone check asynchronously after fetching stats
            if (stats) {
                 this.checkAndPublishMilestones(stats.marketCap).catch(err => logger.error('Async milestone check failed', err));
            }
            return stats; // Return cached or freshly fetched stats
        } catch (error) {
            logger.error('Failed to get current market stats', { error });
            return null;
        }
    }

    /**
     * Get historical price data for a given period.
     * Uses caching via MarketRepository.
     */
    async getPriceHistory(period: '1h' | '24h' | '7d' | '30d'): Promise<PriceDataPoint[]> {
        logger.debug(`Fetching price history for period: ${period}`);
        const cacheKey = `priceHistory:${period}`; // Key defined in repository

        try {
            const history = await this.marketRepository.getOrSet<PriceDataPoint[]>(
                cacheKey,
                async () => {
                    logger.info(`Fetching fresh price history for ${period} (cache miss)`);
                    return this.priceProvider.getHistoricalPrice(SKC_TOKEN_PAIR_ADDRESS, period);
                },
                 { namespace: 'market', ttl: 5 * 60 } // Pass cache options
            );
            return history ?? []; // Return empty array if null
        } catch (error) {
            logger.error('Failed to get price history', { period, error });
            return [];
        }
    }

    /**
     * Get progress towards the next market cap milestone.
     */
    async getMilestoneProgress(): Promise<MilestoneProgress | null> {
        logger.debug('Fetching milestone progress...');
        try {
            // Get current market cap (potentially cached via getCurrentStats)
            const currentStats = await this.getCurrentStats();
            if (!currentStats?.marketCap) {
                 logger.warn('Cannot get milestone progress, market cap unavailable.');
                 return null;
            }
            // Calculate progress using the tracker
            return this.milestoneTracker.calculateProgress(currentStats.marketCap);
        } catch (error) {
            logger.error('Failed to get milestone progress', { error });
            return null;
        }
    }

    /**
     * Get recent transactions related to the token.
     * Uses caching via MarketRepository.
     */
    async getRecentTransactions(limit: number = 20): Promise<TransactionData[]> {
        logger.debug(`Fetching recent transactions (limit: ${limit})...`);
        const cacheKey = `recentTransactions:${limit}`; // Key defined in repository

        try {
            const transactions = await this.marketRepository.getOrSet<TransactionData[]>(
                cacheKey,
                async () => {
                    logger.info(`Fetching fresh recent transactions (cache miss)`);
                    // TODO: Pass the correct SKC token address
                    return this.transactionProvider.getRecentTransactions('SKCTokenAddress', limit);
                },
                { namespace: 'market', ttl: 2 * 60 } // Pass cache options
            );
            return transactions ?? []; // Return empty array if null
        } catch (error) {
            logger.error('Failed to get recent transactions', { limit, error });
            return [];
        }
    }
    
    /**
     * Checks milestones based on current market cap and publishes events if reached.
     * This might be called periodically or triggered by stat updates (e.g., after getCurrentStats).
     * @param currentMarketCap Optional: Pass the current market cap to avoid redundant fetching.
     */
     async checkAndPublishMilestones(currentMarketCap?: number): Promise<void> {
         logger.info('Checking for market cap milestones...');
         try {
            let marketCap = currentMarketCap;
            // Fetch stats if market cap wasn't provided
            if (marketCap === undefined) {
                const currentStats = await this.getCurrentStats(); // Use cached stats if possible
                if (!currentStats?.marketCap) {
                    logger.warn('Cannot check milestones, failed to get current stats.');
                    return;
                }
                 marketCap = currentStats.marketCap;
            }

            // Ensure marketCap is a valid number before checking milestones
            if (typeof marketCap !== 'number' || marketCap < 0) {
                logger.warn('Invalid marketCap value received, skipping milestone check.', { marketCap });
                return;
            }

            const newlyReached = await this.milestoneTracker.checkMilestones(marketCap);

            // Publish event for each newly reached milestone
            for (const milestoneValue of newlyReached) {
                await this.eventBus.publish(EventType.MILESTONE_REACHED, {
                    type: 'market_cap',
                    value: milestoneValue,
                    timestamp: new Date().toISOString()
                });
                logger.info(`Market cap milestone reached and event published: $${milestoneValue}`);
            }
         } catch (error) {
             logger.error('Error checking/publishing milestones', { error });
         }
     }
}

// Export a singleton instance (or handle instantiation in services/index.ts)
// export const marketService = new MarketService(eventBus /*, priceProvider, transactionProvider, milestoneTracker, marketRepository */);
