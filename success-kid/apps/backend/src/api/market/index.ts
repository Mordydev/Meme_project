import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import marketApiRoutes from './routes';

/**
 * Market API Module
 * Encapsulates all routes related to market data (stats, price, milestones, transactions).
 */
export default async function marketModule(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
): Promise<void> {
  // Register routes with /api/v1 prefix, consistent with plan
  fastify.register(marketApiRoutes, { prefix: '/api/v1/market' }); 
}

// Export types and schemas if needed for external use
export * from './types';
export * from './schema';
