/**
 * Route definitions for the Activity API module
 */
import { FastifyInstance } from 'fastify';
import { getFeedSchema, markReadSchema, markReadAllSchema } from './schema';
import { getFeedHandler, markReadHandler, markReadAllHandler } from './handler';

/**
 * Registers the activity API routes
 * @param fastify - The Fastify instance
 */
export default async function activityRoutes(fastify: FastifyInstance): Promise<void> {
  // Get user's activity feed
  fastify.get('/feed', {
    schema: getFeedSchema,
    // @ts-ignore - Assuming authenticate is decorated onto the instance
    onRequest: [fastify.authenticate]
  }, getFeedHandler);

  // Mark feed items as read
  fastify.put('/feed/read', {
    schema: markReadSchema,
    // @ts-ignore - Assuming authenticate is decorated onto the instance
    onRequest: [fastify.authenticate]
  }, markReadHandler);

  // Mark all feed items as read
  fastify.put('/feed/read-all', {
    schema: markReadAllSchema,
    // @ts-ignore - Assuming authenticate is decorated onto the instance
    onRequest: [fastify.authenticate]
  }, markReadAllHandler);
}
