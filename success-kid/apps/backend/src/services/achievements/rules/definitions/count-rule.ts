/**
 * Count Rule
 * 
 * Evaluates count-based criteria, such as "Create X posts" or "Receive Y likes"
 */
import { Pool } from 'pg';
import { 
  AchievementCriteria,
  AchievementTrigger
} from '../../../../models/achievement';
import { RuleEvaluator } from '../engine';
import { logger } from '../../../../lib/logger';

export class CountRule implements RuleEvaluator {
  constructor(private db: Pool) {}
  
  /**
   * Evaluate a count-based criteria
   */
  async evaluate(
    userId: string,
    criteria: AchievementCriteria,
    eventType: AchievementTrigger,
    eventData: any
  ): Promise<boolean> {
    if (criteria.threshold === undefined) {
      logger.warn('Count criteria missing threshold value', { criteria });
      return false;
    }
    
    try {
      // Get current count based on criteria trigger type
      const currentValue = await this.getCurrentCount(userId, criteria, eventType);
      
      // Increment the count by 1 for the current event
      // Note: For some events, we might increment by different amounts or need to extract values
      const newValue = currentValue + 1;
      
      // Check if threshold is met
      return newValue >= criteria.threshold;
    } catch (error) {
      logger.error('Error evaluating count criteria', { error, userId, criteria });
      return false;
    }
  }
  
  /**
   * Get the current count for the given criteria
   */
  private async getCurrentCount(
    userId: string,
    criteria: AchievementCriteria,
    eventType: AchievementTrigger
  ): Promise<number> {
    try {
      // Determine the query based on the trigger type
      switch (eventType) {
        case 'content.created':
          return this.getContentCreationCount(userId, criteria);
          
        case 'comment.created':
          return this.getCommentCreationCount(userId, criteria);
          
        case 'points.awarded':
          return this.getPointsTransactionCount(userId, criteria);
          
        case 'reaction.received':
          return this.getReactionsReceivedCount(userId, criteria);
          
        case 'user.login':
          return this.getLoginCount(userId, criteria);
          
        case 'user.referral':
          return this.getReferralCount(userId, criteria);
          
        default:
          logger.warn(`Unsupported event type for count criteria: ${eventType}`);
          return 0;
      }
    } catch (error) {
      logger.error('Error getting current count', { error, userId, criteria });
      return 0;
    }
  }
  
  /**
   * Get content creation count
   */
  private async getContentCreationCount(
    userId: string, 
    criteria: AchievementCriteria
  ): Promise<number> {
    try {
      // Check if timeframe is specified (in days)
      const timeClause = criteria.timeframe 
        ? `AND created_at > NOW() - INTERVAL '${criteria.timeframe} days'` 
        : '';
      
      // Additional criteria from metadata if any
      const typeFilter = criteria.metadata?.contentType 
        ? `AND type = '${criteria.metadata.contentType}'` 
        : '';
      
      const query = `
        SELECT COUNT(*) as count 
        FROM content 
        WHERE user_id = $1 AND status = 'active' 
        ${timeClause} ${typeFilter}
      `;
      
      const result = await this.db.query<{ count: string }>(query, [userId]);
      return parseInt(result.rows[0].count, 10);
    } catch (error) {
      logger.error('Error getting content creation count', { error, userId });
      return 0;
    }
  }
  
  /**
   * Get comment creation count
   */
  private async getCommentCreationCount(
    userId: string, 
    criteria: AchievementCriteria
  ): Promise<number> {
    try {
      // Check if timeframe is specified (in days)
      const timeClause = criteria.timeframe 
        ? `AND created_at > NOW() - INTERVAL '${criteria.timeframe} days'` 
        : '';
      
      const query = `
        SELECT COUNT(*) as count 
        FROM comments 
        WHERE user_id = $1 AND status = 'active' 
        ${timeClause}
      `;
      
      const result = await this.db.query<{ count: string }>(query, [userId]);
      return parseInt(result.rows[0].count, 10);
    } catch (error) {
      logger.error('Error getting comment creation count', { error, userId });
      return 0;
    }
  }
  
