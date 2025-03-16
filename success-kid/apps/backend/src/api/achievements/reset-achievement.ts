/**
 * Reset an achievement for a user (admin only)
 */
import { FastifyRequest, FastifyReply } from 'fastify';
import { logger } from '../../lib/logger';

export async function resetAchievement(
  request: FastifyRequest<{
    Params: {
      userId: string;
      achievementId: string;
    }
  }>,
  reply: FastifyReply
): Promise<void> {
  try {
    const { userId, achievementId } = request.params;
    
    // Get achievement service
    const achievementService = request.diContainer.resolve('achievementService');
    
    // Check if achievement exists
    const achievement = await achievementService.getAchievement(achievementId);
    
    if (!achievement) {
      return reply.code(404).send({
        error: 'Not Found',
        message: `Achievement with ID ${achievementId} not found`
      });
    }
    
    // Check if user has the achievement
    const isUnlocked = await achievementService.repository.isAchievementUnlocked(
      userId,
      achievementId
    );
    
    if (!isUnlocked) {
      return reply.code(404).send({
        error: 'Not Found',
        message: `User ${userId} has not unlocked achievement ${achievementId}`
      });
    }
    
    // Reset the achievement
    const success = await achievementService.resetAchievement(userId, achievementId);
    
    if (!success) {
      return reply.code(500).send({
        error: 'Internal Server Error',
        message: 'Failed to reset achievement'
      });
    }
    
    // Return success
    return reply.code(200).send({
      data: {
        success: true,
        message: `Achievement ${achievementId} has been reset for user ${userId}`
      }
    });
  } catch (error) {
    logger.error('Error resetting achievement', { 
      error, 
      userId: request.params.userId,
      achievementId: request.params.achievementId
    });
    
    return reply.code(500).send({
      error: 'Internal Server Error',
      message: 'An error occurred while resetting the achievement'
    });
  }
}
