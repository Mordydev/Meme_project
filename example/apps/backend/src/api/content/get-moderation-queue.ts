import { FastifyRequest, FastifyReply } from 'fastify';

interface GetModerationQueueQuery {
  limit?: string;
}

/**
 * Handler for getting content items in the moderation queue
 * This endpoint should be restricted to moderators only
 */
export async function getModerationQueueHandler(
  request: FastifyRequest<{
    Querystring: GetModerationQueueQuery;
  }>,
  reply: FastifyReply
) {
  try {
    const { limit = '10' } = request.query;
    
    // Get authenticated user ID
    const userId = request.user?.id;
    
    if (!userId) {
      return reply.code(401).send({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required to access moderation queue',
        },
      });
    }
    
    // TODO: Add role check for moderator permission
    // This would typically check if user has moderator role
    const isModerator = true; // For now, assume all authenticated users can moderate (replace with actual check)
    
    if (!isModerator) {
      return reply.code(403).send({
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have permission to access moderation queue',
        },
      });
    }
    
    // Get moderation service
    const moderationService = request.diScope.resolve('moderationService');
    
    // Get content items for review
    const queueItems = await moderationService.getContentForReview(parseInt(limit));
    
    return reply.code(200).send({
      data: queueItems,
      meta: {
        count: queueItems.length,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    request.log.error(error, 'Error fetching moderation queue');
    
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
        message: 'An unexpected error occurred while fetching moderation queue',
      },
    });
  }
}
