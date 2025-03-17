/**
 * API Routes
 * 
 * Exports all API routes
 */
import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import usersRoutes from './users';
import pointsRoutes from './points';
import healthRoutes from './health';
import contentRoutes from './content';
import walletRoutes from './wallet';
import authRoutes from './auth';
import presenceRoutes from './presence';
import notificationsRoutes from './notifications';
import marketRoutes from './market';
import leaderboardsRoutes from './leaderboards';
import { handleApiError, notFoundHandler } from '../errors/handlers';
import { middlewares } from '../middleware';

/**
 * API plugin
 * @param fastify Fastify instance
 * @param options Plugin options
 */
export default async function apiPlugin(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
): Promise<void> {
  // Register error handler
  fastify.setErrorHandler(handleApiError);
  
  // Register not found handler
  fastify.setNotFoundHandler(notFoundHandler);
  
  // Register middlewares
  fastify.register(middlewares);
  
  // Register route handlers
  fastify.register(healthRoutes, { prefix: '/health' });
  fastify.register(usersRoutes, { prefix: '/users' });
  fastify.register(pointsRoutes, { prefix: '/points' });
  fastify.register(contentRoutes, { prefix: '/content' });
  fastify.register(walletRoutes, { prefix: '/wallet' });
  fastify.register(authRoutes, { prefix: '/auth' });
  fastify.register(presenceRoutes, { prefix: '/presence' });
  fastify.register(notificationsRoutes, { prefix: '/notifications' });
  fastify.register(marketRoutes, { prefix: '/market' });
  fastify.register(leaderboardsRoutes, { prefix: '/leaderboards' });
  
  // Add generic route for API info
  fastify.get('/', async (request, reply) => {
    return {
      data: {
        name: 'Success Kid Community Platform API',
        version: '1.0.0',
        environment: process.env.NODE_ENV,
        timestamp: new Date().toISOString()
      },
      meta: {
        timestamp: new Date().toISOString()
      }
    };
  });
}
