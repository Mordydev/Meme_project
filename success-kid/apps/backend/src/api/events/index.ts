/**
 * Events API Module Entry Point (Development/Testing)
 *
 * Registers the event testing routes.
 */
import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import eventRoutes from './routes';

const eventsApiPlugin: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  // Register routes with a suitable prefix, e.g., '/events'
  // The routes themselves handle the NODE_ENV check
  await fastify.register(eventRoutes, { prefix: '/events' });
  // No need to log here, the routes file handles logging
};

export default fp(eventsApiPlugin);
