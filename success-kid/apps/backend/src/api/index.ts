/**
 * API Routes
 * 
 * Registers all API routes and middleware for the application.
 */
import { FastifyInstance } from 'fastify';
import { logger } from '../lib/logger';
import mediaModule from './media/index'; // Import the new media module
// Removed incorrect healthRoutes import
import featuresRoutes from './features/index'; // Assuming standard structure
import registerPointsRoutes from './points/routes'; // Keep as is for now, check later
import contentRoutes from './content/index'; // Assuming standard structure
// import mediaRoutes from './media/index'; // Removed incorrect import
import marketModule from './market/index'; // Corrected import for market module
import achievementRoutes from './achievements/index'; // Assuming standard structure
import notificationRoutes from './notifications/index'; // Updated import path
import activityRoutes from './activity/index'; // Updated import path
import presenceRoutes from './presence/index'; // Updated import path
import dashboardModule from './dashboard/index'; // Import the new dashboard module
// import jobRoutes from './jobs/index'; // Removed incorrect import
import forumRoutes from './forum/index'; // Assuming standard structure
import authRoutes from './auth/routes'; // Keep as is for now, check later
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
  // Removed healthRoutes registration
  fastify.register(featuresRoutes); // Register plugin from index.ts
  fastify.register(registerPointsRoutes, { prefix: '/points' }); // Keep specific registration for now
  fastify.register(contentRoutes); // Register plugin from index.ts
  fastify.register(mediaModule, { prefix: '/api/v1/media' }); // Register the new media module
  fastify.register(marketModule); // Register market module (prefix handled internally)
  fastify.register(achievementRoutes); // Register plugin from index.ts (prefix handled internally?) - Check achievement/index.ts
  fastify.register(notificationRoutes, { prefix: '/notifications' }); // Keep prefix here as index.ts doesn't handle it
  fastify.register(activityRoutes); // Register plugin from index.ts (prefix handled internally)
  fastify.register(presenceRoutes, { prefix: '/presence' }); // Keep prefix here as index.ts doesn't handle it
  fastify.register(dashboardModule); // Register the dashboard module
  // fastify.register(jobRoutes); // Removed incorrect registration
  fastify.register(forumRoutes); // Register plugin from index.ts

  // Register auth-related routes - Assuming these might need specific prefixes/options
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
