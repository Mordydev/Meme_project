/**
 * Aggregate Criterion Evaluator
 * 
 * Evaluates aggregate-based achievement criteria (e.g., "Earn 1000 points")
 */
import { Pool } from 'pg';
import { logger } from '../../../../lib/logger';
import { 
  AchievementCriteria,
  AchievementProgress
} from '../../../../models/entities/achievement/achievement.model';

/**
 * Evaluate an aggregate-based achievement criterion
 * 
 * @param userId User ID
 * @param criterion Achievement criterion
 * @param currentProgress Current achievement progress
 * @param eventType Type of event that triggered the evaluation
 * @param eventData Event data
 * @param db Database connection
 * @returns Updated achievement progress
 */
export async function evaluateAggregateCriteria(
  userId: string,
  criterion: AchievementCriteria,
  currentProgress: AchievementProgress,
  eventType: string,
  eventData: any,
  db: Pool
): Promise<AchievementProgress> {
  try {
    // Skip if no target value
    if (!criterion.targetValue) {
      return currentProgress;
    }

    // Get the aggregate value based on the event type
    let newValue = currentProgress.currentValue;

    switch (eventType) {
      case 'points.awarded':
        // For points events, we either increment by the amount or query the total
        if (criterion.metadata?.source && eventData.source !== criterion.metadata.source) {
          // Skip if the source doesn't match
          break;
        }

        if (criterion.metadata?.queryTotal) {
          // Query the total points for this user
          let query = `
            SELECT COALESCE(SUM(amount), 0) as total
            FROM user_points
            WHERE user_id = $1 AND amount > 0
          `;
          
          // Add source filter if specified
          const params = [userId];
          if (criterion.metadata?.source) {
            query += ` AND source = $2`;
            params.push(criterion.metadata.source);
          }
          
          const result = await db.query(query, params);
          newValue = parseInt(result.rows[0].total, 10);
        } else {
          // Increment by the amount awarded
          newValue += eventData.amount;
        }
        break;

      case 'streak.milestone':
        // For streak milestones, we want the current streak count
        if (criterion.metadata?.activityType && eventData.activityType !== criterion.metadata.activityType) {
          // Skip if the activity type doesn't match
          break;
        }
        
        // Use the streak count as the new value
        newValue = Math.max(newValue, eventData.streakCount);
        break;

      default:
        // For other event types, use metadata to determine what to aggregate
        if (criterion.metadata?.table && criterion.metadata?.aggregateField && criterion.metadata?.aggregateFunction) {
          // Use the specified table and aggregation for counting
          const conditions = [`user_id = $1`];
          const params = [userId];
          
          // Add additional conditions from metadata
          if (criterion.metadata.additionalConditions) {
            Object.entries(criterion.metadata.additionalConditions).forEach(([field, value], index) => {
              conditions.push(`${field} = $${index + 2}`);
              params.push(value);
            });
          }
          
          // Construct and execute query
          const query = `
            SELECT ${criterion.metadata.aggregateFunction}(${criterion.metadata.aggregateField}) as total
            FROM ${criterion.metadata.table}
            WHERE ${conditions.join(' AND ')}
          `;
          
          const result = await db.query(query, params);
          newValue = parseFloat(result.rows[0].total) || 0;
        }
        break;
    }

    // Never decrease progress
    if (newValue <= currentProgress.currentValue) {
      return currentProgress;
    }

    // Update progress
    return {
      currentValue: newValue,
      targetValue: criterion.targetValue,
      percentComplete: Math.min(100, Math.round((newValue / criterion.targetValue) * 100)),
      isComplete: newValue >= criterion.targetValue
    };
  } catch (error) {
    logger.error('Error evaluating aggregate criterion', { userId, criterion, eventType, error });
    return currentProgress;
  }
}
