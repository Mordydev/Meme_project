/**
 * Leaderboard API Routes
 */
import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { getLeaderboard } from './get-leaderboard';
import { getLeaderboardCategories } from './get-leaderboard-categories';
import { getUserRank } from './get-user-rank';
import { refreshLeaderboard } from './refresh-leaderboard';

export default async function leaderboardRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
): Promise<void> {
  // Get available leaderboard categories
  fastify.get('/leaderboards/categories', getLeaderboardCategories);
  
  // Get leaderboard
  fastify.get('/leaderboards/:category/:period', getLeaderboard);
  
  // Get user rank in leaderboard
  fastify.get('/users/:userId/rank/:category/:period', {
    onRequest: [fastify.authenticate],
    handler: getUserRank
  });
  
  // Refresh leaderboard (admin only)
  fastify.post('/leaderboards/:category/:period/refresh', {
    onRequest: [fastify.authenticate, fastify.authorizeAdmin],
    handler: refreshLeaderboard
  });
}
