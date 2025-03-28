/**
 * Content Repository
 * 
 * Handles data access operations for content items
 */
import { Pool } from 'pg';
import { BaseRepository } from './base-repository';
import { 
  Content, 
  CreateContentDto, 
  UpdateContentDto,
  ContentListItem 
} from '../models/entities/content.model';
import { logger } from '../lib/logger';

export class ContentRepository extends BaseRepository<Content> {
  /**
   * Create a new ContentRepository instance
   * 
   * @param db Database connection pool
   */
  constructor(db: Pool) {
    super(db, 'content');
  }

  /**
   * Create new content
   * 
   * @param data Content data
   * @returns Created content
   */
  async createContent(data: CreateContentDto): Promise<Content> {
    try {
      // Set created_at and updated_at
      const now = new Date();
      return await this.create({
        ...data,
        created_at: now,
        updated_at: now,
        status: 'active'
      });
    } catch (error) {
      logger.error('Error creating content', { error, data });
      throw error;
    }
  }

  /**
   * Update content
   * 
   * @param id Content ID
   * @param data Content data to update
   * @returns Updated content or null if not found
   */
  async updateContent(id: string, data: UpdateContentDto): Promise<Content | null> {
    try {
      // Always update the updated_at timestamp
      const updateData = {
        ...data,
        updated_at: new Date()
      };
      
      return await this.update(id, updateData);
    } catch (error) {
      logger.error('Error updating content', { error, id, data });
      throw error;
    }
  }

  /**
   * Soft delete content by setting its status to 'deleted'
   * 
   * @param id Content ID
   * @returns True if deleted, false if not found
   */
  async softDeleteContent(id: string): Promise<boolean> {
    try {
      const result = await this.db.query(`
        UPDATE content
        SET status = 'deleted', updated_at = NOW()
        WHERE id = $1
        RETURNING id
      `, [id]);
      
      return result.rowCount > 0;
    } catch (error) {
      logger.error('Error soft deleting content', { error, id });
      throw error;
    }
  }

  /**
   * Get user content feed with efficient pagination
   * 
   * @param options Feed options
   * @returns Array of content items with author and stats
   */
  async getContentFeed(options: {
    lastId?: string;
    lastCreatedAt?: Date;
    limit?: number;
    type?: string;
    status?: string;
    userId?: string;
    categoryId?: string;
  }): Promise<ContentListItem[]> {
    try {
      const {
        lastId,
        lastCreatedAt,
        limit = 20,
        type,
        status = 'active',
        userId,
        categoryId
      } = options;
      
      // Build query with optimized pagination using keyset pagination
      let query = `
        SELECT 
          c.*,
          u.display_name as author_name,
          p.avatar_url as author_avatar,
          (SELECT COUNT(*) FROM comments WHERE content_id = c.id) as comment_count,
          (SELECT COUNT(*) FROM reactions WHERE content_id = c.id) as like_count
        FROM content c
        JOIN users u ON c.user_id = u.id
        LEFT JOIN profiles p ON u.id = p.user_id
        WHERE c.status = $1
      `;
      
      const params: any[] = [status];
      let paramIndex = 2;
      
      // Add content type filter if specified
      if (type) {
        query += ` AND c.type = $${paramIndex++}`;
        params.push(type);
      }
      
      // Add user filter if specified
      if (userId) {
        query += ` AND c.user_id = $${paramIndex++}`;
        params.push(userId);
      }
      
      // Add category filter if specified
      if (categoryId) {
        query += ` AND c.category_id = $${paramIndex++}`;
        params.push(categoryId);
      }
      
      // Implement keyset pagination for better performance
      if (lastId && lastCreatedAt) {
        query += ` AND (c.created_at < $${paramIndex++} OR (c.created_at = $${paramIndex++} AND c.id < $${paramIndex++}))`;
        params.push(lastCreatedAt, lastCreatedAt, lastId);
      }
      
      // Add ordering and limit
      query += ` ORDER BY c.created_at DESC, c.id DESC LIMIT $${paramIndex++}`;
      params.push(limit);
      
      const result = await this.db.query(query, params);
      
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
      logger.error('Error getting content feed', { error, options });
      throw error;
    }
  }

