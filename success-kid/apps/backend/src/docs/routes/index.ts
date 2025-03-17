/**
 * Route schema registration for API documentation
 */
import { FastifyInstance } from 'fastify';
import { healthRoutes } from './health';
import { userRoutes } from './users';
import { pointsRoutes } from './points';
import { walletRoutes } from './wallet';

/**
 * Register all route schemas with Fastify instance
 */
export function registerRouteSchemas(fastify: FastifyInstance): void {
  healthRoutes(fastify);
  userRoutes(fastify);
  pointsRoutes(fastify);
  walletRoutes(fastify);
  
  // Log the number of registered schemas
  const routeCount = Object.keys(fastify.getSchemas()).length;
  fastify.log.info(`Registered ${routeCount} schemas for API documentation`);
}

export { healthRoutes } from './health';
export { userRoutes } from './users';
export { pointsRoutes } from './points';
export { walletRoutes } from './wallet';
