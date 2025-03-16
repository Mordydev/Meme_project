/**
 * Award badge to user (admin only)
 */
import { FastifyRequest, FastifyReply } from 'fastify';
import { logger } from '../../lib/logger';

interface AwardBadgeBody {
  badgeId: string;
  source: string;
  referenceId?: string;
}

export async function awardBadge(
  request: FastifyRequest<{
    Params: {
      userId: string;
    },
    Body: AwardBadgeBody;
  }>,
  reply: FastifyReply
): Promise<void> {
  try {
    const { userId } = request.params;
    const { badgeId, source, referenceId } = request.body;
    
    // Validate request body
    if (!badgeId || !source) {
      return reply.code(400).send({
        error: 'Bad Request',
        message: 'Badge ID and source are required'
      });
    }
    
    // Get badge service
    const badgeService = request.diContainer.resolve('badgeService');
    
    // Check if badge exists
    const badge = await badgeService.getBadge(badgeId);
    
    if (!badge) {
      return reply.code(404).send({
        error: 'Not Found',
        message: `Badge with ID ${badgeId} not found`
      });
    }
    
    // Award badge
    const result = await badgeService.awardBadge({
      userId,
      badgeId,
      source,
      referenceId
    });
    
    // Return result
    return reply.code(200).send({
      data: {
        success: true,
        badge: {
          id: badge.id,
          name: badge.name,
          tier: badge.tier,
          category: badge.category,
          imageUrl: badge.image_url,
          description: badge.description
        },
        awardedAt: result.awarded_at,
        userId,
        source
      }
    });
  } catch (error) {
    logger.error('Error awarding badge', { 
      error, 
      userId: request.params.userId, 
      body: request.body 
    });
    
    return reply.code(500).send({
      error: 'Internal Server Error',
      message: 'An error occurred while awarding the badge'
    });
  }
}
