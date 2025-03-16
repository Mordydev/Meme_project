/**
 * Comment Repository
 * 
 * Handles data access operations for comments
 */
import { Pool } from 'pg';
import { BaseRepository } from './base-repository';
import { Comment, CreateCommentDto, UpdateCommentDto, CommentThread } from '../models/entities/comment.model';
import { logger } from '../lib/logger';

export class CommentRepository extends BaseRepository<Comment> {
  /**
   * Create a new CommentRepository instance
   * 
   * @param db Database connection pool
   */
  constructor(db: Pool) {
    super(db, 'comments');
  }

  /**
   * Create a new comment
   * 
   * @param data Comment data
   * @returns Created comment
   */
  async createComment(data: CreateCommentDto): Promise<Comment> {
    try {
      // Add created_at
      return await this.create({
        ...data,
        created_at: new Date(),
        status: 'active'
      });
    } catch (error) {
      logger.error('Error creating comment', { error, data });
      throw error;
    }
  }

  /**
   * Update a comment
   * 
   * @param id Comment ID
   * @param data Comment data to update
   * @returns Updated comment or null if not found
   */
  async updateComment(id: string, data: UpdateCommentDto): Promise<Comment | null> {
    try {
      return await this.update(id, data);
    } catch (error) {
      logger.error('Error updating comment', { error, id, data });
      throw error;
    }
  }

  /**
   * Soft delete a comment by setting its status to 'deleted'
   * 
   * @param id Comment ID
   * @returns True if deleted, false if not found
   */
  async softDeleteComment(id: string): Promise<boolean> {
    try {
      const result = await this.db.query(`
        UPDATE comments
        SET status = 'deleted'
        WHERE id = $1
        RETURNING id
      `, [id]);
      
      return result.rowCount > 0;
    } catch (error) {
      logger.error('Error soft deleting comment', { error, id });
      throw error;
    }
  }

  /**
   * Get comments for a content item, optionally grouped by thread
   * 
   * @param contentId Content ID
   * @param options Options for retrieving comments
   * @returns Array of comments, possibly with nested replies
   */
  async getContentComments(
    contentId: string,
    options: {
      limit?: number;
      offset?: number;
      threaded?: boolean;
      includeDeleted?: boolean;
    } = {}
  ): Promise<Comment[] | CommentThread[]> {
    try {
      const { limit = 50, offset = 0, threaded = true, includeDeleted = false } = options;
      
      // If not threaded, get flat list of comments
      if (!threaded) {
        let query = `
          SELECT 
            c.*,
            u.display_name as author_name,
            p.avatar_url as author_avatar,
            (SELECT COUNT(*) FROM reactions WHERE comment_id = c.id) as like_count
          FROM comments c
          JOIN users u ON c.user_id = u.id
          LEFT JOIN profiles p ON u.id = p.user_id
          WHERE c.content_id = $1
        `;
        
        if (!includeDeleted) {
          query += ` AND c.status = 'active'`;
        }
        
        query += ` ORDER BY c.created_at ASC LIMIT $2 OFFSET $3`;
        
        const result = await this.db.query(query, [contentId, limit, offset]);
        
        // Map to comment with author
        return result.rows.map(row => ({
          ...this.mapToEntity(row),
          author: {
            id: row.user_id,
            display_name: row.author_name,
            avatar_url: row.author_avatar
          },
          stats: {
            likes: parseInt(row.like_count || '0')
          }
        }));
      }
      
      // For threaded comments, first get top-level comments
      let query = `
        SELECT 
          c.*,
          u.display_name as author_name,
          p.avatar_url as author_avatar,
          (SELECT COUNT(*) FROM reactions WHERE comment_id = c.id) as like_count
        FROM comments c
        JOIN users u ON c.user_id = u.id
        LEFT JOIN profiles p ON u.id = p.user_id
        WHERE c.content_id = $1 AND c.parent_id IS NULL
      `;
      
      if (!includeDeleted) {
        query += ` AND c.status = 'active'`;
      }
      
      query += ` ORDER BY c.created_at ASC LIMIT $2 OFFSET $3`;
      
      const topLevelResult = await this.db.query(query, [contentId, limit, offset]);
      
      if (topLevelResult.rows.length === 0) {
        return [];
      }
      
      // Get IDs of top-level comments
      const topLevelIds = topLevelResult.rows.map(row => row.id);
      
      // Get all replies to these comments
      let repliesQuery = `
        SELECT 
          c.*,
          u.display_name as author_name,
          p.avatar_url as author_avatar,
          (SELECT COUNT(*) FROM reactions WHERE comment_id = c.id) as like_count
        FROM comments c
        JOIN users u ON c.user_id = u.id
        LEFT JOIN profiles p ON u.id = p.user_id
        WHERE c.parent_id = ANY($1::uuid[])
      `;
      
      if (!includeDeleted) {
        repliesQuery += ` AND c.status = 'active'`;
      }
      
      repliesQuery += ` ORDER BY c.created_at ASC`;
      
      const repliesResult = await this.db.query(repliesQuery, [topLevelIds]);
      
      // Group replies by parent ID
      const repliesByParent: Record<string, any[]> = {};
      repliesResult.rows.forEach(row => {
        if (!repliesByParent[row.parent_id]) {
          repliesByParent[row.parent_id] = [];
        }
        repliesByParent[row.parent_id].push(row);
      });
      
      // Map top-level comments with replies
      return topLevelResult.rows.map(row => ({
        ...this.mapToEntity(row),
        author: {
          id: row.user_id,
          display_name: row.author_name,
          avatar_url: row.author_avatar
        },
        stats: {
          likes: parseInt(row.like_count || '0')
        },
        replies: (repliesByParent[row.id] || []).map(replyRow => ({
          ...this.mapToEntity(replyRow),
          author: {
            id: replyRow.user_id,
            display_name: replyRow.author_name,
            avatar_url: replyRow.author_avatar
          },
          stats: {
            likes: parseInt(replyRow.like_count || '0')
          }
        }))
      }));
    } catch (error) {
      logger.error('Error getting content comments', { error, contentId, options });
      throw error;
    }
  }

