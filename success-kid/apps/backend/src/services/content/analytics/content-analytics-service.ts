/**
 * Content Analytics Service
 * 
 * Handles tracking and analysis of content engagement
 */
import { Pool } from 'pg';
import { Redis } from 'ioredis';
import { logger } from '../../../lib/logger';
import { ContentRepository } from '../../../repositories/content-repository';
import { CommentRepository } from '../../../repositories/comment-repository';

/**
 * Timeframe for analytics
 */
export type TimeFrame = 'day' | 'week' | 'month' | 'year' | 'all';

/**
 * Content metrics interface
 */
export interface ContentMetrics {
  contentId: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  engagementRate: number;
  trends: {
    views: { date: string; count: number }[];
    likes: { date: string; count: number }[];
    comments: { date: string; count: number }[];
  };
}

/**
 * User engagement metrics interface
 */
export interface UserEngagementMetrics {
  userId: string;
  contentCreated: number;
  commentsReceived: number;
  likesReceived: number;
  commentsGiven: number;
  likesGiven: number;
  totalEngagement: number;
  mostEngagedContent: { contentId: string; engagement: number }[];
}

/**
 * View tracking options
 */
export interface ViewTrackingOptions {
  contentId: string;
  userId?: string;
  sessionId?: string;
  sourceType?: string;
  referrer?: string;
}

/**
 * Trending topic interface
 */
export interface TrendingTopic {
  name: string;
  count: number;
  trend: number; // Percentage change
}

/**
 * Service for content analytics
 */
export class ContentAnalyticsService {
  /**
   * Create a new ContentAnalyticsService
   * 
   * @param db Database connection pool
   * @param redis Redis client for caching and rate limiting
   * @param contentRepository Repository for content data
   * @param commentRepository Repository for comment data
   */
  constructor(
    private db: Pool,
    private redis: Redis,
    private contentRepository: ContentRepository,
    private commentRepository: CommentRepository
  ) {}

  /**
   * Track a content view
   * 
   * @param options View tracking options
   * @returns Success status
   */
  async trackView(options: ViewTrackingOptions): Promise<boolean> {
    try {
      // Create view ID for idempotency
      const viewId = options.userId 
        ? `${options.contentId}:${options.userId}` 
        : `${options.contentId}:${options.sessionId || this.generateAnonymousId()}`;
      
      // Check if this view was already recorded recently (debounce)
      const viewKey = `view:${viewId}`;
      const alreadyViewed = await this.redis.exists(viewKey);
      
      if (alreadyViewed) {
        // View already recorded recently, skip
        return false;
      }
      
      // Set view record with 30-minute expiry (debounce period)
      await this.redis.set(viewKey, '1', 'EX', 1800);
      
      // Increment view count in Redis
      await this.redis.hincrby(`content:${options.contentId}:stats`, 'views', 1);
      
      // Record view in database for permanent storage and analytics
      // This could be done asynchronously or batched for performance
      const query = `
        INSERT INTO content_views (
          content_id, 
          user_id, 
          session_id, 
          source_type, 
          referrer, 
          viewed_at
        ) VALUES ($1, $2, $3, $4, $5, NOW())
      `;
      
      await this.db.query(query, [
        options.contentId,
        options.userId || null,
        options.sessionId || null,
        options.sourceType || null,
        options.referrer || null
      ]);
      
      return true;
    } catch (error) {
      logger.error('Error tracking content view', { error, options });
      // Don't throw error to avoid disrupting user experience
      return false;
    }
  }

