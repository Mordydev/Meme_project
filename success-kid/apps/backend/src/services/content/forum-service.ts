/**
 * Forum Service
 * 
 * Service for managing forum functionality including categories, threads,
 * and discussion features.
 */
import { CategoryRepository } from '../../repositories/category-repository';
import { ContentRepository } from '../../repositories/content-repository';
import { CommentRepository } from '../../repositories/comment-repository';
import { FeedRepository } from '../../repositories/feed-repository';
import { PointsService } from '../points/points-service';
import { logger } from '../../lib/logger';
import { 
  ValidationError, 
  NotFoundError, 
  ForbiddenError 
} from '../../errors/api-errors';
import { eventBus, EventType } from '../../lib/event-bus';
import { sanitizeHtml } from '../../lib/sanitizer';

// Forum category types defined in PRD
export const FORUM_CATEGORIES = {
  GENERAL: 'general',
  TOKEN_TALK: 'token-talk',
  MEMES_MEDIA: 'memes-media',
  SUCCESS_STORIES: 'success-stories',
  STRATEGY_IDEAS: 'strategy-ideas',
  HELP_SUPPORT: 'help-support'
};

export interface ThreadCreationOptions {
  title: string;
  content: string;
  categoryId: string;
  tags?: string[];
  mediaUrls?: string[];
  isPinned?: boolean;
}

export interface ThreadSummary {
  id: string;
  title: string;
  preview: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  createdAt: Date;
  commentCount: number;
  lastActivity: Date;
  category: {
    id: string;
    name: string;
    slug: string;
  };
  isPinned: boolean;
  tags: any[];
}

export class ForumService {
  constructor(
    private categoryRepository: CategoryRepository,
    private contentRepository: ContentRepository,
    private commentRepository: CommentRepository,
    private feedRepository: FeedRepository,
    private pointsService: PointsService
  ) {}
  
  /**
   * Initialize default forum categories if not already present
   */
  async initializeForumCategories(): Promise<boolean> {
    try {
      // Check if categories already exist
      const existingCategories = await this.categoryRepository.getAllCategories();
      
      if (existingCategories.length > 0) {
        logger.info('Forum categories already initialized');
        return true;
      }
      
      // Define default categories from PRD
      const defaultCategories = [
        {
          name: 'General Discussion',
          description: 'General topics and community discussions',
          slug: FORUM_CATEGORIES.GENERAL,
          order: 1
        },
        {
          name: 'Token Talk',
          description: 'Discussions about the Success Kid token, price, trading, and news',
          slug: FORUM_CATEGORIES.TOKEN_TALK,
          order: 2
        },
        {
          name: 'Memes & Media',
          description: 'Share memes, images, videos, and creative content',
          slug: FORUM_CATEGORIES.MEMES_MEDIA,
          order: 3
        },
        {
          name: 'Success Stories',
          description: 'Share your success stories and achievements',
          slug: FORUM_CATEGORIES.SUCCESS_STORIES,
          order: 4
        },
        {
          name: 'Strategy & Ideas',
          description: 'Discuss strategies, ideas, and proposals for the community',
          slug: FORUM_CATEGORIES.STRATEGY_IDEAS,
          order: 5
        },
        {
          name: 'Help & Support',
          description: 'Get help with platform features and technical support',
          slug: FORUM_CATEGORIES.HELP_SUPPORT,
          order: 6
        }
      ];
      
      // Create each category
      for (const category of defaultCategories) {
        await this.categoryRepository.createCategory(category);
      }
      
      logger.info('Successfully initialized forum categories');
      return true;
    } catch (error) {
      logger.error('Error initializing forum categories', { error });
      throw error;
    }
  }
  
  /**
   * Create a new forum thread in a category
   */
  async createThread(
    userId: string,
    options: ThreadCreationOptions
  ): Promise<any> {
    try {
      const { title, content, categoryId, tags, mediaUrls, isPinned = false } = options;
      
      // Verify category exists
      const category = await this.categoryRepository.findById(categoryId);
      if (!category) {
        throw new ValidationError('Invalid category ID');
      }
      
      // Check if user has permission for pinned posts
      // TODO: Add proper role check for pinned threads
      const canCreatePinnedThread = false; // Default to false until roles implemented
      
      if (isPinned && !canCreatePinnedThread) {
        throw new ForbiddenError('You do not have permission to create pinned threads');
      }
      
      // Create the thread as a special type of content
      const threadContent = await this.contentRepository.createContent({
        user_id: userId,
        type: 'text', // Use standard text content type
        content_text: JSON.stringify({
          title: sanitizeHtml(title),
          content: sanitizeHtml(content),
          isPinned: isPinned && canCreatePinnedThread
        }),
        media_urls: mediaUrls
      });
      
      // Associate with category
      await this.contentRepository.updateContent(threadContent.id, {
        // Custom field for category association
        category_id: categoryId
      });
      
      // Process tags if provided
      if (tags && tags.length > 0) {
        // This assumes TagRepository is available through dependency injection
        // If not, you'll need to implement tag association here
      }
      
      // Award points for thread creation
      await this.pointsService.awardPoints(
        userId,
        50, // Points for thread creation
        'content_creation',
        {
          referenceId: threadContent.id,
          description: `Created forum thread in ${category.name}`
        }
      );
      
      // Emit thread created event
      await eventBus.publish(EventType.CONTENT_CREATED, {
        contentId: threadContent.id,
        userId,
        type: 'thread',
        categoryId,
        timestamp: new Date().toISOString()
      });
      
      return {
        ...threadContent,
        title: title,
        categoryId,
        isPinned: isPinned && canCreatePinnedThread
      };
    } catch (error) {
      logger.error('Error creating forum thread', { error, userId, options });
      throw error;
    }
  }
  
