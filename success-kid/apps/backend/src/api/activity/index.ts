/**
 * Activity API Routes
 * 
 * Handles activity feed-related API endpoints
 */
import { FastifyInstance } from 'fastify';
import { 
  getUserFeed,
  markAsRead,
  markAllAsRead,
  hideFeedItem,
  getActorActivities
} from './handlers';

export default async function activityRoutes(fastify: FastifyInstance) {
  // Make sure user is authenticated for all routes
  fastify.addHook('preHandler', fastify.authenticate);
  
  // Get user's activity feed with filtering and pagination
  fastify.get('/feed', getUserFeed);
  
  // Mark a feed item as read
  fastify.patch('/feed/:id/read', markAsRead);
  
  // Mark all feed items as read
  fastify.post('/feed/read-all', markAllAsRead);
  
  // Hide a feed item
  fastify.patch('/feed/:id/hide', hideFeedItem);
  
  // Get activities by actor (user)
  fastify.get('/user/:id', getActorActivities);
}
