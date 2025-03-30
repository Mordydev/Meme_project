/**
 * Forum API Module Entry Point
 *
 * Registers the forum routes.
 */
import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import forumApiRoutes from './routes';
// Assuming ForumService is decorated onto the Fastify instance during app setup
// import { ForumService } from '../../services/forum/forum-service';

const forumApiPlugin: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  // Register routes with a suitable prefix, e.g., '/forum'
  // The routes file assumes the service is available via decoration (request.server.forumService)
  await fastify.register(forumApiRoutes, { prefix: '/forum' });
  fastify.log.info('Forum API routes registered');
};

export default fp(forumApiPlugin);
