/**
 * Thread Controller
 * 
 * Handles API endpoints for thread management
 */
import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { ForumService } from '../../../services/forum/forum-service';
import { createThreadSchema, updateThreadSchema } from '../../../models/entities/forum/thread.model';
import { logger } from '../../../lib/logger';
import { NotFoundError, ValidationError, ForbiddenError } from '../../../errors';
import { handleApiError } from '../../../errors/handlers';

/**
 * Create a thread
 */
export const createThread = (forumService: ForumService) => {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // Validate request body
      const data = createThreadSchema.parse(request.body);
      
      // Get user ID from authenticated user
      const userId = request.user.id;
      
      // Create thread
      const thread = await forumService.createThread(userId, data);
      
      // Return created thread
      return reply.code(201).send({
        data: thread,
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

// Query params schema for thread replies
const threadRepliesQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0)
});

/**
 * Get thread with replies
 */
export const getThreadWithReplies = (forumService: ForumService) => {
  return async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const { id } = request.params;
      
      // Parse and validate query params
      const query = threadRepliesQuerySchema.parse(request.query);
      
      const thread = await forumService.getThreadWithReplies(id, query);
      
      return reply.code(200).send({
        data: thread,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        },
        pagination: {
          limit: query.limit,
          offset: query.offset,
          nextOffset: query.offset + (thread.replies?.length || 0)
        }
      });
    } catch (error) {
      return handleApiError(request, reply, error);
    }
  };
};

// Reply content schema
const replyContentSchema = z.object({
  content_text: z.string()
    .min(1, { message: 'Reply content is required' })
    .max(5000, { message: 'Reply cannot exceed 5000 characters' }),
  media_urls: z.array(z.string().url()).optional()
});

/**
 * Create a reply to a thread
 */
export const createThreadReply = (forumService: ForumService) => {
  return async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const { id } = request.params;
      
      // Validate request body
      const data = replyContentSchema.parse(request.body);
      
      // Get user ID from authenticated user
      const userId = request.user.id;
      
      // Create reply
      const threadReply = await forumService.createThreadReply(userId, id, data);
      
      // Return created reply
      return reply.code(201).send({
        data: threadReply,
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
 * Update a thread
 */
export const updateThread = (forumService: ForumService) => {
  return async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const { id } = request.params;
      
      // Validate request body
      const data = updateThreadSchema.parse(request.body);
      
      // Get user ID from authenticated user
      const userId = request.user.id;
      
      // Update thread
      const thread = await forumService.updateThread(id, userId, data);
      
      // Return updated thread
      return reply.code(200).send({
        data: thread,
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

// Query params schema for user threads
const userThreadsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20),
  offset: z.coerce.number().int().min(0).default(0)
});

/**
 * Get user's threads
 */
export const getUserThreads = (forumService: ForumService) => {
  return async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const { id } = request.params;
      
      // Parse and validate query params
      const query = userThreadsQuerySchema.parse(request.query);
      
      // Check if requesting own threads or has permission
      if (id !== request.user.id) {
        // Permission check here if needed
        // For now, we allow viewing other users' threads
      }
      
      const threads = await forumService.getUserThreads(id, query);
      
      return reply.code(200).send({
        data: threads,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        },
        pagination: {
          limit: query.limit,
          offset: query.offset,
          nextOffset: query.offset + threads.length
        }
      });
    } catch (error) {
      return handleApiError(request, reply, error);
    }
  };
};

// Query params schema for trending threads
const trendingThreadsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(10),
  period: z.enum(['day', 'week', 'month']).default('week')
});

/**
 * Get trending threads
 */
export const getTrendingThreads = (forumService: ForumService) => {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // Parse and validate query params
      const query = trendingThreadsQuerySchema.parse(request.query);
      
      const threads = await forumService.getTrendingThreads(query);
      
      return reply.code(200).send({
        data: threads,
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
