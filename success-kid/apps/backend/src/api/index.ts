/**
 * API Routes
 * 
 * Registers all API routes and middleware for the application.
 */
import { FastifyInstance } from 'fastify';
import { logger } from '../lib/logger';
import healthRoutes from './health';
import featuresRoutes from './features';
import pointsRoutes from './points';
import contentRoutes from './content';
import mediaRoutes from './media';
import marketRoutes from './market';
import achievementRoutes from './achievements';
import notificationRoutes from './notifications';
import activityRoutes from './activity';
import presenceRoutes from './presence';
import jobRoutes from './jobs';

/**
 * Register all API routes
 * 
 * @param fastify Fastify instance
 */
export default async function apiRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.register(healthRoutes, { prefix: '/health' });
  fastify.register(featuresRoutes, { prefix: '/features' });
  fastify.register(pointsRoutes, { prefix: '/points' });
  fastify.register(contentRoutes, { prefix: '/content' });
  fastify.register(mediaRoutes, { prefix: '/media' });
  fastify.register(marketRoutes, { prefix: '/market' });
  fastify.register(achievementRoutes, { prefix: '/' });
  fastify.register(notificationRoutes, { prefix: '/notifications' });
  fastify.register(activityRoutes, { prefix: '/activity' });
  fastify.register(presenceRoutes, { prefix: '/presence' });
  fastify.register(jobRoutes, { prefix: '/jobs' });

  logger.info('API routes registered');
}
