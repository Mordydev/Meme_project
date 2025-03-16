/**
 * Comment API Handlers
 * 
 * Handlers for comment-related API endpoints
 */
import { FastifyRequest, FastifyReply } from 'fastify';
import { validate } from '../../../middleware/validation';
import { z } from 'zod';
import { logger } from '../../../lib/logger';
import { 
  CreateCommentDto, 
  UpdateCommentDto 
} from '../../../models/comment';
import { NotFoundError } from '../../../errors/api-errors';

// Request validation schemas
export const createCommentSchema = z.object({
  content_id: z.string().uuid(),
  comment_text: z.string().min(1).max(1000),
  parent_id: z.string().uuid().nullable().optional()
});

export const updateCommentSchema = z.object({
  comment_text: z.string().min(1).max(1000)
});

export const commentParamsSchema = z.object({
  id: z.string().uuid()
});

export const contentCommentsParamsSchema = z.object({
  contentId: z.string().uuid()
});

export const commentQuerySchema = z.object({
  limit: z.string().transform(val => parseInt(val, 10)).pipe(z.number().int().min(1).max(100)).optional(),
  offset: z.string().transform(val => parseInt(val, 10)).pipe(z.number().int().min(0)).optional()
});

/**
 * Get comments for content
 */
export async function getContentComments(
  request: FastifyRequest<{ 
    Params: z.infer<typeof contentCommentsParamsSchema>;
    Querystring: z.infer<typeof commentQuerySchema>;
  }>,
  reply: FastifyReply
) {
  try {
    const { contentId } = request.params;
    const { limit, offset } = request.query;
    
    const contentService = request.diContainer.resolve('services').contentService;
    
    const comments = await contentService.getContentComments(contentId, { limit, offset });
    
    return reply.send({
      data: comments,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: request.id
      }
    });
  } catch (error) {
    logger.error('Error getting content comments', { 
      error, 
      contentId: request.params.contentId 
    });
    throw error;
  }
}

/**
 * Create comment
 */
export async function createComment(
  request: FastifyRequest<{ Body: z.infer<typeof createCommentSchema> }>,
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
    
    const result = await contentService.createComment(userId, request.body);
    
    return reply.code(201).send({
      data: result,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: request.id
      }
    });
  } catch (error) {
    logger.error('Error creating comment', { 
      error, 
      userId: request.user?.id, 
      body: request.body 
    });
    throw error;
  }
}

/**
 * Update comment
 */
export async function updateComment(
  request: FastifyRequest<{ 
    Params: z.infer<typeof commentParamsSchema>;
    Body: z.infer<typeof updateCommentSchema>;
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
    
    const updatedComment = await contentService.updateComment(id, userId, request.body);
    
    return reply.send({
      data: updatedComment,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: request.id
      }
    });
  } catch (error) {
    logger.error('Error updating comment', { 
      error, 
      commentId: request.params.id, 
      userId: request.user?.id, 
      body: request.body 
    });
    throw error;
  }
}

/**
 * Delete comment
 */
export async function deleteComment(
  request: FastifyRequest<{ Params: z.infer<typeof commentParamsSchema> }>,
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
    
    await contentService.deleteComment(id, userId);
    
    return reply.send({
      data: { success: true },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: request.id
      }
    });
  } catch (error) {
    logger.error('Error deleting comment', { 
      error, 
      commentId: request.params.id, 
      userId: request.user?.id
    });
    throw error;
  }
}
