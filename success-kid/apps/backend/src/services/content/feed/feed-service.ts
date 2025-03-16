/**
 * Feed Service
 * 
 * Handles generation and retrieval of content feeds
 */
import { Pool } from 'pg';
import { logger } from '../../../lib/logger';
import { ContentRepository } from '../../../repositories/content-repository';
import { CategoryRepository } from '../../../repositories/category-repository';
import { TagRepository } from '../../../repositories/tag-repository';
import { ContentListItem } from '../../../models/entities/content.model';

/**
 * Feed filter options
 */
export interface FeedFilterOptions {
  lastId?: string;
  lastCreatedAt?: Date;
  limit?: number;
  userId?: string;
  categoryId?: string;
  tagId?: string;
  contentType?: string;
  timeframe?: 'day' | 'week' | 'month' | 'year' | 'all';
}

/**
 * Feed type
 */
export type FeedType = 'latest' | 'trending' | 'popular' | 'featured' | 'discussed' | 'personal';

/**
 * Service for generating and retrieving content feeds
 */
export class FeedService {
  /**
   * Create a new FeedService
   * 
   * @param db Database connection pool
   * @param contentRepository Repository for content data
   * @param categoryRepository Repository for category data
   * @param tagRepository Repository for tag data
   */
  constructor(
    private db: Pool,
    private contentRepository: ContentRepository,
    private categoryRepository: CategoryRepository,
    private tagRepository: TagRepository
  ) {}

  /**
   * Get a content feed
   * 
   * @param feedType Type of feed to retrieve
   * @param options Feed filter options
   * @returns Array of content items
   */
  async getFeed(feedType: FeedType, options: FeedFilterOptions = {}): Promise<ContentListItem[]> {
    try {
      switch (feedType) {
        case 'latest':
          return await this.getLatestFeed(options);
        case 'trending':
          return await this.getTrendingFeed(options);
        case 'popular':
          return await this.getPopularFeed(options);
        case 'featured':
          return await this.getFeaturedFeed(options);
        case 'discussed':
          return await this.getDiscussedFeed(options);
        case 'personal':
          if (!options.userId) {
            throw new Error('User ID required for personal feed');
          }
          return await this.getPersonalFeed(options.userId, options);
        default:
          // Default to latest feed
          return await this.getLatestFeed(options);
      }
    } catch (error) {
      logger.error('Error getting feed', { error, feedType, options });
      throw error;
    }
  }

  /**
   * Get latest content feed
   * 
   * @param options Feed filter options
   * @returns Array of content items
   */
  async getLatestFeed(options: FeedFilterOptions = {}): Promise<ContentListItem[]> {
    try {
      // Convert options to content repository format
      const repoOptions = {
        lastId: options.lastId,
        lastCreatedAt: options.lastCreatedAt,
        limit: options.limit || 20,
        type: options.contentType,
        userId: options.userId,
        categoryId: options.categoryId
      };

      // Get content feed from repository
      return await this.contentRepository.getContentFeed(repoOptions);
    } catch (error) {
      logger.error('Error getting latest feed', { error, options });
      throw error;
    }
  }

  /**
   * Get trending content feed
   * 
   * @param options Feed filter options
   * @returns Array of content items
   */
  async getTrendingFeed(options: FeedFilterOptions = {}): Promise<ContentListItem[]> {
    try {
      // Calculate time range based on timeframe
      const timeRange = this.calculateTimeRange(options.timeframe || 'day');
      
      // Build query for trending content (recent with high engagement)
      const query = `
        SELECT 
          c.*,
          u.display_name as author_name,
          p.avatar_url as author_avatar,
          COUNT(DISTINCT r.user_id) as like_count,
          COUNT(DISTINCT cm.id) as comment_count,
          (COUNT(DISTINCT r.user_id) * 3 + COUNT(DISTINCT cm.id) * 5) as engagement_score
        FROM content c
        JOIN users u ON c.user_id = u.id
        LEFT JOIN profiles p ON u.id = p.user_id
        LEFT JOIN content_reactions r ON c.id = r.content_id
        LEFT JOIN comments cm ON c.id = cm.content_id
        WHERE c.status = 'active'
        AND c.created_at >= $1
      `;
      
      const params: any[] = [timeRange.start];
      let paramIndex = 2;
      
      // Apply filters
      let filterQuery = '';
      
      if (options.contentType) {
        filterQuery += ` AND c.type = $${paramIndex++}`;
        params.push(options.contentType);
      }
      
      if (options.categoryId) {
        filterQuery += ` AND c.category_id = $${paramIndex++}`;
        params.push(options.categoryId);
      }
      
      if (options.userId) {
        filterQuery += ` AND c.user_id = $${paramIndex++}`;
        params.push(options.userId);
      }
      
      if (options.tagId) {
        filterQuery += ` AND $${paramIndex++} = ANY(SELECT tag_id FROM content_tags WHERE content_id = c.id)`;
        params.push(options.tagId);
      }
      
      // Complete query with grouping and sorting
      const fullQuery = `
        ${query}${filterQuery}
        GROUP BY c.id, u.display_name, p.avatar_url
        ORDER BY engagement_score DESC, c.created_at DESC
        LIMIT $${paramIndex++}
      `;
      
      params.push(options.limit || 20);
      
      const result = await this.db.query(fullQuery, params);
      
      // Map to content list items
      return result.rows.map(row => ({
        id: row.id,
        user_id: row.user_id,
        type: row.type,
        content_text: row.content_text,
        media_urls: row.media_urls || [],
        created_at: row.created_at,
        status: row.status,
        
        // Author information
        author: {
          id: row.user_id,
          display_name: row.author_name,
          avatar_url: row.author_avatar
        },
        
        // Stats
        stats: {
          likes: parseInt(row.like_count || '0'),
          comments: parseInt(row.comment_count || '0'),
          shares: 0 // Will implement later
        }
      }));
    } catch (error) {
      logger.error('Error getting trending feed', { error, options });
      throw error;
    }
  }

