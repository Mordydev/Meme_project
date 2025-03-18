/**
 * Forum Plugin
 * 
 * This plugin registers all forum and community services for the application.
 */
import fp from 'fastify-plugin';
import { FastifyInstance } from 'fastify';
import { getDatabase } from '../database';
import { EventBus } from '../lib/event-bus';
import { logger } from '../lib/logger';

// Forum Service
import { ForumRepository } from '../repositories/forum-repository';
import { ThreadRepository } from '../repositories/thread-repository';
import { CategoryRepository } from '../repositories/category-repository';
import { ContentRepository } from '../repositories/content-repository';
import { CommentRepository } from '../repositories/comment-repository';
import { ForumService } from '../services/forum/forum-service';

// Points Service for awarding points
import { PointsService } from '../services/points/points-service';

/**
 * Plugin to initialize and register forum services
 */
export default fp(async (fastify: FastifyInstance) => {
  const db = getDatabase().pool;
  const eventBus = new EventBus();
  
  // Get points service instance
  const pointsService = fastify.points; // Assuming points service is already registered
  if (!pointsService) {
    logger.warn('Points service not available. Forum rewards may not work correctly.');
  }
  
  // Initialize repositories
  const forumRepository = new ForumRepository(db);
  const threadRepository = new ThreadRepository(db);
  const categoryRepository = new CategoryRepository(db);
  const contentRepository = new ContentRepository(db);
  const commentRepository = new CommentRepository(db);
  
  // Initialize forum service
  const forumService = new ForumService(
    forumRepository,
    categoryRepository,
    threadRepository,
    contentRepository,
    commentRepository,
    pointsService || createFallbackPointsService(db),
    eventBus
  );
  
  // Register service with Fastify instance
  fastify.decorate('forum', {
    forumService
  });
  
  // Add to dependency injection container
  fastify.diContainer = fastify.diContainer || {};
  fastify.diContainer.resolve = (serviceName) => {
    if (serviceName === 'forumService') {
      return forumService;
    }
    // For other services, could check other containers
    return null;
  };
  
  // Log that services are initialized
  logger.info('Forum and community services initialized');
}, {
  name: 'forum',
  dependencies: ['database'], // Depend on database plugin
  fastify: '4.x',
});

/**
 * Create a fallback points service if the main one is not available
 * This is used only in development or testing when points service might not be registered
 */
function createFallbackPointsService(db: any): PointsService {
  logger.warn('Creating fallback points service for forum');
  // This is a minimal implementation that won't actually award points
  // but will prevent errors when points service is not available
  return {
    awardPoints: async () => {
      logger.warn('Using fallback points service - no points will be awarded');
      return { success: true, amount: 0, total: 0 };
    }
  } as unknown as PointsService;
}
