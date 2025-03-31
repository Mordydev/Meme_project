import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import dashboardRoutes from './routes';

/**
 * Dashboard API Module
 * Encapsulates all routes related to the user dashboard.
 * Provides aggregated data from multiple services for the main dashboard view.
 */
export default async function dashboardModule(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
): Promise<void> {
  // Register routes with /api/v1 prefix
  fastify.register(dashboardRoutes, { prefix: '/api/v1' });
}

// Export types and schemas for external use (e.g., testing, SDK generation)
export * from './types';
export * from './schema';
