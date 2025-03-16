/**
 * Content Service
 * 
 * Core service for content management, handling content creation, retrieval,
 * updates, and search functionality.
 */
import { 
  Content, 
  CreateContentDto, 
  UpdateContentDto, 
  ContentType 
} from '../../models/content';
import { 
  Comment,
  CreateCommentDto, 
  UpdateCommentDto 
} from '../../models/comment';
import { ContentRepository, ContentFeedOptions } from '../../repositories/content-repository';
import { CommentRepository } from '../../repositories/comment-repository';
import { CategoryRepository } from '../../repositories/category-repository';
import { TagRepository } from '../../repositories/tag-repository';
import { ContentReportRepository } from '../../repositories/content-report-repository';
import { PointsService } from '../points/points-service';
import { eventBus, EventType } from '../../lib/event-bus';
import { logger } from '../../lib/logger';
import { sanitizeHtml } from '../../lib/sanitizer';
import { ForbiddenError, NotFoundError, ValidationError } from '../../errors/api-errors';

export interface ContentCreationResult {
  content: Content;
  tags?: any[];
}

export interface CommentCreationResult {
  comment: Comment;
}

export class ContentService {
  constructor(
    private contentRepository: ContentRepository,
    private commentRepository: CommentRepository,
    private categoryRepository: CategoryRepository,
    private tagRepository: TagRepository,
    private contentReportRepository: ContentReportRepository,
    private pointsService: PointsService
  ) {}

  /**
   * Create new content with optional tags
   */
  async createContent(
    userId: string,
    data: CreateContentDto & { tags?: string[]; categoryId?: string }
  ): Promise<ContentCreationResult> {
    try {
      // Sanitize text content for security
      let sanitizedData = { ...data };
      
      if (sanitizedData.content_text) {
        sanitizedData.content_text = sanitizeHtml(sanitizedData.content_text);
      }
      
      // Verify category exists if provided
      if (sanitizedData.categoryId) {
        const category = await this.categoryRepository.findById(sanitizedData.categoryId);
        if (!category) {
          throw new ValidationError('Invalid category ID');
        }
      }
      
      // Create content
      const content = await this.contentRepository.createContent({
        ...sanitizedData,
        user_id: userId
      });
      
      // Process tags if provided
      let tags = [];
      if (data.tags && data.tags.length > 0) {
        tags = await this.tagRepository.findOrCreateTags(data.tags);
        
        // Associate tags with content
        await this.tagRepository.tagContent(
          content.id,
          tags.map(tag => tag.id)
        );
      }
      
      // Award points for content creation
      await this.pointsService.awardPoints(
        userId,
        50, // Points for content creation (can be configured)
        'content_creation',
        {
          referenceId: content.id,
          description: `Created ${content.type} content`
        }
      );
      
      // Emit content created event
      await eventBus.publish(EventType.CONTENT_CREATED, {
        contentId: content.id,
        userId,
        type: content.type,
        timestamp: new Date().toISOString()
      });
      
      return { content, tags };
    } catch (error) {
      logger.error('Error creating content', { error, userId, data });
      throw error;
    }
  }
  
  /**
   * Get content feed with various filtering and sorting options
   */
  async getContentFeed(options: ContentFeedOptions = {}): Promise<Content[]> {
    try {
      return await this.contentRepository.getContentFeed(options);
    } catch (error) {
      logger.error('Error getting content feed', { error, options });
      throw error;
    }
  }
  
  /**
   * Get content by ID with details including comments and reactions
   */
  async getContentById(id: string): Promise<any> {
    try {
      const content = await this.contentRepository.getContentWithDetails(id);
      
      if (!content) {
        throw new NotFoundError('Content not found');
      }
      
      // Get tags for content
      const tags = await this.tagRepository.getContentTags(id);
      
      return {
        ...content,
        tags
      };
    } catch (error) {
      logger.error('Error getting content by ID', { error, contentId: id });
      throw error;
    }
  }
  
