/**
 * Get achievement by ID
 */
import { FastifyRequest, FastifyReply } from 'fastify';
import { logger } from '../../lib/logger';

export async function getAchievementById(
  request: FastifyRequest<{
    Params: {
      id: string;
    }
  }>,
  reply: FastifyReply
): Promise<void> {
  try {
    const { id } = request.params;
    
    // Get achievement from service
    const achievementService = request.diContainer.resolve('achievementService');
    const achievement = await achievementService.getAchievement(id);
    
    // Check if achievement exists
    if (!achievement) {
      return reply.code(404).send({
        error: 'Not Found',
        message: `Achievement with ID ${id} not found`
      });
    }
    
    // Check if secret and user is not admin
    if (achievement.secret && !request.isAdmin) {
      return reply.code(403).send({
        error: 'Forbidden',
        message: 'You do not have permission to view this achievement'
      });
    }
    
    // Return achievement
    return reply.code(200).send({
      data: achievement
    });
  } catch (error) {
    logger.error('Error getting achievement by ID', { error, id: request.params.id });
    return reply.code(500).send({
      error: 'Internal Server Error',
      message: 'An error occurred while fetching the achievement'
    });
  }
}
