import { ContentRepository } from '../repositories/content-repository';
import { CommentRepository } from '../repositories/comment-repository';
import { EventEmitter, EventType } from '../lib/events';
import { NotFoundError, ValidationError, ForbiddenError, AppError } from '../lib/errors';
import { ContentModel } from '../repositories/content-repository';
import { CommentModel } from '../repositories/comment-repository';
import { TagService } from './tag-service';
import { TransactionManager } from '../lib/transaction';
import { ContentValidator } from '../validators/content-validator';

export interface ContentCreateInput {
  type: ContentModel['type'];
  title: string;
  body?: string;
  mediaUrl?: string;
  additionalMedia?: string[];
  tags?: string[];
  battleId?: string;
  isDraft?: boolean;
  categories?: string[];
  location?: string;
  deviceInfo?: string;
}

/**
 * Service for managing content operations
 */
export class ContentService {
  constructor(
    private contentRepository: ContentRepository,
    private commentRepository: CommentRepository,
    private eventEmitter: EventEmitter,
    private tagService: TagService,
    private transactionManager: TransactionManager,
    private contentValidator: ContentValidator
  ) {}

  /**
   * Register event handlers for this service
   */
  registerEventHandlers(): void {
    // Listen for content creation events
    this.eventEmitter.on(EventType.CONTENT_CREATED, async (data) => {
      // Process new content
      try {
        const content = await this.contentRepository.findById(data.contentId);
        
        if (content) {
          // Update trending metrics, recommendation data, etc.
          await this.updateContentMetrics(content.id);
          
          // Trigger achievements if applicable
          await this.checkCreatorAchievements(content.creatorId);
        }
      } catch (error) {
        console.error('Error processing content created event:', error);
      }
    });
  }

  /**
   * Create new content with comprehensive validation and transaction support
   */
  async createContent(userId: string, data: ContentCreateInput): Promise<ContentModel> {
    // Validate content data
    const validationResult = this.contentValidator.validate(data);
    
    if (!validationResult.success) {
      throw AppError.validation(
        'Invalid content data', 
        validationResult.errors
      );
    }
    
    // Create content with transaction
    return this.transactionManager.execute(async (transaction) => {
      const content = await this.contentRepository.create({
        creatorId: userId,
        type: data.type,
        title: data.title,
        body: data.body || '',
        mediaUrl: data.mediaUrl,
        additionalMedia: data.additionalMedia,
        battleId: data.battleId,
        tags: data.tags || [],
        status: data.isDraft ? 'draft' : 'published',
        moderation: {
          status: 'pending'
        },
        metadata: {
          categories: data.categories || [],
          location: data.location,
          deviceInfo: data.deviceInfo
        },
        metrics: {
          viewCount: 0,
          commentCount: 0,
          shareCount: 0,
          reactionCounts: {}
        }
      }, transaction);
      
      // Process tags
      if (data.tags?.length) {
        await this.tagService.associateTagsWithContent(
          content.id, data.tags, transaction
        );
      }
      
      // Emit event if content is published (not draft)
      if (!data.isDraft) {
        await this.eventEmitter.emit(EventType.CONTENT_CREATED, {
          contentId: content.id,
          creatorId: userId,
          contentType: data.type,
          timestamp: new Date().toISOString()
        });
      }
      
      return content;
    });
  }

  /**
   * Get content feed with pagination and filtering
   */
  async getContentFeed(
    options: {
      limit?: number;
      cursor?: string;
      filter?: {
        type?: ContentModel['type'][];
        tags?: string[];
        creatorId?: string;
        battleId?: string;
        excludeIds?: string[];
      };
      sort?: 'recent' | 'popular' | 'trending';
    } = {}
  ): Promise<{
    content: ContentModel[];
    hasMore: boolean;
    cursor?: string;
  }> {
    const limit = options.limit || 20;
    const filter = options.filter || {};
    const sort = options.sort || 'recent';
    
    return this.contentRepository.getContentFeed(limit, options.cursor, filter, sort);
  }

  /**
   * Get content by ID with validation and security check
   */
  async getContentById(contentId: string, userId?: string): Promise<ContentModel> {
    const content = await this.contentRepository.findById(contentId);
    
    if (!content) {
      throw new NotFoundError('content', contentId);
    }
    
    // If content is published or archived, any user can view it
    if (content.status === 'published' || content.status === 'archived') {
      // Increment view count if userId is provided
      if (userId) {
        await this.incrementViewCount(contentId, userId);
      }
      return content;
    }
    
    // If content is draft, moderation, or removed, only the creator can view it
    if (userId && content.creatorId === userId) {
      return content;
    }
    
    // Otherwise, content is not accessible
    throw new ForbiddenError('You do not have permission to access this content');
  }

