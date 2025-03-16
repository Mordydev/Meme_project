/**
 * Streak Rule
 * 
 * Evaluates streak-based criteria, such as "Login for 7 consecutive days"
 */
import { Pool } from 'pg';
import { 
  AchievementCriteria,
  AchievementTrigger
} from '../../../../models/achievement';
import { RuleEvaluator } from '../engine';
import { logger } from '../../../../lib/logger';

export class StreakRule implements RuleEvaluator {
  constructor(private db: Pool) {}
  
  /**
   * Evaluate a streak-based criteria
   */
  async evaluate(
    userId: string,
    criteria: AchievementCriteria,
    eventType: AchievementTrigger,
    eventData: any
  ): Promise<boolean> {
    if (criteria.threshold === undefined) {
      logger.warn('Streak criteria missing threshold value', { criteria });
      return false;
    }
    
    try {
      // Get current streak
      const currentStreak = await this.getCurrentStreak(userId, criteria, eventType);
      
      // Check if threshold is met
      return currentStreak >= criteria.threshold;
    } catch (error) {
      logger.error('Error evaluating streak criteria', { error, userId, criteria });
      return false;
    }
  }
  
  /**
   * Get the current streak for the given criteria
   */
  private async getCurrentStreak(
    userId: string,
    criteria: AchievementCriteria,
    eventType: AchievementTrigger
  ): Promise<number> {
    try {
      // Use the appropriate streak table based on event type
      const activityType = this.getActivityTypeFromEvent(eventType, criteria);
      
      if (!activityType) {
        logger.warn(`Unsupported event type for streak criteria: ${eventType}`);
        return 0;
      }
      
      const query = `
        SELECT current_count
        FROM user_streaks
        WHERE user_id = $1 AND activity_type = $2
      `;
      
      const result = await this.db.query<{ current_count: number }>(query, [userId, activityType]);
      
      if (result.rows.length === 0) {
        return 0;
      }
      
      return result.rows[0].current_count;
    } catch (error) {
      logger.error('Error getting current streak', { error, userId, criteria });
      return 0;
    }
  }
  
  /**
   * Map event type to streak activity type
   */
  private getActivityTypeFromEvent(
    eventType: AchievementTrigger, 
    criteria: AchievementCriteria
  ): string | null {
    // Check if activity type is explicitly specified in metadata
    if (criteria.metadata?.activityType) {
      return criteria.metadata.activityType as string;
    }
    
    // Otherwise, map from event type
    switch (eventType) {
      case 'user.login':
        return 'login';
        
      case 'content.created':
        return 'content_creation';
        
      case 'comment.created':
      case 'reaction.received':
        return 'engagement';
        
      case 'points.awarded':
        return 'points_earning';
        
      default:
        return null;
    }
  }
  
  /**
   * Get progress for streak criteria
   */
  async getProgress(
    userId: string,
    criteria: AchievementCriteria
  ): Promise<{ current: number; target: number; complete: boolean }> {
    if (!criteria.threshold) {
      return { current: 0, target: 1, complete: false };
    }
    
    try {
      const current = await this.getCurrentStreak(userId, criteria, criteria.trigger);
      const target = criteria.threshold;
      
      return {
        current,
        target,
        complete: current >= target
      };
    } catch (error) {
      logger.error('Error getting streak criteria progress', { error, userId, criteria });
      return {
        current: 0,
        target: criteria.threshold,
        complete: false
      };
    }
  }
}
