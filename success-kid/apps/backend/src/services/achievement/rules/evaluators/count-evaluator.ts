/**
 * Count Criterion Evaluator
 * 
 * Evaluates count-based achievement criteria (e.g., "Create 10 posts")
 */
import { Pool } from 'pg';
import { logger } from '../../../../lib/logger';
import { 
  AchievementCriteria,
  AchievementProgress
} from '../../../../models/entities/achievement/achievement.model';

/**
 * Evaluate a count-based achievement criterion
 * 
 * @param userId User ID
 * @param criterion Achievement criterion
 * @param currentProgress Current achievement progress
 * @param eventType Type of event that triggered the evaluation
 * @param eventData Event data
 * @param db Database connection
 * @returns Updated achievement progress
 */
export async function evaluateCountCriteria(
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

    // Get the count based on the event type
    let newCount = currentProgress.currentValue;

    switch (eventType) {
      case 'content.created':
        // Increment count for content creation
        if ((criterion.metadata?.contentType && eventData.contentType === criterion.metadata.contentType) || 
            !criterion.metadata?.contentType) {
          newCount++;
        }
        break;

      case 'content.commented':
        // Increment count for comments
        newCount++;
        break;

      case 'achievement.unlocked':
        // Count achievements
        if (criterion.metadata?.category) {
          // If we're looking for a specific category, query the total
          const result = await db.query(`
            SELECT COUNT(*) as count 
            FROM user_achievements ua
            JOIN achievements a ON ua.achievement_id = a.id
            WHERE ua.user_id = $1 
              AND a.category = $2
              AND ua.unlocked_at IS NOT NULL
          `, [userId, criterion.metadata.category]);
          
          newCount = parseInt(result.rows[0].count, 10);
        } else {
          // Just increment for any achievement
          newCount++;
        }
        break;

      case 'wallet.connected':
        // Boolean check for wallet connection
        newCount = 1;
        break;

      case 'referral.completed':
        // Count referrals
        if (criterion.metadata?.requireVerified) {
          // Query verified referrals
          const result = await db.query(`
            SELECT COUNT(*) as count 
            FROM referrals
            WHERE referrer_id = $1 AND status = 'verified'
          `, [userId]);
          
          newCount = parseInt(result.rows[0].count, 10);
        } else {
          // Increment for any referral
          newCount++;
        }
        break;

      default:
        // For other event types, use metadata to determine what to count
        if (criterion.metadata?.table && criterion.metadata?.countField) {
          // Use the specified table and condition for counting
          const conditions = [`${criterion.metadata.countField} = $1`];
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
            SELECT COUNT(*) as count 
            FROM ${criterion.metadata.table}
            WHERE ${conditions.join(' AND ')}
          `;
          
          const result = await db.query(query, params);
          newCount = parseInt(result.rows[0].count, 10);
        }
        break;
    }

    // Never decrease progress
    if (newCount <= currentProgress.currentValue) {
      return currentProgress;
    }

    // Update progress
    return {
      currentValue: newCount,
      targetValue: criterion.targetValue,
      percentComplete: Math.min(100, Math.round((newCount / criterion.targetValue) * 100)),
      isComplete: newCount >= criterion.targetValue
    };
  } catch (error) {
    logger.error('Error evaluating count criterion', { userId, criterion, eventType, error });
    return currentProgress;
  }
}
