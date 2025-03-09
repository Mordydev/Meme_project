import { FastifyRequest, FastifyReply } from 'fastify';

interface GetContentByIdParams {
  id: string;
}

export async function getContentByIdHandler(
  request: FastifyRequest<{ Params: GetContentByIdParams }>,
  reply: FastifyReply
) {
  try {
    const { id } = request.params;
    
    // Get authenticated user ID if available (for permission checks)
    const userId = request.user?.id;
    
    // Get content service
    const contentService = request.diScope.resolve('contentService');
    
    // Get content by ID
    const content = await contentService.getContentById(id, userId);
    
    // Get comments for the content
    const commentsResult = await contentService.getComments(id);
    
    // Combine content with comments
    const responseData = {
      ...content,
      comments: commentsResult.comments
    };
    
    return reply.code(200).send({
      data: responseData
    });
  } catch (error) {
    request.log.error(error, `Error fetching content with ID ${request.params.id}`);
    
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
    
    // Handle other errors
    return reply.code(500).send({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred while fetching content',
      },
    });
  }
}