  /**
   * Get popular content feed
   * 
   * @param options Feed filter options
   * @returns Array of content items
   */
  async getPopularFeed(options: FeedFilterOptions = {}): Promise<ContentListItem[]> {
    try {
      // Calculate time range based on timeframe
      const timeRange = this.calculateTimeRange(options.timeframe || 'week');
      
      // Build query for popular content (most reactions)
      const query = `
        SELECT 
          c.*,
          u.display_name as author_name,
          p.avatar_url as author_avatar,
          COUNT(DISTINCT r.user_id) as like_count,
          COUNT(DISTINCT cm.id) as comment_count
        FROM content c
        JOIN users u ON c.user_id = u.id
        LEFT JOIN profiles p ON u.id = p.user_id
        LEFT JOIN content_reactions r ON c.id = r.content_id
        LEFT JOIN comments cm ON c.id = cm.content_id
        WHERE c.status = 'active'
        AND c.created_at >= $1
      `;
      
      const params: any[] = [timeRange.start];
      let paramIndex = 2;
      
      // Apply filters
      let filterQuery = '';
      
      if (options.contentType) {
        filterQuery += ` AND c.type = $${paramIndex++}`;
        params.push(options.contentType);
      }
      
      if (options.categoryId) {
        filterQuery += ` AND c.category_id = $${paramIndex++}`;
        params.push(options.categoryId);
      }
      
      if (options.userId) {
        filterQuery += ` AND c.user_id = $${paramIndex++}`;
        params.push(options.userId);
      }
      
      if (options.tagId) {
        filterQuery += ` AND $${paramIndex++} = ANY(SELECT tag_id FROM content_tags WHERE content_id = c.id)`;
        params.push(options.tagId);
      }
      
      // Complete query with grouping and sorting
      const fullQuery = `
        ${query}${filterQuery}
        GROUP BY c.id, u.display_name, p.avatar_url
        ORDER BY like_count DESC, comment_count DESC, c.created_at DESC
        LIMIT $${paramIndex++}
      `;
      
      params.push(options.limit || 20);
      
      const result = await this.db.query(fullQuery, params);
      
      // Map to content list items
      return result.rows.map(row => ({
        id: row.id,
        user_id: row.user_id,
        type: row.type,
        content_text: row.content_text,
        media_urls: row.media_urls || [],
        created_at: row.created_at,
        status: row.status,
        
        // Author information
        author: {
          id: row.user_id,
          display_name: row.author_name,
          avatar_url: row.author_avatar
        },
        
        // Stats
        stats: {
          likes: parseInt(row.like_count || '0'),
          comments: parseInt(row.comment_count || '0'),
          shares: 0 // Will implement later
        }
      }));
    } catch (error) {
      logger.error('Error getting popular feed', { error, options });
      throw error;
    }
  }

