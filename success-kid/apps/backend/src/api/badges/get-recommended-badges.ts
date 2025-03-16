/**
 * Get recommended badges for user
 */
import { FastifyRequest, FastifyReply } from 'fastify';
import { logger } from '../../lib/logger';

export async function getRecommendedBadges(
  request: FastifyRequest<{
    Params: {
      userId: string;
    },
    Querystring: {
      limit?: string;
    }
  }>,
  reply: FastifyReply
): Promise<void> {
  try {
    const { userId } = request.params;
    const limit = request.query.limit ? parseInt(request.query.limit, 10) : 5;
    
    // Check permissions - users can only see their own recommendations unless admin
    const isOwnProfile = request.user?.id === userId;
    if (!isOwnProfile && !request.isAdmin) {
      return reply.code(403).send({
        error: 'Forbidden',
        message: 'You do not have permission to view this user\'s recommended badges'
      });
    }
    
    // Validate limit
    if (isNaN(limit) || limit < 1 || limit > 20) {
      return reply.code(400).send({
        error: 'Bad Request',
        message: 'Limit must be a number between 1 and 20'
      });
    }
    
    // Get badge service
    const badgeService = request.diContainer.resolve('badgeService');
    
    // Get recommended badges
    const badges = await badgeService.getRecommendedBadges(userId, limit);
    
    // Return badges
    return reply.code(200).send({
      data: badges,
      meta: {
        total: badges.length,
        userId,
        limit
      }
    });
  } catch (error) {
    logger.error('Error getting recommended badges', { 
      error, 
      userId: request.params.userId, 
      limit: request.query.limit 
    });
    
    return reply.code(500).send({
      error: 'Internal Server Error',
      message: 'An error occurred while fetching recommended badges'
    });
  }
}
