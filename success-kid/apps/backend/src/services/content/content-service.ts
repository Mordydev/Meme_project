/**
 * Content Service
 * 
 * Core service for managing content creation, retrieval, and engagement
 */
import { v4 as uuidv4 } from 'uuid';
import { sanitizeHtml } from '../../lib/sanitizer';
import { logger } from '../../lib/logger';
import { ContentRepository } from '../../repositories/content-repository';
import { CommentRepository } from '../../repositories/comment-repository';
import { CategoryRepository } from '../../repositories/category-repository';
import { TagRepository } from '../../repositories/tag-repository';
import { UserRepository } from '../../repositories/user-repository';
import { BlobService } from '../blob/blob-service';
import { EnhancedPointsService } from '../points/points-service-enhanced';
import { NotificationService } from '../notifications/notification-service';
import { EventBus, EventType } from '../../lib/event-bus';
import { 
  Content, 
  CreateContentDto, 
  UpdateContentDto, 
  ContentListItem, 
  ContentResponseDto 
} from '../../models/entities/content.model';
import {
  Comment,
  CreateCommentDto,
  UpdateCommentDto,
  CommentThread
} from '../../models/entities/comment.model';
import {
  NotFoundError,
  ValidationError,
  ForbiddenError,
  ContentCreationFailedError,
  ContentModerationRequiredError
} from '../../errors';
import { ModerationService } from '../moderation/moderation-service';

/**
 * Content feed options
 */
export interface ContentFeedOptions {
  lastId?: string;
  lastCreatedAt?: Date;
  limit?: number;
  type?: string;
  categoryId?: string;
  userId?: string;
  tags?: string[];
}

/**
 * Comment options for retrieval
 */
export interface CommentOptions {
  limit?: number;
  offset?: number;
  threaded?: boolean;
  includeDeleted?: boolean;
}

/**
 * Core service for managing content
 */
export class ContentService {
  /**
   * Create a new ContentService
   * 
   * @param contentRepository Repository for content data
   * @param commentRepository Repository for comment data
   * @param categoryRepository Repository for category data
   * @param tagRepository Repository for tag data
   * @param userRepository Repository for user data
   * @param blobService Service for managing blob storage
   * @param pointsService Service for managing points
   * @param notificationService Service for sending notifications
   * @param moderationService Service for content moderation
   * @param eventBus Event bus for publishing events
   */
  constructor(
    private contentRepository: ContentRepository,
    private commentRepository: CommentRepository,
    private categoryRepository: CategoryRepository,
    private tagRepository: TagRepository,
    private userRepository: UserRepository,
    private blobService: BlobService,
    private pointsService: EnhancedPointsService,
    private notificationService: NotificationService,
    private moderationService: ModerationService,
    private eventBus: EventBus
  ) {}

  /**
   * Create new content
   * 
   * @param userId User ID
   * @param data Content data
   * @returns Created content
   */
  async createContent(userId: string, data: CreateContentDto): Promise<ContentResponseDto> {
    try {
      // Sanitize text content for security
      if (data.content_text) {
        data.content_text = sanitizeHtml(data.content_text);
      }

      // Handle link type content
      if (data.type === 'link' && data.link_url) {
        // Additional link validation/enrichment could be done here
        // For example, fetching metadata from the link
      }

      // Handle poll type content
      if (data.type === 'poll' && data.poll_options) {
        // Ensure poll options are valid
        if (!Array.isArray(data.poll_options) || data.poll_options.length < 2) {
          throw new ValidationError('Poll must have at least 2 options');
        }

        // Initialize poll option votes
        data.poll_options = data.poll_options.map(option => ({
          ...option,
          votes: 0
        }));
      }

      // Process tags if provided
      let tagIds: string[] = [];
      if (data.tags && data.tags.length > 0) {
        const tags = await this.tagRepository.findOrCreateTags(data.tags);
        tagIds = tags.map(tag => tag.id);
      }

      // Check if content needs moderation
      const moderationResult = await this.moderationService.checkContent(data);
      if (moderationResult.requiresModeration) {
        throw new ContentModerationRequiredError(moderationResult.reason || 'Content requires moderation');
      }

      // Generate a new UUID for the content
      const contentId = uuidv4();

      // Create the content
      const content = await this.contentRepository.createContent({
        ...data,
        id: contentId,
        user_id: userId
      });

      // Associate tags if any
      if (tagIds.length > 0) {
        await this.tagRepository.tagContent(contentId, tagIds);
      }

      // Award points for content creation
      await this.pointsService.awardPoints({
        userId,
        amount: this.getPointsForContentType(data.type),
        source: 'content_creation',
        referenceId: contentId
      });

      // Emit content created event
      await this.eventBus.publish(EventType.CONTENT_CREATED, {
        contentId,
        userId,
        contentType: data.type,
        categoryId: data.category_id
      });

      // Get the complete content with details
      const contentWithDetails = await this.getContentById(contentId);
      
      logger.info(`User ${userId} created new content ${contentId} of type ${data.type}`);
      return contentWithDetails as ContentResponseDto;
    } catch (error) {
      logger.error('Error creating content', { userId, error });
      if (error instanceof ValidationError || error instanceof ContentModerationRequiredError) {
        throw error;
      }
      throw new ContentCreationFailedError('Failed to create content', error);
    }
  }

