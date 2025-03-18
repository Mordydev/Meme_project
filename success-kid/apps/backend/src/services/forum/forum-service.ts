/**
 * Forum Service
 * 
 * Core service for managing forum structures, categories, and threads
 */
import { v4 as uuidv4 } from 'uuid';
import { sanitizeHtml } from '../../lib/sanitizer';
import { logger } from '../../lib/logger';
import { ForumRepository } from '../../repositories/forum-repository';
import { CategoryRepository } from '../../repositories/category-repository';
import { ThreadRepository } from '../../repositories/thread-repository';
import { ContentRepository } from '../../repositories/content-repository';
import { CommentRepository } from '../../repositories/comment-repository';
import { PointsService } from '../points/points-service';
import { EventBus, EventType } from '../../lib/event-bus';
import { 
  Forum,
  CreateForumDto,
  UpdateForumDto,
  ForumListItem
} from '../../models/entities/forum/forum.model';
import { 
  Category,
  CreateCategoryDto,
  UpdateCategoryDto,
  CategoryWithChildren
} from '../../models/entities/taxonomy/category.model';
import {
  Thread,
  CreateThreadDto,
  UpdateThreadDto,
  ThreadListItem
} from '../../models/entities/forum/thread.model';
import {
  NotFoundError,
  ValidationError,
  ForbiddenError,
  ContentCreationFailedError
} from '../../errors';

/**
 * Thread pagination options
 */
export interface ThreadPaginationOptions {
  limit?: number;
  offset?: number;
  sort?: 'recent' | 'newest' | 'views';
}

/**
 * Core service for managing forums
 */
export class ForumService {
  /**
   * Create a new ForumService
   * 
   * @param forumRepository Repository for forum data
   * @param categoryRepository Repository for category data
   * @param threadRepository Repository for thread data
   * @param contentRepository Repository for content data
   * @param commentRepository Repository for comment data
   * @param pointsService Service for managing points
   * @param eventBus Event bus for publishing events
   */
  constructor(
    private forumRepository: ForumRepository,
    private categoryRepository: CategoryRepository,
    private threadRepository: ThreadRepository,
    private contentRepository: ContentRepository,
    private commentRepository: CommentRepository,
    private pointsService: PointsService,
    private eventBus: EventBus
  ) {}

  /**
   * Get all forums with stats
   * 
   * @returns Array of forums with stats
   */
  async getAllForums(): Promise<ForumListItem[]> {
    try {
      return await this.forumRepository.getAllForums();
    } catch (error) {
      logger.error('Error getting all forums', { error });
      throw error;
    }
  }

  /**
   * Get forum by slug with categories
   * 
   * @param slug Forum slug
   * @returns Forum with categories
   */
  async getForumBySlug(slug: string): Promise<any> {
    try {
      const forum = await this.forumRepository.getForumBySlug(slug);
      if (!forum) {
        throw new NotFoundError('Forum', slug);
      }

      // Get categories for this forum
      const categories = await this.categoryRepository.getCategoriesByForumId(forum.id);
      
      return {
        ...forum,
        categories
      };
    } catch (error) {
      logger.error('Error getting forum by slug', { error, slug });
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new Error(`Failed to get forum: ${error.message}`);
    }
  }

  /**
   * Get category with threads
   * 
   * @param categoryId Category ID
   * @param options Thread pagination options
   * @returns Category with threads
   */
  async getCategoryWithThreads(categoryId: string, options: ThreadPaginationOptions = {}): Promise<any> {
    try {
      const category = await this.categoryRepository.findById(categoryId);
      if (!category) {
        throw new NotFoundError('Category', categoryId);
      }

      // Get threads for this category
      const threads = await this.threadRepository.getThreadsByCategory(categoryId, options);
      
      // Get child categories if any
      const childCategories = await this.categoryRepository.getChildCategories(categoryId);
      
      return {
        ...category,
        threads,
        subcategories: childCategories
      };
    } catch (error) {
      logger.error('Error getting category with threads', { error, categoryId, options });
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new Error(`Failed to get category with threads: ${error.message}`);
    }
  }

