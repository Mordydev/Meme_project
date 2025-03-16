/**
 * Get leaderboard
 */
import { FastifyRequest, FastifyReply } from 'fastify';
import { logger } from '../../lib/logger';
import { LeaderboardCategory, LeaderboardPeriod } from '../../models/leaderboard';

export async function getLeaderboard(
  request: FastifyRequest<{
    Params: {
      category: string;
      period: string;
    },
    Querystring: {
      limit?: string;
      offset?: string;
      includeCurrentUser?: string;
    }
  }>,
  reply: FastifyReply
): Promise<void> {
  try {
    const { category, period } = request.params;
    const limit = request.query.limit ? parseInt(request.query.limit, 10) : 100;
    const offset = request.query.offset ? parseInt(request.query.offset, 10) : 0;
    const includeCurrentUser = request.query.includeCurrentUser === 'true';
    
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
    
    // Validate pagination params
    if (isNaN(limit) || limit < 1 || limit > 1000 || isNaN(offset) || offset < 0) {
      return reply.code(400).send({
        error: 'Bad Request',
        message: 'Invalid pagination parameters'
      });
    }
    
    // Get leaderboard service
    const leaderboardService = request.diContainer.resolve('leaderboardService');
    
    // Get leaderboard data
    const leaderboardData = await leaderboardService.getLeaderboard(
      category as LeaderboardCategory,
      period as LeaderboardPeriod,
      {
        limit,
        offset,
        includeCurrentUser,
        currentUserId: request.user?.id
      }
    );
    
    // Return leaderboard
    return reply.code(200).send({
      data: leaderboardData.entries,
      meta: {
        total: leaderboardData.total,
        category,
        period,
        limit,
        offset,
        hasMore: leaderboardData.entries.length === limit
      },
      currentUser: leaderboardData.currentUserRank
    });
  } catch (error) {
    logger.error('Error getting leaderboard', { 
      error, 
      category: request.params.category,
      period: request.params.period
    });
    
    return reply.code(500).send({
      error: 'Internal Server Error',
      message: 'An error occurred while fetching leaderboard'
    });
  }
}
