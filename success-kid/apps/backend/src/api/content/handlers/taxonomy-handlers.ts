/**
 * Taxonomy API Handlers
 * 
 * Handlers for category and tag related API endpoints
 */
import { FastifyRequest, FastifyReply } from 'fastify';
import { validate } from '../../../middleware/validation';
import { z } from 'zod';
import { logger } from '../../../lib/logger';
import { NotFoundError } from '../../../errors/api-errors';

// Request validation schemas
export const categoryParamsSchema = z.object({
  id: z.string().uuid().optional()
});

export const categoryQuerySchema = z.object({
  parentId: z.string().uuid().nullable().optional()
});

export const tagQuerySchema = z.object({
  limit: z.string().transform(val => parseInt(val, 10)).pipe(z.number().int().min(1).max(100)).optional()
});

export const tagSearchQuerySchema = z.object({
  query: z.string().min(1).max(50),
  limit: z.string().transform(val => parseInt(val, 10)).pipe(z.number().int().min(1).max(50)).optional()
});

/**
 * Get categories
 */
export async function getCategories(
  request: FastifyRequest<{ Querystring: z.infer<typeof categoryQuerySchema> }>,
  reply: FastifyReply
) {
  try {
    const { parentId } = request.query;
    
    const contentService = request.diContainer.resolve('services').contentService;
    
    const categories = await contentService.getCategories(parentId);
    
    return reply.send({
      data: categories,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: request.id
      }
    });
  } catch (error) {
    logger.error('Error getting categories', { 
      error, 
      query: request.query 
    });
    throw error;
  }
}

/**
 * Get category by ID
 */
export async function getCategoryById(
  request: FastifyRequest<{ Params: z.infer<typeof categoryParamsSchema> }>,
  reply: FastifyReply
) {
  try {
    const { id } = request.params;
    
    if (!id) {
      throw new NotFoundError('Category');
    }
    
    const contentService = request.diContainer.resolve('services').contentService;
    
    // Find the category
    const categories = await contentService.getCategories();
    const category = categories.find(c => c.id === id);
    
    if (!category) {
      throw new NotFoundError('Category');
    }
    
    // Get child categories
    const childCategories = await contentService.getCategories(id);
    
    return reply.send({
      data: {
        category,
        children: childCategories
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: request.id
      }
    });
  } catch (error) {
    logger.error('Error getting category by ID', { 
      error, 
      categoryId: request.params.id 
    });
    throw error;
  }
}

/**
 * Get popular tags
 */
export async function getPopularTags(
  request: FastifyRequest<{ Querystring: z.infer<typeof tagQuerySchema> }>,
  reply: FastifyReply
) {
  try {
    const { limit = 20 } = request.query;
    
    const contentService = request.diContainer.resolve('services').contentService;
    
    const tags = await contentService.getPopularTags(limit);
    
    return reply.send({
      data: tags,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: request.id
      }
    });
  } catch (error) {
    logger.error('Error getting popular tags', { 
      error, 
      query: request.query 
    });
    throw error;
  }
}

/**
 * Search tags
 */
export async function searchTags(
  request: FastifyRequest<{ Querystring: z.infer<typeof tagSearchQuerySchema> }>,
  reply: FastifyReply
) {
  try {
    const { query, limit = 10 } = request.query;
    
    // Get tag repository directly since ContentService doesn't expose tag search
    const tagRepository = request.diContainer.resolve('db').repositories.tags;
    
    const tags = await tagRepository.searchTags(query, limit);
    
    return reply.send({
      data: tags,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: request.id,
        query
      }
    });
  } catch (error) {
    logger.error('Error searching tags', { 
      error, 
      query: request.query 
    });
    throw error;
  }
}
