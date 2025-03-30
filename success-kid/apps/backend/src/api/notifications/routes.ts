/**
 * Route definitions for the Notifications API module
 */
import { FastifyInstance } from 'fastify';
import {
  getNotificationsSchema,
  getNotificationCountSchema,
  markNotificationReadSchema,
  markAllNotificationsReadSchema,
  getPreferencesSchema,
  updatePreferencesSchema,
  resetPreferencesSchema
} from './schema';
import {
  getNotificationsHandler,
  getNotificationCountHandler,
  markNotificationReadHandler,
  markAllNotificationsReadHandler,
  getPreferencesHandler,
  updatePreferencesHandler,
  resetPreferencesHandler
} from './handler';

/**
 * Registers the notification API routes
 * @param fastify - The Fastify instance
 */
export default async function notificationRoutes(fastify: FastifyInstance): Promise<void> {
  // Get current user's notifications
  fastify.get('/', {
    schema: getNotificationsSchema,
    // @ts-ignore - Assuming authenticate is decorated onto the instance
    onRequest: [fastify.authenticate]
  }, getNotificationsHandler);

  // Get notification count
  fastify.get('/count', {
    schema: getNotificationCountSchema,
    // @ts-ignore - Assuming authenticate is decorated onto the instance
    onRequest: [fastify.authenticate]
  }, getNotificationCountHandler);

  // Mark notification as read
  fastify.put('/:id/read', {
    schema: markNotificationReadSchema,
    // @ts-ignore - Assuming authenticate is decorated onto the instance
    onRequest: [fastify.authenticate]
  }, markNotificationReadHandler);

  // Mark all notifications as read
  fastify.put('/read-all', {
    schema: markAllNotificationsReadSchema,
    // @ts-ignore - Assuming authenticate is decorated onto the instance
    onRequest: [fastify.authenticate]
  }, markAllNotificationsReadHandler);

  // --- Preferences Routes ---

  // Get notification preferences
  fastify.get('/preferences', {
    schema: getPreferencesSchema,
    // @ts-ignore - Assuming authenticate is decorated onto the instance
    onRequest: [fastify.authenticate]
  }, getPreferencesHandler);

  // Update notification preferences
  fastify.put('/preferences', {
    schema: updatePreferencesSchema,
    // @ts-ignore - Assuming authenticate is decorated onto the instance
    onRequest: [fastify.authenticate]
  }, updatePreferencesHandler);

  // Reset notification preferences to defaults
  fastify.post('/preferences/reset', {
    schema: resetPreferencesSchema,
    // @ts-ignore - Assuming authenticate is decorated onto the instance
    onRequest: [fastify.authenticate]
  }, resetPreferencesHandler);
}