  /**
   * Count comments for a content item
   * 
   * @param contentId Content ID
   * @param includeDeleted Whether to include deleted comments
   * @returns Comment count
   */
  async countContentComments(contentId: string, includeDeleted: boolean = false): Promise<number> {
    try {
      let query = `
        SELECT COUNT(*) as count
        FROM comments
        WHERE content_id = $1
      `;
      
      if (!includeDeleted) {
        query += ` AND status = 'active'`;
      }
      
      const result = await this.db.query(query, [contentId]);
      return parseInt(result.rows[0].count);
    } catch (error) {
      logger.error('Error counting content comments', { error, contentId });
      throw error;
    }
  }

  /**
   * Count user's comments within a time period
   * 
   * @param userId User ID
   * @param startDate Start date
   * @param endDate End date
   * @returns Count of comments created in the time period
   */
  async countByUserInPeriod(
    userId: string, 
    startDate: Date,
    endDate: Date = new Date()
  ): Promise<number> {
    try {
      const query = `
        SELECT COUNT(*) as count
        FROM comments
        WHERE user_id = $1 
        AND created_at >= $2 
        AND created_at <= $3
        AND status = 'active'
      `;
      
      const result = await this.db.query(query, [userId, startDate, endDate]);
      return parseInt(result.rows[0].count);
    } catch (error) {
      logger.error('Error counting comments by user in period', { 
        error, userId, startDate, endDate 
      });
      throw error;
    }
  }

  /**
   * Check if a user has commented on a content item
   * 
   * @param userId User ID
   * @param contentId Content ID
   * @returns True if user has commented, false otherwise
   */
  async hasUserCommented(userId: string, contentId: string): Promise<boolean> {
    try {
      const query = `
        SELECT EXISTS(
          SELECT 1 FROM comments
          WHERE user_id = $1 AND content_id = $2 AND status = 'active'
        ) as has_commented
      `;
      
      const result = await this.db.query(query, [userId, contentId]);
      return result.rows[0].has_commented;
    } catch (error) {
      logger.error('Error checking if user has commented', { error, userId, contentId });
      throw error;
    }
  }

  /**
   * Get recent comments by a user
   * 
   * @param userId User ID
   * @param limit Maximum comments to return
   * @returns Array of comments with content information
   */
  async getRecentUserComments(userId: string, limit: number = 10): Promise<any[]> {
    try {
      const query = `
        SELECT 
          c.*,
          cnt.id as content_id,
          cnt.type as content_type,
          cnt.content_text as content_text,
          u.display_name as content_author_name
        FROM comments c
        JOIN content cnt ON c.content_id = cnt.id
        JOIN users u ON cnt.user_id = u.id
        WHERE c.user_id = $1 AND c.status = 'active'
        ORDER BY c.created_at DESC
        LIMIT $2
      `;
      
      const result = await this.db.query(query, [userId, limit]);
      
      return result.rows.map(row => ({
        ...this.mapToEntity(row),
        content: {
          id: row.content_id,
          type: row.content_type,
          content_text: row.content_text,
          author_name: row.content_author_name
        }
      }));
    } catch (error) {
      logger.error('Error getting recent user comments', { error, userId, limit });
      throw error;
    }
  }

  /**
   * Map database row to Comment entity
   * 
   * @param row Database row
   * @returns Comment entity
   */
  protected mapToEntity(row: Record<string, any>): Comment {
    return {
      id: row.id,
      content_id: row.content_id,
      user_id: row.user_id,
      comment_text: row.comment_text,
      parent_id: row.parent_id,
      created_at: row.created_at,
      status: row.status,
      metadata: row.metadata || {}
    };
  }
}