  /**
   * Update existing content
   * 
   * @param contentId Content ID
   * @param userId User ID (for authorization)
   * @param data Content data to update
   * @returns Updated content
   */
  async updateContent(contentId: string, userId: string, data: UpdateContentDto): Promise<ContentResponseDto> {
    try {
      // Get existing content to check ownership
      const existingContent = await this.contentRepository.findById(contentId);
      if (!existingContent) {
        throw new NotFoundError('Content', contentId);
      }

      // Check ownership
      if (existingContent.user_id !== userId) {
        throw new ForbiddenError('You can only update your own content');
      }

      // Check status
      if (existingContent.status !== 'active') {
        throw new ValidationError(`Cannot update content with status: ${existingContent.status}`);
      }

      // Sanitize text content for security
      if (data.content_text) {
        data.content_text = sanitizeHtml(data.content_text);
      }

      // Process tags if provided
      if (data.tags && data.tags.length > 0) {
        const tags = await this.tagRepository.findOrCreateTags(data.tags);
        await this.tagRepository.tagContent(contentId, tags.map(tag => tag.id));
      }

      // Update the content
      await this.contentRepository.updateContent(contentId, data);

      // Get the updated content with details
      const updatedContent = await this.getContentById(contentId);
      
      logger.info(`User ${userId} updated content ${contentId}`);
      return updatedContent as ContentResponseDto;
    } catch (error) {
      logger.error('Error updating content', { contentId, userId, error });
      // Re-throw known errors
      if (error instanceof NotFoundError || error instanceof ForbiddenError || error instanceof ValidationError) {
        throw error;
      }
      // Wrap unknown errors
      throw new Error(`Failed to update content: ${error.message}`);
    }
  }

  /**
   * Delete content (soft delete)
   * 
   * @param contentId Content ID
   * @param userId User ID (for authorization)
   * @returns True if deleted successfully
   */
  async deleteContent(contentId: string, userId: string): Promise<boolean> {
    try {
      // Get existing content to check ownership
      const existingContent = await this.contentRepository.findById(contentId);
      if (!existingContent) {
        throw new NotFoundError('Content', contentId);
      }

      // Check ownership
      if (existingContent.user_id !== userId) {
        throw new ForbiddenError('You can only delete your own content');
      }

      // Soft delete the content
      const deleted = await this.contentRepository.softDeleteContent(contentId);
      
      if (deleted) {
        // Emit content deleted event
        await this.eventBus.publish(EventType.CONTENT_DELETED, {
          contentId,
          userId
        });
        
        logger.info(`User ${userId} deleted content ${contentId}`);
      }
      
      return deleted;
    } catch (error) {
      logger.error('Error deleting content', { contentId, userId, error });
      // Re-throw known errors
      if (error instanceof NotFoundError || error instanceof ForbiddenError) {
        throw error;
      }
      // Wrap unknown errors
      throw new Error(`Failed to delete content: ${error.message}`);
    }
  }

  /**
   * Get content by ID with comments and details
   * 
   * @param contentId Content ID
   * @returns Content with details
   */
  async getContentById(contentId: string): Promise<ContentResponseDto | null> {
    try {
      // Get content with author details
      const content = await this.contentRepository.getContentWithDetails(contentId);
      if (!content) {
        return null;
      }

      // Get content tags
      const tags = await this.tagRepository.getContentTags(contentId);

      // Get category if available
      let category = null;
      if (content.category_id) {
        category = await this.categoryRepository.findById(content.category_id);
      }

      // Enhance with tags and category
      const enhancedContent: ContentResponseDto = {
        ...content as any,
        tags: tags.map(tag => ({
          id: tag.id,
          name: tag.name,
          slug: tag.slug,
          color: tag.color
        })),
        category: category ? {
          id: category.id,
          name: category.name,
          slug: category.slug
        } : null
      };

      return enhancedContent;
    } catch (error) {
      logger.error('Error getting content by ID', { contentId, error });
      throw error;
    }
  }