  /**
   * Get content metrics
   * 
   * @param contentId Content ID
   * @param timeframe Timeframe for metrics
   * @returns Content metrics
   */
  async getContentMetrics(contentId: string, timeframe: TimeFrame = 'all'): Promise<ContentMetrics> {
    try {
      // Get content first to ensure it exists
      const content = await this.contentRepository.findById(contentId);
      if (!content) {
        throw new Error(`Content ${contentId} not found`);
      }

      // Calculate timeframe start date
      const { start } = this.calculateTimeRange(timeframe);
      
      // Get aggregated metrics
      const metricsQuery = `
        SELECT
          (SELECT COUNT(*) FROM content_views WHERE content_id = $1 AND viewed_at >= $2) as view_count,
          (SELECT COUNT(*) FROM content_reactions WHERE content_id = $1 AND created_at >= $2) as like_count,
          (SELECT COUNT(*) FROM comments WHERE content_id = $1 AND created_at >= $2) as comment_count,
          (SELECT COUNT(*) FROM content_shares WHERE content_id = $1 AND created_at >= $2) as share_count
      `;
      
      const metricsResult = await this.db.query(metricsQuery, [contentId, start]);
      const metrics = metricsResult.rows[0];
      
      // Get trend data (by day for the timeframe)
      const trendQuery = `
        -- Views by day
        SELECT 
          DATE_TRUNC('day', viewed_at) as date, 
          COUNT(*) as count
        FROM content_views
        WHERE content_id = $1 AND viewed_at >= $2
        GROUP BY DATE_TRUNC('day', viewed_at)
        ORDER BY date ASC;
        
        -- Likes by day
        SELECT 
          DATE_TRUNC('day', created_at) as date, 
          COUNT(*) as count
        FROM content_reactions
        WHERE content_id = $1 AND created_at >= $2
        GROUP BY DATE_TRUNC('day', created_at)
        ORDER BY date ASC;
        
        -- Comments by day
        SELECT 
          DATE_TRUNC('day', created_at) as date, 
          COUNT(*) as count
        FROM comments
        WHERE content_id = $1 AND created_at >= $2
        GROUP BY DATE_TRUNC('day', created_at)
        ORDER BY date ASC;
      `;
      
      const trendResult = await this.db.query(trendQuery, [contentId, start]);
      
      // Calculate engagement rate
      // Formula: (likes + comments + shares) / views * 100
      const totalEngagements = 
        parseInt(metrics.like_count || '0') + 
        parseInt(metrics.comment_count || '0') + 
        parseInt(metrics.share_count || '0');
      
      const viewCount = parseInt(metrics.view_count || '0');
      const engagementRate = viewCount > 0 ? (totalEngagements / viewCount) * 100 : 0;
      
      return {
        contentId,
        viewCount: parseInt(metrics.view_count || '0'),
        likeCount: parseInt(metrics.like_count || '0'),
        commentCount: parseInt(metrics.comment_count || '0'),
        shareCount: parseInt(metrics.share_count || '0'),
        engagementRate,
        trends: {
          views: trendResult[0].rows.map(row => ({
            date: row.date.toISOString().split('T')[0],
            count: parseInt(row.count)
          })),
          likes: trendResult[1].rows.map(row => ({
            date: row.date.toISOString().split('T')[0],
            count: parseInt(row.count)
          })),
          comments: trendResult[2].rows.map(row => ({
            date: row.date.toISOString().split('T')[0],
            count: parseInt(row.count)
          }))
        }
      };
    } catch (error) {
      logger.error('Error getting content metrics', { error, contentId, timeframe });
      throw error;
    }
  }

  /**
   * Get user engagement metrics
   * 
   * @param userId User ID
   * @param timeframe Timeframe for metrics
   * @returns User engagement metrics
   */
  async getUserEngagementMetrics(userId: string, timeframe: TimeFrame = 'month'): Promise<UserEngagementMetrics> {
    try {
      // Calculate timeframe start date
      const { start } = this.calculateTimeRange(timeframe);
      
      // Get aggregated user metrics
      const metricsQuery = `
        SELECT
          (SELECT COUNT(*) FROM content WHERE user_id = $1 AND created_at >= $2) as content_created,
          (SELECT COUNT(*) FROM comments WHERE content_id IN (SELECT id FROM content WHERE user_id = $1) AND created_at >= $2) as comments_received,
          (SELECT COUNT(*) FROM content_reactions WHERE content_id IN (SELECT id FROM content WHERE user_id = $1) AND created_at >= $2) as likes_received,
          (SELECT COUNT(*) FROM comments WHERE user_id = $1 AND created_at >= $2) as comments_given,
          (SELECT COUNT(*) FROM content_reactions WHERE user_id = $1 AND created_at >= $2) as likes_given
      `;
      
      const metricsResult = await this.db.query(metricsQuery, [userId, start]);
      const metrics = metricsResult.rows[0];
      
      // Get most engaged content from this user
      const engagedContentQuery = `
        SELECT 
          c.id as content_id,
          COUNT(DISTINCT r.user_id) + COUNT(DISTINCT cm.id) as engagement
        FROM content c
        LEFT JOIN content_reactions r ON c.id = r.content_id
        LEFT JOIN comments cm ON c.id = cm.content_id
        WHERE c.user_id = $1
        AND c.created_at >= $2
        GROUP BY c.id
        ORDER BY engagement DESC
        LIMIT 5
      `;
      
      const engagedContentResult = await this.db.query(engagedContentQuery, [userId, start]);
      
      // Calculate total engagement
      const totalEngagement = 
        parseInt(metrics.comments_received || '0') + 
        parseInt(metrics.likes_received || '0') + 
        parseInt(metrics.comments_given || '0') + 
        parseInt(metrics.likes_given || '0');
      
      return {
        userId,
        contentCreated: parseInt(metrics.content_created || '0'),
        commentsReceived: parseInt(metrics.comments_received || '0'),
        likesReceived: parseInt(metrics.likes_received || '0'),
        commentsGiven: parseInt(metrics.comments_given || '0'),
        likesGiven: parseInt(metrics.likes_given || '0'),
        totalEngagement,
        mostEngagedContent: engagedContentResult.rows.map(row => ({
          contentId: row.content_id,
          engagement: parseInt(row.engagement)
        }))
      };
    } catch (error) {
      logger.error('Error getting user engagement metrics', { error, userId, timeframe });
      throw error;
    }
  }

