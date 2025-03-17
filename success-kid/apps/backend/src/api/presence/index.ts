/**
 * Presence API Routes
 * 
 * Handles user presence API endpoints
 */
import { FastifyInstance } from 'fastify';
import { 
  getUserPresence,
  getUsersPresence,
  updatePresence,
  getOnlineUsers,
  getPresencePreferences,
  updatePresencePreferences
} from './handlers';

export default async function presenceRoutes(fastify: FastifyInstance) {
  // Make sure user is authenticated for all routes
  fastify.addHook('preHandler', fastify.authenticate);
  
  // Get user's presence status
  fastify.get('/users/:id', getUserPresence);
  
  // Get presence for multiple users
  fastify.post('/users', getUsersPresence);
  
  // Update user's own presence
  fastify.patch('/me', updatePresence);
  
  // Get online users
  fastify.get('/online', getOnlineUsers);
  
  // Get presence preferences
  fastify.get('/preferences', getPresencePreferences);
  
  // Update presence preferences
  fastify.patch('/preferences', updatePresencePreferences);
}
