/**
 * Leaderboards API Routes
 */
import { FastifyInstance } from 'fastify';
import { validate } from '../../middleware/validation';
import { 
  getLeaderboard,
  leaderboardQuerySchema
} from './handlers';

export default async function leaderboards(fastify: FastifyInstance): Promise<void> {
  /**
   * GET /api/v1/leaderboards
   * Get leaderboard data
   */
  fastify.get(
    '/',
    {
      preHandler: [
        validate(leaderboardQuerySchema, { source: 'query' })
      ]
    },
    getLeaderboard
  );
}