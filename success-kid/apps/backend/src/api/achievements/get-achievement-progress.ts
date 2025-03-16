/**
 * Get achievement progress for a user
 */
import { FastifyRequest, FastifyReply } from 'fastify';
import { logger } from '../../lib/logger';

export async function getAchievementProgress(
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
    
    // Check permissions - users can only see their own progress unless admin
    const isOwnProfile = request.user?.id === userId;
    if (!isOwnProfile && !request.isAdmin) {
      return reply.code(403).send({
        error: 'Forbidden',
        message: 'You do not have permission to view this user\'s achievement progress'
      });
    }
    
    // Get services from DI container
    const achievementService = request.diContainer.resolve('achievementService');
    
    // Get achievement details
    const achievement = await achievementService.getAchievement(achievementId);
    
    if (!achievement) {
      return reply.code(404).send({
        error: 'Not Found',
        message: `Achievement with ID ${achievementId} not found`
      });
    }
    
    // Check if achievement is secret and user is not admin
    if (achievement.secret && !request.isAdmin && !isOwnProfile) {
      return reply.code(403).send({
        error: 'Forbidden',
        message: 'You do not have permission to view this achievement'
      });
    }
    
    // Check if achievement is already unlocked
    const isUnlocked = await achievementService.repository.isAchievementUnlocked(
      userId,
      achievementId
    );
    
    // If unlocked, return complete progress
    if (isUnlocked) {
      return reply.code(200).send({
        data: {
          achievementId,
          userId,
          isComplete: true,
          progress: 100,
          criteriaProgress: {},
          unlockedAt: await achievementService.repository.getUnlockDate(userId, achievementId)
        }
      });
    }
    
    // Get progress for achievement
    const progress = await achievementService.rulesEngine.getAchievementProgress(
      userId,
      achievement
    );
    
    // Return progress
    return reply.code(200).send({
      data: {
        achievementId,
        userId,
        ...progress
      }
    });
  } catch (error) {
    logger.error('Error getting achievement progress', { 
      error, 
      userId: request.params.userId,
      achievementId: request.params.achievementId
    });
    
    return reply.code(500).send({
      error: 'Internal Server Error',
      message: 'An error occurred while fetching achievement progress'
    });
  }
}
