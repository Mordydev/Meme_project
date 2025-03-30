/**
 * Content Service
 *
 * Core service for managing content creation, retrieval, and engagement
 */
import { v4 as uuidv4 } from 'uuid';
import { sanitizeHtml } from '../../lib/sanitizer'; // Corrected path
import { logger } from '../../lib/logger';
import { ContentRepository, contentRepository } from '../../repositories/content-repository';
import { CommentRepository } from '../../repositories/comment-repository'; // Import class
import { CategoryRepository } from '../../repositories/category-repository'; // Import class
import { TagRepository, tagRepository } from '../../repositories/tag-repository';
import { UserRepository, userRepository } from '../../repositories/user-repository';
import { BlobService, blobService } from '../blob';
import { EnhancedPointsService, pointsService } from '../points';
import { NotificationService } from '../notifications/notification-service'; // Import class
import { EventBus, EventType, eventBus } from '../../lib/event-bus';
import {
  Content,
  CreateContentDto,
  UpdateContentDto,
  ContentListItem, // Assuming this type is defined elsewhere or locally if needed
  ContentResponseDto
} from '../../models/entities/content.model';
import {
  Comment,
  CreateCommentDto,
  UpdateCommentDto,
  CommentThread,
  // NewComment type is defined in the schema file
} from '../../models/entities/comment.model';
// Correct import path for schema again
import { NewComment } from '../../database/schema/comments'; 
import {
  NotFoundError,
  ValidationError,
  ForbiddenError,
  ContentCreationFailedError,
  ContentModerationRequiredError
} from '../../errors';
import { ModerationService } from '../moderation/moderation-service'; // Import class
import { ReactionService } from './reaction/reaction-service'; // Import ReactionService
// PointsSource type is imported, but values are used as strings
import { PointsSource } from '../../models/entities/points.model';
import { NewContent } from '../../database/schema/content';

