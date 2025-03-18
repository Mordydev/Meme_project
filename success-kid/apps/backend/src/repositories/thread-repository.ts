/**
 * Thread Repository
 * 
 * Handles data access operations for discussion threads
 */
import { Pool } from 'pg';
import { BaseRepository } from './base-repository';
import { 
  Thread,
  ThreadListItem
} from '../models/entities/forum/thread.model';
import { logger } from '../lib/logger';

export class ThreadRepository extends BaseRepository<Thread> {
  /**
   * Create a new ThreadRepository instance
   * 
   * @param db Database connection pool
   */
  constructor(db: Pool) {
    super(db, 'threads');
  }

  /**
   * Create a new thread
   * 
   * @param thread Thread data
   * @returns Created thread
   */
  async createThread(thread: Thread): Promise<Thread> {
    try {
      return await this.create(thread);
    } catch (error) {
      logger.error('Error creating thread', { error, thread });
      throw error;
    }
  }

  /**
   * Update a thread
   * 
   * @param id Thread ID
   * @param data Thread data to update
   * @returns Updated thread
   */
  async updateThread(id: string, data: Partial<Thread>): Promise<Thread | null> {
    try {
      // Always update the updated_at timestamp
      const updateData = {
        ...data,
        updated_at: new Date()
      };
      
      return await this.update(id, updateData);
    } catch (error) {
      logger.error('Error updating thread', { error, id, data });
      throw error;
    }
  }