  /**
   * Get points transaction count
   */
  private async getPointsTransactionCount(
    userId: string, 
    criteria: AchievementCriteria
  ): Promise<number> {
    try {
      // Check if timeframe is specified (in days)
      const timeClause = criteria.timeframe 
        ? `AND created_at > NOW() - INTERVAL '${criteria.timeframe} days'` 
        : '';
      
      // Filter by source if specified
      const sourceFilter = criteria.metadata?.source 
        ? `AND source = '${criteria.metadata.source}'` 
        : '';
      
      const query = `
        SELECT COUNT(*) as count 
        FROM user_points 
        WHERE user_id = $1 AND amount > 0 
        ${timeClause} ${sourceFilter}
      `;
      
      const result = await this.db.query<{ count: string }>(query, [userId]);
      return parseInt(result.rows[0].count, 10);
    } catch (error) {
      logger.error('Error getting points transaction count', { error, userId });
      return 0;
    }
  }
  
  /**
   * Get reactions received count
   */
  private async getReactionsReceivedCount(
    userId: string, 
    criteria: AchievementCriteria
  ): Promise<number> {
    try {
      // Check if timeframe is specified (in days)
      const timeClause = criteria.timeframe 
        ? `AND cr.created_at > NOW() - INTERVAL '${criteria.timeframe} days'` 
        : '';
      
      // Filter by reaction type if specified
      const typeFilter = criteria.metadata?.reactionType 
        ? `AND cr.reaction_type = '${criteria.metadata.reactionType}'` 
        : '';
      
      const query = `
        SELECT COUNT(*) as count 
        FROM content_reactions cr
        JOIN content c ON cr.content_id = c.id
        WHERE c.user_id = $1
        ${timeClause} ${typeFilter}
      `;
      
      const result = await this.db.query<{ count: string }>(query, [userId]);
      return parseInt(result.rows[0].count, 10);
    } catch (error) {
      logger.error('Error getting reactions received count', { error, userId });
      return 0;
    }
  }
  
  /**
   * Get login count
   */
  private async getLoginCount(
    userId: string, 
    criteria: AchievementCriteria
  ): Promise<number> {
    try {
      // Check if timeframe is specified (in days)
      const timeframe = criteria.timeframe || 30; // Default to 30 days
      
      const query = `
        SELECT COUNT(*) as count 
        FROM user_logins
        WHERE user_id = $1 
        AND created_at > NOW() - INTERVAL '${timeframe} days'
      `;
      
      const result = await this.db.query<{ count: string }>(query, [userId]);
      return parseInt(result.rows[0].count, 10);
    } catch (error) {
      logger.error('Error getting login count', { error, userId });
      return 0;
    }
  }
  
  /**
   * Get referral count
   */
  private async getReferralCount(
    userId: string, 
    criteria: AchievementCriteria
  ): Promise<number> {
    try {
      // Check if timeframe is specified (in days)
      const timeClause = criteria.timeframe 
        ? `AND created_at > NOW() - INTERVAL '${criteria.timeframe} days'` 
        : '';
      
      // Only count converted referrals if specified
      const convertedFilter = criteria.metadata?.onlyConverted 
        ? `AND status = 'converted'` 
        : '';
      
      const query = `
        SELECT COUNT(*) as count 
        FROM referrals 
        WHERE referrer_id = $1 
        ${timeClause} ${convertedFilter}
      `;
      
      const result = await this.db.query<{ count: string }>(query, [userId]);
      return parseInt(result.rows[0].count, 10);
    } catch (error) {
      logger.error('Error getting referral count', { error, userId });
      return 0;
    }
  }
  
  /**
   * Get progress for count criteria
   */
  async getProgress(
    userId: string,
    criteria: AchievementCriteria
  ): Promise<{ current: number; target: number; complete: boolean }> {
    if (!criteria.threshold) {
      return { current: 0, target: 1, complete: false };
    }
    
    try {
      const current = await this.getCurrentCount(userId, criteria, criteria.trigger);
      const target = criteria.threshold;
      
      return {
        current,
        target,
        complete: current >= target
      };
    } catch (error) {
      logger.error('Error getting count criteria progress', { error, userId, criteria });
      return {
        current: 0,
        target: criteria.threshold,
        complete: false
      };
    }
  }
}
