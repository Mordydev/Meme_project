/**
 * Content Controller
 * 
 * Handles API endpoints for content management
 */
import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { ContentService } from '../../../services/content/content-service';
import { 
  createContentSchema, 
  updateContentSchema,
  ContentType
} from '../../../models/entities/content.model';
import { 
  createCommentSchema, 
  updateCommentSchema 
} from '../../../models/entities/comment.model';
import { logger } from '../../../lib/logger';
import { ValidationError, NotFoundError, ForbiddenError } from '../../../errors';
import { handleApiError } from '../../../errors/handlers';

// Query params schema for content feed
const contentFeedQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20),
  lastId: z.string().optional(),
  lastCreatedAt: z.string().optional(),
  type: z.string().optional(),
  categoryId: z.string().optional(),
  userId: z.string().optional()
});

// Query params schema for comments
const commentsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
  threaded: z.boolean().default(true),
  includeDeleted: z.boolean().default(false)
});

/**
 * Get content feed
 */
export const getContentFeed = (contentService: ContentService) => {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // Parse and validate query params
      const query = contentFeedQuerySchema.parse(request.query);
      
      // Build options object
      const options = {
        limit: query.limit,
        lastId: query.lastId,
        lastCreatedAt: query.lastCreatedAt ? new Date(query.lastCreatedAt) : undefined,
        type: query.type as ContentType | undefined,
        categoryId: query.categoryId,
        userId: query.userId
      };
      
      // Get content feed
      const contentItems = await contentService.getContentFeed(options);
      
      // Return content items
      return reply.code(200).send({
        data: contentItems,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        },
        pagination: {
          lastId: contentItems.length > 0 ? contentItems[contentItems.length - 1].id : null,
          lastCreatedAt: contentItems.length > 0 ? contentItems[contentItems.length - 1].created_at.toISOString() : null,
          limit: query.limit,
          hasMore: contentItems.length === query.limit
        }
      });
    } catch (error) {
      return handleApiError(request, reply, error);
    }
  };
};

/**
 * Get content by ID
 */
export const getContentById = (contentService: ContentService) => {
  return async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const { id } = request.params;
      
      // Get content
      const content = await contentService.getContentById(id);
      
      if (!content) {
        throw new NotFoundError('Content', id);
      }
      
      // Return content
      return reply.code(200).send({
        data: content,
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
 * Create content
 */
export const createContent = (contentService: ContentService) => {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // Validate request body
      const data = createContentSchema.parse(request.body);
      
      // Get user ID from authenticated user
      const userId = request.user.id;
      
      // Create content
      const content = await contentService.createContent(userId, data);
      
      // Return created content
      return reply.code(201).send({
        data: content,
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
 * Update content
 */
export const updateContent = (contentService: ContentService) => {
  return async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const { id } = request.params;
      
      // Validate request body
      const data = updateContentSchema.parse(request.body);
      
      // Get user ID from authenticated user
      const userId = request.user.id;
      
      // Update content
      const content = await contentService.updateContent(id, userId, data);
      
      // Return updated content
      return reply.code(200).send({
        data: content,
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
 * Delete content
 */
export const deleteContent = (contentService: ContentService) => {
  return async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const { id } = request.params;
      
      // Get user ID from authenticated user
      const userId = request.user.id;
      
      // Delete content
      const deleted = await contentService.deleteContent(id, userId);
      
      if (!deleted) {
        throw new NotFoundError('Content', id);
      }
      
      // Return success
      return reply.code(200).send({
        data: { success: true },
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
 * Get comments for content
 */
export const getContentComments = (contentService: ContentService) => {
  return async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const { id } = request.params;
      
      // Parse and validate query params
      const query = commentsQuerySchema.parse(request.query);
      
      // Get comments
      const comments = await contentService.getContentComments(id, {
        limit: query.limit,
        offset: query.offset,
        threaded: query.threaded,
        includeDeleted: query.includeDeleted
      });
      
      // Return comments
      return reply.code(200).send({
        data: comments,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        },
        pagination: {
          limit: query.limit,
          offset: query.offset,
          nextOffset: query.offset + comments.length
        }
      });
    } catch (error) {
      return handleApiError(request, reply, error);
    }
  };
};

/**
 * Create comment for content
 */
export const createComment = (contentService: ContentService) => {
  return async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const { id } = request.params;
      
      // Validate request body
      const bodyData = createCommentSchema.omit({ content_id: true, user_id: true }).parse(request.body);
      
      // Get user ID from authenticated user
      const userId = request.user.id;
      
      // Create comment data with content ID and user ID
      const commentData = {
        ...bodyData,
        content_id: id,
        user_id: userId
      };
      
      // Create comment
      const comment = await contentService.createComment(userId, commentData);
      
      // Return created comment
      return reply.code(201).send({
        data: comment,
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
 * Update comment
 */
export const updateComment = (contentService: ContentService) => {
  return async (request: FastifyRequest<{ Params: { id: string; commentId: string } }>, reply: FastifyReply) => {
    try {
      const { commentId } = request.params;
      
      // Validate request body
      const data = updateCommentSchema.parse(request.body);
      
      // Get user ID from authenticated user
      const userId = request.user.id;
      
      // Update comment
      const comment = await contentService.updateComment(commentId, userId, data);
      
      if (!comment) {
        throw new NotFoundError('Comment', commentId);
      }
      
      // Return updated comment
      return reply.code(200).send({
        data: comment,
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
 * Delete comment
 */
export const deleteComment = (contentService: ContentService) => {
  return async (request: FastifyRequest<{ Params: { id: string; commentId: string } }>, reply: FastifyReply) => {
    try {
      const { commentId } = request.params;
      
      // Get user ID from authenticated user
      const userId = request.user.id;
      
      // Delete comment
      const deleted = await contentService.deleteComment(commentId, userId);
      
      if (!deleted) {
        throw new NotFoundError('Comment', commentId);
      }
      
      // Return success
      return reply.code(200).send({
        data: { success: true },
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
