/**
 * Route definitions for the Presence API module
 */
import { FastifyInstance } from 'fastify';
import {
  updatePresenceSchema,
  getPresenceSchema,
  getPresenceBatchSchema,
  subscribePresenceSchema
} from './schema';
import {
  updatePresenceHandler,
  getPresenceHandler,
  getPresenceBatchHandler,
  subscribePresenceHandler
} from './handler';

/**
 * Registers the presence API routes
 * @param fastify - The Fastify instance
 */
export default async function presenceRoutes(fastify: FastifyInstance): Promise<void> {
  // Update user presence
  fastify.put('/', {
    schema: updatePresenceSchema,
    // @ts-ignore - Assuming authenticate is decorated onto the instance
    onRequest: [fastify.authenticate]
  }, updatePresenceHandler);

  // Get user presence (self)
  fastify.get('/', {
    schema: getPresenceSchema,
    // @ts-ignore - Assuming authenticate is decorated onto the instance
    onRequest: [fastify.authenticate]
  }, getPresenceHandler);

  // Get presence for multiple users
  fastify.get('/batch', {
    schema: getPresenceBatchSchema,
    // @ts-ignore - Assuming authenticate is decorated onto the instance
    onRequest: [fastify.authenticate]
  }, getPresenceBatchHandler);

  // Subscribe to presence updates
  fastify.post('/subscribe', {
    schema: subscribePresenceSchema,
    // @ts-ignore - Assuming authenticate is decorated onto the instance
    onRequest: [fastify.authenticate]
  }, subscribePresenceHandler);
}
