import { Achievement, UserAchievement } from '../../../database/schema/achievements';
import { logger } from '../../../lib/logger';
import { AchievementCriteriaEvaluator, AchievementEventData, CriteriaCheckResult, getCurrentProgress } from './evaluator';
// TODO: Import necessary services/repositories (e.g., for checking login history or Redis streaks)

/**
 * Evaluator for achievements based on maintaining a streak (e.g., consecutive daily logins).
 * Assumes the achievement definition's `criteriaThreshold` holds the target streak length (in days).
 * Requires a mechanism to track consecutive events (e.g., daily logins).
 */
export class StreakEvaluator implements AchievementCriteriaEvaluator {

    async check(eventData: AchievementEventData, userAchievement: UserAchievement | null, achievementDef: Achievement): Promise<CriteriaCheckResult> {
        const targetThreshold = achievementDef.criteriaThreshold ?? 1; // Target streak length
        let progressIncrement = 0;
        let isComplete = false;
        let currentStreak = 0;

        logger.debug('StreakEvaluator check started', {
            achievementId: achievementDef.id,
            userId: eventData.userId,
            targetThreshold
        });

        try {
            // TODO: Implement streak tracking logic. This is highly dependent on the specific event.
            // Example for daily login streak:
            // 1. Get the timestamp of the current login event (from eventData).
            // 2. Get the timestamp of the user's previous relevant login event (from repository or Redis).
            // 3. Calculate the difference. If it's approx 24 hours, increment the streak.
            // 4. If the difference is > ~48 hours, reset the streak.
            // 5. Store the updated streak count (e.g., in Redis or user profile).

            // Placeholder logic: Assume we fetch the current streak length somehow
            // currentStreak = await streakTrackingService.getUserStreak(eventData.userId, achievementDef.triggerEvent); // Fictional service

            // For this placeholder, we'll just log a warning and return no progress.
            logger.warn('StreakEvaluator logic is not implemented. Returning no progress.', { achievementId: achievementDef.id, userId: eventData.userId });
            currentStreak = getCurrentProgress(userAchievement); // Use existing progress as placeholder

            // Check completion (this part is standard)
            isComplete = currentStreak >= targetThreshold;
            // Progress increment for streaks is usually handled by the tracking logic itself,
            // but we could set it to the new streak length if needed.
            // For now, assume progress is the streak length itself.
            progressIncrement = currentStreak - getCurrentProgress(userAchievement); // Calculate diff if needed


        } catch (error) {
            logger.error('Error during streak evaluation', {
                achievementId: achievementDef.id,
                userId: eventData.userId,
                error
            });
            // Return no progress on error
            progressIncrement = 0;
            isComplete = userAchievement?.isUnlocked ?? false; // Keep existing status on error
        }

        logger.debug('StreakEvaluator check completed', {
            achievementId: achievementDef.id,
            userId: eventData.userId,
            currentStreak, // Log the calculated streak
            progressIncrement,
            isComplete
        });

        // Return progressIncrement=0 because the repository upsert handles setting the absolute progress (streak length)
        // Or adjust upsert logic to handle increments differently for streaks.
        // For simplicity now, let the upsert handle the absolute value based on isComplete.
        return { progressIncrement: isComplete ? targetThreshold - getCurrentProgress(userAchievement) : 0, isComplete };
    }
}