  /**
   * Get content feed
   * 
   * @param options Feed options
   * @returns Array of content items
   */
  async getContentFeed(options: ContentFeedOptions = {}): Promise<ContentListItem[]> {
    try {
      return await this.contentRepository.getContentFeed(options);
    } catch (error) {
      logger.error('Error getting content feed', { options, error });
      throw error;
    }
  }

  /**
   * Get content by category
   * 
   * @param categoryId Category ID
   * @param options Feed options
   * @returns Array of content items
   */
  async getContentByCategory(categoryId: string, options: Omit<ContentFeedOptions, 'categoryId'> = {}): Promise<ContentListItem[]> {
    try {
      // Verify category exists
      const category = await this.categoryRepository.findById(categoryId);
      if (!category) {
        throw new NotFoundError('Category', categoryId);
      }

      // Get content feed with category filter
      return await this.contentRepository.getContentFeed({
        ...options,
        categoryId
      });
    } catch (error) {
      logger.error('Error getting content by category', { categoryId, options, error });
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new Error(`Failed to get content by category: ${error.message}`);
    }
  }

  /**
   * Get content by tag
   * 
   * @param tagSlug Tag slug
   * @param options Feed options
   * @returns Array of content items
   */
  async getContentByTag(tagSlug: string, options: Omit<ContentFeedOptions, 'tags'> = {}): Promise<ContentListItem[]> {
    try {
      // Verify tag exists
      const tag = await this.tagRepository.getTagBySlug(tagSlug);
      if (!tag) {
        throw new NotFoundError('Tag', tagSlug);
      }

      // Get content IDs with this tag
      const contentWithTag = await this.db.query(`
        SELECT content_id
        FROM content_tags
        WHERE tag_id = $1
      `, [tag.id]);

      const contentIds = contentWithTag.rows.map(row => row.content_id);
      
      // If no content has this tag, return empty array
      if (contentIds.length === 0) {
        return [];
      }

      // Get content details for these IDs
      const contentItems = await Promise.all(
        contentIds.map(id => this.contentRepository.getContentWithDetails(id))
      );

      // Filter out null results and map to content list items
      return contentItems
        .filter(Boolean)
        .map(content => ({
          id: content.id,
          user_id: content.user_id,
          type: content.type,
          content_text: content.content_text,
          media_urls: content.media_urls,
          created_at: content.created_at,
          status: content.status,
          author: (content as any).author,
          stats: (content as any).stats
        }));
    } catch (error) {
      logger.error('Error getting content by tag', { tagSlug, options, error });
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new Error(`Failed to get content by tag: ${error.message}`);
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
      return await this.contentRepository.searchContent(searchText, options);
    } catch (error) {
      logger.error('Error searching content', { searchText, options, error });
      throw error;
    }
  }

  /**
   * Create a comment on content
   * 
   * @param userId User ID
   * @param data Comment data
   * @returns Created comment
   */
  async createComment(userId: string, data: CreateCommentDto): Promise<Comment> {
    try {
      // Check if content exists
      const content = await this.contentRepository.findById(data.content_id);
      if (!content) {
        throw new NotFoundError('Content', data.content_id);
      }

      // Check if parent comment exists if provided
      if (data.parent_id) {
        const parentComment = await this.commentRepository.findById(data.parent_id);
        if (!parentComment) {
          throw new NotFoundError('Parent comment', data.parent_id);
        }
        // Ensure parent comment belongs to the same content
        if (parentComment.content_id !== data.content_id) {
          throw new ValidationError('Parent comment does not belong to the specified content');
        }
      }

      // Sanitize comment text
      data.comment_text = sanitizeHtml(data.comment_text);

      // Check if comment needs moderation
      const moderationResult = await this.moderationService.checkComment({
        comment_text: data.comment_text
      });
      if (moderationResult.requiresModeration) {
        throw new ContentModerationRequiredError(moderationResult.reason || 'Comment requires moderation');
      }

      // Create the comment
      const comment = await this.commentRepository.createComment({
        ...data,
        user_id: userId
      });

      // Award points for comment creation
      await this.pointsService.awardPoints({
        userId,
        amount: 15, // Points for commenting
        source: 'comment',
        referenceId: comment.id
      });

      // Award points to content creator for receiving a comment (if not self-comment)
      if (content.user_id !== userId) {
        await this.pointsService.awardPoints({
          userId: content.user_id,
          amount: 5, // Points for receiving a comment
          source: 'comment_received',
          referenceId: comment.id
        });
      }

      // Emit comment created event
      await this.eventBus.publish(EventType.COMMENT_CREATED, {
        commentId: comment.id,
        contentId: data.content_id,
        userId,
        contentUserId: content.user_id
      });
      
      logger.info(`User ${userId} commented on content ${data.content_id}`);
      return comment;
    } catch (error) {
      logger.error('Error creating comment', { userId, contentId: data.content_id, error });
      // Re-throw known errors
      if (error instanceof NotFoundError || error instanceof ValidationError || error instanceof ContentModerationRequiredError) {
        throw error;
      }
      // Wrap unknown errors
      throw new Error(`Failed to create comment: ${error.message}`);
    }
  }

