/**
 * API Routes Registration
 * 
 * Registers all API routes for the application
 */
import { FastifyPluginAsync } from 'fastify';
import pointsRoutes from './points';
import auditRoutes from './audit';
import referralRoutes from './referrals';
import notificationRoutes from './notifications';
import activityRoutes from './activity';
import presenceRoutes from './presence';

// Root prefix for all API routes
const API_PREFIX = '/api/v1';

// API plugin that registers all routes
const apiPlugin: FastifyPluginAsync = async (fastify) => {
  // Register all API routes with versioned prefix
  fastify.register(pointsRoutes, { prefix: API_PREFIX });
  fastify.register(auditRoutes, { prefix: API_PREFIX });
  fastify.register(referralRoutes, { prefix: `${API_PREFIX}/referrals` });
  
  // Real-time and notification routes
  fastify.register(notificationRoutes, { prefix: `${API_PREFIX}/notifications` });
  fastify.register(activityRoutes, { prefix: `${API_PREFIX}/activity` });
  fastify.register(presenceRoutes, { prefix: `${API_PREFIX}/presence` });
  
  // Add more routes here
  // fastify.register(contentRoutes, { prefix: API_PREFIX });
  // fastify.register(profileRoutes, { prefix: API_PREFIX });
  
  // Add a root API endpoint for health check and API info
  fastify.get(`${API_PREFIX}`, async () => {
    return {
      status: 'ok',
      version: '1.0.0',
      documentation: '/api/docs'
    };
  });
};

export default apiPlugin;
