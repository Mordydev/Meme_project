import { FastifyInstance } from 'fastify';
import { BaseRepository } from './core/base-repository';
import { NotFoundError } from '../lib/errors';

/**
 * Content model interface
 */
export interface ContentModel {
  id: string;
  creatorId: string;
  type: 'text' | 'image' | 'audio' | 'video' | 'mixed';
  title: string;
  body: string;
  mediaUrl?: string;
  additionalMedia?: string[];
  battleId?: string;
  tags: string[];
  status: 'draft' | 'published' | 'archived' | 'removed';
  moderation: {
    status: 'pending' | 'approved' | 'rejected';
    reviewerId?: string;
    reviewedAt?: Date;
    reason?: string;
  };
  metrics: {
    viewCount: number;
    commentCount: number;
    shareCount: number;
    reactionCounts: {
      [key: string]: number;
    };
  };
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Repository for handling Content
 */
export class ContentRepository extends BaseRepository<ContentModel> {
  constructor(fastify: FastifyInstance) {
    super(fastify, 'content');
  }

  /**
   * Get content feed with user details
   */
  async getContentFeed(limit = 20, cursor?: string): Promise<{
    content: ContentModel[];
    hasMore: boolean;
    cursor?: string;
  }> {
    const { data, error } = await this.db
      .from(this.tableName)
      .select(`
        *,
        creator:user_profiles!creatorId(id, username, displayName, imageUrl)
      `)
      .eq('status', 'published')
      .eq('moderation.status', 'approved')
      .order('createdAt', { ascending: false })
      .limit(limit + 1);
    
    if (error) {
      this.logger.error(error, 'Failed to get content feed');
      throw new Error('Failed to get content feed');
    }
    
    const hasMore = data.length > limit;
    const contentItems = hasMore ? data.slice(0, limit) : data;
    
    return {
      content: contentItems,
      hasMore,
      cursor: contentItems.length ? contentItems[contentItems.length - 1].id : undefined
    };
  }

  /**
   * Get content by creator
   */
  async getContentByCreator(creatorId: string, limit = 20, cursor?: string): Promise<{
    content: ContentModel[];
    hasMore: boolean;
    cursor?: string;
  }> {
    const result = await this.findManyWithPagination(
      { creatorId, status: 'published' },
      { limit, cursor, cursorField: 'id' }
    );
    
    return {
      content: result.data,
      hasMore: result.hasMore,
      cursor: result.cursor
    };
  }

  /**
   * Update content reaction count
   */
  async updateReactionCount(contentId: string, reactionType: string, increment = true): Promise<ContentModel> {
    try {
      // Get current content
      const content = await this.findById(contentId);
      
      if (!content) {
        throw new NotFoundError('content', contentId);
      }
      
      // Update reaction counts
      const reactionCounts = {
        ...content.metrics.reactionCounts
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
      return this.update(contentId, {
        metrics: {
          ...content.metrics,
          reactionCounts
        }
      });
    } catch (error) {
      this.logger.error(error, `Failed to update reaction count for content ${contentId}`);
      throw error;
    }
  }

  /**
   * Update content comment count
   */
  async incrementCommentCount(contentId: string): Promise<ContentModel> {
    try {
      // Get current content
      const content = await this.findById(contentId);
      
      if (!content) {
        throw new NotFoundError('content', contentId);
      }
      
      // Update in database
      return this.update(contentId, {
        metrics: {
          ...content.metrics,
          commentCount: content.metrics.commentCount + 1
        }
      });
    } catch (error) {
      this.logger.error(error, `Failed to update comment count for content ${contentId}`);
      throw error;
    }
  }
}
