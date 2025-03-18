import { FastifyInstance } from 'fastify';
import { validate } from '../../middleware/validation';
import transactionVerification from '../../middleware/transaction-verification';
import { createCacheMiddleware, createClearCacheMiddleware } from '../../middleware/cache-middleware';
import { CacheCategory } from '../../services/cache/cache-service';
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
          validate(createContentSchema),
          createClearCacheMiddleware([CacheCategory.FEED, CacheCategory.CONTENT])
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
          validate(updateContentSchema),
          createClearCacheMiddleware(
            [CacheCategory.FEED, CacheCategory.CONTENT], 
            (request) => request.params.id
          )
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
          validate(contentParamsSchema, { source: 'params' }),
          createClearCacheMiddleware(
            [CacheCategory.FEED, CacheCategory.CONTENT], 
            (request) => request.params.id
          )
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
          validate(createCommentSchema),
          createClearCacheMiddleware(
            CacheCategory.CONTENT, 
            (request) => request.params.contentId
          )
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
          validate(updateCommentSchema),
          createClearCacheMiddleware(CacheCategory.CONTENT)
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
          validate(commentParamsSchema, { source: 'params' }),
          createClearCacheMiddleware(CacheCategory.CONTENT)
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
          validate(reviewReportSchema),
          createClearCacheMiddleware([CacheCategory.CONTENT, CacheCategory.FEED])
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
          validate(createThreadSchema),
          createClearCacheMiddleware(CacheCategory.FEED)
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
          validate(replyToThreadSchema),
          createClearCacheMiddleware(
            CacheCategory.CONTENT, 
            (request) => request.params.threadId
          )
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
        validate(contentQuerySchema, { source: 'query' }),
        createCacheMiddleware({
          category: CacheCategory.FEED,
          ttl: 60, // 60 second cache
          unless: (request) => request.method !== 'GET'
        })
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
        validate(contentParamsSchema, { source: 'params' }),
        createCacheMiddleware({
          category: CacheCategory.CONTENT,
          ttl: 300, // 5 minute cache
          idFunction: (request) => request.params.id
        })
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
        validate(commentQuerySchema, { source: 'query' }),
        createCacheMiddleware({
          category: CacheCategory.CONTENT,
          ttl: 300, // 5 minute cache
          idFunction: (request) => `${request.params.contentId}:comments:${JSON.stringify(request.query)}`
        })
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
        // No caching for search - results vary widely
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
      },
      preHandler: [
        createCacheMiddleware({
          category: CacheCategory.FEED,
          ttl: 60, // 60 second cache
          idFunction: (request) => `trending:${JSON.stringify(request.query)}`
        })
      ]
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
        validate(categoryQuerySchema, { source: 'query' }),
        createCacheMiddleware({
          category: CacheCategory.TAXONOMY,
          ttl: 3600, // 1 hour cache
          idFunction: (request) => `categories:${JSON.stringify(request.query)}`
        })
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
        validate(categoryParamsSchema, { source: 'params' }),
        createCacheMiddleware({
          category: CacheCategory.TAXONOMY,
          ttl: 3600, // 1 hour cache
          idFunction: (request) => `category:${request.params.id}`
        })
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
        validate(tagQuerySchema, { source: 'query' }),
        createCacheMiddleware({
          category: CacheCategory.TAXONOMY,
          ttl: 900, // 15 minute cache
          idFunction: (request) => `popular-tags:${JSON.stringify(request.query)}`
        })
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
        // No caching for search
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
        // No caching for moderation queue - needs fresh data
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
    {
      preHandler: [
        createCacheMiddleware({
          category: CacheCategory.TAXONOMY,
          ttl: 3600, // 1 hour cache
          idFunction: () => 'forum-categories'
        })
      ]
    },
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
        validate(forumCategoryQuerySchema, { source: 'query' }),
        createCacheMiddleware({
          category: CacheCategory.FEED,
          ttl: 120, // 2 minute cache
          idFunction: (request) => `forum:category:${request.params.categoryId}:${JSON.stringify(request.query)}`
        })
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
        validate(threadParamsSchema, { source: 'params' }),
        createCacheMiddleware({
          category: CacheCategory.CONTENT,
          ttl: 300, // 5 minute cache
          idFunction: (request) => `forum:thread:${request.params.threadId}`
        })
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
        // No caching for search
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
        validate(popularThreadsQuerySchema, { source: 'query' }),
        createCacheMiddleware({
          category: CacheCategory.FEED,
          ttl: 120, // 2 minute cache
          idFunction: (request) => `forum:popular:${JSON.stringify(request.query)}`
        })
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
        // No caching for search
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
    {
      preHandler: [
        createCacheMiddleware({
          category: CacheCategory.TAXONOMY,
          ttl: 900, // 15 minute cache
          idFunction: (request) => `search:suggestions:${JSON.stringify(request.query)}`
        })
      ]
    },
    getSearchSuggestions
  );
  
  /**
   * GET /api/v1/content/search/trending
   * Get trending search terms
   */
  fastify.get(
    '/search/trending',
    {
      preHandler: [
        createCacheMiddleware({
          category: CacheCategory.TAXONOMY,
          ttl: 900, // 15 minute cache
        })
      ]
    },
    getTrendingSearchTerms
  );
}