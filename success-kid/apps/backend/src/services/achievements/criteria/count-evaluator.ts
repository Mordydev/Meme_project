import { Achievement, UserAchievement } from '../../../database/schema/achievements';
import { logger } from '../../../lib/logger';
import { AchievementCriteriaEvaluator, AchievementEventData, CriteriaCheckResult, getCurrentProgress } from './evaluator';

/**
 * Evaluator for achievements based on counting events.
 * Assumes the achievement definition's `criteriaThreshold` holds the target count.
 * Assumes the event trigger logic in AchievementService correctly filters events
 * so that this evaluator only receives events relevant to the specific count achievement.
 */
export class CountEvaluator implements AchievementCriteriaEvaluator {

    // Add async keyword here
    async check(eventData: AchievementEventData, userAchievement: UserAchievement | null, achievementDef: Achievement): Promise<CriteriaCheckResult> {
        const currentProgress = getCurrentProgress(userAchievement);
        const targetThreshold = achievementDef.criteriaThreshold ?? 1; // Default to 1 if threshold not set

        // Simple count: Increment progress by 1 for each relevant event received.
        // The AchievementService is responsible for ensuring only relevant events call this checker.
        const progressIncrement = 1; 
        const newProgress = currentProgress + progressIncrement;
        const isComplete = newProgress >= targetThreshold;

        logger.debug('CountEvaluator check completed', {
            achievementId: achievementDef.id,
            userId: eventData.userId,
            currentProgress,
            progressIncrement,
            newProgress,
            targetThreshold,
            isComplete
        });

        return { progressIncrement, isComplete };
    }
}