  /**
   * Get single content with comments and author information
   * 
   * @param id Content ID
   * @returns Content with comments and author information
   */
  async getContentWithDetails(id: string): Promise<Content | null> {
    try {
      // Get content with author information
      const contentQuery = `
        SELECT 
          c.*,
          u.display_name as author_name,
          p.avatar_url as author_avatar,
          (SELECT COUNT(*) FROM comments WHERE content_id = c.id) as comment_count,
          (SELECT COUNT(*) FROM reactions WHERE content_id = c.id) as like_count
        FROM content c
        JOIN users u ON c.user_id = u.id
        LEFT JOIN profiles p ON u.id = p.user_id
        WHERE c.id = $1
      `;
      
      const contentResult = await this.db.query(contentQuery, [id]);
      
      if (contentResult.rows.length === 0) {
        return null;
      }
      
      // Map content result
      const content = this.mapToEntity(contentResult.rows[0]);
      
      // Add author and stats information
      return {
        ...content,
        author: {
          id: content.user_id,
          display_name: contentResult.rows[0].author_name,
          avatar_url: contentResult.rows[0].author_avatar
        },
        stats: {
          likes: parseInt(contentResult.rows[0].like_count || '0'),
          comments: parseInt(contentResult.rows[0].comment_count || '0'),
          shares: 0 // Will implement later
        }
      } as any;
    } catch (error) {
      logger.error('Error getting content with details', { error, id });
      throw error;
    }
  }

  /**
   * Search content by text
   * 
   * @param searchText Text to search for
   * @param options Search options
   * @returns Array of matching content items
   */
  async searchContent(
    searchText: string,
    options: {
      limit?: number;
      offset?: number;
      type?: string;
      userId?: string;
    } = {}
  ): Promise<ContentListItem[]> {
    try {
      const { limit = 20, offset = 0, type, userId } = options;
      
      // Use full-text search for better performance and accuracy
      let query = `
        SELECT 
          c.*,
          u.display_name as author_name,
          p.avatar_url as author_avatar,
          (SELECT COUNT(*) FROM comments WHERE content_id = c.id) as comment_count,
          (SELECT COUNT(*) FROM reactions WHERE content_id = c.id) as like_count,
          ts_rank(to_tsvector('english', c.content_text), plainto_tsquery('english', $1)) as rank
        FROM content c
        JOIN users u ON c.user_id = u.id
        LEFT JOIN profiles p ON u.id = p.user_id
        WHERE c.status = 'active'
        AND to_tsvector('english', c.content_text) @@ plainto_tsquery('english', $1)
      `;
      
      const params: any[] = [searchText];
      let paramIndex = 2;
      
      // Add content type filter if specified
      if (type) {
        query += ` AND c.type = $${paramIndex++}`;
        params.push(type);
      }
      
      // Add user filter if specified
      if (userId) {
        query += ` AND c.user_id = $${paramIndex++}`;
        params.push(userId);
      }
      
      // Add ordering and limit
      query += ` ORDER BY rank DESC, c.created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
      params.push(limit, offset);
      
      const result = await this.db.query(query, params);
      
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
      logger.error('Error searching content', { error, searchText, options });
      throw error;
    }
  }

  /**
   * Count content by user
   * 
   * @param userId User ID
   * @param status Content status (default 'active')
   * @returns Count of user's content
   */
  async countByUser(userId: string, status: string = 'active'): Promise<number> {
    try {
      const query = `
        SELECT COUNT(*) as count
        FROM content
        WHERE user_id = $1 AND status = $2
      `;
      
      const result = await this.db.query(query, [userId, status]);
      return parseInt(result.rows[0].count);
    } catch (error) {
      logger.error('Error counting content by user', { error, userId, status });
      throw error;
    }
  }

  /**
   * Count user's content within a time period
   * 
   * @param userId User ID
   * @param startDate Start date
   * @param endDate End date
   * @returns Count of content created in the time period
   */
  async countByUserInPeriod(
    userId: string, 
    startDate: Date,
    endDate: Date = new Date()
  ): Promise<number> {
    try {
      const query = `
        SELECT COUNT(*) as count
        FROM content
        WHERE user_id = $1 
        AND created_at >= $2 
        AND created_at <= $3
        AND status = 'active'
      `;
      
      const result = await this.db.query(query, [userId, startDate, endDate]);
      return parseInt(result.rows[0].count);
    } catch (error) {
      logger.error('Error counting content by user in period', { 
        error, userId, startDate, endDate 
      });
      throw error;
    }
  }

  /**
   * Map database row to Content entity
   * 
   * @param row Database row
   * @returns Content entity
   */
  protected mapToEntity(row: Record<string, any>): Content {
    return {
      id: row.id,
      user_id: row.user_id,
      type: row.type,
      content_text: row.content_text,
      media_urls: row.media_urls || [],
      created_at: row.created_at,
      updated_at: row.updated_at,
      status: row.status,
      
      // Optional fields based on content type
      poll_options: row.poll_options,
      link_url: row.link_url,
      link_title: row.link_title,
      link_description: row.link_description,
      link_image: row.link_image,
      
      // Metadata
      category_id: row.category_id,
      tags: row.tags || [],
      metadata: row.metadata || {}
    };
  }
}
