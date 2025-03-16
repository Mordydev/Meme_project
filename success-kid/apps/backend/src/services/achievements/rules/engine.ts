/**
 * Achievement Rules Engine
 * 
 * Evaluates achievement criteria based on user activity.
 * Supports various criteria types like count, streak, threshold, etc.
 */
import { Pool } from 'pg';
import { 
  Achievement,
  AchievementCriteria,
  AchievementCriteriaType,
  AchievementTrigger 
} from '../../../models/achievement';
import { AchievementRepository } from '../../../repositories/achievement-repository';
import { logger } from '../../../lib/logger';

// Import rule definitions
import { CountRule } from './definitions/count-rule';
import { StreakRule } from './definitions/streak-rule';
import { ThresholdRule } from './definitions/threshold-rule';
import { MilestoneRule } from './definitions/milestone-rule';
import { CombinationRule } from './definitions/combination-rule';
import { DurationRule } from './definitions/duration-rule';
import { QualityRule } from './definitions/quality-rule';
import { SpecialRule } from './definitions/special-rule';

/**
 * Interface for rule evaluators
 */
export interface RuleEvaluator {
  evaluate(
    userId: string,
    criteria: AchievementCriteria,
    eventType: AchievementTrigger,
    eventData: any
  ): Promise<boolean>;
}

/**
 * Achievement Rules Engine
 */
export class AchievementRulesEngine {
  private repository: AchievementRepository;
  private ruleEvaluators: Map<AchievementCriteriaType, RuleEvaluator>;
  
  constructor(db: Pool, repository: AchievementRepository) {
    this.repository = repository;
    
    // Initialize rule evaluators
    this.ruleEvaluators = new Map();
    this.initializeRuleEvaluators(db);
  }
  
  /**
   * Initialize rule evaluators for each criteria type
   */
  private initializeRuleEvaluators(db: Pool): void {
    this.ruleEvaluators.set('count', new CountRule(db));
    this.ruleEvaluators.set('streak', new StreakRule(db));
    this.ruleEvaluators.set('threshold', new ThresholdRule(db));
    this.ruleEvaluators.set('milestone', new MilestoneRule(db));
    this.ruleEvaluators.set('combination', new CombinationRule(db, this));
    this.ruleEvaluators.set('duration', new DurationRule(db));
    this.ruleEvaluators.set('quality', new QualityRule(db));
    this.ruleEvaluators.set('special', new SpecialRule(db));
  }
  
  /**
   * Evaluate if an achievement's criteria are met
   */
  async evaluateAchievement(
    userId: string,
    achievement: Achievement,
    eventType: AchievementTrigger,
    eventData: any
  ): Promise<boolean> {
    try {
      logger.debug('Evaluating achievement', { 
        achievementId: achievement.id,
        userId,
        eventType
      });
      
      // For each criteria in the achievement
      for (const criteria of achievement.criteria) {
        // Skip criteria that aren't triggered by this event type
        if (criteria.trigger !== eventType) {
          continue;
        }
        
        const evaluator = this.ruleEvaluators.get(criteria.type);
        
        if (!evaluator) {
          logger.warn(`No evaluator found for criteria type: ${criteria.type}`);
          continue;
        }
        
        // Evaluate criteria
        const criteriaResult = await evaluator.evaluate(
          userId,
          criteria,
          eventType,
          eventData
        );
        
        // For achievement to be complete, all criteria must be true
        if (!criteriaResult) {
          logger.debug('Achievement criteria not met', { 
            achievementId: achievement.id,
            userId,
            criteriaType: criteria.type
          });
          return false;
        }
      }
      
      // If we get here, all criteria were met
      logger.info('Achievement criteria met', { 
        achievementId: achievement.id,
        userId,
        name: achievement.name
      });
      
      return true;
    } catch (error) {
      logger.error('Error evaluating achievement', { 
        error,
        achievementId: achievement.id,
        userId,
        eventType
      });
      return false;
    }
  }
  
  /**
   * Get achievement progress for a user
   */
  async getAchievementProgress(
    userId: string,
    achievement: Achievement
  ): Promise<{
    isComplete: boolean;
    progress: number; // 0-100 percentage
    criteriaProgress: Record<string, { current: number; target: number; complete: boolean }>;
  }> {
    try {
      const criteriaProgress: Record<string, { current: number; target: number; complete: boolean }> = {};
      let completedCriteria = 0;
      
      // Evaluate each criteria
      for (const [index, criteria] of achievement.criteria.entries()) {
        const evaluator = this.ruleEvaluators.get(criteria.type);
        
        if (!evaluator) {
          logger.warn(`No evaluator found for criteria type: ${criteria.type}`);
          continue;
        }
        
        // For progress calculation, we need to get actual values
        // This would depend on the specific rule implementation
        // For simplicity, I'm assuming all rules can provide progress
        const progress = await this.getCriteriaProgress(userId, criteria);
        
        criteriaProgress[`criterion_${index}`] = progress;
        
        if (progress.complete) {
          completedCriteria++;
        }
      }
      
      // Calculate overall progress percentage
      const totalCriteria = achievement.criteria.length;
      const progressPercentage = totalCriteria > 0 
        ? Math.round((completedCriteria / totalCriteria) * 100) 
        : 0;
      
      const isComplete = completedCriteria === totalCriteria && totalCriteria > 0;
      
      return {
        isComplete,
        progress: progressPercentage,
        criteriaProgress
      };
    } catch (error) {
      logger.error('Error getting achievement progress', { 
        error,
        achievementId: achievement.id,
        userId
      });
      
      return {
        isComplete: false,
        progress: 0,
        criteriaProgress: {}
      };
    }
  }
  
  /**
   * Get progress for a specific criteria
   * This would be implemented differently for each criteria type
   */
  private async getCriteriaProgress(
    userId: string, 
    criteria: AchievementCriteria
  ): Promise<{ current: number; target: number; complete: boolean }> {
    // This is a simplified implementation
    // In a real system, each rule evaluator would provide its own progress calculation
    const evaluator = this.ruleEvaluators.get(criteria.type);
    
    if (!evaluator) {
      return { current: 0, target: criteria.threshold || 1, complete: false };
    }
    
    // For demonstration, I'm using a dummy value
    // In a real implementation, this would use the actual rule logic
    const current = 0; // This would be calculated based on the criteria type
    const target = criteria.threshold || 1;
    
    return {
      current,
      target,
      complete: current >= target
    };
  }
}
