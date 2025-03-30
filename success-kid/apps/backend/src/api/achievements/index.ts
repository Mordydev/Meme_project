/**
 * Achievement API Routes Registration
 * 
 * Registers all achievement and gamification-related API endpoints
 */
import { FastifyInstance } from 'fastify';
import achievementRoutes from './routes'; // Updated import to the consolidated routes file
// Removed imports for levelRoutes, badgeRoutes, streakRoutes, challengeRoutes, leaderboardRoutes

/**
 * Register achievement and gamification-related routes
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
  // Register the consolidated achievement routes
  // The prefix '/achievements' should cover the routes defined in ./routes.ts for now.
  // Prefixes for levels, badges, etc., will need to be handled within the consolidated routes file later.
  fastify.register(achievementRoutes, { prefix: '/achievements' });

  // Removed registration for levelRoutes, badgeRoutes, streakRoutes, challengeRoutes, leaderboardRoutes
  // TODO: Ensure the consolidated achievementRoutes handles registration for all sub-routes (levels, badges, etc.) eventually.
}