  /**
   * Get trending topics
   * 
   * @param timeframe Timeframe for trends
   * @param limit Maximum number of topics to return
   * @returns Array of trending topics
   */
  async getTrendingTopics(timeframe: TimeFrame = 'day', limit: number = 10): Promise<TrendingTopic[]> {
    try {
      // Calculate current and previous timeframe
      const currentRange = this.calculateTimeRange(timeframe);
      const previousRange = this.calculatePreviousTimeRange(timeframe);
      
      // Calculate trending topic frequencies
      const query = `
        -- Current period topics
        WITH current_topics AS (
          SELECT 
            tag_name, 
            COUNT(*) as count
          FROM (
            SELECT 
              UNNEST(tags) as tag_name
            FROM content 
            WHERE created_at BETWEEN $1 AND $2
            AND array_length(tags, 1) > 0
          ) t
          GROUP BY tag_name
          ORDER BY count DESC
          LIMIT $4
        ),
        -- Previous period topics
        previous_topics AS (
          SELECT 
            tag_name, 
            COUNT(*) as count
          FROM (
            SELECT 
              UNNEST(tags) as tag_name
            FROM content 
            WHERE created_at BETWEEN $3 AND $1
            AND array_length(tags, 1) > 0
          ) t
          GROUP BY tag_name
        )
        
        -- Join to calculate trends
        SELECT 
          c.tag_name as name,
          c.count,
          CASE 
            WHEN p.count IS NULL OR p.count = 0 THEN 100
            ELSE ((c.count - p.count) / p.count::float) * 100
          END as trend
        FROM current_topics c
        LEFT JOIN previous_topics p ON c.tag_name = p.tag_name
        ORDER BY c.count DESC, trend DESC
      `;
      
      const result = await this.db.query(query, [
        currentRange.start,
        currentRange.end,
        previousRange.start,
        limit
      ]);
      
      return result.rows.map(row => ({
        name: row.name,
        count: parseInt(row.count),
        trend: parseFloat(row.trend)
      }));
    } catch (error) {
      logger.error('Error getting trending topics', { error, timeframe, limit });
      throw error;
    }
  }

  /**
   * Generate an anonymous ID for tracking
   * 
   * @returns Random ID
   */
  private generateAnonymousId(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }

  /**
   * Calculate time range based on timeframe
   * 
   * @param timeframe Timeframe to calculate range for
   * @returns Start and end dates
   */
  private calculateTimeRange(timeframe: TimeFrame): { start: Date; end: Date } {
    const end = new Date();
    let start = new Date();
    
    switch (timeframe) {
      case 'day':
        start.setDate(end.getDate() - 1);
        break;
      case 'week':
        start.setDate(end.getDate() - 7);
        break;
      case 'month':
        start.setMonth(end.getMonth() - 1);
        break;
      case 'year':
        start.setFullYear(end.getFullYear() - 1);
        break;
      case 'all':
        start = new Date(0); // Beginning of time
        break;
    }
    
    return { start, end };
  }

  /**
   * Calculate previous time range based on timeframe
   * 
   * @param timeframe Timeframe to calculate range for
   * @returns Start and end dates for previous period
   */
  private calculatePreviousTimeRange(timeframe: TimeFrame): { start: Date; end: Date } {
    const currentRange = this.calculateTimeRange(timeframe);
    const end = new Date(currentRange.start);
    let start = new Date(end);
    
    // Previous period is same duration as current period
    const duration = currentRange.end.getTime() - currentRange.start.getTime();
    start = new Date(end.getTime() - duration);
    
    return { start, end };
  }
}
