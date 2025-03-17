/**
 * WebSocket Module
 * 
 * Exports WebSocket functionality for real-time communication.
 */
import { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import { WebSocketService } from './websocket-service';
import { logger } from '../lib/logger';
import { eventBus } from '../lib/event-bus';
import { getDbClient } from '../lib/db-client';

// Export WebSocketService class
export { WebSocketService } from './websocket-service';
export { ConnectionRegistry } from './connection-registry';

/**
 * WebSocket plugin for Fastify
 * Sets up the WebSocket server and decorates the Fastify instance
 */
export default fp(async function websocketPlugin(fastify: FastifyInstance) {
  try {
    // Get database connection
    const db = getDbClient();
    
    // Create WebSocket service
    const webSocketService = new WebSocketService(db, eventBus);
    
    // Register WebSocket plugin - make sure @fastify/websocket is installed
    await fastify.register(require('@fastify/websocket'), {
      options: {
        maxPayload: 1048576, // 1MB max message size
        clientTracking: true,
        // Ping interval to keep connections alive
        pingInterval: 30000,
      },
    });
    
    // Initialize WebSocket service
    webSocketService.initialize(fastify);
    
    // Expose service for use in other parts of the application
    fastify.decorate('websockets', webSocketService);
    
    logger.info('WebSocket plugin registered successfully');
  } catch (error) {
    logger.error('Failed to register WebSocket plugin', { error });
    throw error;
  }
});
