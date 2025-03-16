/**
 * Get user level
 */
import { FastifyRequest, FastifyReply } from 'fastify';
import { logger } from '../../lib/logger';

export async function getUserLevel(
  request: FastifyRequest<{
    Params: {
      userId: string;
    }
  }>,
  reply: FastifyReply
): Promise<void> {
  try {
    const { userId } = request.params;
    
    // Check permissions - users can only see their own level unless admin
    const isOwnProfile = request.user?.id === userId;
    if (!isOwnProfile && !request.isAdmin) {
      return reply.code(403).send({
        error: 'Forbidden',
        message: 'You do not have permission to view this user\'s level'
      });
    }
    
    // Get level service
    const levelService = request.diContainer.resolve('levelService');
    
    // Get user level
    const levelData = await levelService.getUserLevel(userId);
    
    // Return level data
    return reply.code(200).send({
      data: levelData
    });
  } catch (error) {
    logger.error('Error getting user level', { 
      error, 
      userId: request.params.userId 
    });
    
    return reply.code(500).send({
      error: 'Internal Server Error',
      message: 'An error occurred while fetching user level'
    });
  }
}
