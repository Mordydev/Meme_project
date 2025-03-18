import { FastifyInstance } from 'fastify';
import { validate } from '../../middleware/validation';
import transactionVerification from '../../middleware/transaction-verification';
import { 
  getContentFeed,
  getContentById,
  createContent,
  updateContent,
  deleteContent,
  searchContent,
  getTrendingContent,
  getContentComments,
  createComment,
  updateComment,
  deleteComment,
  getCategories,
  getCategoryById,
  getPopularTags,
  searchTags,
  reportContent,
  getReportQueue,
  reviewReport,
  contentParamsSchema,
  contentQuerySchema,
  createContentSchema,
  updateContentSchema,
  searchQuerySchema,
  contentCommentsParamsSchema,
  commentQuerySchema,
  createCommentSchema,
  updateCommentSchema,
  commentParamsSchema,
  categoryParamsSchema,
  categoryQuerySchema,
  tagQuerySchema,
  tagSearchQuerySchema,
  reportContentSchema,
  reportQueueQuerySchema,
  reviewReportSchema,
  reportParamsSchema
} from './handlers';

// Import forum handlers
import {
  getForumCategories,
  getCategoryThreads,
  createThread,
  getThreadById,
  replyToThread,
  searchThreads,
  getPopularThreads,
  forumCategoryParamsSchema,
  forumCategoryQuerySchema,
  createThreadSchema,
  threadParamsSchema,
  replyToThreadSchema,
  searchForumSchema,
  popularThreadsQuerySchema
} from './handlers/forum-handlers';

// Import search handlers
import {
  advancedSearch,
  getSearchSuggestions,
  getTrendingSearchTerms,
  searchQuerySchema as advancedSearchQuerySchema
} from './handlers/search-handlers';

