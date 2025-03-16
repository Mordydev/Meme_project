/**
 * Comment Repository
 * 
 * Handles data access for comments
 */
import { Pool } from 'pg';
import { BaseRepository } from './base-repository';
import { Comment, CreateCommentDto, UpdateCommentDto } from '../models/comment';
import { logger } from '../lib/logger';

export class CommentRepository extends BaseRepository<Comment> {
  constructor(db: Pool) {
    super(db, 'comments', 'id');
  }
  
  /**
   * Create a new comment
   */
  async createComment(input: CreateCommentDto): Promise<Comment> {
    try {
      const { content_id, user_id, comment_text, parent_id } = input;
      
      const query = `
        INSERT INTO comments
        (id, content_id, user_id, comment_text, parent_id, created_at, status)
        VALUES (uuid_generate_v4(), $1, $2, $3, $4, NOW(), 'active')
        RETURNING *
      `;
      
      const result = await this.db.query<Comment>(query, [
        content_id,
        user_id,
        comment_text,
        parent_id || null
      ]);
      
      return result.rows[0];
    } catch (error) {
      logger.error('Error creating comment', { error, input });
      throw error;
    }
  }
  
  /**
   * Get comments for content
   */
  async getContentComments(
    contentId: string,
    options: { limit?: number; offset?: number } = {}
  ): Promise<Comment[]> {
    try {
      const { limit = 50, offset = 0 } = options;
      
      const query = `
        SELECT c.*, u.display_name as author_name, p.avatar_url as author_avatar
        FROM comments c
        JOIN users u ON c.user_id = u.id
        LEFT JOIN profiles p ON c.user_id = p.user_id
        WHERE c.content_id = $1 AND c.status = 'active'
        ORDER BY 
          CASE WHEN c.parent_id IS NULL THEN c.created_at END DESC,
          CASE WHEN c.parent_id IS NOT NULL THEN c.created_at END ASC
        LIMIT $2 OFFSET $3
      `;
      
      const result = await this.db.query(query, [contentId, limit, offset]);
      return result.rows;
    } catch (error) {
      logger.error('Error getting content comments', { error, contentId, options });
      throw error;
    }
  }
  
  /**
   * Get replies to a comment
   */
  async getCommentReplies(
    commentId: string,
    options: { limit?: number; offset?: number } = {}
  ): Promise<Comment[]> {
    try {
      const { limit = 20, offset = 0 } = options;
      
      const query = `
        SELECT c.*, u.display_name as author_name, p.avatar_url as author_avatar
        FROM comments c
        JOIN users u ON c.user_id = u.id
        LEFT JOIN profiles p ON c.user_id = p.user_id
        WHERE c.parent_id = $1 AND c.status = 'active'
        ORDER BY c.created_at ASC
        LIMIT $2 OFFSET $3
      `;
      
      const result = await this.db.query(query, [commentId, limit, offset]);
      return result.rows;
    } catch (error) {
      logger.error('Error getting comment replies', { error, commentId, options });
      throw error;
    }
  }
  
  /**
   * Update a comment
   */
  async updateComment(
    id: string,
    update: UpdateCommentDto
  ): Promise<Comment | null> {
    try {
      const { comment_text, status } = update;
      
      // Build dynamic update query
      const updates = [];
      const values = [];
      let paramIndex = 1;
      
      if (comment_text !== undefined) {
        updates.push(`comment_text = $${paramIndex++}`);
        values.push(comment_text);
      }
      
      if (status !== undefined) {
        updates.push(`status = $${paramIndex++}`);
        values.push(status);
      }
      
      if (updates.length === 0) {
        return this.findById(id);
      }
      
      const query = `
        UPDATE comments
        SET ${updates.join(', ')}
        WHERE id = $${paramIndex++}
        RETURNING *
      `;
      
      values.push(id);
      
      const result = await this.db.query<Comment>(query, values);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error updating comment', { error, id, update });
      throw error;
    }
  }
  
  /**
   * Get user's recent comments
   */
  async getUserRecentComments(
    userId: string,
    options: { limit?: number; offset?: number } = {}
  ): Promise<any[]> {
    try {
      const { limit = 20, offset = 0 } = options;
      
      const query = `
        SELECT 
          c.*,
          ct.type as content_type,
          LEFT(ct.content_text, 100) as content_preview
        FROM comments c
        JOIN content ct ON c.content_id = ct.id
        WHERE c.user_id = $1 AND c.status = 'active'
        ORDER BY c.created_at DESC
        LIMIT $2 OFFSET $3
      `;
      
      const result = await this.db.query(query, [userId, limit, offset]);
      return result.rows;
    } catch (error) {
      logger.error('Error getting user recent comments', { error, userId, options });
      throw error;
    }
  }
  
  /**
   * Count comments for content
   */
  async countContentComments(contentId: string): Promise<number> {
    try {
      const query = `
        SELECT COUNT(*) as count
        FROM comments
        WHERE content_id = $1 AND status = 'active'
      `;
      
      const result = await this.db.query<{ count: string }>(query, [contentId]);
      return parseInt(result.rows[0].count, 10);
    } catch (error) {
      logger.error('Error counting content comments', { error, contentId });
      throw error;
    }
  }
}
