/**
 * Enhanced WebSocket Plugin
 * 
 * Registers and configures the WebSocket service with Fastify
 */
import { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import { EnhancedWebSocketService } from './websocket-service-enhanced';
import { logger } from '../lib/logger';
import { EnhancedEventBus } from '../lib/enhanced-event-bus';
import { getDbClient } from '../lib/db-client';
import { redis } from '../lib/redis';
import { getJwtService } from '../auth/jwt';
import { getPresenceService } from '../services/presence';

/**
 * WebSocket plugin options
 */
interface WebSocketPluginOptions {
  /**
   * WebSocket service options
   */
  serviceOptions?: {
    /**
     * Maximum message size in bytes
     * Default: 1MB
     */
    maxPayload?: number;
    
    /**
     * Enable client tracking
     * Default: true
     */
    clientTracking?: boolean;
    
    /**
     * Ping interval in milliseconds
     * Default: 30000ms (30 seconds)
     */
    pingInterval?: number;
    
    /**
     * Ping timeout in milliseconds
     * Default: 10000ms (10 seconds)
     */
    pingTimeout?: number;
    
    /**
     * Maximum connections per user
     * Default: 5
     */
    maxConnectionsPerUser?: number;
    
    /**
     * Path for WebSocket endpoint
     * Default: /ws
     */
    path?: string;
  };
  
  /**
   * Service ID for this WebSocket instance
   * Used for distributed environments
   */
  serviceId?: string;
  
  /**
   * Enable presence tracking
   * Default: true
   */
  enablePresence?: boolean;
}

/**
 * Enhanced WebSocket plugin for Fastify
 * Sets up the WebSocket server with improved features
 */
export default fp<WebSocketPluginOptions>(async function enhancedWebsocketPlugin(
  fastify: FastifyInstance,
  options: WebSocketPluginOptions = {}
) {
  try {
    // Get database connection
    const db = getDbClient();
    
    // Get JWT service
    const jwtService = getJwtService();
    
    // Create enhanced event bus
    const eventBus = new EnhancedEventBus(redis, options.serviceId);
    
    // Get or create presence service if enabled
    const presenceService = options.enablePresence !== false ? 
      getPresenceService() : undefined;
    
    // Create WebSocket service
    const webSocketService = new EnhancedWebSocketService(
      db,
      eventBus,
      redis,
      jwtService,
      presenceService,
      options.serviceOptions
    );
    
    // Initialize WebSocket service
    webSocketService.initialize(fastify);
    
    // Expose service for use in other parts of the application
    fastify.decorate('websockets', webSocketService);
    
    // Register graceful shutdown
    fastify.addHook('onClose', async (instance) => {
      await webSocketService.shutdown();
      await eventBus.shutdown();
    });
    
    logger.info('Enhanced WebSocket plugin registered successfully', {
      path: options.serviceOptions?.path || '/ws',
      serviceId: options.serviceId || 'default'
    });
  } catch (error) {
    logger.error('Failed to register enhanced WebSocket plugin', { error });
    throw error;
  }
});
