/**
 * Get streak status for a specific activity type
 */
import { FastifyRequest, FastifyReply } from 'fastify';
import { logger } from '../../lib/logger';
import { StreakType } from '../../models/streak';

export async function getStreakStatus(
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
    
    // Check permissions - users can only see their own streaks unless admin
    const isOwnProfile = request.user?.id === userId;
    if (!isOwnProfile && !request.isAdmin) {
      return reply.code(403).send({
        error: 'Forbidden',
        message: 'You do not have permission to view this user\'s streak'
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
    
    // Get streak status
    const status = await streakService.getStreakStatus(
      userId, 
      activityType as StreakType
    );
    
    if (!status) {
      return reply.code(404).send({
        error: 'Not Found',
        message: `Streak for activity type ${activityType} not found`
      });
    }
    
    // Return streak status
    return reply.code(200).send({
      data: status
    });
  } catch (error) {
    logger.error('Error getting streak status', { 
      error, 
      userId: request.params.userId,
      activityType: request.params.activityType
    });
    
    return reply.code(500).send({
      error: 'Internal Server Error',
      message: 'An error occurred while fetching streak status'
    });
  }
}
