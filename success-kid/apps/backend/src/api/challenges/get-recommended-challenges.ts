/**
 * Get recommended challenges for user
 */
import { FastifyRequest, FastifyReply } from 'fastify';
import { logger } from '../../lib/logger';

export async function getRecommendedChallenges(
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
    const limit = request.query.limit ? parseInt(request.query.limit, 10) : 3;
    
    // Check permissions - users can only see their own recommendations unless admin
    const isOwnProfile = request.user?.id === userId;
    if (!isOwnProfile && !request.isAdmin) {
      return reply.code(403).send({
        error: 'Forbidden',
        message: 'You do not have permission to view this user\'s recommended challenges'
      });
    }
    
    // Validate limit
    if (isNaN(limit) || limit < 1 || limit > 10) {
      return reply.code(400).send({
        error: 'Bad Request',
        message: 'Limit must be a number between 1 and 10'
      });
    }
    
    // Get challenge service
    const challengeService = request.diContainer.resolve('challengeService');
    
    // Get recommended challenges
    const challenges = await challengeService.getRecommendedChallenges(userId, limit);
    
    // Return challenges
    return reply.code(200).send({
      data: challenges,
      meta: {
        total: challenges.length,
        userId,
        limit
      }
    });
  } catch (error) {
    logger.error('Error getting recommended challenges', { 
      error, 
      userId: request.params.userId, 
      limit: request.query.limit 
    });
    
    return reply.code(500).send({
      error: 'Internal Server Error',
      message: 'An error occurred while fetching recommended challenges'
    });
  }
}
