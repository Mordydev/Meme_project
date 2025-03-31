import { logger } from '../../lib/logger';
import { cacheService } from '../../lib/cache'; // For potentially storing completed milestones

// Define the market cap milestones based on masterplan.md
const MARKET_CAP_MILESTONES = [
    100_000,
    500_000,
    1_000_000,
    5_000_000,
    10_000_000,
    50_000_000,
    100_000_000,
];

// Sort milestones just in case they are not defined in order
MARKET_CAP_MILESTONES.sort((a, b) => a - b);

export interface MilestoneProgress { // Export interface
    currentMarketCap: number;
    nextMilestoneTarget: number | null;
    progressPercentage: number; // Towards next milestone
    completedMilestones: number[]; // Array of completed milestone values
}

const COMPLETED_MILESTONES_CACHE_KEY = 'market:completedMilestones';
const MILESTONE_CACHE_OPTIONS = { namespace: 'market', ttl: 3600 * 24 }; // Cache for 24 hours

export class MilestoneTracker {

    constructor(
        // Potentially inject cacheService if not using global import
    ) {}

    /**
     * Calculates the progress towards the next market cap milestone.
     * @param currentMarketCap The current market cap.
     * @returns MilestoneProgress object or null if data is unavailable.
     */
    async calculateProgress(currentMarketCap: number): Promise<MilestoneProgress | null> {
        if (currentMarketCap < 0) {
            logger.warn('Cannot calculate milestone progress with negative market cap', { currentMarketCap });
            return null;
        }

        const completedMilestones = await this.getCompletedMilestones();
        let nextMilestoneTarget: number | null = null;
        let previousMilestone = 0; // Start from 0 for percentage calculation

        for (const milestone of MARKET_CAP_MILESTONES) {
            if (currentMarketCap < milestone) {
                nextMilestoneTarget = milestone;
                // Find the highest completed milestone before this target
                const completedBeforeTarget = completedMilestones.filter(m => m < nextMilestoneTarget!).sort((a,b) => b-a);
                previousMilestone = completedBeforeTarget.length > 0 ? completedBeforeTarget[0] : 0;
                break; // Found the next target
            }
        }

        let progressPercentage = 0;
        if (nextMilestoneTarget !== null) {
            const range = nextMilestoneTarget - previousMilestone;
            const progressInRange = currentMarketCap - previousMilestone;
            progressPercentage = range > 0 ? Math.max(0, Math.min(100, (progressInRange / range) * 100)) : 100;
        } else {
            // If all milestones are completed
            progressPercentage = 100;
        }

        return {
            currentMarketCap,
            nextMilestoneTarget,
            progressPercentage: Math.round(progressPercentage), // Round to nearest integer
            completedMilestones,
        };
    }

    /**
     * Checks if any new milestones have been reached based on the current market cap.
     * Stores newly completed milestones in cache.
     * @param currentMarketCap The current market cap.
     * @returns An array of newly reached milestone values.
     */
    async checkMilestones(currentMarketCap: number): Promise<number[]> {
        if (currentMarketCap < 0) return [];

        const completedMilestones = await this.getCompletedMilestones();
        const newlyReached: number[] = [];

        for (const milestone of MARKET_CAP_MILESTONES) {
            if (currentMarketCap >= milestone && !completedMilestones.includes(milestone)) {
                newlyReached.push(milestone);
            }
        }

        if (newlyReached.length > 0) {
            const updatedCompleted = [...completedMilestones, ...newlyReached].sort((a, b) => a - b);
            await cacheService.set(COMPLETED_MILESTONES_CACHE_KEY, updatedCompleted, MILESTONE_CACHE_OPTIONS);
            logger.info('New market cap milestones reached and cached', { newlyReached });
        }

        return newlyReached;
    }

    /**
     * Retrieves the list of completed milestones from cache.
     */
    private async getCompletedMilestones(): Promise<number[]> {
        try {
            const cached = await cacheService.get<number[]>(COMPLETED_MILESTONES_CACHE_KEY, MILESTONE_CACHE_OPTIONS);
            return cached ?? [];
        } catch (error) {
            logger.error('Failed to retrieve completed milestones from cache', { error });
            return []; // Return empty array on error
        }
    }
}

// Export a singleton instance (or handle instantiation in services/index.ts)
export const milestoneTracker = new MilestoneTracker();
