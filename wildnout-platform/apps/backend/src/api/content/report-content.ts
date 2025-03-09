import { FastifyRequest, FastifyReply } from 'fastify';

interface ReportContentParams {
  id: string;
}

interface ReportContentBody {
  reason: string;
  details?: Record<string, any>;
}

/**
 * Handler for reporting content for moderation
 */
export async function reportContentHandler(
  request: FastifyRequest<{
    Params: ReportContentParams;
    Body: ReportContentBody;
  }>,
  reply: FastifyReply
) {
  try {
    const { id } = request.params;
    const { reason, details } = request.body;
    
    // Get authenticated user ID
    const userId = request.user?.id;
    
    if (!userId) {
      return reply.code(401).send({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required to report content',
        },
      });
    }
    
    // Validate reason
    if (!reason || reason.trim().length < 3) {
      return reply.code(400).send({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Report reason is required and must be at least 3 characters',
        },
      });
    }
    
    // Get moderation service
    const moderationService = request.diScope.resolve('moderationService');
    
    // Report the content
    await moderationService.reportContent(id, userId, reason, details);
    
    return reply.code(200).send({
      success: true,
      message: 'Content reported successfully',
      reportId: `report-${Date.now()}`,
    });
  } catch (error) {
    request.log.error(error, `Error reporting content with ID ${request.params.id}`);
    
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
        message: 'An unexpected error occurred while reporting content',
      },
    });
  }
}
