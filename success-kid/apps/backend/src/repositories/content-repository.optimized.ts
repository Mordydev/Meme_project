/**
 * Optimized Content Repository
 * 
 * Handles data access for content with optimized query patterns
 */
import { Pool } from 'pg';
import { BaseRepository } from './base-repository';
import { Content, CreateContentDto, UpdateContentDto } from '../models/content';
import { logger } from '../lib/logger';

export interface ContentFeedOptions {
  limit?: number;
  offset?: number;
  lastId?: string;
  type?: string;
  status?: string;
  userId?: string;
  categoryId?: string;
  tags?: string[];
  sortBy?: 'recent' | 'popular' | 'trending';
  timeframe?: 'day' | 'week' | 'month' | 'all';
}

export class ContentRepository extends BaseRepository<Content> {
  constructor(db: Pool) {
    super(db, 'content', 'id');
  }
  
  /**
   * Create new content
   */
  async createContent(input: CreateContentDto): Promise<Content> {
    try {
      const { user_id, type, content_text, media_urls } = input;

      // Process media_urls to ensure it's stored as JSONB
      const mediaUrlsJson = media_urls ? JSON.stringify(media_urls) : '[]';
      
      const query = `
        INSERT INTO content 
        (id, user_id, type, content_text, media_urls, created_at, updated_at, status)
        VALUES (uuid_generate_v4(), $1, $2, $3, $4, NOW(), NOW(), 'active')
        RETURNING *
      `;
      
      const result = await this.db.query<Content>(query, [
        user_id, 
        type, 
        content_text, 
        mediaUrlsJson
      ]);
      
      return result.rows[0];
    } catch (error) {
      logger.error('Error creating content', { error, input });
      throw error;
    }
  }
  
  /**
   * Get content feed with optimized pagination using keyset pagination
   * for better performance under load
   */
  async getContentFeed(options: ContentFeedOptions = {}): Promise<Content[]> {
    try {
      const { 
        limit = 20, 
        lastId, 
        type, 
        status = 'active', 
        userId, 
        categoryId,
        tags,
        sortBy = 'recent',
        timeframe = 'all'
      } = options;
      
      // Calculate time range for queries
      let timeInterval: string;
      switch (timeframe) {
        case 'day': timeInterval = '1 day'; break;
        case 'week': timeInterval = '7 days'; break;
        case 'month': timeInterval = '30 days'; break;
        case 'all':
        default: timeInterval = '365 days'; break; // Default to a year for 'all'
      }

      // Initialize query parameters
      const queryParams: any[] = [status];
      let paramIndex = 2;

      // Build optimized query using CTE approach
      let query = `
        WITH feed_data AS (
          SELECT 
            c.*,
            u.display_name as author_name,
            p.avatar_url as author_avatar,
            COALESCE((
              SELECT COUNT(*) FROM comments 
              WHERE content_id = c.id AND status = 'active'
            ), 0) as comment_count,
            COALESCE((
              SELECT COUNT(*) FROM content_reactions 
              WHERE content_id = c.id
            ), 0) as reaction_count
      `;
      
      // Trending score only needed for trending sort
      if (sortBy === 'trending') {
        query += `,
          (
            COALESCE((
              SELECT COUNT(*) FROM content_reactions 
              WHERE content_id = c.id AND created_at > NOW() - INTERVAL $${paramIndex}
            ), 0) * 1.0 +
            COALESCE((
              SELECT COUNT(*) FROM comments 
              WHERE content_id = c.id AND status = 'active' AND created_at > NOW() - INTERVAL $${paramIndex}
            ), 0) * 3.0
          ) as trending_score
        `;
        queryParams.push(timeInterval);
        paramIndex++;
      }
      
      query += `
          FROM content c
          JOIN users u ON c.user_id = u.id
          LEFT JOIN profiles p ON c.user_id = p.user_id
          WHERE c.status = $1
      `;
      
      // Add filters with parameter placeholders
      if (type) {
        query += ` AND c.type = $${paramIndex}`;
        queryParams.push(type);
        paramIndex++;
      }
      
      if (userId) {
        query += ` AND c.user_id = $${paramIndex}`;
        queryParams.push(userId);
        paramIndex++;
      }
      
      if (categoryId) {
        query += ` AND c.category_id = $${paramIndex}`;
        queryParams.push(categoryId);
        paramIndex++;
      }
      
      // Filter by time range for trending/popular
      if (sortBy === 'trending' || sortBy === 'popular') {
        query += ` AND c.created_at > NOW() - INTERVAL $${paramIndex}`;
        queryParams.push(timeInterval);
        paramIndex++;
      }
      
      // Implement keyset pagination using created_at and id for better performance
      // This is more efficient than OFFSET-based pagination
      if (lastId) {
        query += `
          AND (c.created_at, c.id) < (
            SELECT created_at, id FROM content WHERE id = $${paramIndex}
          )
        `;
        queryParams.push(lastId);
        paramIndex++;
      }
      
      // Close CTE
      query += `) `;
      
      // Main query selection with tag filtering if needed
      if (tags && tags.length > 0) {
        query += `
          SELECT fd.* FROM feed_data fd
          JOIN (
            SELECT 
              ct.content_id, 
              COUNT(DISTINCT ct.tag_id) AS tag_match_count
            FROM content_tags ct
            WHERE ct.tag_id IN (${tags.map((_, i) => `$${paramIndex + i}`).join(', ')})
            GROUP BY ct.content_id
            HAVING COUNT(DISTINCT ct.tag_id) = $${paramIndex + tags.length}
          ) tm ON fd.id = tm.content_id
        `;
        queryParams.push(...tags);
        paramIndex += tags.length + 1;
      } else {
        query += `SELECT * FROM feed_data fd`;
      }
      
      // Sorting based on chosen sort type
      switch (sortBy) {
        case 'popular':
          query += ` ORDER BY (fd.comment_count + fd.reaction_count) DESC, fd.created_at DESC, fd.id DESC`;
          break;
        case 'trending':
          query += ` ORDER BY fd.trending_score DESC, fd.created_at DESC, fd.id DESC`;
          break;
        case 'recent':
        default:
          query += ` ORDER BY fd.created_at DESC, fd.id DESC`;
          break;
      }
      
      // Add limit
      query += ` LIMIT $${paramIndex}`;
      queryParams.push(limit);
      
      // Execute the optimized query
      const result = await this.db.query(query, queryParams);
      return result.rows;
    } catch (error) {
      logger.error('Error getting content feed', { error, options });
      throw error;
    }
  }
  