  /**
   * Get threads for a specific category with efficient pagination
   */
  async getCategoryThreads(
    categoryId: string,
    options: { 
      sortBy?: 'recent' | 'popular' | 'trending'; 
      limit?: number;
      lastId?: string;
      includeDeleted?: boolean;
    } = {}
  ): Promise<ThreadSummary[]> {
    try {
      const { 
        sortBy = 'recent', 
        limit = 20,
        lastId,
        includeDeleted = false
      } = options;
      
      // Verify category exists
      const category = await this.categoryRepository.findById(categoryId);
      if (!category) {
        throw new NotFoundError('Category not found');
      }
      
      // Query threads in this category
      const threads = await this.feedRepository.getContentFeed({
        categoryId,
        limit,
        lastId,
        sortBy,
        status: includeDeleted ? undefined : 'active',
        includeCommentCounts: true,
        includeUserDetails: true
      });
      
      // Transform into thread summary format
      return await this.transformToThreadSummaries(threads, category);
    } catch (error) {
      logger.error('Error getting category threads', { error, categoryId, options });
      throw error;
    }
  }
  
  /**
   * Get thread by ID with details
   */
  async getThreadById(threadId: string): Promise<any> {
    try {
      // Get thread content
      const thread = await this.contentRepository.getContentWithDetails(threadId);
      
      if (!thread) {
        throw new NotFoundError('Thread not found');
      }
      
      // Parse thread metadata from content_text
      let threadData = { title: '', content: '', isPinned: false };
      try {
        threadData = JSON.parse(thread.content_text || '{}');
      } catch (e) {
        logger.warn('Invalid thread content format', { threadId });
      }
      
      // Get category info
      let category = null;
      if (thread.category_id) {
        category = await this.categoryRepository.findById(thread.category_id);
      }
      
      // Return formatted thread with all details
      return {
        id: thread.id,
        title: threadData.title || '',
        content: threadData.content || '',
        authorId: thread.user_id,
        authorName: thread.author_name,
        authorAvatar: thread.author_avatar,
        createdAt: thread.created_at,
        updatedAt: thread.updated_at,
        comments: thread.comments || [],
        commentCount: thread.comment_count || 0,
        reactions: thread.reactions || {},
        isPinned: threadData.isPinned || false,
        category: category ? {
          id: category.id,
          name: category.name,
          slug: category.slug
        } : null,
        mediaUrls: thread.media_urls || []
      };
    } catch (error) {
      logger.error('Error getting thread by ID', { error, threadId });
      throw error;
    }
  }
  
  /**
   * Get popular and active threads across all categories
   */
  async getPopularThreads(
    options: { 
      timeframe?: 'day' | 'week' | 'month' | 'all';
      limit?: number;
    } = {}
  ): Promise<ThreadSummary[]> {
    try {
      const { timeframe = 'week', limit = 10 } = options;
      
      // Get popular threads based on engagement
      const popularThreads = await this.feedRepository.getContentFeed({
        sortBy: 'popular',
        timeframe,
        limit
      });
      
      // Process into thread summaries
      const categoryIds = new Set(
        popularThreads
          .filter(thread => thread.category_id)
          .map(thread => thread.category_id)
      );
      
      // Fetch all needed categories
      const categories = await Promise.all(
        Array.from(categoryIds).map(id => this.categoryRepository.findById(id))
      );
      
      // Create a map for quick lookup
      const categoryMap = new Map();
      categories.forEach(category => {
        if (category) {
          categoryMap.set(category.id, category);
        }
      });
      
      // Transform threads to summaries
      return popularThreads.map(thread => {
        // Parse thread data
        let threadData = { title: '', content: '', isPinned: false };
        try {
          threadData = JSON.parse(thread.content_text || '{}');
        } catch (e) {
          // Handle parsing error
        }
        
        // Get category info if available
        const category = thread.category_id ? categoryMap.get(thread.category_id) : null;
        
        return {
          id: thread.id,
          title: threadData.title || '',
          preview: threadData.content ? 
            threadData.content.substring(0, 150) + (threadData.content.length > 150 ? '...' : '') : 
            '',
          authorId: thread.user_id,
          authorName: thread.author_name,
          authorAvatar: thread.author_avatar,
          createdAt: thread.created_at,
          commentCount: thread.comment_count || 0,
          lastActivity: thread.updated_at || thread.created_at,
          category: category ? {
            id: category.id,
            name: category.name,
            slug: category.slug
          } : null,
          isPinned: threadData.isPinned || false,
          tags: [] // Tags handling would go here if implemented
        };
      });
    } catch (error) {
      logger.error('Error getting popular threads', { error, options });
      throw error;
    }
  }
  
