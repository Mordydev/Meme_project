/**
 * Level API Routes
 */
import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { getUserLevel } from './get-user-level';
import { getLevels } from './get-levels';
import { getLevelDefinition } from './get-level-definition';
import { getUserXPHistory } from './get-user-xp-history';
import { awardXP } from './award-xp';
import { resetUserLevel } from './reset-user-level';

export default async function levelRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
): Promise<void> {
  // Get all level definitions
  fastify.get('/levels', getLevels);
  
  // Get specific level definition
  fastify.get('/levels/:level', getLevelDefinition);
  
  // Get user's level
  fastify.get('/users/:userId/level', getUserLevel);
  
  // Get user's XP history
  fastify.get('/users/:userId/xp-history', getUserXPHistory);
  
  // Award XP to user (admin only)
  fastify.post('/users/:userId/xp', {
    onRequest: [fastify.authenticate, fastify.authorizeAdmin],
    handler: awardXP
  });
  
  // Reset user level (admin only)
  fastify.delete('/users/:userId/level', {
    onRequest: [fastify.authenticate, fastify.authorizeAdmin],
    handler: resetUserLevel
  });
}
