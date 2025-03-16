/**
 * Record activity for streak
 */
import { FastifyRequest, FastifyReply } from 'fastify';
import { logger } from '../../lib/logger';
import { StreakType } from '../../models/streak';

export async function recordActivity(
  request: FastifyRequest<{
    Params: {
      userId: string;
      activityType: string;
    }
  }>,
  reply: FastifyReply
): Promise<void> {
  try {
    const { userId, activityType } = request.params;
    
    // Check permissions - users can only record their own activities unless admin
    const isOwnProfile = request.user?.id === userId;
    if (!isOwnProfile && !request.isAdmin) {
      return reply.code(403).send({
        error: 'Forbidden',
        message: 'You do not have permission to record activity for this user'
      });
    }
    
    // Validate activity type
    if (!Object.values(StreakType).includes(activityType as StreakType)) {
      return reply.code(400).send({
        error: 'Bad Request',
        message: `Invalid activity type: ${activityType}`
      });
    }
    
    // Get streak service
    const streakService = request.diContainer.resolve('streakService');
    
    // Record activity
    const result = await streakService.recordActivity(
      userId, 
      activityType as StreakType
    );
    
    // Return result
    return reply.code(200).send({
      data: {
        ...result,
        userId,
        activityType
      }
    });
  } catch (error) {
    logger.error('Error recording activity', { 
      error, 
      userId: request.params.userId,
      activityType: request.params.activityType
    });
    
    return reply.code(500).send({
      error: 'Internal Server Error',
      message: 'An error occurred while recording activity'
    });
  }
}
