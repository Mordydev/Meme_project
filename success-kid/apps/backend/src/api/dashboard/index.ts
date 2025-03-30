import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import dashboardRoutes from './routes';

/**
 * Dashboard API Module
 * Encapsulates all routes related to the user dashboard.
 */
export default async function dashboardModule(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
): Promise<void> {
  fastify.register(dashboardRoutes, { prefix: '/api' }); // Register routes with /api prefix
}

// Export types and schemas if needed for external use (e.g., testing, SDK generation)
export * from './types';
export * from './schema';
