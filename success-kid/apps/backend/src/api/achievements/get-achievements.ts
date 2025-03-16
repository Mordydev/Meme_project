/**
 * Get all achievements
 */
import { FastifyRequest, FastifyReply } from 'fastify';
import { logger } from '../../lib/logger';

export async function getAchievements(
  request: FastifyRequest<{
    Querystring: {
      category?: string;
      difficulty?: string;
      includeSecret?: boolean;
    }
  }>,
  reply: FastifyReply
): Promise<void> {
  try {
    const { category, difficulty, includeSecret = false } = request.query;
    
    // Get achievements from service
    const achievementService = request.diContainer.resolve('achievementService');
    const achievements = await achievementService.getAchievements();
    
    // Filter achievements based on query params
    let filteredAchievements = achievements;
    
    if (category) {
      filteredAchievements = filteredAchievements.filter(
        a => a.category.toLowerCase() === category.toLowerCase()
      );
    }
    
    if (difficulty) {
      filteredAchievements = filteredAchievements.filter(
        a => a.difficulty.toLowerCase() === difficulty.toLowerCase()
      );
    }
    
    // Filter out secret achievements unless explicitly requested or user is admin
    if (!includeSecret && !request.isAdmin) {
      filteredAchievements = filteredAchievements.filter(a => !a.secret);
    }
    
    // Return achievements
    return reply.code(200).send({
      data: filteredAchievements,
      meta: {
        total: filteredAchievements.length,
        categories: [...new Set(filteredAchievements.map(a => a.category))],
        difficulties: [...new Set(filteredAchievements.map(a => a.difficulty))]
      }
    });
  } catch (error) {
    logger.error('Error getting achievements', { error });
    return reply.code(500).send({
      error: 'Internal Server Error',
      message: 'An error occurred while fetching achievements'
    });
  }
}
