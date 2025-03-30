import { logger } from '../../lib/logger';
import { cacheService } from '../../lib/cache';
// TODO: Potentially import repository if milestone status needs persistence

// Define the market cap milestones from the masterplan
const MARKET_CAP_MILESTONES = [
    100_000,
    500_000,
    1_000_000,
    5_000_000,
    10_000_000,
    50_000_000,
    100_000_000,
    // Add more milestones if needed
];

// Interface for milestone progress (defined in market-service.ts for now)
interface MilestoneProgress {
    currentMarketCap: number;
    nextMilestoneTarget: number | null;
    progressPercentage: number; // Towards next milestone
    completedMilestones: number[]; // Array of completed milestone values
}

/**
 * Tracks market cap milestones and calculates progress.
 */
export class MilestoneTracker {
    private readonly COMPLETED_MILESTONES_CACHE_KEY = 'completedMarketCapMilestones';
    private readonly CACHE_NAMESPACE = 'market';
    private readonly CACHE_TTL = 60 * 60; // Cache completed milestones for 1 hour

    constructor(
        // TODO: Inject repository if persistence is needed beyond cache
    ) {}

    /**
     * Calculates the progress towards the next market cap milestone.
     * @param currentMarketCap The current market cap.
     * @returns MilestoneProgress object or null if unable to calculate.
     */
    async calculateProgress(currentMarketCap: number): Promise<MilestoneProgress | null> {
        if (currentMarketCap < 0) return null;

        try {
            const completedMilestones = await this.getCompletedMilestones();
            
            let nextMilestoneTarget: number | null = null;
            for (const milestone of MARKET_CAP_MILESTONES) {
                if (milestone > currentMarketCap && !completedMilestones.includes(milestone)) {
                    if (nextMilestoneTarget === null || milestone < nextMilestoneTarget) {
                        nextMilestoneTarget = milestone;
                    }
                }
            }

            let progressPercentage = 100; // Default to 100 if all milestones are complete or no next target
            if (nextMilestoneTarget !== null) {
                // Find the previous milestone to calculate percentage from
                const previousMilestone = completedMilestones.length > 0 
                    ? Math.max(...completedMilestones) 
                    : 0;
                
                const range = nextMilestoneTarget - previousMilestone;
                const progressInRange = currentMarketCap - previousMilestone;
                
                progressPercentage = range > 0 ? Math.max(0, Math.min(100, Math.floor((progressInRange / range) * 100))) : 100;
            }
            
            return {
                currentMarketCap,
                nextMilestoneTarget,
                progressPercentage,
                completedMilestones
            };
        } catch (error) {
            logger.error('Error calculating milestone progress', { currentMarketCap, error });
            return null;
        }
    }

    /**
     * Checks the current market cap against defined milestones and identifies newly reached ones.
     * Updates the cache/storage of completed milestones.
     * @param currentMarketCap The current market cap.
     * @returns An array of newly reached milestone values.
     */
    async checkMilestones(currentMarketCap: number): Promise<number[]> {
        if (currentMarketCap < 0) return [];

        try {
            const previouslyCompleted = await this.getCompletedMilestones();
            const newlyReached: number[] = [];

            for (const milestone of MARKET_CAP_MILESTONES) {
                if (currentMarketCap >= milestone && !previouslyCompleted.includes(milestone)) {
                    newlyReached.push(milestone);
                }
            }

            if (newlyReached.length > 0) {
                const updatedCompleted = [...previouslyCompleted, ...newlyReached].sort((a, b) => a - b);
                await this.saveCompletedMilestones(updatedCompleted);
                logger.info('New market cap milestones reached', { newlyReached, currentMarketCap });
            }

            return newlyReached;
        } catch (error) {
            logger.error('Error checking milestones', { currentMarketCap, error });
            return [];
        }
    }

    /**
     * Retrieves the list of completed milestones from cache (or storage).
     */
    private async getCompletedMilestones(): Promise<number[]> {
        try {
            const cachedData = await cacheService.get<number[]>(this.COMPLETED_MILESTONES_CACHE_KEY, { namespace: this.CACHE_NAMESPACE });
            if (cachedData) {
                return cachedData;
            }
            // TODO: Implement fetching from persistent storage (e.g., a dedicated table or settings store) if cache misses
            logger.info('No completed milestones found in cache, returning empty array.');
            return [];
        } catch (error) {
            logger.error('Error fetching completed milestones from cache', { error });
            return []; // Return empty on error
        }
    }

    /**
     * Saves the updated list of completed milestones to cache (and storage).
     */
    private async saveCompletedMilestones(completedMilestones: number[]): Promise<void> {
        try {
            await cacheService.set(this.COMPLETED_MILESTONES_CACHE_KEY, completedMilestones, { namespace: this.CACHE_NAMESPACE, ttl: this.CACHE_TTL });
            // TODO: Implement saving to persistent storage
            logger.info('Saved updated completed milestones to cache.');
        } catch (error) {
            logger.error('Error saving completed milestones to cache', { error });
            // Handle error - might need retry or logging for manual intervention
        }
    }
}
