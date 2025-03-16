/**
 * Achievement Rules Engine
 * 
 * Evaluates achievement criteria against user actions and tracks progress.
 */
import { logger } from '../../../lib/logger';
import { 
  Achievement,
  AchievementCriteria,
  AchievementProgress
} from '../../../models/entities/achievement/achievement.model';
import { getDatabase } from '../../../database';

// Import rule evaluators
import { evaluateCountCriteria } from './evaluators/count-evaluator';
import { evaluateStreakCriteria } from './evaluators/streak-evaluator';
import { evaluateAggregateCriteria } from './evaluators/aggregate-evaluator';
import { evaluateMilestoneCriteria } from './evaluators/milestone-evaluator';
import { evaluateBooleanCriteria } from './evaluators/boolean-evaluator';
import { evaluateComplexCriteria } from './evaluators/complex-evaluator';

/**
 * Rules engine for evaluating achievement criteria
 */
export class AchievementRulesEngine {
  private db = getDatabase().pool;

  /**
   * Evaluate a user's progress for an achievement
   * 
   * @param userId User ID
   * @param achievement Achievement to evaluate
   * @param currentProgress Current achievement progress
   * @param eventType Type of event that triggered the evaluation
   * @param eventData Event data
   * @returns Updated achievement progress
   */
  async evaluateProgress(
    userId: string,
    achievement: Achievement,
    currentProgress: AchievementProgress,
    eventType: string,
    eventData: any
  ): Promise<AchievementProgress> {
    try {
      // Start with current progress
      let updatedProgress = { ...currentProgress };
      
      // If already complete, no need to evaluate
      if (updatedProgress.isComplete) {
        return updatedProgress;
      }

      // For each criterion in the achievement, evaluate progress
      for (const criterion of achievement.requirements) {
        const progressForCriterion = await this.evaluateCriterion(
          userId, 
          criterion, 
          updatedProgress,
          eventType,
          eventData
        );

        // Update overall progress if this criterion resulted in higher progress
        if (progressForCriterion.currentValue > updatedProgress.currentValue) {
          updatedProgress = progressForCriterion;
        }
      }

      // Recalculate percent complete and completion status
      updatedProgress.percentComplete = Math.min(
        100, 
        Math.round((updatedProgress.currentValue / updatedProgress.targetValue) * 100)
      );
      
      updatedProgress.isComplete = updatedProgress.currentValue >= updatedProgress.targetValue;

      return updatedProgress;
    } catch (error) {
      logger.error('Error evaluating achievement progress', { 
        userId, 
        achievementId: achievement.id, 
        error 
      });
      
      // Return unchanged progress
      return currentProgress;
    }
  }

  /**
   * Evaluate a single achievement criterion
   * 
   * @param userId User ID
   * @param criterion Achievement criterion
   * @param currentProgress Current achievement progress
   * @param eventType Type of event that triggered the evaluation
   * @param eventData Event data
   * @returns Updated progress for this criterion
   */
  private async evaluateCriterion(
    userId: string,
    criterion: AchievementCriteria,
    currentProgress: AchievementProgress,
    eventType: string,
    eventData: any
  ): Promise<AchievementProgress> {
    // Skip evaluation if this criterion isn't relevant to the current event
    if (criterion.eventType && criterion.eventType !== eventType && criterion.eventType !== '*') {
      return currentProgress;
    }

    try {
      // Delegate to the appropriate evaluator based on criterion type
      switch (criterion.type) {
        case 'count':
          return evaluateCountCriteria(userId, criterion, currentProgress, eventType, eventData, this.db);
          
        case 'streak':
          return evaluateStreakCriteria(userId, criterion, currentProgress, eventType, eventData, this.db);
          
        case 'aggregate':
          return evaluateAggregateCriteria(userId, criterion, currentProgress, eventType, eventData, this.db);
          
        case 'milestone':
          return evaluateMilestoneCriteria(userId, criterion, currentProgress, eventType, eventData, this.db);
          
        case 'boolean':
          return evaluateBooleanCriteria(userId, criterion, currentProgress, eventType, eventData, this.db);
          
        case 'complex':
          return evaluateComplexCriteria(userId, criterion, currentProgress, eventType, eventData, this.db);
          
        default:
          logger.warn(`Unknown criterion type: ${criterion.type}`, { criterion });
          return currentProgress;
      }
    } catch (error) {
      logger.error('Error evaluating criterion', { userId, criterion, eventType, error });
      return currentProgress;
    }
  }
}