  /**
   * Update existing content with validation and security check
   */
  async updateContent(
    contentId: string, 
    userId: string,
    updates: Partial<ContentCreateInput & { status: 'draft' | 'published' | 'archived' }>
  ): Promise<ContentModel> {
    // Get existing content
    const content = await this.getContentById(contentId, userId);
    
    // Verify ownership
    if (content.creatorId !== userId) {
      throw new ForbiddenError('You do not have permission to update this content');
    }
    
    // Prevent updating removed content
    if (content.status === 'removed') {
      throw new ValidationError('Cannot update removed content');
    }
    
    // Validate updates
    if (updates.title || updates.body || updates.type) {
      const validationResult = this.contentValidator.validateUpdates(updates);
      
      if (!validationResult.success) {
        throw AppError.validation(
          'Invalid content updates', 
          validationResult.errors
        );
      }
    }
    
    return this.transactionManager.execute(async (transaction) => {
      // Prepare update object
      const updateData: Partial<ContentModel> = {
        title: updates.title,
        body: updates.body,
        mediaUrl: updates.mediaUrl,
        additionalMedia: updates.additionalMedia,
        status: updates.status,
        updatedAt: new Date()
      };
      
      // Update metadata if provided
      if (updates.categories || updates.location || updates.deviceInfo) {
        updateData.metadata = {
          ...content.metadata,
          categories: updates.categories || content.metadata.categories,
          location: updates.location || content.metadata.location,
          deviceInfo: updates.deviceInfo || content.metadata.deviceInfo
        };
      }
      
      // If status is changing to published from draft, update moderation status
      if (content.status === 'draft' && updates.status === 'published') {
        updateData.moderation = {
          ...content.moderation,
          status: 'pending'
        };
      }
      
      // Update tags if provided
      if (updates.tags) {
        await this.tagService.updateContentTags(
          contentId, 
          updates.tags, 
          transaction
        );
      }
      
      // Perform update
      const updatedContent = await this.contentRepository.update(contentId, updateData, transaction);
      
      // Emit event if being published for the first time
      if (content.status === 'draft' && updatedContent.status === 'published') {
        await this.eventEmitter.emit(EventType.CONTENT_CREATED, {
          contentId: updatedContent.id,
          creatorId: updatedContent.creatorId,
          contentType: updatedContent.type,
          timestamp: new Date().toISOString()
        });
      } else {
        // Otherwise emit update event
        await this.eventEmitter.emit(EventType.CONTENT_UPDATED, {
          contentId: updatedContent.id,
          creatorId: updatedContent.creatorId,
          updatedFields: Object.keys(updates),
          timestamp: new Date().toISOString()
        });
      }
      
      return updatedContent;
    });
  }

