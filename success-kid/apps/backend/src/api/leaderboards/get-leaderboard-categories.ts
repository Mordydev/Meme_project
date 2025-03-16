/**
 * Get available leaderboard categories
 */
import { FastifyRequest, FastifyReply } from 'fastify';
import { logger } from '../../lib/logger';

export async function getLeaderboardCategories(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    // Get leaderboard service
    const leaderboardService = request.diContainer.resolve('leaderboardService');
    
    // Get categories
    const categories = await leaderboardService.getLeaderboardCategories();
    
    // Return categories
    return reply.code(200).send({
      data: categories,
      meta: {
        total: categories.length
      }
    });
  } catch (error) {
    logger.error('Error getting leaderboard categories', { error });
    
    return reply.code(500).send({
      error: 'Internal Server Error',
      message: 'An error occurred while fetching leaderboard categories'
    });
  }
}