  /**
   * Update content
   */
  async updateContent(
    id: string,
    userId: string,
    data: UpdateContentDto & { tags?: string[] }
  ): Promise<Content> {
    try {
      // Verify content exists and user has permission
      const existingContent = await this.contentRepository.findById(id);
      
      if (!existingContent) {
        throw new NotFoundError('Content not found');
      }
      
      if (existingContent.user_id !== userId) {
        throw new ForbiddenError('You do not have permission to update this content');
      }
      
      // Create sanitized update data
      let updateData = { ...data };
      
      if (updateData.content_text) {
        updateData.content_text = sanitizeHtml(updateData.content_text);
      }
      
      // Update content
      const updatedContent = await this.contentRepository.updateContent(id, updateData);
      
      // Update tags if provided
      if (data.tags) {
        const tags = await this.tagRepository.findOrCreateTags(data.tags);
        
        await this.tagRepository.tagContent(
          id,
          tags.map(tag => tag.id)
        );
      }
      
      return updatedContent;
    } catch (error) {
      logger.error('Error updating content', { error, contentId: id, userId, data });
      throw error;
    }
  }
  
  /**
   * Delete content (soft delete)
   */
  async deleteContent(id: string, userId: string): Promise<boolean> {
    try {
      // Verify content exists and user has permission
      const existingContent = await this.contentRepository.findById(id);
      
      if (!existingContent) {
        throw new NotFoundError('Content not found');
      }
      
      if (existingContent.user_id !== userId) {
        throw new ForbiddenError('You do not have permission to delete this content');
      }
      
      // Soft delete by updating status
      await this.contentRepository.updateContent(id, { status: 'deleted' });
      
      return true;
    } catch (error) {
      logger.error('Error deleting content', { error, contentId: id, userId });
      throw error;
    }
  }
  
  /**
   * Search content
   */
  async searchContent(
    query: string,
    options: { limit?: number; offset?: number; type?: string } = {}
  ): Promise<Content[]> {
    try {
      return await this.contentRepository.searchContent(query, options);
    } catch (error) {
      logger.error('Error searching content', { error, query, options });
      throw error;
    }
  }
  
  /**
   * Create a comment on content
   */
  async createComment(
    userId: string,
    data: CreateCommentDto
  ): Promise<CommentCreationResult> {
    try {
      // Verify content exists
      const content = await this.contentRepository.findById(data.content_id);
      
      if (!content || content.status !== 'active') {
        throw new NotFoundError('Content not found or inactive');
      }
      
      // Verify parent comment exists if specified
      if (data.parent_id) {
        const parentComment = await this.commentRepository.findById(data.parent_id);
        
        if (!parentComment || parentComment.status !== 'active') {
          throw new ValidationError('Parent comment not found or inactive');
        }
        
        // Verify parent belongs to same content
        if (parentComment.content_id !== data.content_id) {
          throw new ValidationError('Parent comment does not belong to the specified content');
        }
      }
      
      // Create the comment
      const comment = await this.commentRepository.createComment({
        ...data,
        user_id: userId,
        // Sanitize comment text
        comment_text: sanitizeHtml(data.comment_text)
      });
      
      // Award points for comment creation
      await this.pointsService.awardPoints(
        userId,
        15, // Points for comment creation (can be configured)
        'comment',
        {
          referenceId: comment.id,
          description: 'Created a comment'
        }
      );
      
      // Award points to content author for receiving engagement
      // Only if commenter is not the content author
      if (content.user_id !== userId) {
        await this.pointsService.awardPoints(
          content.user_id,
          5, // Points for receiving a comment (can be configured)
          'upvote_received',
          {
            referenceId: comment.id,
            description: 'Received a comment on content'
          }
        );
      }
      
      // Emit comment created event
      await eventBus.publish(EventType.COMMENT_CREATED, {
        commentId: comment.id,
        contentId: data.content_id,
        userId,
        timestamp: new Date().toISOString()
      });
      
      return { comment };
    } catch (error) {
      logger.error('Error creating comment', { error, userId, data });
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
      // Verify content exists
      const content = await this.contentRepository.findById(contentId);
      
      if (!content || content.status !== 'active') {
        throw new NotFoundError('Content not found or inactive');
      }
      
      return await this.commentRepository.getContentComments(contentId, options);
    } catch (error) {
      logger.error('Error getting content comments', { error, contentId, options });
      throw error;
    }
  }
  
