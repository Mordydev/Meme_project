/**
 * Boolean Criterion Evaluator
 * 
 * Evaluates boolean achievement criteria (e.g., "Connect wallet")
 */
import { Pool } from 'pg';
import { logger } from '../../../../lib/logger';
import { 
  AchievementCriteria,
  AchievementProgress
} from '../../../../models/entities/achievement/achievement.model';

/**
 * Evaluate a boolean achievement criterion
 * 
 * @param userId User ID
 * @param criterion Achievement criterion
 * @param currentProgress Current achievement progress
 * @param eventType Type of event that triggered the evaluation
 * @param eventData Event data
 * @param db Database connection
 * @returns Updated achievement progress
 */
export async function evaluateBooleanCriteria(
  userId: string,
  criterion: AchievementCriteria,
  currentProgress: AchievementProgress,
  eventType: string,
  eventData: any,
  db: Pool
): Promise<AchievementProgress> {
  try {
    // If already complete, nothing to do
    if (currentProgress.isComplete) {
      return currentProgress;
    }

    // For a boolean criterion, there are only two states: complete or not complete
    let isComplete = false;
    const booleanType = criterion.metadata?.booleanType || 'event_occurrence';

    // Handle different types of boolean criteria
    switch (booleanType) {
      case 'event_occurrence':
        // Check if this is the exact event we're looking for
        if (eventType === criterion.eventType) {
          isComplete = true;
        }
        break;

      case 'wallet_connected':
        // Check if user has connected a wallet
        if (eventType === 'wallet.connected') {
          isComplete = true;
        } else {
          // Query if user has a wallet connection
          const walletResult = await db.query(
            'SELECT COUNT(*) as count FROM wallet_connections WHERE user_id = $1 AND is_verified = true',
            [userId]
          );
          
          isComplete = parseInt(walletResult.rows[0].count, 10) > 0;
        }
        break;

      case 'profile_completed':
        // Check if user has completed their profile
        const profileResult = await db.query(
          `SELECT 
             (bio IS NOT NULL AND bio != '') AND
             (avatar_url IS NOT NULL) AS is_complete
           FROM profiles
           WHERE user_id = $1`,
          [userId]
        );
        
        isComplete = profileResult.rows.length > 0 && profileResult.rows[0].is_complete;
        break;

      case 'has_badge':
        // Check if user has a specific badge
        if (criterion.metadata?.badgeId) {
          const badgeResult = await db.query(
            'SELECT COUNT(*) as count FROM user_badges WHERE user_id = $1 AND badge_id = $2',
            [userId, criterion.metadata.badgeId]
          );
          
          isComplete = parseInt(badgeResult.rows[0].count, 10) > 0;
        }
        break;

      default:
        // For custom boolean types, check if there's a query in metadata
        if (criterion.metadata?.query) {
          const customQuery = criterion.metadata.query;
          const customParams = [userId];
          
          // Add additional params from metadata
          if (criterion.metadata.queryParams) {
            customParams.push(...criterion.metadata.queryParams);
          }
          
          const customResult = await db.query(customQuery, customParams);
          
          if (customResult.rows.length > 0) {
            isComplete = !!customResult.rows[0].is_complete;
          }
        }
        break;
    }

    // For boolean criteria, it's either complete (1) or not (0)
    const newValue = isComplete ? 1 : 0;

    // Don't downgrade if already complete
    if (currentProgress.currentValue === 1 && newValue === 0) {
      return currentProgress;
    }

    // Update progress
    return {
      currentValue: newValue,
      targetValue: 1, // Boolean criteria always have a target of 1
      percentComplete: newValue * 100, // Either 0% or 100%
      isComplete: newValue === 1
    };
  } catch (error) {
    logger.error('Error evaluating boolean criterion', { userId, criterion, eventType, error });
    return currentProgress;
  }
}
