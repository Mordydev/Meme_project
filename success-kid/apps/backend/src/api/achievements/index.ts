/**
 * Achievement API Routes
 */
import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { getAchievements } from './get-achievements';
import { getUserAchievements } from './get-user-achievements';
import { getAchievementById } from './get-achievement-by-id';
import { getAchievementProgress } from './get-achievement-progress';
import { getAchievementStats } from './get-achievement-stats';
import { resetAchievement } from './reset-achievement';

export default async function achievementRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
): Promise<void> {
  // Get all achievements
  fastify.get('/achievements', getAchievements);
  
  // Get a specific achievement by ID
  fastify.get('/achievements/:id', getAchievementById);
  
  // Get achievements for a user
  fastify.get('/users/:userId/achievements', getUserAchievements);
  
  // Get achievement progress for a user
  fastify.get('/users/:userId/achievements/:achievementId/progress', getAchievementProgress);
  
  // Get achievement stats (for admins)
  fastify.get('/achievements/stats', {
    onRequest: [fastify.authenticate, fastify.authorizeAdmin],
    handler: getAchievementStats
  });
  
  // Reset an achievement (for admins/testing)
  fastify.delete('/users/:userId/achievements/:achievementId', {
    onRequest: [fastify.authenticate, fastify.authorizeAdmin],
    handler: resetAchievement
  });
}
