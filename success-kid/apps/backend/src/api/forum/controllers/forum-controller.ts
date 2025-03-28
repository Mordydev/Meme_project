/**
 * Forum Controller
 * 
 * Handles API endpoints for forums and categories
 */
import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { ForumService } from '../../../services/forum/forum-service';
import { logger } from '../../../lib/logger';
import { NotFoundError } from '../../../errors';
import { handleApiError } from '../../../errors/handlers';

/**
 * Get all forums
 */
export const getAllForums = (forumService: ForumService) => {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const forums = await forumService.getAllForums();
      
      return reply.code(200).send({
        data: forums,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        }
      });
    } catch (error) {
      return handleApiError(request, reply, error);
    }
  };
};

/**
 * Get forum by slug
 */
export const getForumBySlug = (forumService: ForumService) => {
  return async (request: FastifyRequest<{ Params: { slug: string } }>, reply: FastifyReply) => {
    try {
      const { slug } = request.params;
      
      const forum = await forumService.getForumBySlug(slug);
      
      return reply.code(200).send({
        data: forum,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        }
      });
    } catch (error) {
      return handleApiError(request, reply, error);
    }
  };
};

// Query params schema for thread listing
const threadListingQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20),
  offset: z.coerce.number().int().min(0).default(0),
  sort: z.enum(['recent', 'newest', 'views']).default('recent')
});

/**
 * Get category with threads
 */
export const getCategoryWithThreads = (forumService: ForumService) => {
  return async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const { id } = request.params;
      
      // Parse and validate query params
      const query = threadListingQuerySchema.parse(request.query);
      
      const category = await forumService.getCategoryWithThreads(id, query);
      
      return reply.code(200).send({
        data: category,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        },
        pagination: {
          limit: query.limit,
          offset: query.offset,
          nextOffset: query.offset + (category.threads?.length || 0)
        }
      });
    } catch (error) {
      return handleApiError(request, reply, error);
    }
  };
};
