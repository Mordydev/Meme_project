/**
 * Get user achievements
 */
import { FastifyRequest, FastifyReply } from 'fastify';
import { logger } from '../../lib/logger';

export async function getUserAchievements(
  request: FastifyRequest<{
    Params: {
      userId: string;
    },
    Querystring: {
      category?: string;
      includeProgress?: boolean;
      includeSummary?: boolean;
    }
  }>,
  reply: FastifyReply
): Promise<void> {
  try {
    const { userId } = request.params;
    const { category, includeProgress = false, includeSummary = false } = request.query;
    
    // Check permissions - users can only see their own achievements unless admin
    const isOwnProfile = request.user?.id === userId;
    if (!isOwnProfile && !request.isAdmin) {
      return reply.code(403).send({
        error: 'Forbidden',
        message: 'You do not have permission to view this user\'s achievements'
      });
    }
    
    // Get achievement service from DI container
    const achievementService = request.diContainer.resolve('achievementService');
    
    // Get user achievements with progress if requested
    let achievements;
    if (includeProgress) {
      achievements = await achievementService.getUserAchievementsWithProgress(userId);
    } else {
      achievements = await achievementService.getUserAchievements(userId);
    }
    
    // Filter by category if specified
    if (category) {
      achievements = achievements.filter(
        a => a.achievement?.category?.toLowerCase() === category.toLowerCase()
      );
    }
    
    // Get achievement summary if requested
    let summary = null;
    if (includeSummary) {
      summary = await achievementService.getUserAchievementSummary(userId);
    }
    
    // Return achievements
    return reply.code(200).send({
      data: achievements,
      meta: {
        total: achievements.length,
        userId
      },
      summary
    });
  } catch (error) {
    logger.error('Error getting user achievements', { 
      error, 
      userId: request.params.userId 
    });
    
    return reply.code(500).send({
      error: 'Internal Server Error',
      message: 'An error occurred while fetching user achievements'
    });
  }
}
