/**
 * Route Schema Registration
 * 
 * Centralized registration of API route schemas for OpenAPI documentation
 */
import { FastifyInstance } from 'fastify';
import { pointsRouteSchemas } from './points';
import { walletRouteSchemas } from './wallet';
import { userRouteSchemas } from './user';

/**
 * Register all route schemas for OpenAPI documentation
 * @param fastify Fastify instance
 */
export function registerRouteSchemas(fastify: FastifyInstance): void {
  // Register schemas for each API category
  pointsRouteSchemas(fastify);
  walletRouteSchemas(fastify);
  userRouteSchemas(fastify);
  
  // Add more schema registrations here as needed
}
