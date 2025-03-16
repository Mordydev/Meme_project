/**
 * Streak Criterion Evaluator
 * 
 * Evaluates streak-based achievement criteria (e.g., "Login 7 days in a row")
 */
import { Pool } from 'pg';
import { logger } from '../../../../lib/logger';
import { 
  AchievementCriteria,
  AchievementProgress
} from '../../../../models/entities/achievement/achievement.model';

/**
 * Evaluate a streak-based achievement criterion
 * 
 * @param userId User ID
 * @param criterion Achievement criterion
 * @param currentProgress Current achievement progress
 * @param eventType Type of event that triggered the evaluation
 * @param eventData Event data
 * @param db Database connection
 * @returns Updated achievement progress
 */
export async function evaluateStreakCriteria(
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

    // Process only streak milestone events or daily login events
    if (eventType !== 'streak.milestone' && eventType !== 'daily.login') {
      return currentProgress;
    }

    let newValue = currentProgress.currentValue;

    if (eventType === 'streak.milestone') {
      // For a streak milestone event, check if it matches the expected activity type
      if (criterion.metadata?.activityType && eventData.activityType !== criterion.metadata.activityType) {
        // Not the right type of streak
        return currentProgress;
      }

      // Use the streak count from the event
      newValue = eventData.streakCount;
    } else if (eventType === 'daily.login') {
      // For login events, query the current streak from the user_streaks table
      const streakQuery = `
        SELECT current_count
        FROM user_streaks us
        JOIN streak_definitions sd ON us.streak_id = sd.id
        WHERE us.user_id = $1 AND sd.activity_type = 'login'
        ORDER BY current_count DESC
        LIMIT 1
      `;
      
      const result = await db.query(streakQuery, [userId]);
      
      if (result.rows.length > 0) {
        newValue = result.rows[0].current_count;
      }
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
    logger.error('Error evaluating streak criterion', { userId, criterion, eventType, error });
    return currentProgress;
  }
}