export default async function content(fastify: FastifyInstance): Promise<void> {
  // Register transaction verification for transaction idempotency
  fastify.register(async (instance) => {
    instance.addHook('preHandler', transactionVerification);
    
    /**
     * POST /api/v1/content
     * Create new content
     */
    instance.post(
      '/',
      {
        preHandler: [
          validate(createContentSchema)
        ]
      },
      createContent
    );
    
    /**
     * PUT /api/v1/content/:id
     * Update content
     */
    instance.put(
      '/:id',
      {
        preHandler: [
          validate(contentParamsSchema, { source: 'params' }),
          validate(updateContentSchema)
        ]
      },
      updateContent
    );
    
    /**
     * DELETE /api/v1/content/:id
     * Delete content
     */
    instance.delete(
      '/:id',
      {
        preHandler: [
          validate(contentParamsSchema, { source: 'params' })
        ]
      },
      deleteContent
    );
    
    /**
     * POST /api/v1/content/:contentId/comments
     * Create comment on content
     */
    instance.post(
      '/:contentId/comments',
      {
        preHandler: [
          validate(contentCommentsParamsSchema, { source: 'params' }),
          validate(createCommentSchema)
        ]
      },
      createComment
    );
    
    /**
     * PUT /api/v1/content/comments/:id
     * Update comment
     */
    instance.put(
      '/comments/:id',
      {
        preHandler: [
          validate(commentParamsSchema, { source: 'params' }),
          validate(updateCommentSchema)
        ]
      },
      updateComment
    );
    
    /**
     * DELETE /api/v1/content/comments/:id
     * Delete comment
     */
    instance.delete(
      '/comments/:id',
      {
        preHandler: [
          validate(commentParamsSchema, { source: 'params' })
        ]
      },
      deleteComment
    );
    
    /**
     * POST /api/v1/content/report
     * Report content or comment
     */
    instance.post(
      '/report',
      {
        preHandler: [
          validate(reportContentSchema)
        ]
      },
      reportContent
    );
    
    /**
     * POST /api/v1/content/moderation/review/:id
     * Review a reported content item
     */
    instance.post(
      '/moderation/review/:id',
      {
        preHandler: [
          validate(reportParamsSchema, { source: 'params' }),
          validate(reviewReportSchema)
        ]
      },
      reviewReport
    );
    
    /**
     * POST /api/v1/content/forum/threads
     * Create new thread
     */
    instance.post(
      '/forum/threads',
      {
        preHandler: [
          validate(createThreadSchema)
        ]
      },
      createThread
    );
    
    /**
     * POST /api/v1/content/forum/threads/:threadId/replies
     * Reply to thread
     */
    instance.post(
      '/forum/threads/:threadId/replies',
      {
        preHandler: [
          validate(threadParamsSchema, { source: 'params' }),
          validate(replyToThreadSchema)
        ]
      },
      replyToThread
    );
  });
  
  /**
   * GET /api/v1/content
   * Get content feed
   */
  fastify.get(
    '/',
    {
      preHandler: [
        validate(contentQuerySchema, { source: 'query' })
      ]
    },
    getContentFeed
  );
  
  /**
   * GET /api/v1/content/:id
   * Get content by ID
   */
  fastify.get(
    '/:id',
    {
      preHandler: [
        validate(contentParamsSchema, { source: 'params' })
      ]
    },
    getContentById
  );
  
  /**
   * GET /api/v1/content/:contentId/comments
   * Get comments for content
   */
  fastify.get(
    '/:contentId/comments',
    {
      preHandler: [
        validate(contentCommentsParamsSchema, { source: 'params' }),
        validate(commentQuerySchema, { source: 'query' })
      ]
    },
    getContentComments
  );
  
  /**
   * GET /api/v1/content/search
   * Search content
   */
  fastify.get(
    '/search',
    {
      preHandler: [
        validate(searchQuerySchema, { source: 'query' })
      ]
    },
    searchContent
  );
  
  /**
   * GET /api/v1/content/trending
   * Get trending content
   */
  fastify.get(
    '/trending',
    {
      schema: {
        querystring: {
          limit: { type: 'integer', minimum: 1, maximum: 100 },
          timeframe: { type: 'string', enum: ['day', 'week', 'month', 'all'] }
        }
      }
    },
    getTrendingContent
  );
  
  /**
   * GET /api/v1/content/categories
   * Get all categories
   */
  fastify.get(
    '/categories',
    {
      preHandler: [
        validate(categoryQuerySchema, { source: 'query' })
      ]
    },
    getCategories
  );
  
  /**
   * GET /api/v1/content/categories/:id
   * Get category by ID
   */
  fastify.get(
    '/categories/:id',
    {
      preHandler: [
        validate(categoryParamsSchema, { source: 'params' })
      ]
    },
    getCategoryById
  );
  
  /**
   * GET /api/v1/content/tags/popular
   * Get popular tags
   */
  fastify.get(
    '/tags/popular',
    {
      preHandler: [
        validate(tagQuerySchema, { source: 'query' })
      ]
    },
    getPopularTags
  );
  
  /**
   * GET /api/v1/content/tags/search
   * Search tags
   */
  fastify.get(
    '/tags/search',
    {
      preHandler: [
        validate(tagSearchQuerySchema, { source: 'query' })
      ]
    },
    searchTags
  );
  
  /**
   * GET /api/v1/content/moderation/queue
   * Get moderation queue
   */
  fastify.get(
    '/moderation/queue',
    {
      preHandler: [
        validate(reportQueueQuerySchema, { source: 'query' })
      ]
    },
    getReportQueue
  );
  
  /**
   * GET /api/v1/content/forum/categories
   * Get forum categories
   */
  fastify.get(
    '/forum/categories',
    getForumCategories
  );
  
  /**
   * GET /api/v1/content/forum/categories/:categoryId/threads
   * Get threads in category
   */
  fastify.get(
    '/forum/categories/:categoryId/threads',
    {
      preHandler: [
        validate(forumCategoryParamsSchema, { source: 'params' }),
        validate(forumCategoryQuerySchema, { source: 'query' })
      ]
    },
    getCategoryThreads
  );
  
  /**
   * GET /api/v1/content/forum/threads/:threadId
   * Get thread by ID
   */
  fastify.get(
    '/forum/threads/:threadId',
    {
      preHandler: [
        validate(threadParamsSchema, { source: 'params' })
      ]
    },
    getThreadById
  );
  
  /**
   * GET /api/v1/content/forum/search
   * Search threads
   */
  fastify.get(
    '/forum/search',
    {
      preHandler: [
        validate(searchForumSchema, { source: 'query' })
      ]
    },
    searchThreads
  );
  
  /**
   * GET /api/v1/content/forum/popular
   * Get popular threads
   */
  fastify.get(
    '/forum/popular',
    {
      preHandler: [
        validate(popularThreadsQuerySchema, { source: 'query' })
      ]
    },
    getPopularThreads
  );
  
  /**
   * GET /api/v1/content/search/advanced
   * Perform advanced search
   */
  fastify.get(
    '/search/advanced',
    {
      preHandler: [
        validate(advancedSearchQuerySchema, { source: 'query' })
      ]
    },
    advancedSearch
  );
  
  /**
   * GET /api/v1/content/search/suggestions
   * Get search suggestions
   */
  fastify.get(
    '/search/suggestions',
    getSearchSuggestions
  );
  
  /**
   * GET /api/v1/content/search/trending
   * Get trending search terms
   */
  fastify.get(
    '/search/trending',
    getTrendingSearchTerms
  );
}