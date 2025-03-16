/**
 * Achievement API Routes Registration
 * 
 * Registers all achievement and gamification-related API endpoints
 */
import { FastifyInstance } from 'fastify';
import achievementRoutes from './achievement-routes';
import levelRoutes from './level-routes';
import badgeRoutes from './badge-routes';
import streakRoutes from './streak-routes';
import challengeRoutes from './challenge-routes';
import leaderboardRoutes from './leaderboard-routes';

/**
 * Register all achievement and gamification-related routes
 * 
 * @param fastify Fastify instance
 * @param options Plugin options
 */
export default async function registerAchievementRoutes(
  fastify: FastifyInstance,
  options: any
): Promise<void> {
  // Register authentication check for protected routes
  fastify.addHook('onRequest', async (request, reply) => {
    // Authentication check will only be applied to specific routes
    // Default routes are accessible without authentication
  });

  // Register achievement routes
  fastify.register(achievementRoutes, { prefix: '/achievements' });
  
  // Register level routes
  fastify.register(levelRoutes, { prefix: '/levels' });
  
  // Register badge routes
  fastify.register(badgeRoutes, { prefix: '/badges' });
  
  // Register streak routes
  fastify.register(streakRoutes, { prefix: '/streaks' });
  
  // Register challenge routes
  fastify.register(challengeRoutes, { prefix: '/challenges' });
  
  // Register leaderboard routes
  fastify.register(leaderboardRoutes, { prefix: '/leaderboards' });
}
