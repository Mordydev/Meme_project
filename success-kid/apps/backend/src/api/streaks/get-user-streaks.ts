/**
 * Get user streaks
 */
import { FastifyRequest, FastifyReply } from 'fastify';
import { logger } from '../../lib/logger';

export async function getUserStreaks(
  request: FastifyRequest<{
    Params: {
      userId: string;
    }
  }>,
  reply: FastifyReply
): Promise<void> {
  try {
    const { userId } = request.params;
    
    // Check permissions - users can only see their own streaks unless admin
    const isOwnProfile = request.user?.id === userId;
    if (!isOwnProfile && !request.isAdmin) {
      return reply.code(403).send({
        error: 'Forbidden',
        message: 'You do not have permission to view this user\'s streaks'
      });
    }
    
    // Get streak service
    const streakService = request.diContainer.resolve('streakService');
    
    // Get user streaks
    const streaks = await streakService.getUserStreaks(userId);
    
    // Return streaks
    return reply.code(200).send({
      data: streaks,
      meta: {
        total: streaks.length,
        userId
      }
    });
  } catch (error) {
    logger.error('Error getting user streaks', { 
      error, 
      userId: request.params.userId 
    });
    
    return reply.code(500).send({
      error: 'Internal Server Error',
      message: 'An error occurred while fetching user streaks'
    });
  }
}
