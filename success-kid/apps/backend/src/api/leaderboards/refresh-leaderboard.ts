/**
 * Refresh leaderboard (admin only)
 */
import { FastifyRequest, FastifyReply } from 'fastify';
import { logger } from '../../lib/logger';
import { LeaderboardCategory, LeaderboardPeriod } from '../../models/leaderboard';

export async function refreshLeaderboard(
  request: FastifyRequest<{
    Params: {
      category: string;
      period: string;
    }
  }>,
  reply: FastifyReply
): Promise<void> {
  try {
    const { category, period } = request.params;
    
    // Validate category
    if (!Object.values(LeaderboardCategory).includes(category as LeaderboardCategory)) {
      return reply.code(400).send({
        error: 'Bad Request',
        message: `Invalid category: ${category}`
      });
    }
    
    // Validate period
    if (!Object.values(LeaderboardPeriod).includes(period as LeaderboardPeriod)) {
      return reply.code(400).send({
        error: 'Bad Request',
        message: `Invalid period: ${period}`
      });
    }
    
    // Get leaderboard service
    const leaderboardService = request.diContainer.resolve('leaderboardService');
    
    // Refresh leaderboard
    await leaderboardService.refreshCategoryLeaderboards(category as LeaderboardCategory);
    
    // Return success
    return reply.code(200).send({
      data: {
        success: true,
        message: `Leaderboard ${category} for ${period} refreshed successfully`
      }
    });
  } catch (error) {
    logger.error('Error refreshing leaderboard', { 
      error, 
      category: request.params.category,
      period: request.params.period
    });
    
    return reply.code(500).send({
      error: 'Internal Server Error',
      message: 'An error occurred while refreshing leaderboard'
    });
  }
}
