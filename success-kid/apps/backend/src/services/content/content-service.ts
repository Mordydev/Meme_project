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
import { MediaService } from '../media/media-service';
import { EnhancedPointsService } from '../points';
import { ModerationService } from '../moderation/moderation-service';
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
  CommentThread,
} from '../../models/entities/comment.model';
import { NewComment } from '../../database/schema/comments';
import {
  NotFoundError,
  ValidationError,
  ForbiddenError,
  ContentCreationFailedError,
  ContentModerationRequiredError
} from '../../errors';
import { ReactionService } from './reaction/reaction-service';
import type { PointsSource } from '../../models/entities/points.model';
import { NewContent } from '../../database/schema/content';

// Dependencies are now injected through constructor
export class ContentService {
  constructor(
    private contentRepository: ContentRepository,
    private commentRepository: CommentRepository,
    private categoryRepository: CategoryRepository,
    private tagRepository: TagRepository,
    private pointsService: EnhancedPointsService,
    private moderationService: ModerationService,
    private mediaService: MediaService, // Add Media Service
    private eventBus: EventBus,
    private reactionService?: ReactionService // Optional, as it might be injected later
  ) {}

  /**
   * Create new content
   *
   * @param userId User ID
   * @param data Content data DTO
   * @returns Created content response DTO
   */
  async createContent(userId: string, data: CreateContentDto): Promise<ContentResponseDto> {
    try {
      // Sanitize text content for security
      let sanitizedText: string | null | undefined = data.contentText;
      if (sanitizedText) {
        sanitizedText = sanitizeHtml(sanitizedText);
      }

      // Handle link type content
      if (data.type === 'link' && data.linkUrl) {
        // Additional link validation/enrichment could be done here
      }

      // Handle poll type content
      let sanitizedPollOptions = data.pollOptions;
      if (data.type === 'poll' && sanitizedPollOptions) {
        if (!Array.isArray(sanitizedPollOptions) || sanitizedPollOptions.length < 2) {
          throw new ValidationError('Poll must have at least 2 options');
        }
        // Ensure options are sanitized and add an ID
        sanitizedPollOptions = sanitizedPollOptions.map((option: { text: string; [key: string]: any }) => ({
          id: uuidv4(), // Add an ID for the option
          text: sanitizeHtml(option.text),
          votes: 0
        }));
      }

      // Validate media URLs if provided
      if (data.mediaUrls && data.mediaUrls.length > 0) {
        // Verify that all media URLs exist and belong to the user
        for (const mediaUrl of data.mediaUrls) {
          // Use mediaService to verify the media exists
          const mediaExists = await this.verifyMediaBelongsToUser(mediaUrl, userId);
          if (!mediaExists) {
            throw new ValidationError(`Media URL not found or not owned by user: ${mediaUrl}`);
          }
        }
      }

      // Process tags if provided
      let tagIds: string[] = [];
      if (data.tags && data.tags.length > 0) {
        const tags = await this.tagRepository.findOrCreateTags(data.tags);
        tagIds = tags.map(tag => tag.id);
      }

      // Check if content needs moderation
      const moderationResult = await this.moderationService.checkContent({
          content_text: sanitizedText,
      });
      if (moderationResult.requiresModeration) {
        throw new ContentModerationRequiredError(moderationResult.reason || 'Content requires moderation');
      }

      // Generate a new UUID for the content
      const contentId = uuidv4();

      // Prepare data for repository
      const repoData: NewContent = {
          id: contentId,
          userId: userId,
          type: data.type,
          contentText: sanitizedText,
          mediaUrls: data.mediaUrls || [],
          metadata: {
              ...(data.metadata || {}),
              ...(data.type === 'poll' && { pollOptions: sanitizedPollOptions }),
              ...(data.type === 'link' && { linkUrl: data.linkUrl })
          },
          status: 'active'
      };

      // Create the content
      const content = await this.contentRepository.createContent(repoData);

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
      });

      // Get the complete content with details
      const contentWithDetails = await this.getContentById(contentId);

