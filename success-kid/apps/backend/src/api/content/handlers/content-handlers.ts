/**
 * Content API Handlers
 * 
 * Handlers for content-related API endpoints
 */
import { FastifyRequest, FastifyReply } from 'fastify';
import { validate } from '../../../middleware/validation';
import { z } from 'zod';
import { logger } from '../../../lib/logger';
import { 
  ContentTypeEnum, 
  CreateContentDto, 
  UpdateContentDto 
} from '../../../models/content';
import { NotFoundError } from '../../../errors/api-errors';

// Request validation schemas
export const createContentSchema = z.object({
  type: ContentTypeEnum,
  content_text: z.string().max(5000).nullable().optional(),
  media_urls: z.array(z.string().url()).optional(),
  categoryId: z.string().uuid().optional(),
  tags: z.array(z.string().min(2).max(50)).optional()
});

export const updateContentSchema = z.object({
  content_text: z.string().max(5000).optional(),
  media_urls: z.array(z.string().url()).optional(),
  tags: z.array(z.string().min(2).max(50)).optional()
});

export const contentParamsSchema = z.object({
  id: z.string().uuid()
});

export const contentQuerySchema = z.object({
  type: z.enum(['text', 'image', 'link', 'poll']).optional(),
  categoryId: z.string().uuid().optional(),
  userId: z.string().uuid().optional(),
  sortBy: z.enum(['recent', 'popular', 'trending']).optional(),
  timeframe: z.enum(['day', 'week', 'month', 'all']).optional(),
  limit: z.string().transform(val => parseInt(val, 10)).pipe(z.number().int().min(1).max(100)).optional(),
  lastId: z.string().optional()
});

export const searchQuerySchema = z.object({
  query: z.string().min(1).max(100),
  type: ContentTypeEnum.optional(),
  limit: z.string().transform(val => parseInt(val, 10)).pipe(z.number().int().min(1).max(100)).optional(),
  offset: z.string().transform(val => parseInt(val, 10)).pipe(z.number().int().min(0)).optional()
});

/**
 * Get content feed
 */
export async function getContentFeed(
  request: FastifyRequest<{ Querystring: z.infer<typeof contentQuerySchema> }>,
  reply: FastifyReply
) {
  try {
    const { 
      type, 
      categoryId, 
      userId, 
      sortBy, 
      timeframe, 
      limit, 
      lastId 
    } = request.query;
    
    const contentService = request.diContainer.resolve('services').contentService;
    
    const feed = await contentService.getContentFeed({
      type,
      categoryId,
      userId,
      sortBy,
      timeframe,
      limit,
      lastId
    });
    
    return reply.send({
      data: feed,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: request.id
      }
    });
  } catch (error) {
    logger.error('Error getting content feed', { error, request });
    throw error;
  }
}

/**
 * Get content by ID
 */
export async function getContentById(
  request: FastifyRequest<{ Params: z.infer<typeof contentParamsSchema> }>,
  reply: FastifyReply
) {
  try {
    const { id } = request.params;
    const contentService = request.diContainer.resolve('services').contentService;
    
    const content = await contentService.getContentById(id);
    
    return reply.send({
      data: content,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: request.id
      }
    });
  } catch (error) {
    logger.error('Error getting content by ID', { error, contentId: request.params.id });
    throw error;
  }
}

/**
 * Create content
 */
export async function createContent(
  request: FastifyRequest<{ Body: z.infer<typeof createContentSchema> }>,
  reply: FastifyReply
) {
  try {
    const userId = request.user?.id;
    
    if (!userId) {
      return reply.code(401).send({ 
        error: 'Authentication required' 
      });
    }
    
    const contentService = request.diContainer.resolve('services').contentService;
    
    const result = await contentService.createContent(userId, request.body);
    
    return reply.code(201).send({
      data: result,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: request.id
      }
    });
  } catch (error) {
    logger.error('Error creating content', { error, userId: request.user?.id, body: request.body });
    throw error;
  }
}

/**
 * Update content
 */
export async function updateContent(
  request: FastifyRequest<{ 
    Params: z.infer<typeof contentParamsSchema>;
    Body: z.infer<typeof updateContentSchema>;
  }>,
  reply: FastifyReply
) {
  try {
    const { id } = request.params;
    const userId = request.user?.id;
    
    if (!userId) {
      return reply.code(401).send({ 
        error: 'Authentication required' 
      });
    }
    
    const contentService = request.diContainer.resolve('services').contentService;
    
    const updatedContent = await contentService.updateContent(id, userId, request.body);
    
    return reply.send({
      data: updatedContent,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: request.id
      }
    });
  } catch (error) {
    logger.error('Error updating content', { 
      error, 
      contentId: request.params.id, 
      userId: request.user?.id, 
      body: request.body 
    });
    throw error;
  }
}

/**
 * Delete content
 */
export async function deleteContent(
  request: FastifyRequest<{ Params: z.infer<typeof contentParamsSchema> }>,
  reply: FastifyReply
) {
  try {
    const { id } = request.params;
    const userId = request.user?.id;
    
    if (!userId) {
      return reply.code(401).send({ 
        error: 'Authentication required' 
      });
    }
    
    const contentService = request.diContainer.resolve('services').contentService;
    
    await contentService.deleteContent(id, userId);
    
    return reply.send({
      data: { success: true },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: request.id
      }
    });
  } catch (error) {
    logger.error('Error deleting content', { 
      error, 
      contentId: request.params.id, 
      userId: request.user?.id
    });
    throw error;
  }
}

/**
 * Search content
 */
export async function searchContent(
  request: FastifyRequest<{ Querystring: z.infer<typeof searchQuerySchema> }>,
  reply: FastifyReply
) {
  try {
    const { query, type, limit = 20, offset = 0 } = request.query;
    
    const contentService = request.diContainer.resolve('services').contentService;
    
    const results = await contentService.searchContent(query, { type, limit, offset });
    
    return reply.send({
      data: results,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: request.id,
        query
      }
    });
  } catch (error) {
    logger.error('Error searching content', { 
      error, 
      query: request.query 
    });
    throw error;
  }
}

/**
 * Get trending content
 */
export async function getTrendingContent(
  request: FastifyRequest<{ 
    Querystring: { 
      limit?: string; 
      timeframe?: 'day' | 'week' | 'month' | 'all'; 
    }
  }>,
  reply: FastifyReply
) {
  try {
    const { 
      limit = '20', 
      timeframe = 'week' 
    } = request.query;
    
    const contentService = request.diContainer.resolve('services').contentService;
    
    const results = await contentService.getTrendingContent({
      limit: parseInt(limit, 10),
      timeframe
    });
    
    return reply.send({
      data: results,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: request.id,
        timeframe
      }
    });
  } catch (error) {
    logger.error('Error getting trending content', { 
      error, 
      query: request.query 
    });
    throw error;
  }
}
