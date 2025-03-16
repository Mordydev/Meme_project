/**
 * Threshold Rule
 * 
 * Evaluates threshold-based criteria, such as "Reach 1000 points" or "Get 100 followers"
 */
import { Pool } from 'pg';
import { 
  AchievementCriteria,
  AchievementTrigger
} from '../../../../models/achievement';
import { RuleEvaluator } from '../engine';
import { logger } from '../../../../lib/logger';

export class ThresholdRule implements RuleEvaluator {
  constructor(private db: Pool) {}
  
  /**
   * Evaluate a threshold-based criteria
   */
  async evaluate(
    userId: string,
    criteria: AchievementCriteria,
    eventType: AchievementTrigger,
    eventData: any
  ): Promise<boolean> {
    if (criteria.threshold === undefined) {
      logger.warn('Threshold criteria missing threshold value', { criteria });
      return false;
    }
    
    try {
      // Get current value
      const currentValue = await this.getCurrentValue(userId, criteria, eventType);
      
      // Check if threshold is met
      return currentValue >= criteria.threshold;
    } catch (error) {
      logger.error('Error evaluating threshold criteria', { error, userId, criteria });
      return false;
    }
  }
  
  /**
   * Get the current value for the given criteria
   */
  private async getCurrentValue(
    userId: string,
    criteria: AchievementCriteria,
    eventType: AchievementTrigger
  ): Promise<number> {
    try {
      // Determine what to measure based on the event type and metadata
      const metricType = criteria.metadata?.metricType || this.getDefaultMetricType(eventType);
      
      switch (metricType) {
        case 'points_total':
          return this.getTotalPoints(userId, criteria);
          
        case 'points_balance':
          return this.getPointsBalance(userId, criteria);
          
        case 'content_likes':
          return this.getContentLikes(userId, criteria);
          
        case 'follower_count':
          return this.getFollowerCount(userId, criteria);
          
        case 'token_balance':
          return this.getTokenBalance(userId, criteria);
          
        case 'achievement_count':
          return this.getAchievementCount(userId, criteria);
          
        case 'level':
          return this.getUserLevel(userId, criteria);
          
        default:
          logger.warn(`Unsupported metric type for threshold criteria: ${metricType}`);
          return 0;
      }
    } catch (error) {
      logger.error('Error getting current value for threshold', { error, userId, criteria });
      return 0;
    }
  }
  
  /**
   * Get default metric type based on event type
   */
  private getDefaultMetricType(eventType: AchievementTrigger): string {
    switch (eventType) {
      case 'points.awarded':
        return 'points_total';
        
      case 'reaction.received':
        return 'content_likes';
        
      case 'user.levelUp':
        return 'level';
        
      default:
        return 'points_total'; // Default to points total
    }
  }
  
  /**
   * Get total points earned (cumulative)
   */
  private async getTotalPoints(
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
        SELECT COALESCE(SUM(amount), 0) as total
        FROM user_points 
        WHERE user_id = $1 AND amount > 0
        ${timeClause} ${sourceFilter}
      `;
      
      const result = await this.db.query<{ total: string }>(query, [userId]);
      return parseInt(result.rows[0].total, 10);
    } catch (error) {
      logger.error('Error getting total points', { error, userId });
      return 0;
    }
  }
  
  /**
   * Get current points balance
   */
  private async getPointsBalance(
    userId: string, 
    criteria: AchievementCriteria
  ): Promise<number> {
    try {
      const query = `
        SELECT COALESCE(SUM(amount), 0) as balance
        FROM user_points 
        WHERE user_id = $1
      `;
      
      const result = await this.db.query<{ balance: string }>(query, [userId]);
      return parseInt(result.rows[0].balance, 10);
    } catch (error) {
      logger.error('Error getting points balance', { error, userId });
      return 0;
    }
  }
  
  /**
   * Get total likes received on content
   */
  private async getContentLikes(
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
        : `AND cr.reaction_type = 'like'`; // Default to likes
      
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
      logger.error('Error getting content likes', { error, userId });
      return 0;
    }
  }
  
  /**
   * Get follower count
   */
  private async getFollowerCount(
    userId: string, 
    criteria: AchievementCriteria
  ): Promise<number> {
    try {
      const query = `
        SELECT COUNT(*) as count
        FROM followers
        WHERE followed_id = $1
      `;
      
      const result = await this.db.query<{ count: string }>(query, [userId]);
      return parseInt(result.rows[0].count, 10);
    } catch (error) {
      logger.error('Error getting follower count', { error, userId });
      return 0;
    }
  }
  
  /**
   * Get token balance from connected wallet
   */
  private async getTokenBalance(
    userId: string, 
    criteria: AchievementCriteria
  ): Promise<number> {
    try {
      // This would typically come from a blockchain service
      // For this implementation, we'll check if there's wallet data available
      const query = `
        SELECT token_balance
        FROM wallet_connections
        WHERE user_id = $1 AND is_verified = true
        ORDER BY last_verified_at DESC
        LIMIT 1
      `;
      
      const result = await this.db.query<{ token_balance: number }>(query, [userId]);
      
      if (result.rows.length === 0) {
        return 0;
      }
      
      return result.rows[0].token_balance || 0;
    } catch (error) {
      logger.error('Error getting token balance', { error, userId });
      return 0;
    }
  }
  
  /**
   * Get user achievement count
   */
  private async getAchievementCount(
    userId: string, 
    criteria: AchievementCriteria
  ): Promise<number> {
    try {
      // Filter by difficulty if specified
      const difficultyFilter = criteria.metadata?.difficulty 
        ? `JOIN achievements a ON ua.achievement_id = a.id AND a.difficulty = '${criteria.metadata.difficulty}'` 
        : '';
      
      const query = `
        SELECT COUNT(*) as count 
        FROM user_achievements ua
        ${difficultyFilter}
        WHERE ua.user_id = $1
      `;
      
      const result = await this.db.query<{ count: string }>(query, [userId]);
      return parseInt(result.rows[0].count, 10);
    } catch (error) {
      logger.error('Error getting achievement count', { error, userId });
      return 0;
    }
  }
  
  /**
   * Get user level
   */
  private async getUserLevel(
    userId: string, 
    criteria: AchievementCriteria
  ): Promise<number> {
    try {
      const query = `
        SELECT level FROM profiles WHERE user_id = $1
      `;
      
      const result = await this.db.query<{ level: number }>(query, [userId]);
      
      if (result.rows.length === 0) {
        return 1; // Default level is 1
      }
      
      return result.rows[0].level;
    } catch (error) {
      logger.error('Error getting user level', { error, userId });
      return 1; // Default level is 1
    }
  }
  
  /**
   * Get progress for threshold criteria
   */
  async getProgress(
    userId: string,
    criteria: AchievementCriteria
  ): Promise<{ current: number; target: number; complete: boolean }> {
    if (!criteria.threshold) {
      return { current: 0, target: 1, complete: false };
    }
    
    try {
      const current = await this.getCurrentValue(userId, criteria, criteria.trigger);
      const target = criteria.threshold;
      
      return {
        current,
        target,
        complete: current >= target
      };
    } catch (error) {
      logger.error('Error getting threshold criteria progress', { error, userId, criteria });
      return {
        current: 0,
        target: criteria.threshold,
        complete: false
      };
    }
  }
}
