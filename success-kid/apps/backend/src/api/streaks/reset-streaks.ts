/**
 * Reset streaks (admin only)
 */
import { FastifyRequest, FastifyReply } from 'fastify';
import { logger } from '../../lib/logger';
import { StreakType } from '../../models/streak';

export async function resetStreaks(
  request: FastifyRequest<{
    Params: {
      userId: string;
      activityType?: string;
    }
  }>,
  reply: FastifyReply
): Promise<void> {
  try {
    const { userId, activityType } = request.params;
    
    // Get streak service
    const streakService = request.diContainer.resolve('streakService');
    
    // If activity type provided, reset specific streak
    if (activityType) {
      // Validate activity type
      if (!Object.values(StreakType).includes(activityType as StreakType)) {
        return reply.code(400).send({
          error: 'Bad Request',
          message: `Invalid activity type: ${activityType}`
        });
      }
      
      // Reset specific streak
      const success = await streakService.repository.resetStreak(
        userId, 
        activityType as StreakType
      );
      
      if (!success) {
        return reply.code(404).send({
          error: 'Not Found',
          message: `Streak for activity type ${activityType} not found`
        });
      }
      
      return reply.code(200).send({
        data: {
          success: true,
          message: `Streak reset for user ${userId} activity ${activityType}`
        }
      });
    }
    
    // Reset all streaks
    const streaks = await streakService.getUserStreaks(userId);
    
    if (streaks.length === 0) {
      return reply.code(404).send({
        error: 'Not Found',
        message: `No streaks found for user ${userId}`
      });
    }
    
    // Reset each streak
    const results = await Promise.all(
      streaks.map(streak => 
        streakService.repository.resetStreak(userId, streak.activityType)
      )
    );
    
    const resetCount = results.filter(Boolean).length;
    
    return reply.code(200).send({
      data: {
        success: true,
        message: `Reset ${resetCount} streaks for user ${userId}`,
        resetCount
      }
    });
  } catch (error) {
    logger.error('Error resetting streaks', { 
      error, 
      userId: request.params.userId,
      activityType: request.params.activityType
    });
    
    return reply.code(500).send({
      error: 'Internal Server Error',
      message: 'An error occurred while resetting streaks'
    });
  }
}
