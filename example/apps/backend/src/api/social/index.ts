import { FastifyInstance } from 'fastify';
import reactionRoutes from './reactions';
import followRoutes from './follows';
import feedRoutes from './feed';
import commentRoutes from './comments';

/**
 * Register all social feature routes
 */
export default async function socialRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.register(reactionRoutes, { prefix: '/reactions' });
  fastify.register(followRoutes, { prefix: '/follows' });
  fastify.register(feedRoutes, { prefix: '/feed' });
  fastify.register(commentRoutes, { prefix: '/comments' });
}
