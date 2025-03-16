/**
 * Get user rank in leaderboard
 */
import { FastifyRequest, FastifyReply } from 'fastify';
import { logger } from '../../lib/logger';
import { LeaderboardCategory, LeaderboardPeriod } from '../../models/leaderboard';

export async function getUserRank(
  request: FastifyRequest<{
    Params: {
      userId: string;
      category: string;
      period: string;
    }
  }>,
  reply: FastifyReply
): Promise<void> {
  try {
    const { userId, category, period } = request.params;
    
    // Check permissions - users can only see their own rank unless admin
    const isOwnProfile = request.user?.id === userId;
    if (!isOwnProfile && !request.isAdmin) {
      return reply.code(403).send({
        error: 'Forbidden',
        message: 'You do not have permission to view this user\'s rank'
      });
    }
    
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
    
    // Get user rank
    const rank = await leaderboardService.getUserRank(
      userId,
      category as LeaderboardCategory,
      period as LeaderboardPeriod
    );
    
    if (!rank) {
      return reply.code(404).send({
        error: 'Not Found',
        message: `User ${userId} not found in ${category} leaderboard for ${period} period`
      });
    }
    
    // Return user rank
    return reply.code(200).send({
      data: {
        ...rank,
        userId,
        category,
        period
      }
    });
  } catch (error) {
    logger.error('Error getting user rank', { 
      error, 
      userId: request.params.userId,
      category: request.params.category,
      period: request.params.period
    });
    
    return reply.code(500).send({
      error: 'Internal Server Error',
      message: 'An error occurred while fetching user rank'
    });
  }
}
