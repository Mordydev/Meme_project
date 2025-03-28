/**
 * Content API Routes
 * 
 * Registers all content-related API routes
 */
import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';

// Controllers
import * as contentController from './controllers/content-controller';
import * as feedController from './controllers/feed-controller';
import * as searchController from './controllers/search-controller';
import * as taxonomyController from './controllers/taxonomy-controller';
import * as moderationController from './controllers/moderation-controller';
import * as analyticsController from './controllers/analytics-controller';

// Services
import { createContentService } from '../../services/content';
import { createFeedService } from '../../services/content';
import { createSearchService } from '../../services/content';
import { createContentAnalyticsService } from '../../services/content';
import { createTaxonomyService } from '../../services/taxonomy';
import { createModerationService } from '../../services/moderation';

// Import repositories
import { ContentRepository } from '../../repositories/content-repository';
import { CommentRepository } from '../../repositories/comment-repository';
import { CategoryRepository } from '../../repositories/category-repository';
import { TagRepository } from '../../repositories/tag-repository';
import { ReportRepository } from '../../repositories/report-repository';

// Authentication middleware
import { authenticateUser, authenticateOptional } from '../../middleware/auth';

/**
 * Content API routes
 */
const contentRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  // Initialize repositories
  const db = fastify.db;
  const redis = fastify.redis;
  
  const contentRepository = new ContentRepository(db);
  const commentRepository = new CommentRepository(db);
  const categoryRepository = new CategoryRepository(db);
  const tagRepository = new TagRepository(db);
  const reportRepository = new ReportRepository(db);
  
  // Initialize services with dependency injection
  const taxonomyService = createTaxonomyService(categoryRepository, tagRepository);
  const moderationService = createModerationService(reportRepository, contentRepository, commentRepository, fastify.eventBus);
  const contentService = createContentService(contentRepository, commentRepository, categoryRepository, tagRepository, fastify.pointsService, moderationService, fastify.eventBus);
  const feedService = createFeedService(db, contentRepository, categoryRepository, tagRepository);
  const searchService = createSearchService(db, redis, contentRepository, tagRepository, categoryRepository);
  const analyticsService = createContentAnalyticsService(db, redis, contentRepository, commentRepository);

  // Content routes
  
  // Feed endpoints
  fastify.get('/feed/:type', 
    { onRequest: authenticateOptional },
    feedController.getFeed(feedService)
  );
  
  // Content endpoints
  fastify.get('/', 
    { onRequest: authenticateOptional },
    contentController.getContentFeed(contentService)
  );
  
  fastify.get('/:id', 
    { onRequest: authenticateOptional },
    contentController.getContentById(contentService)
  );
  
  fastify.post('/', 
    { onRequest: authenticateUser },
    contentController.createContent(contentService)
  );
  
  fastify.put('/:id', 
    { onRequest: authenticateUser },
    contentController.updateContent(contentService)
  );
  
  fastify.delete('/:id', 
    { onRequest: authenticateUser },
    contentController.deleteContent(contentService)
  );
  
  // Comment endpoints
  fastify.get('/:id/comments', 
    { onRequest: authenticateOptional },
    contentController.getContentComments(contentService)
  );
  
  fastify.post('/:id/comments', 
    { onRequest: authenticateUser },
    contentController.createComment(contentService)
  );
  
  fastify.put('/:id/comments/:commentId', 
    { onRequest: authenticateUser },
    contentController.updateComment(contentService)
  );
  
  fastify.delete('/:id/comments/:commentId', 
    { onRequest: authenticateUser },
    contentController.deleteComment(contentService)
  );
  
  // Search endpoints
  fastify.get('/search', 
    { onRequest: authenticateOptional },
    searchController.searchContent(searchService)
  );
  
  fastify.get('/search/suggestions', 
    searchController.getSearchSuggestions(searchService)
  );
  
  // Taxonomy endpoints
  
  // Categories
  fastify.get('/categories', 
    taxonomyController.getCategories(taxonomyService)
  );
  
  fastify.get('/categories/:id', 
    taxonomyController.getCategoryById(taxonomyService)
  );
  
  fastify.get('/categories/slug/:slug', 
    taxonomyController.getCategoryBySlug(taxonomyService)
  );
  
  fastify.get('/categories/:id/content', 
    { onRequest: authenticateOptional },
    taxonomyController.getCategoryContent(contentService)
  );
  
  fastify.post('/categories', 
    { onRequest: authenticateUser },
    taxonomyController.createCategory(taxonomyService)
  );
  
  fastify.put('/categories/:id', 
    { onRequest: authenticateUser },
    taxonomyController.updateCategory(taxonomyService)
  );
  
  fastify.delete('/categories/:id', 
    { onRequest: authenticateUser },
    taxonomyController.deleteCategory(taxonomyService)
  );
  
  // Tags
  fastify.get('/tags/popular', 
    taxonomyController.getPopularTags(taxonomyService)
  );
  
  fastify.get('/tags/:id', 
    taxonomyController.getTagById(taxonomyService)
  );
  
  fastify.get('/tags/slug/:slug', 
    taxonomyController.getTagBySlug(taxonomyService)
  );
  
  fastify.get('/tags/slug/:slug/content', 
    { onRequest: authenticateOptional },
    taxonomyController.getTagContent(contentService)
  );
  
  fastify.get('/:id/tags', 
    taxonomyController.getContentTags(taxonomyService)
  );
  
  fastify.post('/tags', 
    { onRequest: authenticateUser },
    taxonomyController.createTag(taxonomyService)
  );
  
  fastify.put('/tags/:id', 
    { onRequest: authenticateUser },
    taxonomyController.updateTag(taxonomyService)
  );
  
  fastify.delete('/tags/:id', 
    { onRequest: authenticateUser },
    taxonomyController.deleteTag(taxonomyService)
  );
  
  // Moderation endpoints
  fastify.post('/report', 
    { onRequest: authenticateUser },
    moderationController.reportContent(moderationService)
  );
  
  fastify.get('/moderation/queue', 
    { onRequest: authenticateUser },
    moderationController.getModerationQueue(moderationService)
  );
  
  fastify.get('/moderation/counts', 
    { onRequest: authenticateUser },
    moderationController.getReportCounts(moderationService)
  );
  
  fastify.put('/moderation/reports/:id/status', 
    { onRequest: authenticateUser },
    moderationController.updateReportStatus(moderationService)
  );
  
  fastify.post('/moderation/reports/:id/resolve', 
    { onRequest: authenticateUser },
    moderationController.resolveReport(moderationService)
  );
  
  fastify.post('/moderation/reports/:id/reject', 
    { onRequest: authenticateUser },
    moderationController.rejectReport(moderationService)
  );
  
  // Analytics endpoints
  fastify.post('/analytics/view', 
    { onRequest: authenticateOptional },
    analyticsController.trackContentView(analyticsService)
  );
  
  fastify.get('/analytics/content/:id', 
    { onRequest: authenticateOptional },
    analyticsController.getContentMetrics(analyticsService)
  );
  
  fastify.get('/analytics/user/:id', 
    { onRequest: authenticateUser },
    analyticsController.getUserEngagementMetrics(analyticsService)
  );
  
  fastify.get('/analytics/trending-topics', 
    analyticsController.getTrendingTopics(analyticsService)
  );
};

export default fp(contentRoutes);
