/**
 * Leaderboard API Handlers
 */
import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { logger } from '../../lib/logger';
import { 
  LeaderboardCategory, 
  LeaderboardPeriod 
} from '../../services/leaderboards/leaderboard-service';

// Request validation schemas
export const leaderboardQuerySchema = z.object({
  category: z.enum([
    LeaderboardCategory.OVERALL_POINTS,
    LeaderboardCategory.CONTENT_CREATION,
    LeaderboardCategory.COMMUNITY_ENGAGEMENT,
    LeaderboardCategory.REFERRAL_CHAMPIONS,
    LeaderboardCategory.TOKEN_REDEMPTION,
  ]).default(LeaderboardCategory.OVERALL_POINTS),
  period: z.enum([
    LeaderboardPeriod.DAY,
    LeaderboardPeriod.WEEK,
    LeaderboardPeriod.MONTH,
    LeaderboardPeriod.ALL_TIME,
  ]).default(LeaderboardPeriod.WEEK),
  limit: z.string().transform(val => parseInt(val, 10)).pipe(z.number().int().min(1).max(100)).optional(),
  offset: z.string().transform(val => parseInt(val, 10)).pipe(z.number().int().min(0)).optional()
});

/**
 * Get leaderboard
 */
export async function getLeaderboard(
  request: FastifyRequest<{ Querystring: z.infer<typeof leaderboardQuerySchema> }>,
  reply: FastifyReply
) {
  try {
    const { category, period, limit = 20, offset = 0 } = request.query;
    const userId = request.user?.id;
    
    const leaderboardService = request.diContainer.resolve('services').leaderboardService;
    
    const leaderboard = await leaderboardService.getLeaderboard(
      category,
      period,
      { limit, offset, userId }
    );
    
    return reply.send({
      data: leaderboard,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: request.id,
        category,
        period,
        hasMore: leaderboard.entries.length === limit
      }
    });
  } catch (error) {
    logger.error('Error getting leaderboard', { 
      error, 
      query: request.query 
    });
    throw error;
  }
}
