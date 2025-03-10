import { FastifyInstance } from 'fastify';
import authRoutes from './auth';
import battleRoutes from './battles';
import contentRoutes from './content';
import tokenRoutes from './token';
import userRoutes from './users';
import socialRoutes from './social';
import walletRoutes from './wallet';
import leaderboardRoutes from './leaderboard';
import pointsRoutes from './points';
import { registerWebSocketRoutes } from './websocket-routes';

/**
 * Register all API routes
 */
export default async function registerRoutes(fastify: FastifyInstance): Promise<void> {
  // Register route groups
  fastify.register(authRoutes, { prefix: '/auth' });
  fastify.register(battleRoutes, { prefix: '/battles' });
  fastify.register(contentRoutes, { prefix: '/content' });
  fastify.register(tokenRoutes, { prefix: '/token' });
  fastify.register(userRoutes, { prefix: '/users' });
  fastify.register(socialRoutes, { prefix: '/social' });
  fastify.register(walletRoutes, { prefix: '/wallet' });
  fastify.register(leaderboardRoutes, { prefix: '/leaderboard' });
  fastify.register(pointsRoutes, { prefix: '/points' });
  
  // Register WebSocket routes
  await registerWebSocketRoutes(fastify);
  
  // Health check route
  fastify.get('/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });
}
