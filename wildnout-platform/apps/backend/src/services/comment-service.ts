import { CommentRepository, CommentModel } from '../repositories/comment-repository';
import { ContentRepository } from '../repositories/content-repository';
import { EventEmitter, EventType } from '../lib/events';
import { TransactionManager } from '../lib/transaction';
import { NotificationService } from './notification-service';
import { AppError } from '../lib/errors';
import { CommentThreadResult } from '../models/social';

/**
 * Input for creating a comment
 */
export interface CommentCreateInput {
  body: string;
  parentId?: string;
}

/**
 * Service for managing comments
 */
export class CommentService {
  constructor(
    private commentRepository: CommentRepository,
    private contentRepository: ContentRepository,
    private notificationService: NotificationService,
    private eventEmitter: EventEmitter,
    private transactionManager: TransactionManager
  ) {}

  /**
   * Register event handlers for this service
   */
  registerEventHandlers(): void {
    // Listen for comment events
    this.eventEmitter.on(EventType.CONTENT_COMMENT_ADDED, async (data) => {
      try {
        // Get the content to find its creator
        const content = await this.contentRepository.findById(data.contentId);
        
        if (content && content.creatorId !== data.userId) {
          // Create notification for content creator
          await this.notificationService.createNotification({
            userId: data.userId,
            targetUserId: content.creatorId,
            type: 'comment',
            referenceType: 'content',
            referenceId: data.contentId,
            data: {
              commentId: data.commentId
            }
          });
        }
        
        // If this is a reply, also notify the parent comment author
        if (data.parentCommentId) {
          const parentComment = await this.commentRepository.findById(data.parentCommentId);
          
          if (parentComment && parentComment.userId !== data.userId) {
            await this.notificationService.createNotification({
              userId: data.userId,
              targetUserId: parentComment.userId,
              type: 'reply',
              referenceType: 'comment',
              referenceId: data.parentCommentId,
              data: {
                commentId: data.commentId,
                contentId: data.contentId
              }
            });
          }
        }
      } catch (error) {
        console.error('Error processing comment event:', error);
      }
    });
  }

  /**
   * Add a comment to content
   */
  async addComment(
    contentId: string,
    userId: string,
    data: CommentCreateInput
  ): Promise<CommentModel> {
    if (!data.body.trim()) {
      throw AppError.validation('Comment body is required');
    }
    
    // Verify content exists
    const content = await this.contentRepository.findById(contentId);
    
    if (!content) {
      throw AppError.notFound('content', contentId);
    }
    
    // Check if the content is published
    if (content.status !== 'published') {
      throw AppError.validation('Cannot comment on unpublished content');
    }
    
    return this.transactionManager.execute(async (transaction) => {
      // Check parent comment if provided
      let parentComment: CommentModel | null = null;
      
      if (data.parentId) {
        parentComment = await this.commentRepository.findById(data.parentId);
        
        if (!parentComment) {
          throw AppError.notFound('comment', data.parentId);
        }
        
        // Verify parent comment belongs to this content
        if (parentComment.contentId !== contentId) {
          throw AppError.validation('Parent comment does not belong to this content');
        }
        
        // Limit thread depth (max depth of 2: comments and replies to comments)
        if (parentComment.parentId) {
          throw AppError.validation('Cannot reply to a reply, maximum thread depth reached');
        }
      }
      
      // Create the comment
      const comment = await this.commentRepository.create({
        contentId,
        userId,
        body: data.body,
        parentId: data.parentId,
        status: 'visible',
        metrics: {
          reactionCounts: {}
        },
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      // Update comment count on content
      await this.contentRepository.incrementCommentCount(contentId);
      
      // Emit event
      await this.eventEmitter.emit(EventType.CONTENT_COMMENT_ADDED, {
        contentId,
        commentId: comment.id,
        parentCommentId: data.parentId,
        userId,
        timestamp: new Date().toISOString()
      });
      
      return comment;
    });
  }

  /**
   * Get a comment thread with replies
   */
  async getCommentThread(
    commentId: string,
    options: { page?: number; limit?: number } = {}
  ): Promise<CommentThreadResult> {
    return this.commentRepository.getCommentThread(commentId, options);
  }

  /**
   * Update a comment
   */
  async updateComment(
    commentId: string,
    userId: string,
    body: string
  ): Promise<CommentModel> {
    if (!body.trim()) {
      throw AppError.validation('Comment body is required');
    }
    
    // Get existing comment
    const comment = await this.commentRepository.findById(commentId);
    
    if (!comment) {
      throw AppError.notFound('comment', commentId);
    }
    
    // Verify ownership
    if (comment.userId !== userId) {
      throw AppError.forbidden('You do not have permission to update this comment');
    }
    
    // Prevent updating deleted or hidden comments
    if (comment.status !== 'visible') {
      throw AppError.validation('Cannot update a deleted or hidden comment');
    }
    
    // Update the comment
    const updatedComment = await this.commentRepository.update(commentId, {
      body,
      updatedAt: new Date()
    });
    
    return updatedComment;
  }

  /**
   * Delete a comment (soft-delete)
   */
  async deleteComment(commentId: string, userId: string, isAdmin = false): Promise<void> {
    // Get existing comment
    const comment = await this.commentRepository.findById(commentId);
    
    if (!comment) {
      throw AppError.notFound('comment', commentId);
    }
    
    // Verify ownership or admin access
    if (!isAdmin && comment.userId !== userId) {
      throw AppError.forbidden('You do not have permission to delete this comment');
    }
    
    // Get content to update comment count
    const content = await this.contentRepository.findById(comment.contentId);
    
    return this.transactionManager.execute(async (transaction) => {
      // Update comment status
      await this.commentRepository.update(commentId, {
        status: 'deleted',
        updatedAt: new Date()
      }, transaction);
      
      // Decrement comment count on content
      if (content) {
        await this.contentRepository.decrementCommentCount(comment.contentId, transaction);
      }
    });
  }

  /**
   * Get comments for content with enhanced threading support
   */
  async getComments(
    contentId: string,
    options: { 
      threaded?: boolean; 
      limit?: number;
      cursor?: string;
    } = {}
  ): Promise<{
    comments: CommentModel[];
    totalCount: number;
    hasMore: boolean;
    cursor?: string;
  }> {
    // Verify content exists
    const content = await this.contentRepository.findById(contentId);
    
    if (!content) {
      throw AppError.notFound('content', contentId);
    }
    
    const threaded = options.threaded !== false; // Default to true
    const limit = options.limit || 20;
    
    // Get comments
    const result = await (
      threaded 
        ? this.commentRepository.getThreadedCommentsForContent(contentId, limit)
        : this.commentRepository.getCommentsForContent(contentId, limit)
    );
    
    // Determine if there are more comments
    const hasMore = result.comments.length >= limit;
    
    // Generate cursor if there are more results
    let cursor = undefined;
    if (hasMore && result.comments.length > 0) {
      const lastComment = result.comments[result.comments.length - 1];
      cursor = Buffer.from(`${lastComment.createdAt.toISOString()}|${lastComment.id}`).toString('base64');
    }
    
    return {
      comments: result.comments,
      totalCount: result.totalCount,
      hasMore,
      cursor
    };
  }
}
