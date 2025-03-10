import { FastifyRequest, FastifyReply } from 'fastify';
import { ModerationDecision, ContentModerationFlag } from '../../services/moderation-service';

interface ModerateContentParams {
  id: string;
}

interface ModerateContentBody {
  decision: ModerationDecision;
  reason?: string;
  flags?: ContentModerationFlag[];
}

/**
 * Handler for moderating content
 * This endpoint should be restricted to moderators only
 */
export async function moderateContentHandler(
  request: FastifyRequest<{
    Params: ModerateContentParams;
    Body: ModerateContentBody;
  }>,
  reply: FastifyReply
) {
  try {
    const { id } = request.params;
    const { decision, reason, flags } = request.body;
    
    // Get authenticated user ID
    const userId = request.user?.id;
    
    if (!userId) {
      return reply.code(401).send({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required to moderate content',
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
          message: 'You do not have permission to moderate content',
        },
      });
    }
    
    // Validate decision
    if (!['approved', 'rejected', 'escalated'].includes(decision)) {
      return reply.code(400).send({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid moderation decision',
        },
      });
    }
    
    // Get moderation service
    const moderationService = request.diScope.resolve('moderationService');
    
    // Moderate the content
    await moderationService.moderateContent(id, userId, decision, reason, flags);
    
    return reply.code(200).send({
      success: true,
      message: `Content has been ${decision}`,
      contentId: id,
      decision
    });
  } catch (error) {
    request.log.error(error, `Error moderating content with ID ${request.params.id}`);
    
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
        message: 'An unexpected error occurred while moderating content',
      },
    });
  }
}