  /**
   * Create a new thread
   * 
   * @param userId User ID
   * @param data Thread data
   * @returns Created thread
   */
  async createThread(userId: string, data: CreateThreadDto): Promise<any> {
    try {
      // Check if category exists
      const category = await this.categoryRepository.findById(data.category_id);
      if (!category) {
        throw new NotFoundError('Category', data.category_id);
      }

      // Check if forum exists
      const forum = await this.forumRepository.findById(data.forum_id);
      if (!forum) {
        throw new NotFoundError('Forum', data.forum_id);
      }

      // Sanitize content
      const sanitizedContent = sanitizeHtml(data.content.content_text);

      // Create the first post content
      const contentId = uuidv4();
      const content = await this.contentRepository.createContent({
        id: contentId,
        user_id: userId,
        type: 'text', // Default for forum posts
        content_text: sanitizedContent,
        media_urls: data.content.media_urls || [],
        poll_options: data.content.poll_options
      });

      // Create the thread
      const threadId = uuidv4();
      const now = new Date();
      const thread = await this.threadRepository.createThread({
        id: threadId,
        title: data.title,
        user_id: userId,
        category_id: data.category_id,
        forum_id: data.forum_id,
        content_id: contentId,
        type: data.type || 'discussion',
        status: 'active',
        is_pinned: false,
        is_locked: false,
        views: 0,
        created_at: now,
        updated_at: now,
        last_activity_at: now,
        last_post_id: null,
        last_post_user_id: null,
        tags: data.tags || [],
        metadata: {}
      });

      // Award points for thread creation
      await this.pointsService.awardPoints({
        userId,
        amount: 50, // Points for creating a thread
        source: 'content_creation',
        referenceId: threadId,
        description: `Created thread: ${data.title}`
      });

      // Emit thread created event
      await this.eventBus.publish(EventType.CONTENT_CREATED, {
        contentId: thread.id,
        contentType: 'thread',
        userId,
        additionalData: {
          forumId: data.forum_id,
          categoryId: data.category_id,
          threadTitle: data.title
        }
      });

      // Get the thread with details
      const threadWithDetails = await this.threadRepository.getThreadWithDetails(threadId);
      
      logger.info(`User ${userId} created new thread ${threadId} in category ${data.category_id}`);
      return threadWithDetails;
    } catch (error) {
      logger.error('Error creating thread', { error, userId, data });
      if (error instanceof NotFoundError || error instanceof ValidationError) {
        throw error;
      }
      throw new ContentCreationFailedError('Failed to create thread', error);
    }
  }

  /**
   * Get thread with replies
   * 
   * @param threadId Thread ID
   * @param options Pagination options
   * @returns Thread with replies
   */
  async getThreadWithReplies(threadId: string, options: { limit?: number; offset?: number } = {}): Promise<any> {
    try {
      // Increment thread views
      await this.threadRepository.incrementThreadViews(threadId);

      // Get thread with details
      const thread = await this.threadRepository.getThreadWithDetails(threadId);
      if (!thread) {
        throw new NotFoundError('Thread', threadId);
      }

      // Get replies for this thread
      const replies = await this.getThreadReplies(threadId, options);

      return {
        ...thread,
        replies
      };
    } catch (error) {
      logger.error('Error getting thread with replies', { error, threadId, options });
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new Error(`Failed to get thread with replies: ${error.message}`);
    }
  }

  /**
   * Get replies for a thread
   * 
   * @param threadId Thread ID
   * @param options Pagination options
   * @returns Array of replies
   */
  async getThreadReplies(threadId: string, options: { limit?: number; offset?: number } = {}): Promise<any[]> {
    try {
      const { limit = 20, offset = 0 } = options;

      // Get thread to verify it exists
      const thread = await this.threadRepository.findById(threadId);
      if (!thread) {
        throw new NotFoundError('Thread', threadId);
      }

      // Query for replies
      const query = `
        SELECT 
          r.id as reply_id,
          r.thread_id,
          r.content_id,
          r.created_at,
          c.content_text,
          c.media_urls,
          c.user_id,
          u.display_name as author_name,
          p.avatar_url as author_avatar,
          (SELECT COUNT(*) FROM reactions WHERE content_id = c.id) as like_count
        FROM thread_replies r
        JOIN content c ON r.content_id = c.id
        JOIN users u ON c.user_id = u.id
        LEFT JOIN profiles p ON u.id = p.user_id
        WHERE r.thread_id = $1 AND c.status = 'active'
        ORDER BY r.created_at ASC
        LIMIT $2 OFFSET $3
      `;

      const result = await this.db.query(query, [threadId, limit, offset]);

      // Map to reply objects
      return result.rows.map(row => ({
        id: row.reply_id,
        content_id: row.content_id,
        created_at: row.created_at,
        content_text: row.content_text,
        media_urls: row.media_urls || [],
        author: {
          id: row.user_id,
          display_name: row.author_name,
          avatar_url: row.author_avatar
        },
        stats: {
          likes: parseInt(row.like_count || '0')
        }
      }));
    } catch (error) {
      logger.error('Error getting thread replies', { error, threadId, options });
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new Error(`Failed to get thread replies: ${error.message}`);
    }
  }

