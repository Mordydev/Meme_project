/**
 * API Routes
 * 
 * Registers all API routes and middleware for the application.
 */
import { FastifyInstance } from 'fastify';
import { logger } from '../lib/logger';
import healthRoutes from './health';
import featuresRoutes from './features';
import registerPointsRoutes from './points/routes';
import contentRoutes from './content';
import mediaRoutes from './media';
import { marketRoutes } from './market';
import achievementRoutes from './achievements';
import notificationRoutes from './notifications';
import activityRoutes from './activity';
import presenceRoutes from './presence';
import jobRoutes from './jobs';
import forumRoutes from './forum';
import authRoutes from './auth/routes';
import walletAuthRoutes from './wallet-auth/routes';
import tokenRoutes from './tokens/routes';
import securityRoutes from './security/routes';
import usersRoutes from './users';
import walletRoutes from './wallet';

/**
 * Register all API routes
 * 
 * @param fastify Fastify instance
 */
export default async function apiRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.register(healthRoutes, { prefix: '/health' });
  fastify.register(featuresRoutes, { prefix: '/features' });
  fastify.register(registerPointsRoutes, { prefix: '/points' });
  fastify.register(contentRoutes, { prefix: '/content' });
  fastify.register(mediaRoutes, { prefix: '/media' });
  fastify.register(marketRoutes, { prefix: '/market' });
  fastify.register(achievementRoutes, { prefix: '/' });
  fastify.register(notificationRoutes, { prefix: '/notifications' });
  fastify.register(activityRoutes, { prefix: '/activity' });
  fastify.register(presenceRoutes, { prefix: '/presence' });
  fastify.register(jobRoutes, { prefix: '/jobs' });
  fastify.register(forumRoutes, { prefix: '/forum' });

  // Register auth-related routes
  await fastify.register(authRoutes, { prefix: '/api/v1/auth' });
  await fastify.register(walletAuthRoutes, { prefix: '/api/v1/wallet-auth' });
  await fastify.register(tokenRoutes, { prefix: '/api/v1/tokens' });
  await fastify.register(securityRoutes, { prefix: '/api/v1/security' });
  
  // Register user routes
  await fastify.register(usersRoutes, { prefix: '/api/v1/users' });
  
  // Register wallet routes
  await fastify.register(walletRoutes, { prefix: '/api/v1/wallet' });
  
  logger.info('API routes registered');
}
