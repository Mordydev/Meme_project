/**
 * Forum API Routes
 * 
 * Defines API endpoints for forums, categories, and threads
 */

import { FastifyInstance } from 'fastify';
import { ForumService } from '../../services/forum/forum-service';
import * as controllers from './controllers';
import { authenticate } from '../../middleware/auth';

export default async function forumRoutes(fastify: FastifyInstance) {
  // Create instances
  const forumService = fastify.diContainer.resolve('forumService') as ForumService;
  
  // Get all forums
  fastify.get('/forums', controllers.getAllForums(forumService));
  
  // Get forum by slug
  fastify.get('/forums/:slug', controllers.getForumBySlug(forumService));
  
  // Get category with threads
  fastify.get('/categories/:id/threads', controllers.getCategoryWithThreads(forumService));
  
  // Create a thread (requires authentication)
  fastify.post('/threads', {
    preHandler: [authenticate],
    handler: controllers.createThread(forumService)
  });
  
  // Get thread with replies
  fastify.get('/threads/:id', controllers.getThreadWithReplies(forumService));
  
  // Create a reply to a thread (requires authentication)
  fastify.post('/threads/:id/replies', {
    preHandler: [authenticate],
    handler: controllers.createThreadReply(forumService)
  });
  
  // Update a thread (requires authentication)
  fastify.put('/threads/:id', {
    preHandler: [authenticate],
    handler: controllers.updateThread(forumService)
  });
  
  // Get user's threads (requires authentication)
  fastify.get('/users/:id/threads', {
    preHandler: [authenticate],
    handler: controllers.getUserThreads(forumService)
  });
  
  // Get trending threads
  fastify.get('/trending-threads', controllers.getTrendingThreads(forumService));
}