  /**
   * Update a comment
   */
  async updateComment(
    id: string,
    userId: string,
    data: UpdateCommentDto
  ): Promise<Comment> {
    try {
      // Verify comment exists and user has permission
      const existingComment = await this.commentRepository.findById(id);
      
      if (!existingComment) {
        throw new NotFoundError('Comment not found');
      }
      
      if (existingComment.user_id !== userId) {
        throw new ForbiddenError('You do not have permission to update this comment');
      }
      
      // Update the comment
      const updatedComment = await this.commentRepository.updateComment(
        id,
        {
          ...data,
          // Sanitize comment text if provided
          ...(data.comment_text ? { comment_text: sanitizeHtml(data.comment_text) } : {})
        }
      );
      
      return updatedComment;
    } catch (error) {
      logger.error('Error updating comment', { error, commentId: id, userId, data });
      throw error;
    }
  }
  
  /**
   * Delete a comment (soft delete)
   */
  async deleteComment(id: string, userId: string): Promise<boolean> {
    try {
      // Verify comment exists and user has permission
      const existingComment = await this.commentRepository.findById(id);
      
      if (!existingComment) {
        throw new NotFoundError('Comment not found');
      }
      
      if (existingComment.user_id !== userId) {
        throw new ForbiddenError('You do not have permission to delete this comment');
      }
      
      // Soft delete by updating status
      await this.commentRepository.updateComment(id, { status: 'deleted' });
      
      return true;
    } catch (error) {
      logger.error('Error deleting comment', { error, commentId: id, userId });
      throw error;
    }
  }
  
  /**
   * Report content for moderation
   */
  async reportContent(
    reporterId: string,
    targetId: string,
    targetType: 'content' | 'comment',
    reason: string,
    description?: string
  ): Promise<any> {
    try {
      // Verify target exists
      let targetExists = false;
      
      if (targetType === 'content') {
        const content = await this.contentRepository.findById(targetId);
        targetExists = !!content;
      } else if (targetType === 'comment') {
        const comment = await this.commentRepository.findById(targetId);
        targetExists = !!comment;
      }
      
      if (!targetExists) {
        throw new NotFoundError(`${targetType} not found`);
      }
      
      // Check if user has already reported this target
      const hasReported = await this.contentReportRepository.hasUserReported(
        reporterId,
        targetId,
        targetType
      );
      
      if (hasReported) {
        throw new ValidationError('You have already reported this item');
      }
      
      // Create report
      const report = await this.contentReportRepository.createReport({
        reporter_id: reporterId,
        target_id: targetId,
        target_type: targetType,
        reason: reason as any,
        description
      });
      
      return report;
    } catch (error) {
      logger.error('Error reporting content', { 
        error, 
        reporterId, 
        targetId, 
        targetType, 
        reason 
      });
      throw error;
    }
  }
  
  /**
   * Get categories
   */
  async getCategories(parentId?: string): Promise<any[]> {
    try {
      const categories = await this.categoryRepository.getAllCategories(parentId);
      
      // Get content counts for each category
      for (const category of categories) {
        category['content_count'] = await this.categoryRepository.countContentInCategory(category.id);
      }
      
      return categories;
    } catch (error) {
      logger.error('Error getting categories', { error, parentId });
      throw error;
    }
  }
  
  /**
   * Get popular tags
   */
  async getPopularTags(limit: number = 20): Promise<any[]> {
    try {
      return await this.tagRepository.getPopularTags(limit);
    } catch (error) {
      logger.error('Error getting popular tags', { error, limit });
      throw error;
    }
  }
  
  /**
   * Get trending content
   */
  async getTrendingContent(
    options: { limit?: number; timeframe?: string } = {}
  ): Promise<Content[]> {
    try {
      return await this.contentRepository.getTrendingContent(options);
    } catch (error) {
      logger.error('Error getting trending content', { error, options });
      throw error;
    }
  }
}
