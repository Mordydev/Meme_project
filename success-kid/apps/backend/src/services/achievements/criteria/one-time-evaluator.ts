import { Achievement, UserAchievement } from '../../../database/schema/achievements';
import { logger } from '../../../lib/logger';
import { AchievementCriteriaEvaluator, AchievementEventData, CriteriaCheckResult, getCurrentProgress } from './evaluator';

/**
 * Evaluator for achievements that are completed by a single, specific event.
 * Examples: Connect Wallet, Complete Profile.
 * Assumes the achievement definition's `criteriaThreshold` is 1 (or ignored).
 * Assumes the event trigger logic in AchievementService correctly filters events
 * so that this evaluator only receives the specific event that completes the achievement.
 */
export class OneTimeEvaluator implements AchievementCriteriaEvaluator {

    async check(eventData: AchievementEventData, userAchievement: UserAchievement | null, achievementDef: Achievement): Promise<CriteriaCheckResult> {
        const currentProgress = getCurrentProgress(userAchievement);

        // If this evaluator is called, it means the specific one-time event occurred.
        // The achievement is considered complete immediately.
        const isComplete = true;
        // Increment progress only if it wasn't already complete (progress is usually 0 or 1 for one-time)
        const progressIncrement = currentProgress < 1 ? 1 : 0; 

        logger.debug('OneTimeEvaluator check completed', {
            achievementId: achievementDef.id,
            userId: eventData.userId,
            progressIncrement,
            isComplete
        });

        return { progressIncrement, isComplete };
    }
}