  /**
   * Update thread last activity
   * 
   * @param id Thread ID
   * @param postId Post ID causing the activity
   * @param userId User ID causing the activity
   * @returns Updated thread
   */
  async updateThreadActivity(id: string, postId: string, userId: string): Promise<Thread | null> {
    try {
      const now = new Date();
      
      const query = `
        UPDATE threads
        SET 
          last_activity_at = $1,
          last_post_id = $2,
          last_post_user_id = $3,
          updated_at = $1
        WHERE id = $4
        RETURNING *
      `;
      
      const result = await this.db.query(query, [now, postId, userId, id]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return this.mapToEntity(result.rows[0]);
    } catch (error) {
      logger.error('Error updating thread activity', { error, id, postId, userId });
      throw error;
    }
  }

  /**
   * Increment thread views
   * 
   * @param id Thread ID
   * @returns Updated view count
   */
  async incrementThreadViews(id: string): Promise<number> {
    try {
      const query = `
        UPDATE threads
        SET views = views + 1
        WHERE id = $1
        RETURNING views
      `;
      
      const result = await this.db.query(query, [id]);
      
      if (result.rows.length === 0) {
        return 0;
      }
      
      return result.rows[0].views;
    } catch (error) {
      logger.error('Error incrementing thread views', { error, id });
      throw error;
    }
  }

  /**
   * Get threads for a category
   * 
   * @param categoryId Category ID
   * @param options Query options
   * @returns List of threads
   */
  async getThreadsByCategory(
    categoryId: string,
    options: {
      limit?: number;
      offset?: number;
      sort?: string;
    } = {}
  ): Promise<ThreadListItem[]> {
    try {
      const { limit = 20, offset = 0, sort = 'recent' } = options;
      
      // Determine sort order
      let orderClause = 't.last_activity_at DESC';
      if (sort === 'newest') {
        orderClause = 't.created_at DESC';
      } else if (sort === 'views') {
        orderClause = 't.views DESC, t.last_activity_at DESC';
      }
      
      const query = `
        SELECT 
          t.*,
          u.display_name as author_name,
          p.avatar_url as author_avatar,
          c.name as category_name,
          c.slug as category_slug,
          ct.content_text as content_preview,
          lu.display_name as last_user_name,
          (SELECT COUNT(*) FROM comments WHERE content_id = t.content_id OR 
            content_id IN (SELECT content_id FROM thread_replies WHERE thread_id = t.id)) as reply_count,
          (SELECT COUNT(*) FROM reactions WHERE content_id = t.content_id OR 
            content_id IN (SELECT content_id FROM thread_replies WHERE thread_id = t.id)) as like_count,
          (SELECT COUNT(DISTINCT user_id) FROM comments WHERE content_id = t.content_id OR 
            content_id IN (SELECT content_id FROM thread_replies WHERE thread_id = t.id)) as participant_count
        FROM threads t
        JOIN users u ON t.user_id = u.id
        LEFT JOIN profiles p ON u.id = p.user_id
        JOIN categories c ON t.category_id = c.id
        JOIN content ct ON t.content_id = ct.id
        LEFT JOIN users lu ON t.last_post_user_id = lu.id
        WHERE t.category_id = $1 AND t.status = 'active'
        ORDER BY t.is_pinned DESC, ${orderClause}
        LIMIT $2 OFFSET $3
      `;
      
      const result = await this.db.query(query, [categoryId, limit, offset]);
      
      // Map to thread list items
      return result.rows.map(row => ({
        id: row.id,
        title: row.title,
        user_id: row.user_id,
        category_id: row.category_id,
        forum_id: row.forum_id,
        type: row.type,
        status: row.status,
        is_pinned: row.is_pinned,
        is_locked: row.is_locked,
        views: row.views,
        created_at: row.created_at,
        last_activity_at: row.last_activity_at,
        
        // Preview of first post content (truncated)
        preview: row.content_preview.substring(0, 200),
        
        // Author information
        author: {
          id: row.user_id,
          display_name: row.author_name,
          avatar_url: row.author_avatar
        },
        
        // Category information
        category: {
          id: row.category_id,
          name: row.category_name,
          slug: row.category_slug
        },
        
        // Stats
        stats: {
          replies: parseInt(row.reply_count || '0'),
          participants: parseInt(row.participant_count || '0'),
          likes: parseInt(row.like_count || '0')
        },
        
        // Last activity information
        last_activity: {
          user_id: row.last_post_user_id,
          user_name: row.last_user_name,
          timestamp: row.last_activity_at
        }
      }));
    } catch (error) {
      logger.error('Error getting threads by category', { error, categoryId, options });
      throw error;
    }
  }

  /**
   * Get threads for a forum
   * 
   * @param forumId Forum ID
   * @param options Query options
   * @returns List of threads
   */
  async getThreadsByForum(
    forumId: string,
    options: {
      limit?: number;
      offset?: number;
      sort?: string;
    } = {}
  ): Promise<ThreadListItem[]> {
    try {
      const { limit = 20, offset = 0, sort = 'recent' } = options;
      
      // Determine sort order
      let orderClause = 't.last_activity_at DESC';
      if (sort === 'newest') {
        orderClause = 't.created_at DESC';
      } else if (sort === 'views') {
        orderClause = 't.views DESC, t.last_activity_at DESC';
      }
      
      const query = `
        SELECT 
          t.*,
          u.display_name as author_name,
          p.avatar_url as author_avatar,
          c.name as category_name,
          c.slug as category_slug,
          ct.content_text as content_preview,
          lu.display_name as last_user_name,
          (SELECT COUNT(*) FROM comments WHERE content_id = t.content_id OR 
            content_id IN (SELECT content_id FROM thread_replies WHERE thread_id = t.id)) as reply_count,
          (SELECT COUNT(*) FROM reactions WHERE content_id = t.content_id OR 
            content_id IN (SELECT content_id FROM thread_replies WHERE thread_id = t.id)) as like_count,
          (SELECT COUNT(DISTINCT user_id) FROM comments WHERE content_id = t.content_id OR 
            content_id IN (SELECT content_id FROM thread_replies WHERE thread_id = t.id)) as participant_count
        FROM threads t
        JOIN users u ON t.user_id = u.id
        LEFT JOIN profiles p ON u.id = p.user_id
        JOIN categories c ON t.category_id = c.id
        JOIN content ct ON t.content_id = ct.id
        LEFT JOIN users lu ON t.last_post_user_id = lu.id
        WHERE t.forum_id = $1 AND t.status = 'active'
        ORDER BY t.is_pinned DESC, ${orderClause}
        LIMIT $2 OFFSET $3
      `;
      
      const result = await this.db.query(query, [forumId, limit, offset]);
      
      // Map to thread list items
      return result.rows.map(row => ({
        id: row.id,
        title: row.title,
        user_id: row.user_id,
        category_id: row.category_id,
        forum_id: row.forum_id,
        type: row.type,
        status: row.status,
        is_pinned: row.is_pinned,
        is_locked: row.is_locked,
        views: row.views,
        created_at: row.created_at,
        last_activity_at: row.last_activity_at,
        
        // Preview of first post content (truncated)
        preview: row.content_preview.substring(0, 200),
        
        // Author information
        author: {
          id: row.user_id,
          display_name: row.author_name,
          avatar_url: row.author_avatar
        },
        
        // Category information
        category: {
          id: row.category_id,
          name: row.category_name,
          slug: row.category_slug
        },
        
        // Stats
        stats: {
          replies: parseInt(row.reply_count || '0'),
          participants: parseInt(row.participant_count || '0'),
          likes: parseInt(row.like_count || '0')
        },
        
        // Last activity information
        last_activity: {
          user_id: row.last_post_user_id,
          user_name: row.last_user_name,
          timestamp: row.last_activity_at
        }
      }));
    } catch (error) {
      logger.error('Error getting threads by forum', { error, forumId, options });
      throw error;
    }
  }

  /**
   * Get thread with details
   * 
   * @param threadId Thread ID
   * @returns Thread with details
   */
  async getThreadWithDetails(threadId: string): Promise<any | null> {
    try {
      const query = `
        SELECT 
          t.*,
          u.display_name as author_name,
          p.avatar_url as author_avatar,
          c.name as category_name,
          c.slug as category_slug,
          f.name as forum_name,
          f.slug as forum_slug,
          ct.content_text as content_text,
          ct.media_urls as media_urls,
          ct.poll_options as poll_options,
          lu.display_name as last_user_name,
          (SELECT COUNT(*) FROM comments WHERE content_id = t.content_id OR 
            content_id IN (SELECT content_id FROM thread_replies WHERE thread_id = t.id)) as reply_count,
          (SELECT COUNT(*) FROM reactions WHERE content_id = t.content_id OR 
            content_id IN (SELECT content_id FROM thread_replies WHERE thread_id = t.id)) as like_count,
          (SELECT COUNT(DISTINCT user_id) FROM comments WHERE content_id = t.content_id OR 
            content_id IN (SELECT content_id FROM thread_replies WHERE thread_id = t.id)) as participant_count
        FROM threads t
        JOIN users u ON t.user_id = u.id
        LEFT JOIN profiles p ON u.id = p.user_id
        JOIN categories c ON t.category_id = c.id
        JOIN forums f ON t.forum_id = f.id
        JOIN content ct ON t.content_id = ct.id
        LEFT JOIN users lu ON t.last_post_user_id = lu.id
        WHERE t.id = $1
      `;
      
      const result = await this.db.query(query, [threadId]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      const row = result.rows[0];
      
      // Map to thread with details
      return {
        id: row.id,
        title: row.title,
        user_id: row.user_id,
        category_id: row.category_id,
        forum_id: row.forum_id,
        content_id: row.content_id,
        type: row.type,
        status: row.status,
        is_pinned: row.is_pinned,
        is_locked: row.is_locked,
        views: row.views,
        created_at: row.created_at,
        updated_at: row.updated_at,
        last_activity_at: row.last_activity_at,
        last_post_id: row.last_post_id,
        last_post_user_id: row.last_post_user_id,
        tags: row.tags || [],
        metadata: row.metadata || {},
        
        // First post content
        content: {
          id: row.content_id,
          content_text: row.content_text,
          media_urls: row.media_urls || [],
          poll_options: row.poll_options
        },
        
        // Author information
        author: {
          id: row.user_id,
          display_name: row.author_name,
          avatar_url: row.author_avatar
        },
        
        // Category information
        category: {
          id: row.category_id,
          name: row.category_name,
          slug: row.category_slug
        },
        
        // Forum information
        forum: {
          id: row.forum_id,
          name: row.forum_name,
          slug: row.forum_slug
        },
        
        // Stats
        stats: {
          replies: parseInt(row.reply_count || '0'),
          participants: parseInt(row.participant_count || '0'),
          likes: parseInt(row.like_count || '0')
        },
        
        // Last activity information
        last_activity: {
          post_id: row.last_post_id,
          user_id: row.last_post_user_id,
          user_name: row.last_user_name,
          timestamp: row.last_activity_at
        }
      };
    } catch (error) {
      logger.error('Error getting thread with details', { error, threadId });
      throw error;
    }
  }

  /**
   * Get user's threads
   * 
   * @param userId User ID
   * @param options Query options
   * @returns List of threads created by the user
   */
  async getUserThreads(
    userId: string,
    options: {
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<ThreadListItem[]> {
    try {
      const { limit = 20, offset = 0 } = options;
      
      const query = `
        SELECT 
          t.*,
          u.display_name as author_name,
          p.avatar_url as author_avatar,
          c.name as category_name,
          c.slug as category_slug,
          ct.content_text as content_preview,
          lu.display_name as last_user_name,
          (SELECT COUNT(*) FROM comments WHERE content_id = t.content_id OR 
            content_id IN (SELECT content_id FROM thread_replies WHERE thread_id = t.id)) as reply_count,
          (SELECT COUNT(*) FROM reactions WHERE content_id = t.content_id OR 
            content_id IN (SELECT content_id FROM thread_replies WHERE thread_id = t.id)) as like_count,
          (SELECT COUNT(DISTINCT user_id) FROM comments WHERE content_id = t.content_id OR 
            content_id IN (SELECT content_id FROM thread_replies WHERE thread_id = t.id)) as participant_count
        FROM threads t
        JOIN users u ON t.user_id = u.id
        LEFT JOIN profiles p ON u.id = p.user_id
        JOIN categories c ON t.category_id = c.id
        JOIN content ct ON t.content_id = ct.id
        LEFT JOIN users lu ON t.last_post_user_id = lu.id
        WHERE t.user_id = $1 AND t.status = 'active'
        ORDER BY t.created_at DESC
        LIMIT $2 OFFSET $3
      `;
      
      const result = await this.db.query(query, [userId, limit, offset]);
      
      // Map to thread list items
      return result.rows.map(row => this.mapToThreadListItem(row));
    } catch (error) {
      logger.error('Error getting user threads', { error, userId, options });
      throw error;
    }
  }

  /**
   * Get trending threads
   * 
   * @param options Query options
   * @returns List of trending threads
   */
  async getTrendingThreads(
    options: {
      limit?: number;
      period?: 'day' | 'week' | 'month';
    } = {}
  ): Promise<ThreadListItem[]> {
    try {
      const { limit = 10, period = 'week' } = options;
      
      // Determine time period
      let timeFilter = "t.created_at > NOW() - INTERVAL '1 day'";
      if (period === 'week') {
        timeFilter = "t.created_at > NOW() - INTERVAL '7 days'";
      } else if (period === 'month') {
        timeFilter = "t.created_at > NOW() - INTERVAL '30 days'";
      }
      
      const query = `
        SELECT 
          t.*,
          u.display_name as author_name,
          p.avatar_url as author_avatar,
          c.name as category_name,
          c.slug as category_slug,
          ct.content_text as content_preview,
          lu.display_name as last_user_name,
          (SELECT COUNT(*) FROM comments WHERE content_id = t.content_id OR 
            content_id IN (SELECT content_id FROM thread_replies WHERE thread_id = t.id)) as reply_count,
          (SELECT COUNT(*) FROM reactions WHERE content_id = t.content_id OR 
            content_id IN (SELECT content_id FROM thread_replies WHERE thread_id = t.id)) as like_count,
          (SELECT COUNT(DISTINCT user_id) FROM comments WHERE content_id = t.content_id OR 
            content_id IN (SELECT content_id FROM thread_replies WHERE thread_id = t.id)) as participant_count
        FROM threads t
        JOIN users u ON t.user_id = u.id
        LEFT JOIN profiles p ON u.id = p.user_id
        JOIN categories c ON t.category_id = c.id
        JOIN content ct ON t.content_id = ct.id
        LEFT JOIN users lu ON t.last_post_user_id = lu.id
        WHERE t.status = 'active' AND ${timeFilter}
        ORDER BY 
          (reply_count * 10 + like_count * 5 + participant_count * 3 + t.views) DESC,
          t.last_activity_at DESC
        LIMIT $1
      `;
      
      const result = await this.db.query(query, [limit]);
      
      // Map to thread list items
      return result.rows.map(row => this.mapToThreadListItem(row));
    } catch (error) {
      logger.error('Error getting trending threads', { error, options });
      throw error;
    }
  }

  /**
   * Map database row to ThreadListItem
   * 
   * @param row Database row
   * @returns ThreadListItem
   */
  private mapToThreadListItem(row: Record<string, any>): ThreadListItem {
    return {
      id: row.id,
      title: row.title,
      user_id: row.user_id,
      category_id: row.category_id,
      forum_id: row.forum_id,
      type: row.type,
      status: row.status,
      is_pinned: row.is_pinned,
      is_locked: row.is_locked,
      views: row.views,
      created_at: row.created_at,
      last_activity_at: row.last_activity_at,
      
      // Preview of first post content (truncated)
      preview: row.content_preview.substring(0, 200),
      
      // Author information
      author: {
        id: row.user_id,
        display_name: row.author_name,
        avatar_url: row.author_avatar
      },
      
      // Category information
      category: {
        id: row.category_id,
        name: row.category_name,
        slug: row.category_slug
      },
      
      // Stats
      stats: {
        replies: parseInt(row.reply_count || '0'),
        participants: parseInt(row.participant_count || '0'),
        likes: parseInt(row.like_count || '0')
      },
      
      // Last activity information
      last_activity: {
        user_id: row.last_post_user_id,
        user_name: row.last_user_name,
        timestamp: row.last_activity_at
      }
    };
  }

  /**
   * Map database row to Thread entity
   * 
   * @param row Database row
   * @returns Thread entity
   */
  protected mapToEntity(row: Record<string, any>): Thread {
    return {
      id: row.id,
      title: row.title,
      user_id: row.user_id,
      category_id: row.category_id,
      forum_id: row.forum_id,
      content_id: row.content_id,
      type: row.type,
      status: row.status,
      is_pinned: row.is_pinned,
      is_locked: row.is_locked,
      views: row.views,
      created_at: row.created_at,
      updated_at: row.updated_at,
      last_activity_at: row.last_activity_at,
      last_post_id: row.last_post_id,
      last_post_user_id: row.last_post_user_id,
      tags: row.tags || [],
      metadata: row.metadata || {}
    };
  }
}