      logger.info(`User ${userId} created new content ${contentId} of type ${data.type}`);
      if (!contentWithDetails) {
          throw new Error('Failed to retrieve created content details');
      }
      return contentWithDetails;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Error creating content', { userId, error: errorMessage });
      if (error instanceof ValidationError || error instanceof ContentModerationRequiredError) {
        throw error;
      }
      throw new ContentCreationFailedError(`Failed to create content: ${errorMessage}`, error instanceof Error ? error : undefined);
    }
  }

  /**
   * Update existing content
   *
   * @param contentId Content ID
   * @param userId User ID (for authorization)
   * @param data Content data DTO
   * @returns Updated content response DTO
   */
  async updateContent(contentId: string, userId: string, data: UpdateContentDto): Promise<ContentResponseDto> {
    try {
      // Get existing content to check ownership
      const existingContent = await this.contentRepository.findById(contentId);
      if (!existingContent) {
        throw new NotFoundError('Content', contentId);
      }

      // Check ownership
      if (existingContent.userId !== userId) {
        throw new ForbiddenError('You can only update your own content');
      }

      // Check status
      if (existingContent.status !== 'active') {
        throw new ValidationError(`Cannot update content with status: ${existingContent.status}`);
      }

      // Sanitize text content for security
      let sanitizedText: string | undefined = undefined;
      if (data.contentText) {
        sanitizedText = sanitizeHtml(data.contentText);
      }

      // Validate media URLs if updated
      if (data.mediaUrls && data.mediaUrls.length > 0) {
        // Verify that all media URLs exist and belong to the user
        for (const mediaUrl of data.mediaUrls) {
          const mediaExists = await this.verifyMediaBelongsToUser(mediaUrl, userId);
          if (!mediaExists) {
            throw new ValidationError(`Media URL not found or not owned by user: ${mediaUrl}`);
          }
        }
      }

      // Process tags if provided
      if (data.tags && data.tags.length > 0) {
        const tags = await this.tagRepository.findOrCreateTags(data.tags);
        await this.tagRepository.tagContent(contentId, tags.map(tag => tag.id));
      }

      // Prepare data for repository update
      const updateData: Partial<NewContent> = {
          contentText: sanitizedText,
          mediaUrls: data.mediaUrls,
          metadata: data.metadata,
          status: data.status,
      };

      // Update the content
      await this.contentRepository.updateContent(contentId, updateData);

      // Emit event
       await this.eventBus.publish(EventType.CONTENT_UPDATED, { contentId, userId });

      // Get the updated content with details
      const updatedContent = await this.getContentById(contentId);

      logger.info(`User ${userId} updated content ${contentId}`);
       if (!updatedContent) {
          throw new Error('Failed to retrieve updated content details');
      }
      return updatedContent;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Error updating content', { contentId, userId, error: errorMessage });
      if (error instanceof NotFoundError || error instanceof ForbiddenError || error instanceof ValidationError) {
        throw error;
      }
      throw new Error(`Failed to update content: ${errorMessage}`);
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
      if (existingContent.userId !== userId) {
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
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Error deleting content', { contentId, userId, error: errorMessage });
      if (error instanceof NotFoundError || error instanceof ForbiddenError) {
        throw error;
      }
      throw new Error(`Failed to delete content: ${errorMessage}`);
    }
  }

  /**
   * Get content by ID with comments and details
   *
   * @param contentId Content ID
   * @returns Content with details DTO or null
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

      // Enhance with tags and category
      const enhancedContent: ContentResponseDto = {
        ...content, // Spread the result which includes author (camelCase)
        tags: tags.map(tag => ({
          id: tag.id,
          name: tag.name,
          slug: tag.slug,
          color: tag.color
        })),
        category: null // Set to null as categoryId doesn't exist
      };

      return enhancedContent;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Error getting content by ID', { contentId, error: errorMessage });
      throw new Error(`Failed to get content by ID: ${errorMessage}`);
    }
  }

  /**
   * Create a comment on content
   *
   * @param userId User ID
   * @param data Comment data DTO
   * @returns Created comment
   */
  async createComment(userId: string, data: CreateCommentDto): Promise<Comment> {
    try {
      // Check if content exists
      const content = await this.contentRepository.findById(data.contentId);
      if (!content) {
        throw new NotFoundError('Content', data.contentId);
      }

      // Check if parent comment exists if provided
      if (data.parentId) {
        const parentComment = await this.commentRepository.findById(data.parentId);
        if (!parentComment) {
          throw new NotFoundError('Parent comment', data.parentId);
        }
        if (parentComment.contentId !== data.contentId) {
          throw new ValidationError('Parent comment does not belong to the specified content');
        }
      }

      // Sanitize comment text
      let sanitizedCommentText: string | null | undefined = data.commentText;
      if (sanitizedCommentText) {
        sanitizedCommentText = sanitizeHtml(sanitizedCommentText);
      } else {
         throw new ValidationError('Comment text cannot be empty');
      }

      // Check if comment needs moderation
      const commentModerationResult = await this.moderationService.checkComment({
        comment_text: sanitizedCommentText
      });
      if (commentModerationResult.requiresModeration) {
        throw new ContentModerationRequiredError(commentModerationResult.reason || 'Comment requires moderation');
      }

      // Prepare data for repository
      const repoData: NewComment = {
          contentId: data.contentId,
          userId: userId,
          parentId: data.parentId,
          commentText: sanitizedCommentText,
          status: 'active'
      };

      // Create the comment
      const comment = await this.commentRepository.createComment(repoData);

      // Award points for comment creation
      await this.pointsService.awardPoints({
        userId,
        amount: 15, // Points for commenting
        source: 'comment',
        referenceId: comment.id
      });

      // Award points to content creator for receiving a comment (if not self-comment)
      if (content.userId !== userId) {
        await this.pointsService.awardPoints({
          userId: content.userId,
          amount: 5, // Points for receiving a comment
          source: 'reaction_received',
          referenceId: comment.id
        });
      }

      // Emit comment added event
      await this.eventBus.publish(EventType.COMMENT_ADDED, {
        commentId: comment.id,
        contentId: data.contentId,
        userId,
        contentUserId: content.userId
      });

      logger.info(`User ${userId} commented on content ${data.contentId}`);
      return comment;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Error creating comment', { userId, contentId: data.contentId, error: errorMessage });
      if (error instanceof NotFoundError || error instanceof ValidationError || error instanceof ContentModerationRequiredError) {
        throw error;
      }
      throw new Error(`Failed to create comment: ${errorMessage}`);
    }
  }

  /**
   * Update a comment
   *
   * @param commentId Comment ID
   * @param userId User ID (for authorization)
   * @param data Comment data DTO
   * @returns Updated comment or null
   */
  async updateComment(commentId: string, userId: string, data: UpdateCommentDto): Promise<Comment | null> {
    try {
      // Get existing comment to check ownership
      const existingComment = await this.commentRepository.findById(commentId);
      if (!existingComment) {
        throw new NotFoundError('Comment', commentId);
      }

      // Check ownership
      if (existingComment.userId !== userId) {
        throw new ForbiddenError('You can only update your own comments');
      }

      // Check status
      if (existingComment.status !== 'active') {
        throw new ValidationError(`Cannot update comment with status: ${existingComment.status}`);
      }

      // Sanitize comment text
      let sanitizedCommentText: string | undefined = undefined;
      if (data.commentText) {
        sanitizedCommentText = sanitizeHtml(data.commentText);

        // Check if updated comment needs moderation
        const updateModerationResult = await this.moderationService.checkComment({
          comment_text: sanitizedCommentText
        });
        if (updateModerationResult.requiresModeration) {
          throw new ContentModerationRequiredError(updateModerationResult.reason || 'Updated comment requires moderation');
        }
      }

      // Prepare update data
      const updateData: Partial<NewComment> = {};
      if (sanitizedCommentText !== undefined) {
          updateData.commentText = sanitizedCommentText;
      }
      if (data.status !== undefined) {
          updateData.status = data.status;
      }

      // Check if there's anything to update
      if (Object.keys(updateData).length === 0) {
          logger.warn('Update comment called with no data to update', { commentId });
          return existingComment; // Return current comment if no changes
      }

      // Update the comment
      const updatedComment = await this.commentRepository.updateComment(commentId, updateData);

      // Emit event
      await this.eventBus.publish(EventType.COMMENT_UPDATED, { commentId, userId });

      logger.info(`User ${userId} updated comment ${commentId}`);
      return updatedComment;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Error updating comment', { commentId, userId, error: errorMessage });
      if (error instanceof NotFoundError || error instanceof ForbiddenError || error instanceof ValidationError || error instanceof ContentModerationRequiredError) {
        throw error;
      }
      throw new Error(`Failed to update comment: ${errorMessage}`);
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
      if (existingComment.userId !== userId) {
        throw new ForbiddenError('You can only delete your own comments');
      }

      // Soft delete the comment
      const deleted = await this.commentRepository.softDeleteComment(commentId);

      if (deleted) {
        // Emit comment deleted event
        await this.eventBus.publish(EventType.COMMENT_DELETED, {
          commentId,
          contentId: existingComment.contentId,
          userId
        });

        logger.info(`User ${userId} deleted comment ${commentId}`);
      }

      return deleted;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Error deleting comment', { commentId, userId, error: errorMessage });
      if (error instanceof NotFoundError || error instanceof ForbiddenError) {
        throw error;
      }
      throw new Error(`Failed to delete comment: ${errorMessage}`);
    }
  }

  /**
   * Get comments for content
   *
   * @param contentId Content ID
   * @param options Comment retrieval options
   * @returns Array of comments or comment threads
   */
  async getContentComments(contentId: string, options: CommentOptions = {}): Promise<Comment[] | CommentThread[]> {
    try {
      // Check if content exists
      const content = await this.contentRepository.findById(contentId);
      if (!content) {
        throw new NotFoundError('Content', contentId);
      }

      return await this.commentRepository.getContentComments(contentId, options);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Error getting content comments', { contentId, options, error: errorMessage });
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new Error(`Failed to get content comments: ${errorMessage}`);
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
   * Verify that a media URL exists and belongs to the user
   * 
   * @param mediaUrl URL of the media to verify
   * @param userId User ID that should own the media
   * @returns True if media exists and belongs to the user
   */
  private async verifyMediaBelongsToUser(mediaUrl: string, userId: string): Promise<boolean> {
    try {
      // Extract ID or path from the URL
      // This implementation will depend on how your MediaService stores and retrieves media
      // For now, we'll simply check if the media exists by using mediaService
      
      // Assume mediaService has a method to get media by URL or ID
      // This is a placeholder implementation - adjust based on actual MediaService implementation
      const media = await this.mediaService.getMediaByUrl(mediaUrl);
      
      if (!media) {
        logger.warn(`Media not found: ${mediaUrl}`);
        return false;
      }
      
      // Check ownership
      if (media.userId !== userId) {
        logger.warn(`Media ${mediaUrl} belongs to user ${media.userId}, not ${userId}`);
        return false;
      }
      
      return true;
    } catch (error) {
      logger.error(`Error verifying media ownership: ${error}`);
      return false;
    }
  }
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