  /**
   * Update a comment
   * 
   * @param commentId Comment ID
   * @param userId User ID (for authorization)
   * @param data Comment data to update
   * @returns Updated comment
   */
  async updateComment(commentId: string, userId: string, data: UpdateCommentDto): Promise<Comment | null> {
    try {
      // Get existing comment to check ownership
      const existingComment = await this.commentRepository.findById(commentId);
      if (!existingComment) {
        throw new NotFoundError('Comment', commentId);
      }

      // Check ownership
      if (existingComment.user_id !== userId) {
        throw new ForbiddenError('You can only update your own comments');
      }

      // Check status
      if (existingComment.status !== 'active') {
        throw new ValidationError(`Cannot update comment with status: ${existingComment.status}`);
      }

      // Sanitize comment text
      if (data.comment_text) {
        data.comment_text = sanitizeHtml(data.comment_text);

        // Check if updated comment needs moderation
        const moderationResult = await this.moderationService.checkComment({
          comment_text: data.comment_text
        });
        if (moderationResult.requiresModeration) {
          throw new ContentModerationRequiredError(moderationResult.reason || 'Updated comment requires moderation');
        }
      }

      // Update the comment
      const updatedComment = await this.commentRepository.updateComment(commentId, data);
      
      logger.info(`User ${userId} updated comment ${commentId}`);
      return updatedComment;
    } catch (error) {
      logger.error('Error updating comment', { commentId, userId, error });
      // Re-throw known errors
      if (error instanceof NotFoundError || error instanceof ForbiddenError || error instanceof ValidationError || error instanceof ContentModerationRequiredError) {
        throw error;
      }
      // Wrap unknown errors
      throw new Error(`Failed to update comment: ${error.message}`);
    }
  }

  /**
   * Delete a comment (soft delete)
   * 
   * @param commentId Comment ID
   * @param userId User ID (for authorization)
   * @returns True if deleted successfully
   */
  async deleteComment(commentId: string, userId: string): Promise<boolean> {
    try {
      // Get existing comment to check ownership
      const existingComment = await this.commentRepository.findById(commentId);
      if (!existingComment) {
        throw new NotFoundError('Comment', commentId);
      }

      // Check ownership
      if (existingComment.user_id !== userId) {
        throw new ForbiddenError('You can only delete your own comments');
      }

      // Soft delete the comment
      const deleted = await this.commentRepository.softDeleteComment(commentId);
      
      if (deleted) {
        // Emit comment deleted event
        await this.eventBus.publish(EventType.COMMENT_DELETED, {
          commentId,
          contentId: existingComment.content_id,
          userId
        });
        
        logger.info(`User ${userId} deleted comment ${commentId}`);
      }
      
      return deleted;
    } catch (error) {
      logger.error('Error deleting comment', { commentId, userId, error });
      // Re-throw known errors
      if (error instanceof NotFoundError || error instanceof ForbiddenError) {
        throw error;
      }
      // Wrap unknown errors
      throw new Error(`Failed to delete comment: ${error.message}`);
    }
  }

  /**
   * Get comments for content
   * 
   * @param contentId Content ID
   * @param options Comment retrieval options
   * @returns Array of comments
   */
  async getContentComments(contentId: string, options: CommentOptions = {}): Promise<Comment[] | CommentThread[]> {
    try {
      // Check if content exists
      const content = await this.contentRepository.findById(contentId);
      if (!content) {
        throw new NotFoundError('Content', contentId);
      }

      return await this.commentRepository.getContentComments(contentId, options);
    } catch (error) {
      logger.error('Error getting content comments', { contentId, options, error });
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new Error(`Failed to get content comments: ${error.message}`);
    }
  }

  /**
   * Get points value for content type
   * 
   * @param contentType Content type
   * @returns Points value
   */
  private getPointsForContentType(contentType: string): number {
    const pointsMap: Record<string, number> = {
      'text': 50,
      'image': 75,
      'link': 40,
      'poll': 60
    };
    
    return pointsMap[contentType] || 50; // Default to 50 if type not found
  }

  /**
   * Get database instance for custom queries
   */
  private get db() {
    return this.contentRepository['db'];
  }
}
