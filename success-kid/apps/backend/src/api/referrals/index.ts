/**
 * Referral API Routes
 * 
 * Main entry point for all referral API routes
 */
import { FastifyInstance } from 'fastify';
import referralCodeRoutes from './code-routes';
import referralUserRoutes from './user-routes';
import referralCampaignRoutes from './campaign-routes';

export default async function referralRoutes(fastify: FastifyInstance) {
  // Register sub-route handlers
  await fastify.register(referralCodeRoutes, { prefix: '' });
  await fastify.register(referralUserRoutes, { prefix: '' });
  await fastify.register(referralCampaignRoutes, { prefix: '' });
}