  /**
   * Reply to a thread
   */
  async replyToThread(
    userId: string, 
    threadId: string, 
    content: string
  ): Promise<any> {
    try {
      // Verify thread exists
      const thread = await this.contentRepository.findById(threadId);
      if (!thread || thread.status !== 'active') {
        throw new NotFoundError('Thread not found or inactive');
      }
      
      // Create the comment
      const comment = await this.commentRepository.createComment({
        content_id: threadId,
        user_id: userId,
        comment_text: sanitizeHtml(content)
      });
      
      // Award points for thread reply
      await this.pointsService.awardPoints(
        userId,
        15, // Points for thread reply
        'comment',
        {
          referenceId: comment.id,
          description: 'Replied to forum thread'
        }
      );
      
      // Award points to thread author for engagement
      if (thread.user_id !== userId) {
        await this.pointsService.awardPoints(
          thread.user_id,
          5, // Points for receiving reply
          'engagement',
          {
            referenceId: comment.id,
            description: 'Received reply on forum thread'
          }
        );
      }
      
      // Emit comment created event
      await eventBus.publish(EventType.COMMENT_CREATED, {
        commentId: comment.id,
        contentId: threadId,
        userId,
        timestamp: new Date().toISOString()
      });
      
      return comment;
    } catch (error) {
      logger.error('Error replying to thread', { error, userId, threadId });
      throw error;
    }
  }
  
  /**
   * Search forum threads
   */
  async searchThreads(
    query: string,
    options: {
      categoryId?: string;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<ThreadSummary[]> {
    try {
      const { categoryId, limit = 20, offset = 0 } = options;
      
      // Build search query parameters
      const searchOptions: any = { limit, offset };
      if (categoryId) {
        searchOptions.categoryId = categoryId;
      }
      
      // Search for threads
      const searchResults = await this.contentRepository.searchContent(query, searchOptions);
      
      // Filter results with thread metadata
      const threadResults = searchResults.filter(result => {
        try {
          const data = JSON.parse(result.content_text || '{}');
          return !!data.title; // Consider it a thread if it has a title
        } catch (e) {
          return false;
        }
      });
      
      // Get categories for results
      const categoryIds = new Set(
        threadResults
          .filter(thread => thread.category_id)
          .map(thread => thread.category_id)
      );
      
      // Fetch all needed categories
      const categories = await Promise.all(
        Array.from(categoryIds).map(id => this.categoryRepository.findById(id))
      );
      
      // Create a map for quick lookup
      const categoryMap = new Map();
      categories.forEach(category => {
        if (category) {
          categoryMap.set(category.id, category);
        }
      });
      
      // Transform to thread summaries
      return threadResults.map(thread => {
        // Parse thread data
        let threadData = { title: '', content: '', isPinned: false };
        try {
          threadData = JSON.parse(thread.content_text || '{}');
        } catch (e) {
          // Handle parsing error
        }
        
        // Get category info if available
        const category = thread.category_id ? categoryMap.get(thread.category_id) : null;
        
        return {
          id: thread.id,
          title: threadData.title || '',
          preview: threadData.content ? 
            threadData.content.substring(0, 150) + (threadData.content.length > 150 ? '...' : '') : 
            '',
          authorId: thread.user_id,
          authorName: thread.author_name || '',
          authorAvatar: thread.author_avatar,
          createdAt: thread.created_at,
          commentCount: thread.comment_count || 0,
          lastActivity: thread.updated_at || thread.created_at,
          category: category ? {
            id: category.id,
            name: category.name,
            slug: category.slug
          } : null,
          isPinned: threadData.isPinned || false,
          tags: [] // Tags handling would go here if implemented
        };
      });
    } catch (error) {
      logger.error('Error searching threads', { error, query, options });
      throw error;
    }
  }
  
  /**
   * Helper to transform content to thread summaries
   */
  private async transformToThreadSummaries(
    threads: any[], 
    category: any
  ): Promise<ThreadSummary[]> {
    return threads.map(thread => {
      // Parse thread data
      let threadData = { title: '', content: '', isPinned: false };
      try {
        threadData = JSON.parse(thread.content_text || '{}');
      } catch (e) {
        // Handle parsing error
      }
      
      return {
        id: thread.id,
        title: threadData.title || '',
        preview: threadData.content ? 
          threadData.content.substring(0, 150) + (threadData.content.length > 150 ? '...' : '') : 
          '',
        authorId: thread.user_id,
        authorName: thread.author_name || '',
        authorAvatar: thread.author_avatar,
        createdAt: thread.created_at,
        commentCount: thread.comment_count || 0,
        lastActivity: thread.updated_at || thread.created_at,
        category: {
          id: category.id,
          name: category.name,
          slug: category.slug
        },
        isPinned: threadData.isPinned || false,
        tags: [] // Tags handling would go here if implemented
      };
    });
  }
}