// TODO: Replace these declarations with actual dependency injection or service location
// These placeholders assume instances are available in the scope where ContentService is instantiated.
declare const commentRepository: CommentRepository;
declare const categoryRepository: CategoryRepository;
declare const notificationService: NotificationService;
declare const moderationService: ModerationService;
declare const reactionService: ReactionService; // Add placeholder declaration

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
  // Constructor removed - dependencies are imported singletons or passed to methods

  /**
   * Create new content
   *
   * @param userId User ID
   * @param data Content data DTO (assuming snake_case)
   * @returns Created content response DTO
   */
  async createContent(userId: string, data: CreateContentDto): Promise<ContentResponseDto> {
    try {
      // Sanitize text content for security
      let sanitizedText: string | null | undefined = data.contentText; // Use camelCase from DTO
      if (sanitizedText) {
        sanitizedText = sanitizeHtml(sanitizedText);
      }

      // Handle link type content
      if (data.type === 'link' && data.linkUrl) { // Use camelCase from DTO
        // Additional link validation/enrichment could be done here
      }

      // Handle poll type content
      let sanitizedPollOptions = data.pollOptions; // Use camelCase from DTO
      if (data.type === 'poll' && sanitizedPollOptions) {
        if (!Array.isArray(sanitizedPollOptions) || sanitizedPollOptions.length < 2) {
          throw new ValidationError('Poll must have at least 2 options');
        }
        // Ensure options are sanitized and add an ID
        sanitizedPollOptions = sanitizedPollOptions.map((option: { text: string; [key: string]: any }) => ({
          id: uuidv4(), // Add an ID for the option
          text: sanitizeHtml(option.text),
          votes: 0
          // Removed ...option spread
        }));
      }

      // Process tags if provided (assuming data.tags is camelCase or correctly mapped)
      let tagIds: string[] = [];
      if (data.tags && data.tags.length > 0) {
        const tags = await tagRepository.findOrCreateTags(data.tags);
        tagIds = tags.map(tag => tag.id);
      }

      // Check if content needs moderation
      const moderationResult = await moderationService.checkContent({
          content_text: sanitizedText, // Pass sanitized text
          // Map other relevant fields if needed by moderation service
      });
      if (moderationResult.requiresModeration) {
        throw new ContentModerationRequiredError(moderationResult.reason || 'Content requires moderation');
      }

      // Generate a new UUID for the content
      const contentId = uuidv4();

      // Prepare data for repository (NewContent uses camelCase)
      const repoData: NewContent = {
          id: contentId,
          userId: userId,
          type: data.type,
          contentText: sanitizedText, // Use sanitized camelCase version
          mediaUrls: data.mediaUrls, // Map from camelCase DTO
          metadata: { // Store poll options/link in metadata (camelCase keys)
              ...(data.metadata || {}), // Keep original metadata
              ...(data.type === 'poll' && { pollOptions: sanitizedPollOptions }), // Use sanitized camelCase version
              ...(data.type === 'link' && { linkUrl: data.linkUrl }) // Map from camelCase DTO
          },
          // categoryId: data.categoryId, // Map from camelCase DTO - Field does not exist in content schema
          status: 'active'
      };

      // Create the content
      const content = await contentRepository.createContent(repoData);

      // Associate tags if any
      if (tagIds.length > 0) {
        await tagRepository.tagContent(contentId, tagIds);
      }

      // Award points for content creation
      await pointsService.awardPoints({
        userId,
        amount: this.getPointsForContentType(data.type),
        source: PointsSource.CONTENT_CREATION, // Use enum value
        referenceId: contentId
      });

      // Emit content created event
      await eventBus.publish(EventType.CONTENT_CREATED, {
        contentId,
        userId,
        contentType: data.type,
        // categoryId: data.categoryId // Map from camelCase DTO - Removed
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
   * @param data Content data DTO (assuming snake_case)
   * @returns Updated content response DTO
   */
  async updateContent(contentId: string, userId: string, data: UpdateContentDto): Promise<ContentResponseDto> {
    try {
      // Get existing content to check ownership (assuming findById exists)
      const existingContent = await contentRepository.findById(contentId);
      if (!existingContent) {
        throw new NotFoundError('Content', contentId);
      }

      // Check ownership (assuming existingContent uses camelCase)
      if (existingContent.userId !== userId) {
        throw new ForbiddenError('You can only update your own content');
      }

      // Check status (assuming existingContent uses camelCase)
      if (existingContent.status !== 'active') {
        throw new ValidationError(`Cannot update content with status: ${existingContent.status}`);
      }

      // Sanitize text content for security
      let sanitizedText: string | undefined = undefined;
      if (data.contentText) { // Use camelCase from DTO
        sanitizedText = sanitizeHtml(data.contentText);
      }

      // Process tags if provided (assuming data.tags is camelCase or correctly mapped)
      if (data.tags && data.tags.length > 0) {
        const tags = await tagRepository.findOrCreateTags(data.tags);
        await tagRepository.tagContent(contentId, tags.map(tag => tag.id));
      }

      // Prepare data for repository update (map camelCase DTO to camelCase Partial<NewContent>)
      const updateData: Partial<NewContent> = {
          contentText: sanitizedText, // Use sanitized camelCase version
          mediaUrls: data.mediaUrls, // Map from camelCase DTO
          metadata: data.metadata, // Assuming metadata is correct or needs mapping
          // categoryId: data.categoryId, // Map from camelCase DTO - Removed
          status: data.status, // Assuming status is correct
          // Map other updatable fields from camelCase DTO if necessary
      };


      // Update the content
      await contentRepository.updateContent(contentId, updateData);

      // Emit event
       await eventBus.publish(EventType.CONTENT_UPDATED, { contentId, userId });


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
      // Get existing content to check ownership (assuming findById exists)
      const existingContent = await contentRepository.findById(contentId);
      if (!existingContent) {
        throw new NotFoundError('Content', contentId);
      }

      // Check ownership (assuming existingContent uses camelCase)
      if (existingContent.userId !== userId) {
        throw new ForbiddenError('You can only delete your own content');
      }

      // Soft delete the content
      const deleted = await contentRepository.softDeleteContent(contentId);

      if (deleted) {
        // Emit content deleted event
        await eventBus.publish(EventType.CONTENT_DELETED, {
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
      // Get content with author details (assuming getContentWithDetails exists and returns camelCase)
      const content = await contentRepository.getContentWithDetails(contentId);
      if (!content) {
        return null;
      }

      // Get content tags
      const tags = await tagRepository.getContentTags(contentId);

      // Get category if available (assuming findById exists and categoryId exists on content)
      let category = null;
      // if (content.categoryId) { // Removed - categoryId does not exist on content schema
      //   category = await categoryRepository.findById(content.categoryId);
      // }

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
        // category: category ? {
        //   id: category.id,
        //   name: category.name,
        //   slug: category.slug
        // } : null
      };

      return enhancedContent;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Error getting content by ID', { contentId, error: errorMessage });
      throw new Error(`Failed to get content by ID: ${errorMessage}`);
    }
  }

  // Feed-related methods moved to FeedService
  // Search-related methods moved to SearchService

  /**
   * Create a comment on content
   *
   * @param userId User ID
   * @param data Comment data DTO (assuming snake_case)
   * @returns Created comment (camelCase)
   */
  async createComment(userId: string, data: CreateCommentDto): Promise<Comment> {
    try {
      // Check if content exists (assuming findById exists)
      const content = await contentRepository.findById(data.contentId); // Use camelCase from DTO
      if (!content) {
        throw new NotFoundError('Content', data.contentId); // Use camelCase from DTO
      }

      // Check if parent comment exists if provided (assuming findById exists)
      if (data.parentId) { // Use camelCase from DTO
        // Assuming findById exists on commentRepository - Error reported here, needs verification
        const parentComment = await commentRepository.findById(data.parentId); // Use camelCase from DTO
        if (!parentComment) {
          throw new NotFoundError('Parent comment', data.parentId); // Use camelCase from DTO
        }
        // Assuming parentComment has camelCase properties from repository
        if (parentComment.contentId !== data.contentId) { // Compare camelCase repo field with camelCase DTO field
          throw new ValidationError('Parent comment does not belong to the specified content');
        }
      }

      // Sanitize comment text
      let sanitizedCommentText: string | null | undefined = data.commentText; // Use camelCase from DTO
      if (sanitizedCommentText) {
        sanitizedCommentText = sanitizeHtml(sanitizedCommentText);
      } else {
         throw new ValidationError('Comment text cannot be empty');
      }

      // Check if comment needs moderation
      const commentModerationResult = await moderationService.checkComment({ // Renamed variable
        comment_text: sanitizedCommentText // Pass sanitized text
      });
      if (commentModerationResult.requiresModeration) {
        throw new ContentModerationRequiredError(commentModerationResult.reason || 'Comment requires moderation');
      }

      // Prepare data for repository (NewComment uses camelCase)
      const repoData: NewComment = {
          contentId: data.contentId, // Use camelCase from DTO
          userId: userId,
          parentId: data.parentId, // Use camelCase from DTO
          commentText: sanitizedCommentText, // Use sanitized camelCase version
          status: 'active'
      };

      // Create the comment
      const comment = await commentRepository.createComment(repoData);

      // Award points for comment creation
      await pointsService.awardPoints({
        userId,
        amount: 15, // Points for commenting
        source: PointsSource.COMMENT, // Use enum value
        referenceId: comment.id
      });

      // Award points to content creator for receiving a comment (if not self-comment)
      if (content.userId !== userId) { // content object uses camelCase
        await pointsService.awardPoints({
          userId: content.userId, // content object uses camelCase
          amount: 5, // Points for receiving a comment
          // TODO: Verify 'reaction_received' is the correct source for receiving a comment. 'comment_received' is not in PointsSourceEnum.
          source: PointsSource.REACTION_RECEIVED, // Use enum value
          referenceId: comment.id
        });
      }

      // Emit comment added event
      await eventBus.publish(EventType.COMMENT_ADDED, {
        commentId: comment.id,
        contentId: data.contentId, // Use camelCase from DTO
        userId,
        contentUserId: content.userId // content object uses camelCase
      });

      logger.info(`User ${userId} commented on content ${data.contentId}`); // Use camelCase from DTO
      return comment; // comment object uses camelCase
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Error creating comment', { userId, contentId: data.contentId, error: errorMessage }); // Use camelCase from DTO
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
   * @param data Comment data DTO (assuming snake_case)
   * @returns Updated comment (camelCase) or null
   */
  async updateComment(commentId: string, userId: string, data: UpdateCommentDto): Promise<Comment | null> {
    try {
      // Get existing comment to check ownership (assuming findById exists)
      // Assuming findById exists on commentRepository - Error reported here, needs verification
      const existingComment = await commentRepository.findById(commentId);
      if (!existingComment) {
        throw new NotFoundError('Comment', commentId);
      }

      // Check ownership (assuming existingComment uses camelCase)
      if (existingComment.userId !== userId) {
        throw new ForbiddenError('You can only update your own comments');
      }

      // Check status (assuming existingComment uses camelCase)
      if (existingComment.status !== 'active') {
        throw new ValidationError(`Cannot update comment with status: ${existingComment.status}`);
      }

      // Sanitize comment text
      let sanitizedCommentText: string | undefined = undefined;
      if (data.commentText) { // Use camelCase from DTO
        sanitizedCommentText = sanitizeHtml(data.commentText);

        // Check if updated comment needs moderation
        const updateModerationResult = await moderationService.checkComment({ // Renamed variable
          comment_text: sanitizedCommentText // Pass sanitized text
        });
        if (updateModerationResult.requiresModeration) {
          throw new ContentModerationRequiredError(updateModerationResult.reason || 'Updated comment requires moderation');
        }
      }

      // Prepare update data (map camelCase DTO to camelCase Partial<NewComment>)
      // Conditionally add commentText only if it's defined to satisfy type checker
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
      const updatedComment = await commentRepository.updateComment(commentId, updateData);

      // Emit event
      await eventBus.publish(EventType.COMMENT_UPDATED, { commentId, userId });


      logger.info(`User ${userId} updated comment ${commentId}`);
      return updatedComment; // updatedComment uses camelCase
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
      // Get existing comment to check ownership (assuming findById exists)
      // Assuming findById exists on commentRepository - Error reported here, needs verification
      const existingComment = await commentRepository.findById(commentId);
      if (!existingComment) {
        throw new NotFoundError('Comment', commentId);
      }

      // Check ownership (assuming existingComment uses camelCase)
      if (existingComment.userId !== userId) {
        throw new ForbiddenError('You can only delete your own comments');
      }

      // Soft delete the comment
      const deleted = await commentRepository.softDeleteComment(commentId);

      if (deleted) {
        // Emit comment deleted event
        await eventBus.publish(EventType.COMMENT_DELETED, { // Use correct event type
          commentId,
          contentId: existingComment.contentId, // Use camelCase
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
      // Check if content exists (assuming findById exists)
      const content = await contentRepository.findById(contentId);
      if (!content) {
        throw new NotFoundError('Content', contentId);
      }

      return await commentRepository.getContentComments(contentId, options);
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

  // Removed invalid db accessor
}

// Remove incorrect singleton instantiation - this should be handled elsewhere (e.g., services/index.ts)
// export const contentService = new ContentService(...);