  /**
   * Create a reply to a thread
   * 
   * @param userId User ID
   * @param threadId Thread ID
   * @param data Reply data
   * @returns Created reply
   */
  async createThreadReply(userId: string, threadId: string, data: { content_text: string; media_urls?: string[] }): Promise<any> {
    try {
      // Check if thread exists and is not locked
      const thread = await this.threadRepository.findById(threadId);
      if (!thread) {
        throw new NotFoundError('Thread', threadId);
      }

      if (thread.is_locked) {
        throw new ValidationError('Cannot reply to a locked thread');
      }

      // Sanitize content
      const sanitizedContent = sanitizeHtml(data.content_text);

      // Create the content for the reply
      const contentId = uuidv4();
      const content = await this.contentRepository.createContent({
        id: contentId,
        user_id: userId,
        type: 'text',
        content_text: sanitizedContent,
        media_urls: data.media_urls || []
      });

      // Associate reply with thread
      const replyId = uuidv4();
      const now = new Date();
      await this.db.query(`
        INSERT INTO thread_replies (id, thread_id, content_id, created_at)
        VALUES ($1, $2, $3, $4)
      `, [replyId, threadId, contentId, now]);

      // Update thread last activity
      await this.threadRepository.updateThreadActivity(threadId, contentId, userId);

      // Award points for reply
      await this.pointsService.awardPoints({
        userId,
        amount: 15, // Points for replying to a thread
        source: 'comment',
        referenceId: replyId,
        description: `Replied to thread: ${thread.title}`
      });

      // Award points to thread creator for receiving a reply (if not self-reply)
      if (thread.user_id !== userId) {
        await this.pointsService.awardPoints({
          userId: thread.user_id,
          amount: 5, // Points for receiving a reply
          source: 'comment_received',
          referenceId: replyId,
          description: `Received reply on thread: ${thread.title}`
        });
      }

      // Emit reply created event
      await this.eventBus.publish(EventType.COMMENT_CREATED, {
        commentId: replyId,
        contentId: thread.id,
        contentType: 'thread',
        userId,
        threadId,
        userId: thread.user_id
      });

      // Get the reply with details
      const reply = await this.db.query(`
        SELECT 
          r.id as reply_id,
          r.thread_id,
          r.content_id,
          r.created_at,
          c.content_text,
          c.media_urls,
          c.user_id,
          u.display_name as author_name,
          p.avatar_url as author_avatar
        FROM thread_replies r
        JOIN content c ON r.content_id = c.id
        JOIN users u ON c.user_id = u.id
        LEFT JOIN profiles p ON u.id = p.user_id
        WHERE r.id = $1
      `, [replyId]);

      if (reply.rows.length === 0) {
        throw new Error('Reply was created but could not be retrieved');
      }

      const row = reply.rows[0];
      
      logger.info(`User ${userId} replied to thread ${threadId}`);
      
      return {
        id: row.reply_id,
        thread_id: row.thread_id,
        content_id: row.content_id,
        created_at: row.created_at,
        content_text: row.content_text,
        media_urls: row.media_urls || [],
        author: {
          id: row.user_id,
          display_name: row.author_name,
          avatar_url: row.author_avatar
        }
      };
    } catch (error) {
      logger.error('Error creating thread reply', { error, userId, threadId, data });
      if (error instanceof NotFoundError || error instanceof ValidationError) {
        throw error;
      }
      throw new ContentCreationFailedError('Failed to create reply', error);
    }
  }

  /**
   * Update a thread
   * 
   * @param threadId Thread ID
   * @param userId User ID (for authorization)
   * @param data Thread data to update
   * @returns Updated thread
   */
  async updateThread(threadId: string, userId: string, data: UpdateThreadDto): Promise<any> {
    try {
      // Check if thread exists
      const thread = await this.threadRepository.findById(threadId);
      if (!thread) {
        throw new NotFoundError('Thread', threadId);
      }

      // Check ownership (or admin privileges could be added here)
      if (thread.user_id !== userId) {
        throw new ForbiddenError('You can only update your own threads');
      }

      // Update the thread
      const updatedThread = await this.threadRepository.updateThread(threadId, data);
      
      logger.info(`User ${userId} updated thread ${threadId}`);
      
      // Get the thread with details
      return await this.threadRepository.getThreadWithDetails(threadId);
    } catch (error) {
      logger.error('Error updating thread', { error, threadId, userId, data });
      if (error instanceof NotFoundError || error instanceof ForbiddenError) {
        throw error;
      }
      throw new Error(`Failed to update thread: ${error.message}`);
    }
  }

  /**
   * Get user's threads
   * 
   * @param userId User ID
   * @param options Pagination options
   * @returns Array of user's threads
   */
  async getUserThreads(userId: string, options: { limit?: number; offset?: number } = {}): Promise<ThreadListItem[]> {
    try {
      return await this.threadRepository.getUserThreads(userId, options);
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
      return await this.threadRepository.getTrendingThreads(options);
    } catch (error) {
      logger.error('Error getting trending threads', { error, options });
      throw error;
    }
  }

  /**
   * Get database instance for custom queries
   */
  private get db() {
    return this.forumRepository['db'];
  }
}
