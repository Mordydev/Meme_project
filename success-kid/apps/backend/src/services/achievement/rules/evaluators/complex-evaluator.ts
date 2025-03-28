/**
 * Complex Criterion Evaluator
 * 
 * Evaluates complex achievement criteria with multiple conditions or custom logic
 */
import { Pool } from 'pg';
import { logger } from '../../../../lib/logger';
import { 
  AchievementCriteria,
  AchievementProgress
} from '../../../../models/entities/achievement/achievement.model';

// Import other evaluators to use as building blocks
import { evaluateCountCriteria } from './count-evaluator';
import { evaluateAggregateCriteria } from './aggregate-evaluator';
import { evaluateBooleanCriteria } from './boolean-evaluator';

/**
 * Evaluate a complex achievement criterion with multiple conditions
 * 
 * @param userId User ID
 * @param criterion Achievement criterion
 * @param currentProgress Current achievement progress
 * @param eventType Type of event that triggered the evaluation
 * @param eventData Event data
 * @param db Database connection
 * @returns Updated achievement progress
 */
export async function evaluateComplexCriteria(
  userId: string,
  criterion: AchievementCriteria,
  currentProgress: AchievementProgress,
  eventType: string,
  eventData: any,
  db: Pool
): Promise<AchievementProgress> {
  try {
    // Complex criteria require subcriteria
    if (!criterion.metadata?.subcriteria || !Array.isArray(criterion.metadata.subcriteria)) {
      logger.warn('Complex criterion missing subcriteria', { criterion });
      return currentProgress;
    }

    const subcriteria = criterion.metadata.subcriteria;
    const combineMethod = criterion.metadata?.combineMethod || 'all';
    
    // Evaluate each subcriterion
    const results = await Promise.all(subcriteria.map(async (subcriterion) => {
      // Create a fresh progress object for this subcriterion
      const subProgress: AchievementProgress = {
        currentValue: 0,
        targetValue: subcriterion.targetValue || 1,
        percentComplete: 0,
        isComplete: false
      };
      
      // Evaluate based on the subcriterion type
      switch (subcriterion.type) {
        case 'count':
          return evaluateCountCriteria(userId, subcriterion, subProgress, eventType, eventData, db);
        case 'aggregate':
          return evaluateAggregateCriteria(userId, subcriterion, subProgress, eventType, eventData, db);
        case 'boolean':
          return evaluateBooleanCriteria(userId, subcriterion, subProgress, eventType, eventData, db);
        default:
          logger.warn(`Unsupported subcriterion type: ${subcriterion.type}`, { subcriterion });
          return subProgress;
      }
    }));
    
    // Combine the results based on the specified method
    let isComplete = false;
    let percentComplete = 0;
    let newValue = 0;
    
    if (combineMethod === 'all') {
      // All subcriteria must be complete
      isComplete = results.every(result => result.isComplete);
      
      // Average percent complete
      percentComplete = Math.round(
        results.reduce((sum, result) => sum + result.percentComplete, 0) / results.length
      );
      
      // Sum of normalized progress values
      newValue = Math.round(
        results.reduce((sum, result) => sum + (result.currentValue / result.targetValue), 0)
              * 100 / results.length
      );
    } 
    else if (combineMethod === 'any') {
      // Any subcriterion can be complete
      isComplete = results.some(result => result.isComplete);
      
      // Maximum percent complete
      percentComplete = Math.max(...results.map(result => result.percentComplete));
      
      // Maximum normalized progress
      newValue = Math.max(
        ...results.map(result => Math.round((result.currentValue / result.targetValue) * 100))
      );
    }
    else if (combineMethod === 'weighted') {
      // Weighted average based on metadata.weights
      const weights = criterion.metadata.weights || subcriteria.map(() => 1);
      const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
      
      percentComplete = Math.round(
        results.reduce((sum, result, index) => sum + (result.percentComplete * weights[index]), 0) / totalWeight
      );
      
      newValue = Math.round(
        results.reduce((sum, result, index) => 
          sum + ((result.currentValue / result.targetValue) * weights[index]), 0) * 100 / totalWeight
      );
      
      isComplete = percentComplete >= 100;
    }
    else if (combineMethod === 'sequential') {
      // Each criterion must be completed in order
      const firstIncomplete = results.findIndex(result => !result.isComplete);
      
      if (firstIncomplete === -1) {
        // All complete
        isComplete = true;
        percentComplete = 100;
        newValue = 100;
      } 
      else if (firstIncomplete === 0) {
        // First one not complete, use its progress
        percentComplete = results[0].percentComplete;
        newValue = Math.round((results[0].currentValue / results[0].targetValue) * 100);
      } 
      else {
        // Some complete, first incomplete partial
        const completedPercent = (firstIncomplete / results.length) * 100;
        const partialPercent = (results[firstIncomplete].percentComplete / results.length);
        
        percentComplete = Math.round(completedPercent + partialPercent);
        newValue = percentComplete;
      }
    }
    
    // Never decrease progress
    if (newValue < currentProgress.currentValue) {
      return currentProgress;
    }
    
    // Update progress
    return {
      currentValue: newValue,
      targetValue: 100, // Complex criteria are normalized to 100
      percentComplete: Math.min(100, percentComplete),
      isComplete
    };
  } catch (error) {
    logger.error('Error evaluating complex criterion', { userId, criterion, eventType, error });
    return currentProgress;
  }
}
