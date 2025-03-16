/**
 * Badge API Routes
 */
import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { getBadges } from './get-badges';
import { getBadgeById } from './get-badge-by-id';
import { getUserBadges } from './get-user-badges';
import { getRecommendedBadges } from './get-recommended-badges';
import { awardBadge } from './award-badge';
import { updateEquippedBadges } from './update-equipped-badges';
import { revokeBadge } from './revoke-badge';

export default async function badgeRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
): Promise<void> {
  // Get all badges
  fastify.get('/badges', getBadges);
  
  // Get a specific badge by ID
  fastify.get('/badges/:id', getBadgeById);
  
  // Get user's badges
  fastify.get('/users/:userId/badges', {
    onRequest: [fastify.authenticate],
    handler: getUserBadges
  });
  
  // Get recommended badges for user
  fastify.get('/users/:userId/recommended-badges', {
    onRequest: [fastify.authenticate],
    handler: getRecommendedBadges
  });
  
  // Award badge to user (admin only)
  fastify.post('/users/:userId/badges', {
    onRequest: [fastify.authenticate, fastify.authorizeAdmin],
    handler: awardBadge
  });
  
  // Update equipped badges
  fastify.put('/users/:userId/equipped-badges', {
    onRequest: [fastify.authenticate],
    handler: updateEquippedBadges
  });
  
  // Revoke badge (admin only)
  fastify.delete('/users/:userId/badges/:badgeId', {
    onRequest: [fastify.authenticate, fastify.authorizeAdmin],
    handler: revokeBadge
  });
}
