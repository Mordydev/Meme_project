/**
 * Quality Rule
 * 
 * Evaluates quality-based criteria, such as "10 posts with 5+ upvotes"
 */
import { Pool } from 'pg';
import { 
  AchievementCriteria,
  AchievementTrigger
} from '../../../../models/achievement';
import { RuleEvaluator } from '../engine';
import { logger } from '../../../../lib/logger';

export class QualityRule implements RuleEvaluator {
  constructor(private db: Pool) {}
  
  /**
   * Evaluate a quality-based criteria
   */
  async evaluate(
    userId: string,
    criteria: AchievementCriteria,
    eventType: AchievementTrigger,
    eventData: any
  ): Promise<boolean> {
    if (criteria.threshold === undefined) {
      logger.warn('Quality criteria missing threshold value', { criteria });
      return false;
    }
    
    try {
      // Get the number of quality items
      const qualityCount = await this.getQualityCount(userId, criteria, eventType);
      
      // Check if threshold is met
      return qualityCount >= criteria.threshold;
    } catch (error) {
      logger.error('Error evaluating quality criteria', { error, userId, criteria });
      return false;
    }
  }
  
  /**
   * Get the count of quality items based on criteria
   */
  private async getQualityCount(
    userId: string,
    criteria: AchievementCriteria,
    eventType: AchievementTrigger
  ): Promise<number> {
    try {
      // Determine what we're measuring based on event type and metadata
      const qualityType = criteria.metadata?.qualityType || this.getDefaultQualityType(eventType);
      
      // Get the required quality threshold (what makes an item "quality")
      const qualityThreshold = criteria.metadata?.qualityThreshold || 5;
      
      switch (qualityType) {
        case 'popular_posts':
          return this.getPopularPostsCount(userId, qualityThreshold, criteria);
          
        case 'popular_comments':
          return this.getPopularCommentsCount(userId, qualityThreshold, criteria);
          
        case 'high_point_earnings':
          return this.getHighPointEarningsCount(userId, qualityThreshold, criteria);
          
        default:
          logger.warn(`Unsupported quality type: ${qualityType}`);
          return 0;
      }
    } catch (error) {
      logger.error('Error getting quality count', { error, userId, criteria });
      return 0;
    }
  }
  
  /**
   * Get default quality type based on event type
   */
  private getDefaultQualityType(eventType: AchievementTrigger): string {
    switch (eventType) {
      case 'content.created':
        return 'popular_posts';
        
      case 'comment.created':
        return 'popular_comments';
        
      case 'points.awarded':
        return 'high_point_earnings';
        
      default:
        return 'popular_posts'; // Default to popular posts
    }
  }
  
  /**
   * Get count of posts with reaction count above threshold
   */
  private async getPopularPostsCount(
    userId: string, 
    qualityThreshold: number,
    criteria: AchievementCriteria
  ): Promise<number> {
    try {
      // Check if timeframe is specified (in days)
      const timeClause = criteria.timeframe 
        ? `AND c.created_at > NOW() - INTERVAL '${criteria.timeframe} days'` 
        : '';
      
      // Get specific reaction type to count, default to likes
      const reactionType = criteria.metadata?.reactionType || 'like';
      
      const query = `
        SELECT COUNT(*) as count
        FROM content c
        WHERE c.user_id = $1
        AND c.status = 'active'
        AND (
          SELECT COUNT(*) 
          FROM content_reactions cr 
          WHERE cr.content_id = c.id
          AND cr.reaction_type = $2
        ) >= $3
        ${timeClause}
      `;
      
      const result = await this.db.query<{ count: string }>(
        query, 
        [userId, reactionType, qualityThreshold]
      );
      
      return parseInt(result.rows[0].count, 10);
    } catch (error) {
      logger.error('Error getting popular posts count', { 
        error, 
        userId, 
        qualityThreshold 
      });
      return 0;
    }
  }
  
  /**
   * Get count of comments with reaction count above threshold
   */
  private async getPopularCommentsCount(
    userId: string, 
    qualityThreshold: number,
    criteria: AchievementCriteria
  ): Promise<number> {
    try {
      // Check if timeframe is specified (in days)
      const timeClause = criteria.timeframe 
        ? `AND cm.created_at > NOW() - INTERVAL '${criteria.timeframe} days'` 
        : '';
      
      // Get specific reaction type to count, default to likes
      const reactionType = criteria.metadata?.reactionType || 'like';
      
      const query = `
        SELECT COUNT(*) as count
        FROM comments cm
        WHERE cm.user_id = $1
        AND cm.status = 'active'
        AND (
          SELECT COUNT(*) 
          FROM comment_reactions cr 
          WHERE cr.comment_id = cm.id
          AND cr.reaction_type = $2
        ) >= $3
        ${timeClause}
      `;
      
      const result = await this.db.query<{ count: string }>(
        query, 
        [userId, reactionType, qualityThreshold]
      );
      
      return parseInt(result.rows[0].count, 10);
    } catch (error) {
      logger.error('Error getting popular comments count', { 
        error, 
        userId, 
        qualityThreshold 
      });
      return 0;
    }
  }
  
  /**
   * Get count of points transactions above threshold
   */
  private async getHighPointEarningsCount(
    userId: string, 
    qualityThreshold: number,
    criteria: AchievementCriteria
  ): Promise<number> {
    try {
      // Check if timeframe is specified (in days)
      const timeClause = criteria.timeframe 
        ? `AND created_at > NOW() - INTERVAL '${criteria.timeframe} days'` 
        : '';
      
      // Source filter if specified
      const sourceFilter = criteria.metadata?.source 
        ? `AND source = '${criteria.metadata.source}'` 
        : '';
      
      const query = `
        SELECT COUNT(*) as count
        FROM user_points
        WHERE user_id = $1
        AND amount >= $2
        ${timeClause}
        ${sourceFilter}
      `;
      
      const result = await this.db.query<{ count: string }>(
        query, 
        [userId, qualityThreshold]
      );
      
      return parseInt(result.rows[0].count, 10);
    } catch (error) {
      logger.error('Error getting high point earnings count', { 
        error, 
        userId, 
        qualityThreshold 
      });
      return 0;
    }
  }
  
  /**
   * Get progress for quality criteria
   */
  async getProgress(
    userId: string,
    criteria: AchievementCriteria
  ): Promise<{ current: number; target: number; complete: boolean }> {
    if (!criteria.threshold) {
      return { current: 0, target: 1, complete: false };
    }
    
    try {
      const current = await this.getQualityCount(userId, criteria, criteria.trigger);
      const target = criteria.threshold;
      
      return {
        current,
        target,
        complete: current >= target
      };
    } catch (error) {
      logger.error('Error getting quality criteria progress', { error, userId, criteria });
      return {
        current: 0,
        target: criteria.threshold,
        complete: false
      };
    }
  }
}
