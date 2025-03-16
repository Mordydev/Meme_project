/**
 * Services Plugin
 * 
 * Registers application services as Fastify decorations
 */
import { FastifyPluginAsync } from 'fastify';
import fastifyPlugin from 'fastify-plugin';
import { logger } from '../lib/logger';

// Import services
import { PointsService } from '../services/points/points-service';
import { ContentService } from '../services/content/content-service';

// Declare custom types for Fastify instance
declare module 'fastify' {
  interface FastifyInstance {
    services: {
      pointsService: PointsService;
      contentService: ContentService;
    };
  }
  
  // For request-level DI container
  interface FastifyRequest {
    diContainer: {
      resolve: (type: string) => any;
    };
  }
}

// Services plugin
const servicesPlugin: FastifyPluginAsync = async (fastify) => {
  logger.info('Initializing application services');
  
  // Initialize services with necessary dependencies
  const pointsService = new PointsService(
    fastify.db.repositories.userPoints,
    fastify.db.repositories.walletConnections
  );
  
  // Initialize Content Service
  const contentService = new ContentService(
    fastify.db.repositories.content,
    fastify.db.repositories.comments,
    fastify.db.repositories.categories,
    fastify.db.repositories.tags,
    fastify.db.repositories.contentReports,
    pointsService
  );
  
  // Create services container
  const services = {
    pointsService,
    contentService
  };
  
  // Decorate fastify instance with services
  fastify.decorate('services', services);
  
  // Add request-level DI container
  fastify.decorateRequest('diContainer', null);
  fastify.addHook('onRequest', async (request, reply) => {
    // Simple resolver to access services and other dependencies
    request.diContainer = {
      resolve: (type: string) => {
        switch (type) {
          case 'services':
            return services;
          case 'auth':
            return { rbac: fastify.auth?.rbac };
          default:
            return null;
        }
      }
    };
  });
  
  logger.info('Application services initialized');
};

export default fastifyPlugin(servicesPlugin);