  /**
   * Delete content (soft-delete)
   */
  async deleteContent(contentId: string, userId: string): Promise<void> {
    // Get existing content
    const content = await this.getContentById(contentId, userId);
    
    // Verify ownership
    if (content.creatorId !== userId) {
      throw new ForbiddenError('You do not have permission to delete this content');
    }
    
    // Perform soft-delete
    await this.contentRepository.update(contentId, {
      status: 'removed',
      updatedAt: new Date()
    });
    
    // Emit deletion event
    await this.eventEmitter.emit(EventType.CONTENT_DELETED, {
      contentId,
      creatorId: content.creatorId,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Search content with advanced filtering
   */
  async searchContent(
    query: string,
    options: {
      limit?: number;
      cursor?: string;
      filter?: {
        type?: ContentModel['type'][];
        tags?: string[];
        creatorId?: string;
        battleId?: string;
      };
    } = {}
  ): Promise<{
    content: ContentModel[];
    hasMore: boolean;
    cursor?: string;
  }> {
    const limit = options.limit || 20;
    return this.contentRepository.searchContent(query, limit, options.cursor, options.filter);
  }

  /**
   * Increment view count for content
   */
  private async incrementViewCount(contentId: string, userId: string): Promise<void> {
    // Check if user has already viewed this content recently
    const cacheKey = `view:${contentId}:${userId}`;
    const hasViewed = await this.contentRepository.db.redis?.get(cacheKey);
    
    if (hasViewed) {
      return; // Already counted this view
    }
    
    // Update view count
    await this.contentRepository.incrementViewCount(contentId);
    
    // Set cache to prevent duplicate counts (expire after 24 hours)
    await this.contentRepository.db.redis?.set(cacheKey, '1', 'EX', 86400);
  }

  /**
   * Update content metrics (called after creation or on scheduled job)
   */
  private async updateContentMetrics(contentId: string): Promise<void> {
    // Implementation for updating trending metrics, engagement scores, etc.
    // This would be based on views, reactions, shares, etc.
  }

  /**
   * Check creator achievements based on content
   */
  private async checkCreatorAchievements(creatorId: string): Promise<void> {
    // Implementation for checking achievement criteria
    // E.g., first content created, 10 content pieces, etc.
  }

  /**
   * Add a comment to content
   */
  async addComment(
    contentId: string,
    userId: string,
    commentData: {
      body: string;
      parentId?: string;
    }
  ): Promise<CommentModel> {
    // Verify content exists
    const content = await this.getContentById(contentId);
    
    // Validate comment
    if (!commentData.body.trim()) {
      throw new ValidationError('Comment body is required');
    }
    
    // Check if parent comment exists if specified
    if (commentData.parentId) {
      const parentComment = await this.commentRepository.findById(commentData.parentId);
      
      if (!parentComment) {
        throw new NotFoundError('comment', commentData.parentId);
      }
      
      // Verify parent comment belongs to this content
      if (parentComment.contentId !== contentId) {
        throw new ValidationError('Parent comment does not belong to this content');
      }
    }
    
    // Create the comment
    const comment = await this.commentRepository.create({
      contentId,
      userId,
      body: commentData.body,
      parentId: commentData.parentId,
      status: 'visible',
      metrics: {
        reactionCounts: {}
      }
    });
    
    // Update comment count on content
    await this.contentRepository.incrementCommentCount(contentId);
    
    // Emit event
    await this.eventEmitter.emit(EventType.CONTENT_COMMENT_ADDED, {
      contentId,
      commentId: comment.id,
      userId,
      timestamp: new Date().toISOString()
    });
    
    return comment;
  }

  /**
   * Get comments for content
   */
  async getComments(
    contentId: string,
    threaded = true
  ): Promise<{
    comments: CommentModel[];
    totalCount: number;
  }> {
    // Verify content exists
    await this.getContentById(contentId);
    
    // Get comments
    if (threaded) {
      return this.commentRepository.getThreadedCommentsForContent(contentId);
    } else {
      return this.commentRepository.getCommentsForContent(contentId);
    }
  }

  /**
   * Add or remove a reaction to content
   */
  async toggleReaction(
    contentId: string,
    userId: string,
    reactionType: string
  ): Promise<{
    content: ContentModel;
    added: boolean;
  }> {
    // Verify content exists
    await this.getContentById(contentId);
    
    // Check if reaction already exists
    const { data: existingReaction } = await this.contentRepository.db
      .from('content_reactions')
      .select('id')
      .eq('contentId', contentId)
      .eq('userId', userId)
      .eq('type', reactionType)
      .single();
    
    let added = false;
    
    // Toggle the reaction
    if (existingReaction) {
      // Remove existing reaction
      await this.contentRepository.db
        .from('content_reactions')
        .delete()
        .eq('id', existingReaction.id);
      
      // Update counts
      await this.contentRepository.updateReactionCount(contentId, reactionType, false);
      
      // Emit event
      await this.eventEmitter.emit(EventType.CONTENT_REACTION_REMOVED, {
        contentId,
        userId,
        reactionType,
        timestamp: new Date().toISOString()
      });
    } else {
      // Add new reaction
      await this.contentRepository.db
        .from('content_reactions')
        .insert({
          contentId,
          userId,
          type: reactionType,
          createdAt: new Date()
        });
      
      // Update counts
      await this.contentRepository.updateReactionCount(contentId, reactionType, true);
      
      // Emit event
      await this.eventEmitter.emit(EventType.CONTENT_REACTION_ADDED, {
        contentId,
        userId,
        reactionType,
        timestamp: new Date().toISOString()
      });
      
      added = true;
    }
    
    // Get updated content
    const content = await this.getContentById(contentId);
    
    return { content, added };
  }

  /**
   * Get user reactions to content
   */
  async getUserReactions(
    contentId: string,
    userId: string
  ): Promise<{
    reactionType: string;
    createdAt: Date;
  }[]> {
    const { data, error } = await this.contentRepository.db
      .from('content_reactions')
      .select('type, createdAt')
      .eq('contentId', contentId)
      .eq('userId', userId);
    
    if (error) {
      throw new Error(`Failed to get user reactions: ${error.message}`);
    }
    
    return data.map(r => ({
      reactionType: r.type,
      createdAt: new Date(r.createdAt)
    }));
  }
}