  /**
   * Get featured content feed
   * 
   * @param options Feed filter options
   * @returns Array of content items
   */
  async getFeaturedFeed(options: FeedFilterOptions = {}): Promise<ContentListItem[]> {
    try {
      // Featured content would typically be selected by moderators or staff
      // For now, this can be implemented as a special flag in the content metadata
      
      // Build query for featured content
      const query = `
        SELECT 
          c.*,
          u.display_name as author_name,
          p.avatar_url as author_avatar,
          (SELECT COUNT(*) FROM content_reactions WHERE content_id = c.id) as like_count,
          (SELECT COUNT(*) FROM comments WHERE content_id = c.id) as comment_count
        FROM content c
        JOIN users u ON c.user_id = u.id
        LEFT JOIN profiles p ON u.id = p.user_id
        WHERE c.status = 'active'
        AND (c.metadata->>'featured')::boolean = true
      `;
      
      const params: any[] = [];
      let paramIndex = 1;
      
      // Apply filters
      let filterQuery = '';
      
      if (options.contentType) {
        filterQuery += ` AND c.type = $${paramIndex++}`;
        params.push(options.contentType);
      }
      
      if (options.categoryId) {
        filterQuery += ` AND c.category_id = $${paramIndex++}`;
        params.push(options.categoryId);
      }
      
      if (options.tagId) {
        filterQuery += ` AND $${paramIndex++} = ANY(SELECT tag_id FROM content_tags WHERE content_id = c.id)`;
        params.push(options.tagId);
      }
      
      // Complete query with sorting
      const fullQuery = `
        ${query}${filterQuery}
        ORDER BY c.created_at DESC
        LIMIT $${paramIndex++}
      `;
      
      params.push(options.limit || 20);
      
      const result = await this.db.query(fullQuery, params);
      
      // Map to content list items
      return result.rows.map(row => ({
        id: row.id,
        user_id: row.user_id,
        type: row.type,
        content_text: row.content_text,
        media_urls: row.media_urls || [],
        created_at: row.created_at,
        status: row.status,
        
        // Author information
        author: {
          id: row.user_id,
          display_name: row.author_name,
          avatar_url: row.author_avatar
        },
        
        // Stats
        stats: {
          likes: parseInt(row.like_count || '0'),
          comments: parseInt(row.comment_count || '0'),
          shares: 0 // Will implement later
        }
      }));
    } catch (error) {
      logger.error('Error getting featured feed', { error, options });
      throw error;
    }
  }

  /**
   * Get most discussed content feed
   * 
   * @param options Feed filter options
   * @returns Array of content items
   */
  async getDiscussedFeed(options: FeedFilterOptions = {}): Promise<ContentListItem[]> {
    try {
      // Calculate time range based on timeframe
      const timeRange = this.calculateTimeRange(options.timeframe || 'week');
      
      // Build query for most discussed content (most comments)
      const query = `
        SELECT 
          c.*,
          u.display_name as author_name,
          p.avatar_url as author_avatar,
          COUNT(DISTINCT cm.id) as comment_count,
          COUNT(DISTINCT r.user_id) as like_count
        FROM content c
        JOIN users u ON c.user_id = u.id
        LEFT JOIN profiles p ON u.id = p.user_id
        LEFT JOIN comments cm ON c.id = cm.content_id
        LEFT JOIN content_reactions r ON c.id = r.content_id
        WHERE c.status = 'active'
        AND c.created_at >= $1
      `;
      
      const params: any[] = [timeRange.start];
      let paramIndex = 2;
      
      // Apply filters
      let filterQuery = '';
      
      if (options.contentType) {
        filterQuery += ` AND c.type = $${paramIndex++}`;
        params.push(options.contentType);
      }
      
      if (options.categoryId) {
        filterQuery += ` AND c.category_id = $${paramIndex++}`;
        params.push(options.categoryId);
      }
      
      if (options.userId) {
        filterQuery += ` AND c.user_id = $${paramIndex++}`;
        params.push(options.userId);
      }
      
      if (options.tagId) {
        filterQuery += ` AND $${paramIndex++} = ANY(SELECT tag_id FROM content_tags WHERE content_id = c.id)`;
        params.push(options.tagId);
      }
      
      // Complete query with grouping and sorting
      const fullQuery = `
        ${query}${filterQuery}
        GROUP BY c.id, u.display_name, p.avatar_url
        HAVING COUNT(DISTINCT cm.id) > 0
        ORDER BY comment_count DESC, c.created_at DESC
        LIMIT $${paramIndex++}
      `;
      
      params.push(options.limit || 20);
      
      const result = await this.db.query(fullQuery, params);
      
      // Map to content list items
      return result.rows.map(row => ({
        id: row.id,
        user_id: row.user_id,
        type: row.type,
        content_text: row.content_text,
        media_urls: row.media_urls || [],
        created_at: row.created_at,
        status: row.status,
        
        // Author information
        author: {
          id: row.user_id,
          display_name: row.author_name,
          avatar_url: row.author_avatar
        },
        
        // Stats
        stats: {
          likes: parseInt(row.like_count || '0'),
          comments: parseInt(row.comment_count || '0'),
          shares: 0 // Will implement later
        }
      }));
    } catch (error) {
      logger.error('Error getting discussed feed', { error, options });
      throw error;
    }
  }

