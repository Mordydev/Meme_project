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
import { MediaService } from '../services/media/media-service';
import { WalletConnectionService } from '../services/wallet/connection-service';

// Import notification and real-time services
import { 
  NotificationService,
  NotificationTemplateService,
  NotificationPreferencesService
} from '../services/notifications';
import { ActivityService } from '../services/activity';
import { PresenceService } from '../services/presence';
import { WebSocketService } from '../websockets/websocket-service';

// Import notification services plugin
import notificationServicesPlugin from './notification-services';

// Declare custom types for Fastify instance
declare module 'fastify' {
  interface FastifyInstance {
    services: {
      pointsService: PointsService;
      contentService: ContentService;
      mediaService: MediaService;
    };
    walletConnectionService: WalletConnectionService;
    
    // Notification and real-time services
    notificationService: NotificationService;
    notificationTemplateService: NotificationTemplateService;
    notificationPreferencesService: NotificationPreferencesService;
    activityService: ActivityService;
    presenceService: PresenceService;
    websockets: WebSocketService;
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
  
  // Initialize Media Service
  const mediaService = new MediaService(
    fastify.db.repositories.media,
    fastify.db.repositories.mediaPermissions,
    {
      storage: {
        provider: process.env.STORAGE_PROVIDER === 's3' ? 's3' : 'local',
        s3: process.env.STORAGE_PROVIDER === 's3' ? {
          region: process.env.S3_REGION || 'us-east-1',
          bucketName: process.env.S3_BUCKET_NAME || 'media-bucket',
          accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
          secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
          cdnBaseUrl: process.env.S3_CDN_BASE_URL
        } : undefined,
        local: {
          basePath: process.env.STORAGE_LOCAL_PATH || './uploads',
          baseUrl: process.env.BASE_URL || 'http://localhost:3000'
        }
      },
      queueOptions: {
        redis: {
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT || '6379', 10),
          password: process.env.REDIS_PASSWORD
        },
        prefix: 'media'
      },
      uploadLimits: {
        maxSizeBytes: 10 * 1024 * 1024 // 10MB default
      }
    }
  );
  
  // Initialize Wallet Connection Service
  const walletConnectionService = new WalletConnectionService(
    fastify.db.repositories.walletConnections,
    fastify.redis
  );

  // Initialize scheduled tasks if not in test environment
  if (process.env.NODE_ENV !== 'test') {
    mediaService.initializeScheduledTasks()
      .then(() => logger.info('Media maintenance tasks scheduled'))
      .catch(err => logger.error('Failed to schedule media maintenance tasks', { error: err }));
  }

  // Create services container
  const services = {
    pointsService,
    contentService,
    mediaService
  };
  
  // Decorate fastify instance with services
  fastify.decorate('services', services);
  
  // Decorate fastify instance with wallet connection service
  fastify.decorate('walletConnectionService', walletConnectionService);
  
  // Register notification and real-time services
  await fastify.register(notificationServicesPlugin);
  
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
          case 'wallet':
            return { walletConnectionService: fastify.walletConnectionService };
            
          // Notification and real-time services
          case 'notificationService':
            return fastify.notificationService;
          case 'notificationTemplateService':
            return fastify.notificationTemplateService;
          case 'notificationPreferencesService':
            return fastify.notificationPreferencesService;
          case 'activityService':
            return fastify.activityService;
          case 'presenceService':
            return fastify.presenceService;
          case 'websockets':
            return fastify.websockets;
            
          default:
            return null;
        }
      }
    };
  });
  
  logger.info('Application services initialized');
};

export default fastifyPlugin(servicesPlugin);
