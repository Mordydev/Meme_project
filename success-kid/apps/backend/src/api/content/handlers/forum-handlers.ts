/**
 * Forum API Handlers
 * 
 * Handlers for forum-related API endpoints
 */
import { FastifyRequest, FastifyReply } from 'fastify';
import { validate } from '../../../middleware/validation';
import { z } from 'zod';
import { logger } from '../../../lib/logger';
import { NotFoundError } from '../../../errors/api-errors';

// Request validation schemas
export const forumCategoryParamsSchema = z.object({
  categoryId: z.string().uuid()
});

export const forumCategoryQuerySchema = z.object({
  sortBy: z.enum(['recent', 'popular', 'trending']).optional(),
  limit: z.string().transform(val => parseInt(val, 10)).pipe(z.number().int().min(1).max(100)).optional(),
  lastId: z.string().optional()
});

export const createThreadSchema = z.object({
  title: z.string().min(5).max(100),
  content: z.string().min(10).max(10000),
  categoryId: z.string().uuid(),
  tags: z.array(z.string().min(2).max(50)).optional(),
  mediaUrls: z.array(z.string().url()).optional(),
  isPinned: z.boolean().optional()
});

export const threadParamsSchema = z.object({
  threadId: z.string().uuid()
});

export const replyToThreadSchema = z.object({
  content: z.string().min(1).max(1000)
});

export const searchForumSchema = z.object({
  query: z.string().min(1).max(100),
  categoryId: z.string().uuid().optional(),
  limit: z.string().transform(val => parseInt(val, 10)).pipe(z.number().int().min(1).max(100)).optional(),
  offset: z.string().transform(val => parseInt(val, 10)).pipe(z.number().int().min(0)).optional()
});

export const popularThreadsQuerySchema = z.object({
  timeframe: z.enum(['day', 'week', 'month', 'all']).optional(),
  limit: z.string().transform(val => parseInt(val, 10)).pipe(z.number().int().min(1).max(20)).optional()
});

/**
 * Get forum categories
 */
export async function getForumCategories(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const contentService = request.diContainer.resolve('services').contentService;
    const forumService = request.diContainer.resolve('services').forumService;
    
    // Ensure forum categories are initialized
    await forumService.initializeForumCategories();
    
    // Get categories
    const categories = await contentService.getCategories();
    
    return reply.send({
      data: categories,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: request.id
      }
    });
  } catch (error) {
    logger.error('Error getting forum categories', { error });
    throw error;
  }
}

/**
 * Get threads in category
 */
export async function getCategoryThreads(
  request: FastifyRequest<{ 
    Params: z.infer<typeof forumCategoryParamsSchema>;
    Querystring: z.infer<typeof forumCategoryQuerySchema>;
  }>,
  reply: FastifyReply
) {
  try {
    const { categoryId } = request.params;
    const { sortBy = 'recent', limit = 20, lastId } = request.query;
    
    const forumService = request.diContainer.resolve('services').forumService;
    
    const threads = await forumService.getCategoryThreads(categoryId, {
      sortBy,
      limit,
      lastId
    });
    
    return reply.send({
      data: threads,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: request.id,
        categoryId,
        hasMore: threads.length === limit
      }
    });
  } catch (error) {
    logger.error('Error getting category threads', { 
      error, 
      categoryId: request.params.categoryId,
      query: request.query 
    });
    throw error;
  }
}

/**
 * Create new thread
 */
export async function createThread(
  request: FastifyRequest<{ Body: z.infer<typeof createThreadSchema> }>,
  reply: FastifyReply
) {
  try {
    const userId = request.user?.id;
    
    if (!userId) {
      return reply.code(401).send({ 
        error: 'Authentication required' 
      });
    }
    
    const forumService = request.diContainer.resolve('services').forumService;
    
    const thread = await forumService.createThread(userId, request.body);
    
    return reply.code(201).send({
      data: thread,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: request.id
      }
    });
  } catch (error) {
    logger.error('Error creating thread', { 
      error, 
      userId: request.user?.id, 
      body: request.body 
    });
    throw error;
  }
}

/**
 * Get thread by ID
 */
export async function getThreadById(
  request: FastifyRequest<{ Params: z.infer<typeof threadParamsSchema> }>,
  reply: FastifyReply
) {
  try {
    const { threadId } = request.params;
    
    const forumService = request.diContainer.resolve('services').forumService;
    
    const thread = await forumService.getThreadById(threadId);
    
    return reply.send({
      data: thread,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: request.id
      }
    });
  } catch (error) {
    logger.error('Error getting thread', { 
      error, 
      threadId: request.params.threadId 
    });
    throw error;
  }
}

/**
 * Reply to thread
 */
export async function replyToThread(
  request: FastifyRequest<{ 
    Params: z.infer<typeof threadParamsSchema>;
    Body: z.infer<typeof replyToThreadSchema>;
  }>,
  reply: FastifyReply
) {
  try {
    const userId = request.user?.id;
    
    if (!userId) {
      return reply.code(401).send({ 
        error: 'Authentication required' 
      });
    }
    
    const { threadId } = request.params;
    const { content } = request.body;
    
    const forumService = request.diContainer.resolve('services').forumService;
    
    const comment = await forumService.replyToThread(userId, threadId, content);
    
    return reply.code(201).send({
      data: comment,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: request.id
      }
    });
  } catch (error) {
    logger.error('Error replying to thread', { 
      error, 
      userId: request.user?.id,
      threadId: request.params.threadId,
      body: request.body 
    });
    throw error;
  }
}

/**
 * Search forum threads
 */
export async function searchThreads(
  request: FastifyRequest<{ Querystring: z.infer<typeof searchForumSchema> }>,
  reply: FastifyReply
) {
  try {
    const { query, categoryId, limit = 20, offset = 0 } = request.query;
    
    const forumService = request.diContainer.resolve('services').forumService;
    
    const results = await forumService.searchThreads(query, {
      categoryId,
      limit,
      offset
    });
    
    return reply.send({
      data: results,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: request.id,
        query,
        hasMore: results.length === limit
      }
    });
  } catch (error) {
    logger.error('Error searching threads', { 
      error, 
      query: request.query 
    });
    throw error;
  }
}

/**
 * Get popular threads
 */
export async function getPopularThreads(
  request: FastifyRequest<{ Querystring: z.infer<typeof popularThreadsQuerySchema> }>,
  reply: FastifyReply
) {
  try {
    const { timeframe = 'week', limit = 10 } = request.query;
    
    const forumService = request.diContainer.resolve('services').forumService;
    
    const threads = await forumService.getPopularThreads({
      timeframe,
      limit
    });
    
    return reply.send({
      data: threads,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: request.id,
        timeframe
      }
    });
  } catch (error) {
    logger.error('Error getting popular threads', { 
      error, 
      query: request.query 
    });
    throw error;
  }
}
