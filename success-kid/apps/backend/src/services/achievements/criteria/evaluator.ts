import { Achievement, UserAchievement } from '../../../database/schema/achievements';
import { logger } from '../../../lib/logger';

/**
 * Interface for the data passed from the triggering event.
 * Specific event handlers should map their event payload to this structure.
 */
export interface AchievementEventData {
    userId: string;
    // Add common fields or allow any for flexibility initially
    [key: string]: any; 
}

/**
 * Result of an achievement criteria check.
 */
export interface CriteriaCheckResult {
    progressIncrement: number; // How much progress was made by this event
    isComplete: boolean;       // Whether the achievement is now complete
}

/**
 * Base interface for all achievement criteria evaluators.
 */
export interface AchievementCriteriaEvaluator {
    /**
     * Checks if the achievement criteria are met based on the event data
     * and the user's current progress.
     * 
     * @param eventData Data from the triggering event.
     * @param userAchievement The user's current progress record for this achievement (null if none exists).
     * @param achievementDef The definition of the achievement being checked.
     * @returns A promise resolving to the check result.
     */
    check(eventData: AchievementEventData, userAchievement: UserAchievement | null, achievementDef: Achievement): Promise<CriteriaCheckResult>;
}

// Helper function to safely get current progress
export function getCurrentProgress(userAchievement: UserAchievement | null): number {
    return userAchievement?.progress ?? 0;
}
