/**
 * Milestone Criterion Evaluator
 * 
 * Evaluates milestone-based achievement criteria (e.g., "Reach level 5")
 */
import { Pool } from 'pg';
import { logger } from '../../../../lib/logger';
import { 
  AchievementCriteria,
  AchievementProgress
} from '../../../../models/entities/achievement/achievement.model';

/**
 * Evaluate a milestone-based achievement criterion
 * 
 * @param userId User ID
 * @param criterion Achievement criterion
 * @param currentProgress Current achievement progress
 * @param eventType Type of event that triggered the evaluation
 * @param eventData Event data
 * @param db Database connection
 * @returns Updated achievement progress
 */
export async function evaluateMilestoneCriteria(
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

    let newValue = currentProgress.currentValue;
    const milestoneType = criterion.metadata?.milestoneType || 'level';

    // Handle different types of milestones
    switch (milestoneType) {
      case 'level':
        if (eventType === 'user.levelUp') {
          // For level up events, use the new level directly
          newValue = eventData.newLevel;
        } else {
          // Query the user's current level
          const result = await db.query(
            'SELECT level FROM user_levels WHERE user_id = $1',
            [userId]
          );
          
          if (result.rows.length > 0) {
            newValue = result.rows[0].level;
          }
        }
        break;

      case 'badge_count':
        // Count the number of badges the user has
        const badgeResult = await db.query(
          'SELECT COUNT(*) as count FROM user_badges WHERE user_id = $1',
          [userId]
        );
        
        newValue = parseInt(badgeResult.rows[0].count, 10);
        break;

      case 'achievement_count':
        // Count the number of achievements the user has unlocked
        const achievementResult = await db.query(
          'SELECT COUNT(*) as count FROM user_achievements WHERE user_id = $1 AND unlocked_at IS NOT NULL',
          [userId]
        );
        
        newValue = parseInt(achievementResult.rows[0].count, 10);
        break;

      case 'referral_count':
        // Count the number of referrals the user has made
        const referralResult = await db.query(
          'SELECT COUNT(*) as count FROM referrals WHERE referrer_id = $1 AND status = $2',
          [userId, criterion.metadata?.requireVerified ? 'verified' : 'completed']
        );
        
        newValue = parseInt(referralResult.rows[0].count, 10);
        break;

      case 'content_count':
        // Count the user's content
        let contentQuery = 'SELECT COUNT(*) as count FROM content WHERE user_id = $1';
        const contentParams = [userId];
        
        // Add type filter if specified
        if (criterion.metadata?.contentType) {
          contentQuery += ' AND type = $2';
          contentParams.push(criterion.metadata.contentType);
        }
        
        const contentResult = await db.query(contentQuery, contentParams);
        newValue = parseInt(contentResult.rows[0].count, 10);
        break;

      default:
        // For custom milestone types, check if there's a query in metadata
        if (criterion.metadata?.query) {
          const customQuery = criterion.metadata.query;
          const customParams = [userId];
          
          // Add additional params from metadata
          if (criterion.metadata.queryParams) {
            customParams.push(...criterion.metadata.queryParams);
          }
          
          const customResult = await db.query(customQuery, customParams);
          
          if (customResult.rows.length > 0) {
            const firstRow = customResult.rows[0];
            newValue = firstRow.count || firstRow.value || 0;
          }
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
    logger.error('Error evaluating milestone criterion', { userId, criterion, eventType, error });
    return currentProgress;
  }
}
