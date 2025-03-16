/**
 * Combination Rule
 * 
 * Evaluates complex criteria that require multiple conditions to be met
 */
import { Pool } from 'pg';
import { 
  AchievementCriteria,
  AchievementTrigger
} from '../../../../models/achievement';
import { AchievementRulesEngine, RuleEvaluator } from '../engine';
import { logger } from '../../../../lib/logger';

export class CombinationRule implements RuleEvaluator {
  constructor(
    private db: Pool,
    private rulesEngine: AchievementRulesEngine
  ) {}
  
  /**
   * Evaluate a combination of criteria
   */
  async evaluate(
    userId: string,
    criteria: AchievementCriteria,
    eventType: AchievementTrigger,
    eventData: any
  ): Promise<boolean> {
    try {
      if (!criteria.metadata?.conditions || !Array.isArray(criteria.metadata.conditions)) {
        logger.warn('Combination criteria missing conditions array', { criteria });
        return false;
      }
      
      const conditions = criteria.metadata.conditions as AchievementCriteria[];
      const operator = (criteria.metadata?.operator as string) || 'AND';
      
      // Evaluate each condition
      const results = await Promise.all(
        conditions.map(condition => 
          this.evaluateCondition(userId, condition, eventType, eventData)
        )
      );
      
      // Apply logical operator
      if (operator === 'AND') {
        return results.every(result => result);
      } else if (operator === 'OR') {
        return results.some(result => result);
      } else if (operator === 'XOR') {
        return results.filter(result => result).length === 1;
      } else {
        logger.warn(`Unsupported logical operator: ${operator}`);
        return false;
      }
    } catch (error) {
      logger.error('Error evaluating combination criteria', { error, userId, criteria });
      return false;
    }
  }
  
  /**
   * Evaluate a single condition
   */
  private async evaluateCondition(
    userId: string,
    condition: AchievementCriteria,
    eventType: AchievementTrigger,
    eventData: any
  ): Promise<boolean> {
    try {
      // Create a mock achievement to evaluate using the rules engine
      const mockAchievement = {
        id: 'combination-condition',
        name: 'Combination Condition',
        description: 'Temporary achievement for condition evaluation',
        image_url: null,
        category: 'special' as any,
        difficulty: 'common' as any,
        points_reward: 0,
        criteria: [condition],
        created_at: new Date(),
        updated_at: null,
        secret: false
      };
      
      return this.rulesEngine.evaluateAchievement(
        userId,
        mockAchievement,
        condition.trigger || eventType,
        eventData
      );
    } catch (error) {
      logger.error('Error evaluating condition', { error, userId, condition });
      return false;
    }
  }
  
  /**
   * Get progress for combination criteria
   */
  async getProgress(
    userId: string,
    criteria: AchievementCriteria
  ): Promise<{ current: number; target: number; complete: boolean }> {
    try {
      if (!criteria.metadata?.conditions || !Array.isArray(criteria.metadata.conditions)) {
        return { current: 0, target: 1, complete: false };
      }
      
      const conditions = criteria.metadata.conditions as AchievementCriteria[];
      const operator = (criteria.metadata?.operator as string) || 'AND';
      
      // Get progress for each condition
      const conditionProgress = await Promise.all(
        conditions.map(async (condition) => {
          const mockAchievement = {
            id: 'combination-condition',
            name: 'Combination Condition',
            description: 'Temporary achievement for condition evaluation',
            image_url: null,
            category: 'special' as any,
            difficulty: 'common' as any,
            points_reward: 0,
            criteria: [condition],
            created_at: new Date(),
            updated_at: null,
            secret: false
          };
          
          const progress = await this.rulesEngine.getAchievementProgress(userId, mockAchievement);
          return progress.isComplete;
        })
      );
      
      // Count completed conditions
      const completedConditions = conditionProgress.filter(complete => complete).length;
      
      // Determine overall completion based on operator
      let isComplete = false;
      
      if (operator === 'AND') {
        isComplete = completedConditions === conditions.length;
      } else if (operator === 'OR') {
        isComplete = completedConditions > 0;
      } else if (operator === 'XOR') {
        isComplete = completedConditions === 1;
      }
      
      // For progress percentage, we'll use a simple ratio for AND
      // For OR, even one complete condition means 100%
      let progress = 0;
      
      if (operator === 'AND') {
        progress = Math.round((completedConditions / conditions.length) * 100);
      } else if (operator === 'OR') {
        progress = isComplete ? 100 : 0;
      } else if (operator === 'XOR') {
        progress = isComplete ? 100 : 0;
      }
      
      return {
        current: completedConditions,
        target: conditions.length,
        complete: isComplete
      };
    } catch (error) {
      logger.error('Error getting combination criteria progress', { error, userId, criteria });
      return {
        current: 0,
        target: 1,
        complete: false
      };
    }
  }
}
