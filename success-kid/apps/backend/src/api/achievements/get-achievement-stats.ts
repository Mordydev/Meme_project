/**
 * Get achievement statistics (admin only)
 */
import { FastifyRequest, FastifyReply } from 'fastify';
import { logger } from '../../lib/logger';

export async function getAchievementStats(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    // Get services from DI container
    const achievementService = request.diContainer.resolve('achievementService');
    const analyticsService = request.diContainer.resolve('gamificationAnalyticsService');
    
    // Get achievement statistics
    const achievementStats = await achievementService.repository.getAchievementStats();
    
    // Get detailed analytics if available
    let detailedAnalytics = [];
    try {
      detailedAnalytics = await analyticsService.getAchievementAnalytics();
    } catch (error) {
      logger.warn('Error getting detailed achievement analytics', { error });
      // Continue without detailed analytics
    }
    
    // Return stats
    return reply.code(200).send({
      data: {
        stats: achievementStats,
        analytics: detailedAnalytics
      }
    });
  } catch (error) {
    logger.error('Error getting achievement stats', { error });
    
    return reply.code(500).send({
      error: 'Internal Server Error',
      message: 'An error occurred while fetching achievement statistics'
    });
  }
}
