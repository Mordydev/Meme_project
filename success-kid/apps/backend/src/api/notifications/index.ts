/**
 * Notifications API Routes
 * 
 * Handles notification-related API endpoints
 */
import { FastifyInstance } from 'fastify';
import { 
  getNotifications,
  markAsRead,
  markAllAsRead,
  getNotificationPreferences,
  updateNotificationPreferences,
  updateQuietHours,
  resetPreferences
} from './handlers';

export default async function notificationsRoutes(fastify: FastifyInstance) {
  // Make sure user is authenticated for all routes
  fastify.addHook('preHandler', fastify.authenticate);
  
  // Get user's notifications with filtering and pagination
  fastify.get('/', getNotifications);
  
  // Mark a notification as read
  fastify.patch('/:id/read', markAsRead);
  
  // Mark all notifications as read
  fastify.post('/read-all', markAllAsRead);
  
  // Get notification preferences
  fastify.get('/preferences', getNotificationPreferences);
  
  // Update notification preferences
  fastify.patch('/preferences', updateNotificationPreferences);
  
  // Update quiet hours settings
  fastify.patch('/preferences/quiet-hours', updateQuietHours);
  
  // Reset notification preferences to default
  fastify.post('/preferences/reset', resetPreferences);
}
