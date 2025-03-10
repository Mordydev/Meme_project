import { FastifyInstance } from 'fastify';
import { BaseRepository } from './core/base-repository';

/**
 * Comment model interface
 */
export interface CommentModel {
  id: string;
  contentId: string;
  userId: string;
  body: string;
  parentId?: string; // For nested comments
  status: 'visible' | 'hidden' | 'deleted';
  metrics: {
    reactionCounts: {
      [key: string]: number;
    };
  };
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Repository for handling Comments
 */
export class CommentRepository extends BaseRepository<CommentModel> {
  constructor(fastify: FastifyInstance) {
    super(fastify, 'comments');
  }

  /**
   * Get comments for a content item
   */
  async getCommentsForContent(contentId: string, limit = 50): Promise<{
    comments: CommentModel[];
    totalCount: number;
  }> {
    const { data, error, count } = await this.db
      .from(this.tableName)
      .select(`
        *,
        user:user_profiles!userId(id, username, displayName, imageUrl)
      `, { count: 'exact' })
      .eq('contentId', contentId)
      .eq('status', 'visible')
      .order('createdAt', { ascending: false })
      .limit(limit);
    
    if (error) {
      this.logger.error(error, `Failed to get comments for content ${contentId}`);
      throw new Error(`Failed to get comments for content ${contentId}`);
    }
    
    return {
      comments: data,
      totalCount: count || 0
    };
  }

  /**
   * Get threaded comments for a content item with enhanced threading support
   */
  async getThreadedCommentsForContent(contentId: string, limit = 50): Promise<{
    comments: CommentModel[];
    totalCount: number;
  }> {
    // First get top-level comments
    const { data: topLevelComments, error: topError, count } = await this.db
      .from(this.tableName)
      .select(`
        *,
        user:user_profiles!userId(id, username, displayName, imageUrl)
      `, { count: 'exact' })
      .eq('contentId', contentId)
      .is('parentId', null)
      .eq('status', 'visible')
      .order('createdAt', { ascending: false })
      .limit(limit);
    
    if (topError) {
      this.logger.error(topError, `Failed to get top-level comments for content ${contentId}`);
      throw new Error(`Failed to get top-level comments for content ${contentId}`);
    }
    
    // If no top-level comments, return empty
    if (!topLevelComments.length) {
      return { comments: [], totalCount: 0 };
    }
    
    // Get replies to top-level comments
    const topLevelIds = topLevelComments.map(c => c.id);
    
    const { data: replies, error: repliesError } = await this.db
      .from(this.tableName)
      .select(`
        *,
        user:user_profiles!userId(id, username, displayName, imageUrl)
      `)
      .in('parentId', topLevelIds)
      .eq('status', 'visible')
      .order('createdAt', { ascending: true });
    
    if (repliesError) {
      this.logger.error(repliesError, `Failed to get comment replies for content ${contentId}`);
      throw new Error(`Failed to get comment replies for content ${contentId}`);
    }
    
    // Combine top-level and replies
    return {
      comments: [...topLevelComments, ...replies],
      totalCount: count || 0
    };
  }

  /**
   * Get a single comment thread with replies
   */
  async getCommentThread(
    commentId: string,
    options: { page?: number; limit?: number } = {}
  ): Promise<{
    rootComment: CommentModel;
    replies: CommentModel[];
    meta: { total: number; hasMore: boolean; }
  }> {
    // Get root comment
    const { data: rootComment, error: rootError } = await this.db
      .from(this.tableName)
      .select(`
        *,
        user:user_profiles!userId(id, username, displayName, imageUrl)
      `)
      .eq('id', commentId)
      .eq('status', 'visible')
      .single();
    
    if (rootError) {
      this.logger.error(rootError, `Failed to get root comment ${commentId}`);
      throw new Error(`Failed to get root comment: ${rootError.message}`);
    }
    
    if (!rootComment) {
      throw new Error(`Comment with ID ${commentId} not found`);
    }
    
    // Get replies with pagination
    const limit = options.limit || 20;
    const page = options.page || 0;
    const offset = page * limit;
    
    const { data: replies, error: repliesError, count } = await this.db
      .from(this.tableName)
      .select(`
        *,
        user:user_profiles!userId(id, username, displayName, imageUrl)
      `, { count: 'exact' })
      .eq('parentId', commentId)
      .eq('status', 'visible')
      .order('createdAt', { ascending: true })
      .range(offset, offset + limit - 1);
    
    if (repliesError) {
      this.logger.error(repliesError, `Failed to get replies for comment ${commentId}`);
      throw new Error(`Failed to get comment replies: ${repliesError.message}`);
    }
    
    return {
      rootComment,
      replies: replies || [],
      meta: {
        total: count || 0,
        hasMore: (count || 0) > offset + limit
      }
    };
  }
  
  /**
   * Find replies to a comment
   */
  async findReplies(
    commentId: string,
    options: { page?: number; limit?: number } = {}
  ): Promise<{
    data: CommentModel[];
    meta: { total: number; hasMore: boolean; }
  }> {
    const limit = options.limit || 20;
    const page = options.page || 0;
    const offset = page * limit;
    
    const { data, error, count } = await this.db
      .from(this.tableName)
      .select(`
        *,
        user:user_profiles!userId(id, username, displayName, imageUrl)
      `, { count: 'exact' })
      .eq('parentId', commentId)
      .eq('status', 'visible')
      .order('createdAt', { ascending: true })
      .range(offset, offset + limit - 1);
    
    if (error) {
      this.logger.error(error, `Failed to find replies for comment ${commentId}`);
      throw new Error(`Failed to find comment replies: ${error.message}`);
    }
    
    return {
      data: data || [],
      meta: {
        total: count || 0,
        hasMore: (count || 0) > offset + limit
      }
    };
  }

  /**
   * Update comment reaction count
   */
  async updateReactionCount(commentId: string, reactionType: string, increment = true): Promise<CommentModel> {
    try {
      // Get current comment
      const comment = await this.findById(commentId);
      
      if (!comment) {
        throw new Error(`Comment not found: ${commentId}`);
      }
      
      // Update reaction counts
      const reactionCounts = {
        ...comment.metrics.reactionCounts
      };
      
      // Initialize if not present
      if (!reactionCounts[reactionType]) {
        reactionCounts[reactionType] = 0;
      }
      
      // Increment or decrement
      if (increment) {
        reactionCounts[reactionType]++;
      } else {
        reactionCounts[reactionType] = Math.max(0, reactionCounts[reactionType] - 1);
      }
      
      // Update in database
      return this.update(commentId, {
        metrics: {
          ...comment.metrics,
          reactionCounts
        }
      });
    } catch (error) {
      this.logger.error(error, `Failed to update reaction count for comment ${commentId}`);
      throw error;
    }
  }
}