  /**
   * Get personalized content feed for a user
   * 
   * @param userId User ID
   * @param options Feed filter options
   * @returns Array of content items
   */
  async getPersonalFeed(userId: string, options: FeedFilterOptions = {}): Promise<ContentListItem[]> {
    try {
      // This is a simplified personalization implementation
      // A more advanced version would use user preferences, behavior, and interests
      
      // Get user's followed creators and interactions
      
      // Build query for personalized content
      const query = `
        WITH user_interactions AS (
          -- Contents the user has interacted with
          SELECT DISTINCT content_id
          FROM (
            SELECT content_id FROM comments WHERE user_id = $1
            UNION
            SELECT content_id FROM content_reactions WHERE user_id = $1
          ) as interactions
        ),
        user_categories AS (
          -- Categories of content the user has interacted with
          SELECT DISTINCT c.category_id
          FROM content c
          JOIN user_interactions ui ON c.id = ui.content_id
          WHERE c.category_id IS NOT NULL
        ),
        user_tags AS (
          -- Tags of content the user has interacted with
          SELECT DISTINCT ct.tag_id
          FROM content_tags ct
          JOIN user_interactions ui ON ct.content_id = ui.content_id
        )
        
        SELECT 
          c.*,
          u.display_name as author_name,
          p.avatar_url as author_avatar,
          (SELECT COUNT(*) FROM content_reactions WHERE content_id = c.id) as like_count,
          (SELECT COUNT(*) FROM comments WHERE content_id = c.id) as comment_count,
          -- Calculate personalization score
          (CASE
            -- Boost content in categories user interacted with
            WHEN c.category_id IN (SELECT category_id FROM user_categories) THEN 50
            ELSE 0
          END +
          -- Boost content from creators user interacted with
          CASE
            WHEN c.user_id IN (
              SELECT DISTINCT c2.user_id 
              FROM content c2 
              JOIN user_interactions ui ON c2.id = ui.content_id
              WHERE c2.user_id != $1
            ) THEN 30
            ELSE 0
          END) as personalization_score
        FROM content c
        JOIN users u ON c.user_id = u.id
        LEFT JOIN profiles p ON u.id = p.user_id
        WHERE c.status = 'active'
        AND c.user_id != $1 -- Exclude user's own content
        AND c.id NOT IN (SELECT content_id FROM user_interactions) -- Exclude already interacted content
      `;
      
      const params: any[] = [userId];
      let paramIndex = 2;
      
      // Apply filters
      let filterQuery = '';
      
      if (options.contentType) {
        filterQuery += ` AND c.type = $${paramIndex++}`;
        params.push(options.contentType);
      }
      
      if (options.categoryId) {
        filterQuery += ` AND c.category_id = $${paramIndex++}`;
        params.push(options.categoryId);
      }
      
      // Complete query with sorting and limit
      const fullQuery = `
        ${query}${filterQuery}
        ORDER BY personalization_score DESC, c.created_at DESC
        LIMIT $${paramIndex++}
      `;
      
      params.push(options.limit || 20);
      
      const result = await this.db.query(fullQuery, params);
      
      // If there are not enough personalized results, fill with trending content
      let personalizedContent = result.rows.map(row => ({
        id: row.id,
        user_id: row.user_id,
        type: row.type,
        content_text: row.content_text,
        media_urls: row.media_urls || [],
        created_at: row.created_at,
        status: row.status,
        
        // Author information
        author: {
          id: row.user_id,
          display_name: row.author_name,
          avatar_url: row.author_avatar
        },
        
        // Stats
        stats: {
          likes: parseInt(row.like_count || '0'),
          comments: parseInt(row.comment_count || '0'),
          shares: 0
        }
      }));
      
      // If we don't have enough personalized content, supplement with trending content
      if (personalizedContent.length < (options.limit || 20)) {
        const trendingOptions = { ...options, limit: (options.limit || 20) - personalizedContent.length };
        const trendingContent = await this.getTrendingFeed(trendingOptions);
        
        // Filter out any duplicates
        const existingIds = new Set(personalizedContent.map(item => item.id));
        const additionalContent = trendingContent.filter(item => !existingIds.has(item.id));
        
        personalizedContent = [...personalizedContent, ...additionalContent];
      }
      
      return personalizedContent;
    } catch (error) {
      logger.error('Error getting personal feed', { error, userId, options });
      throw error;
    }
  }

  /**
   * Calculate time range based on timeframe
   * 
   * @param timeframe Timeframe to calculate range for
   * @returns Start and end dates
   */
  private calculateTimeRange(timeframe: string): { start: Date; end: Date } {
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
      default:
        start.setDate(end.getDate() - 1); // Default to last 24 hours
    }
    
    return { start, end };
  }
}