  /**
   * Get content with comments and reactions, using multiple efficient queries
   * instead of one complex query
   */
  async getContentWithDetails(id: string): Promise<any> {
    try {
      // Use a transaction to ensure data consistency across queries
      const client = await this.db.connect();
      
      try {
        await client.query('BEGIN');
        
        // Get content with basic information
        const contentQuery = `
          SELECT 
            c.*,
            u.display_name as author_name,
            p.avatar_url as author_avatar
          FROM content c
          JOIN users u ON c.user_id = u.id
          LEFT JOIN profiles p ON c.user_id = p.user_id
          WHERE c.id = $1
        `;
        
        const contentResult = await client.query(contentQuery, [id]);
        
        if (contentResult.rows.length === 0) {
          await client.query('COMMIT');
          return null;
        }
        
        const content = contentResult.rows[0];
        
        // Get comments with author information
        const commentsQuery = `
          SELECT 
            c.*,
            u.display_name as author_name,
            p.avatar_url as author_avatar
          FROM comments c
          JOIN users u ON c.user_id = u.id
          LEFT JOIN profiles p ON c.user_id = p.user_id
          WHERE c.content_id = $1 AND c.status = 'active'
          ORDER BY 
            CASE WHEN c.parent_id IS NULL THEN 0 ELSE 1 END,
            CASE WHEN c.parent_id IS NULL THEN c.created_at END DESC,
            CASE WHEN c.parent_id IS NOT NULL THEN c.created_at END ASC
        `;
        
        const commentsResult = await client.query(commentsQuery, [id]);
        
        // Get reaction counts efficiently using aggregation
        const reactionsQuery = `
          SELECT reaction_type, COUNT(*) as count
          FROM content_reactions
          WHERE content_id = $1
          GROUP BY reaction_type
        `;
        
        const reactionsResult = await client.query(reactionsQuery, [id]);
        
        // Get tags for the content
        const tagsQuery = `
          SELECT t.id, t.name
          FROM tags t
          JOIN content_tags ct ON t.id = ct.tag_id
          WHERE ct.content_id = $1
        `;
        
        const tagsResult = await client.query(tagsQuery, [id]);
        
        // Process reaction counts
        const reactions = {};
        reactionsResult.rows.forEach(row => {
          reactions[row.reaction_type] = parseInt(row.count, 10);
        });
        
        // Build threaded comments
        const commentMap = new Map();
        const topLevelComments = [];
        
        commentsResult.rows.forEach(comment => {
          // Store all comments in map for quick lookup
          commentMap.set(comment.id, {
            ...comment,
            replies: []
          });
          
          // Organize comments into threaded structure
          if (!comment.parent_id) {
            topLevelComments.push(commentMap.get(comment.id));
          } else if (commentMap.has(comment.parent_id)) {
            commentMap.get(comment.parent_id).replies.push(commentMap.get(comment.id));
          }
        });
        
        await client.query('COMMIT');
        
        // Return comprehensive content object
        return {
          ...content,
          comments: topLevelComments,
          reactions,
          comment_count: commentsResult.rowCount,
          tags: tagsResult.rows
        };
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      logger.error('Error getting content with details', { error, contentId: id });
      throw error;
    }
  }
  
  /**
   * Update content with optimized query
   */
  async updateContent(id: string, input: UpdateContentDto): Promise<Content | null> {
    try {
      const updates = [];
      const values = [];
      let paramIndex = 1;
      
      // Build dynamic SET clause
      if (input.content_text !== undefined) {
        updates.push(`content_text = $${paramIndex++}`);
        values.push(input.content_text);
      }
      
      if (input.media_urls !== undefined) {
        updates.push(`media_urls = $${paramIndex++}`);
        values.push(JSON.stringify(input.media_urls));
      }
      
      if (input.status !== undefined) {
        updates.push(`status = $${paramIndex++}`);
        values.push(input.status);
      }
      
      // Always update the updated_at timestamp
      updates.push(`updated_at = NOW()`);
      
      if (updates.length === 0) {
        return this.findById(id);
      }
      
      const query = `
        UPDATE content
        SET ${updates.join(', ')}
        WHERE id = $${paramIndex++}
        RETURNING *
      `;
      
      values.push(id);
      
      const result = await this.db.query<Content>(query, values);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error updating content', { error, contentId: id, input });
      throw error;
    }
  }
  
  /**
   * Search content with optimized query
   */
  async searchContent(
    searchTerm: string, 
    options: { limit?: number; offset?: number; type?: string } = {}
  ): Promise<Content[]> {
    try {
      const { limit = 20, offset = 0, type } = options;
      
      // For performance with larger datasets, consider using full-text search
      // For now, optimize the ILIKE approach
      let query = `
        SELECT 
          c.*,
          u.display_name as author_name,
          p.avatar_url as author_avatar,
          COALESCE((
            SELECT COUNT(*) FROM comments 
            WHERE content_id = c.id AND status = 'active'
          ), 0) as comment_count
        FROM content c
        JOIN users u ON c.user_id = u.id
        LEFT JOIN profiles p ON c.user_id = p.user_id
        WHERE c.status = 'active' AND (
          c.content_text ILIKE $1
          OR u.display_name ILIKE $1
        )
      `;
      
      const queryParams = [`%${searchTerm}%`];
      let paramIndex = 2;
      
      // Filter by type if provided
      if (type) {
        query += ` AND c.type = $${paramIndex++}`;
        queryParams.push(type);
      }
      
      // Add sorting, pagination - note we're using OFFSET/LIMIT for search
      // For better performance with large result sets, consider implementing 
      // keyset pagination similar to getContentFeed
      query += ` ORDER BY c.created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
      queryParams.push(limit, offset);
      
      const result = await this.db.query<Content>(query, queryParams);
      return result.rows;
    } catch (error) {
      logger.error('Error searching content', { error, searchTerm, options });
      throw error;
    }
  }
  
  /**
   * Get trending content with optimized query
   */
  async getTrendingContent(options: { limit?: number; timeframe?: string } = {}): Promise<Content[]> {
    try {
      const { limit = 20, timeframe = '7 days' } = options;
      
      // More efficient query by using proper indexes and pre-aggregation
      const query = `
        WITH reaction_counts AS (
          SELECT
            content_id,
            COUNT(*) as reaction_count
          FROM content_reactions
          WHERE created_at > NOW() - INTERVAL '${timeframe}'
          GROUP BY content_id
        ),
        comment_counts AS (
          SELECT
            content_id,
            COUNT(*) as comment_count
          FROM comments
          WHERE created_at > NOW() - INTERVAL '${timeframe}' AND status = 'active'
          GROUP BY content_id
        )
        SELECT
          c.*,
          u.display_name as author_name,
          p.avatar_url as author_avatar,
          COALESCE(rc.reaction_count, 0) as reaction_count,
          COALESCE(cc.comment_count, 0) as comment_count,
          COALESCE(rc.reaction_count, 0) + COALESCE(cc.comment_count, 0) * 3 as engagement_score
        FROM content c
        JOIN users u ON c.user_id = u.id
        LEFT JOIN profiles p ON c.user_id = p.user_id
        LEFT JOIN reaction_counts rc ON c.id = rc.content_id
        LEFT JOIN comment_counts cc ON c.id = cc.content_id
        WHERE c.status = 'active' AND c.created_at > NOW() - INTERVAL '${timeframe}'
        ORDER BY engagement_score DESC, c.created_at DESC
        LIMIT $1
      `;
      
      const result = await this.db.query(query, [limit]);
      return result.rows;
    } catch (error) {
      logger.error('Error getting trending content', { error, options });
      throw error;
    }
  }
}
