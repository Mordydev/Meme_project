/**
 * Content Repository
 * 
 * Handles data access for content
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
   * Get content feed with optimized pagination
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

      // Build base query
      let query = `
        WITH content_data AS (
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
      
      // Add trending score calculation for trending sorting
      if (sortBy === 'trending') {
        query += `,
            (
              COALESCE((
                SELECT COUNT(*) FROM content_reactions 
                WHERE content_id = c.id AND created_at > NOW() - INTERVAL $1
              ), 0) * 1.0 +
              COALESCE((
                SELECT COUNT(*) FROM comments 
                WHERE content_id = c.id AND status = 'active' AND created_at > NOW() - INTERVAL $1
              ), 0) * 3.0
            ) as trending_score
        `;
      }
      
      // Close the content_data CTE
      query += `
          FROM content c
          JOIN users u ON c.user_id = u.id
          LEFT JOIN profiles p ON c.user_id = p.user_id
          WHERE c.status = $2
      `;
      
      // Initialize query parameters
      const queryParams: any[] = [timeInterval, status];
      let paramIndex = 3;
      
      // Filter by type if provided
      if (type) {
        query += ` AND c.type = ${paramIndex}`;
        queryParams.push(type);
        paramIndex++;
      }
      
      // Filter by user if provided
      if (userId) {
        query += ` AND c.user_id = ${paramIndex}`;
        queryParams.push(userId);
        paramIndex++;
      }
      
      // Filter by category if provided
      if (categoryId) {
        query += ` AND c.category_id = ${paramIndex}`;
        queryParams.push(categoryId);
        paramIndex++;
      }
      
      // Apply time range filter for trending/popular
      if (sortBy === 'trending' || sortBy === 'popular') {
        query += ` AND c.created_at > NOW() - INTERVAL $1`;
      }
      
      // Implement keyset pagination for better performance
      if (lastId) {
        query += `
          AND c.created_at < (SELECT created_at FROM content WHERE id = ${paramIndex})
        `;
        queryParams.push(lastId);
        paramIndex++;
      }
      
      // Close the CTE and start the main query
      query += `
        )
        SELECT cd.*
        FROM content_data cd
      `;
      
      // Add tag filtering if provided
      if (tags && tags.length > 0) {
        const tagPlaceholders = tags.map((_, i) => `${paramIndex + i}`).join(', ');
        query += `
          JOIN (
            SELECT content_id, COUNT(tag_id) as tag_match_count
            FROM content_tags
            WHERE tag_id IN (${tagPlaceholders})
            GROUP BY content_id
          ) tag_matches ON cd.id = tag_matches.content_id
        `;
        
        queryParams.push(...tags);
        paramIndex += tags.length;
      }
      
      // Add ordering based on sort type
      switch (sortBy) {
        case 'popular':
          query += ` ORDER BY (cd.comment_count + cd.reaction_count) DESC, cd.created_at DESC`;
          break;
        case 'trending':
          query += ` ORDER BY cd.trending_score DESC, cd.created_at DESC`;
          break;
        case 'recent':
        default:
          query += ` ORDER BY cd.created_at DESC`;
          break;
      }
      
      // Add limit
      query += ` LIMIT ${paramIndex}`;
      queryParams.push(limit);
      
      const result = await this.db.query(query, queryParams);
      return result.rows;
    } catch (error) {
      logger.error('Error getting content feed', { error, options });
      throw error;
    }
  }
  
  /**
   * Get content with comments and reactions
   */
  async getContentWithDetails(id: string): Promise<any> {
    try {
      // Get content
      const contentQuery = `
        SELECT c.*, u.display_name as author_name, u.avatar_url as author_avatar 
        FROM content c
        JOIN profiles p ON c.user_id = p.user_id
        JOIN users u ON c.user_id = u.id
        WHERE c.id = $1
      `;
      
      const contentResult = await this.db.query(contentQuery, [id]);
      
      if (contentResult.rows.length === 0) {
        return null;
      }
      
      const content = contentResult.rows[0];
      
      // Get comments
      const commentsQuery = `
        SELECT c.*, u.display_name as author_name, p.avatar_url as author_avatar
        FROM comments c
        JOIN users u ON c.user_id = u.id
        LEFT JOIN profiles p ON c.user_id = p.user_id
        WHERE c.content_id = $1
        ORDER BY 
          CASE WHEN c.parent_id IS NULL THEN c.created_at END DESC,
          CASE WHEN c.parent_id IS NOT NULL THEN c.created_at END ASC
      `;
      
      const commentsResult = await this.db.query(commentsQuery, [id]);
      
      // Get reaction counts
      const reactionsQuery = `
        SELECT reaction_type, COUNT(*) as count
        FROM content_reactions
        WHERE content_id = $1
        GROUP BY reaction_type
      `;
      
      const reactionsResult = await this.db.query(reactionsQuery, [id]);
      
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
      
      return {
        ...content,
        comments: topLevelComments,
        reactions,
        comment_count: commentsResult.rowCount
      };
    } catch (error) {
      logger.error('Error getting content with details', { error, contentId: id });
      throw error;
    }
  }
  
  /**
   * Update content
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
   * Search content
   */
  async searchContent(
    searchTerm: string, 
    options: { limit?: number; offset?: number; type?: string } = {}
  ): Promise<Content[]> {
    try {
      const { limit = 20, offset = 0, type } = options;
      
      let query = `
        SELECT c.*, u.display_name as author_name
        FROM content c
        JOIN users u ON c.user_id = u.id
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
      
      // Add sorting, pagination
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
   * Get trending content
   */
  async getTrendingContent(options: { limit?: number; timeframe?: string } = {}): Promise<Content[]> {
    try {
      const { limit = 20, timeframe = '7 days' } = options;
      
      // Query for trending content based on engagement metrics
      const query = `
        SELECT c.*, u.display_name as author_name,
               COUNT(DISTINCT cr.user_id) as reaction_count,
               COUNT(DISTINCT cm.id) as comment_count
        FROM content c
        JOIN users u ON c.user_id = u.id
        LEFT JOIN content_reactions cr ON c.id = cr.content_id AND cr.created_at > NOW() - INTERVAL '${timeframe}'
        LEFT JOIN comments cm ON c.id = cm.content_id AND cm.created_at > NOW() - INTERVAL '${timeframe}'
        WHERE c.status = 'active' AND c.created_at > NOW() - INTERVAL '${timeframe}'
        GROUP BY c.id, u.display_name
        ORDER BY (COUNT(DISTINCT cr.user_id) + COUNT(DISTINCT cm.id) * 3) DESC
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
