import { FastifyRequest, FastifyReply } from 'fastify';
import { ContentCreateInput } from '../../services/content-service';

interface CreateContentBody extends ContentCreateInput {
  // Extend with any API-specific fields
}

export async function createContentHandler(
  request: FastifyRequest<{ Body: CreateContentBody }>,
  reply: FastifyReply
) {
  try {
    // Get authenticated user from request
    const userId = request.user?.id;
    
    if (!userId) {
      return reply.code(401).send({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required to create content',
        },
      });
    }
    
    // Get content service from the container
    const contentService = request.diScope.resolve('contentService');
    
    // Create the content using the service
    const newContent = await contentService.createContent(userId, request.body);
    
    return reply.code(201).send({
      data: newContent,
    });
  } catch (error) {
    request.log.error(error, 'Error creating content');
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      return reply.code(400).send({
        error: {
          code: 'VALIDATION_ERROR',
          message: error.message,
          details: error.details || [],
        },
      });
    }
    
    // Handle not found errors
    if (error.name === 'NotFoundError') {
      return reply.code(404).send({
        error: {
          code: 'NOT_FOUND',
          message: error.message,
        },
      });
    }
    
    // Handle forbidden errors
    if (error.name === 'ForbiddenError') {
      return reply.code(403).send({
        error: {
          code: 'FORBIDDEN',
          message: error.message,
        },
      });
    }
    
    // Handle other errors
    return reply.code(500).send({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred while creating content',
      },
    });
  }
}
