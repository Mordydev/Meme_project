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
}