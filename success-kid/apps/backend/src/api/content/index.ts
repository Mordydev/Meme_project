/**
 * Content API Module Entry Point
 *
 * Registers all content-related API routes (content, comments, feed, search, etc.)
 */
import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import contentCoreRoutes from './routes'; // Import the consolidated routes
// Import other route functions if they exist after refactoring
// import feedRoutes from './feedRoutes'; // Example
// import searchRoutes from './searchRoutes'; // Example
// import taxonomyRoutes from './taxonomyRoutes'; // Example
// import moderationRoutes from './moderationRoutes'; // Example
// import analyticsRoutes from './analyticsRoutes'; // Example

// Assuming services are decorated onto the Fastify instance during app setup
// Example: fastify.decorate('contentService', createContentService(...));

const contentApiPlugin: FastifyPluginAsync = async (fastify: FastifyInstance) => {

  // Register core content and comment routes
  // Pass the required service instance(s) via options if needed by the route function,
  // otherwise, handlers will access them via request.server.*
  await fastify.register(contentCoreRoutes, {
    // Assuming contentCoreRoutes expects contentService in opts,
    // but we refactored handlers to use request.server.contentService
    // If contentCoreRoutes doesn't need opts, pass {} or remove opts.
    // contentService: fastify.contentService // Example if passing via opts
  });

  // TODO: Register routes from other consolidated controller logic
  // await fastify.register(feedRoutes, { prefix: '/feed', feedService: fastify.feedService });
  // await fastify.register(searchRoutes, { prefix: '/search', searchService: fastify.searchService });
  // await fastify.register(taxonomyRoutes, { prefix: '/taxonomy', taxonomyService: fastify.taxonomyService });
  // await fastify.register(moderationRoutes, { prefix: '/moderation', moderationService: fastify.moderationService });
  // await fastify.register(analyticsRoutes, { prefix: '/analytics', analyticsService: fastify.analyticsService });

  fastify.log.info('Content API routes registered');
};

export default fp(contentApiPlugin);
