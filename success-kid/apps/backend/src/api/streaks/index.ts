/**
 * Streak API Routes
 */
import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { getUserStreaks } from './get-user-streaks';
import { getStreakStatus } from './get-streak-status';
import { recordActivity } from './record-activity';
import { resetStreaks } from './reset-streaks';

export default async function streakRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
): Promise<void> {
  // Get user's streaks
  fastify.get('/users/:userId/streaks', {
    onRequest: [fastify.authenticate],
    handler: getUserStreaks
  });
  
  // Get specific streak status
  fastify.get('/users/:userId/streaks/:activityType', {
    onRequest: [fastify.authenticate],
    handler: getStreakStatus
  });
  
  // Record activity for streak
  fastify.post('/users/:userId/streaks/:activityType/record', {
    onRequest: [fastify.authenticate],
    handler: recordActivity
  });
  
  // Reset streaks (admin only)
  fastify.delete('/users/:userId/streaks/:activityType?', {
    onRequest: [fastify.authenticate, fastify.authorizeAdmin],
    handler: resetStreaks
  });
}
