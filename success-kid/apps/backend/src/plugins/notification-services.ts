/**
 * Notification and Real-time Services Plugin
 * 
 * Registers services for notifications, activity feeds, and real-time updates
 */
import { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import { Pool } from 'pg';
import { getDbClient } from '../lib/db-client';
import { eventBus } from '../lib/event-bus';
import { getRedisClient } from '../lib/db-client';

// Import repositories
import { 
  NotificationRepository,
  NotificationTemplateRepository,
  NotificationPreferencesRepository,
  ActivityRepository,
  PresenceRepository,
  ConnectionStateRepository
} from '../repositories';

// Import services
import { 
  NotificationService, 
  NotificationTemplateService,
  NotificationPreferencesService,
  EmailNotificationService,
  PushNotificationService
} from '../services/notifications';
import { ActivityService } from '../services/activity';
import { PresenceService } from '../services/presence';
import { WebSocketService } from '../websockets/websocket-service';

/**
 * Plugin that registers notification and real-time services
 */
const notificationServicesPlugin: FastifyPluginAsync = async (fastify) => {
  // Get database connections
  const db = getDbClient();
  const redis = getRedisClient();
  
  // Initialize repositories
  const notificationRepository = new NotificationRepository(db);
  const notificationTemplateRepository = new NotificationTemplateRepository(db);
  const notificationPreferencesRepository = new NotificationPreferencesRepository(db);
  const activityRepository = new ActivityRepository(db);
  const presenceRepository = new PresenceRepository(db);
  const connectionStateRepository = new ConnectionStateRepository(db);
  
  // Initialize WebSocket service if not already registered
  const webSocketService = fastify.websockets || new WebSocketService(db, eventBus);
  
  // Initialize services
  const notificationTemplateService = new NotificationTemplateService(notificationTemplateRepository);
  
  const emailNotificationService = new EmailNotificationService({
    apiKey: process.env.EMAIL_API_KEY || '',
    fromEmail: process.env.EMAIL_FROM_ADDRESS || 'notifications@successkid.com',
    fromName: process.env.EMAIL_FROM_NAME || 'Success Kid',
    replyToEmail: process.env.EMAIL_REPLY_TO || 'no-reply@successkid.com'
  });
  
  const pushNotificationService = new PushNotificationService({
    apiKey: process.env.PUSH_API_KEY || '',
    appId: process.env.PUSH_APP_ID || '',
    vapidKey: process.env.PUSH_VAPID_KEY
  });
  
  const notificationPreferencesService = new NotificationPreferencesService(
    notificationPreferencesRepository
  );
  
  const notificationService = new NotificationService(
    notificationRepository,
    notificationPreferencesRepository,
    notificationTemplateService,
    emailNotificationService,
    pushNotificationService,
    webSocketService,
    fastify.repositories?.getUserRepository?.()
  );
  
  const activityService = new ActivityService(activityRepository);
  
  const presenceService = new PresenceService(presenceRepository, webSocketService);
  
  // Register services with Fastify
  fastify.decorate('notificationService', notificationService);
  fastify.decorate('notificationTemplateService', notificationTemplateService);
  fastify.decorate('notificationPreferencesService', notificationPreferencesService);
  fastify.decorate('activityService', activityService);
  fastify.decorate('presenceService', presenceService);
  
  // Also add to dependency injection container
  if (fastify.diContainer) {
    fastify.diContainer.register('notificationService', notificationService);
    fastify.diContainer.register('notificationTemplateService', notificationTemplateService);
    fastify.diContainer.register('notificationPreferencesService', notificationPreferencesService);
    fastify.diContainer.register('activityService', activityService);
    fastify.diContainer.register('presenceService', presenceService);
  }
  
  // Set up scheduled tasks for maintenance
  // These would typically run in a separate worker process in production
  
  // Clean up expired notifications every hour
  setInterval(async () => {
    try {
      const count = await notificationService.cleanupExpiredNotifications();
      if (count > 0) {
        fastify.log.info(`Cleaned up ${count} expired notifications`);
      }
    } catch (error) {
      fastify.log.error('Failed to clean up expired notifications', { error });
    }
  }, 60 * 60 * 1000);
  
  // Clean up stale presence data every 5 minutes
  setInterval(async () => {
    try {
      const threshold = new Date(Date.now() - 5 * 60 * 1000); // 5 minutes ago
      const count = await presenceService.cleanupStalePresence(threshold);
      if (count > 0) {
        fastify.log.info(`Updated status for ${count} stale presence records`);
      }
    } catch (error) {
      fastify.log.error('Failed to clean up stale presence data', { error });
    }
  }, 5 * 60 * 1000);
  
  // Clean up old activity data once per day
  setInterval(async () => {
    try {
      const count = await activityService.cleanupOldActivities(30); // Keep 30 days
      if (count > 0) {
        fastify.log.info(`Cleaned up ${count} old activity records`);
      }
    } catch (error) {
      fastify.log.error('Failed to clean up old activity data', { error });
    }
  }, 24 * 60 * 60 * 1000);
  
  fastify.log.info('Notification and real-time services registered');
};

export default fp(notificationServicesPlugin, {
  name: 'notification-services',
  dependencies: ['database', 'websockets']
});
