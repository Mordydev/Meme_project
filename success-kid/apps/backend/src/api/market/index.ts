/**
 * Market API Routes
 * 
 * This module registers all market-related API routes.
 */
import { FastifyInstance } from 'fastify';
import { priceRoutes } from './price';
import { marketCapRoutes } from './marketcap';
import { transactionRoutes } from './transactions';
import { milestoneRoutes } from './milestones';
import { visualizationRoutes } from './visualization';
import { handleApiError } from '../../errors/api-error-handler';

/**
 * Register all market routes
 * 
 * @param fastify Fastify instance
 * @param opts Options
 */
export const marketRoutes = async (fastify: FastifyInstance, opts: any) => {
  // Register all market-related routes
  fastify.register(priceRoutes, { prefix: '/price' });
  fastify.register(marketCapRoutes, { prefix: '/cap' });
  fastify.register(transactionRoutes, { prefix: '/transactions' });
  fastify.register(milestoneRoutes, { prefix: '/milestones' });
  fastify.register(visualizationRoutes, { prefix: '' });
  
  // Register global error handler
  fastify.setErrorHandler(handleApiError);
};
