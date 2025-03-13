import { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import { WebSocket } from 'ws';
import { ConnectionRegistry } from './connection-registry';
import { eventBus, EventType } from '../lib/event-bus';
import { logger } from '../lib/logger';
import { processMessage, authenticateConnection } from './handlers';

/**
 * WebSocket plugin for Fastify
 * Handles real-time communication with clients
 */
export default fp(async function websocketPlugin(fastify: FastifyInstance) {
  // Initialize connection registry
  const connectionRegistry = new ConnectionRegistry();
  
  // Register WebSocket plugin - make sure @fastify/websocket is installed
  await fastify.register(require('@fastify/websocket'), {
    options: {
      maxPayload: 1048576, // 1MB max message size
      clientTracking: true,
      // Ping interval to keep connections alive
      pingInterval: 30000,
    },
  });
  
  // Expose registry for use in other parts of the application
  fastify.decorate('websockets', {
    connectionRegistry,
    sendToUser: (userId: string, message: any) => connectionRegistry.sendToUser(userId, message),
    sendToAll: (message: any) => connectionRegistry.sendToAll(message),
  });
  
  // Set up WebSocket route
  fastify.get('/ws', { websocket: true }, (connection, request) => {
    const socket = connection.socket;
    let userId: string | null = null;
    
    fastify.log.info('WebSocket connection established');
    
    // Authenticate connection
    userId = authenticateConnection(request);
    
    if (userId) {
      // Register authenticated connection
      connectionRegistry.add(userId, socket);
      fastify.log.info(`WebSocket authenticated for user ${userId}`);
    } else {
      // Allow anonymous connection but with limited capabilities
      fastify.log.info('Anonymous WebSocket connection');
    }
    
    // Handle connection close
    socket.on('close', () => {
      fastify.log.info(`WebSocket connection closed${userId ? ` for user ${userId}` : ''}`);
      if (userId) {
        connectionRegistry.remove(userId, socket);
      }
    });
    
    // Handle messages
    socket.on('message', (message: WebSocket.Data) => {
      const messageStr = message.toString();
      processMessage(socket, userId, messageStr);
    });
    
    // Handle errors
    socket.on('error', (error) => {
      fastify.log.error('WebSocket error', error);
    });
    
    // Send welcome message
    socket.send(JSON.stringify({
      type: 'connected',
      data: {
        userId,
        timestamp: new Date().toISOString(),
        authenticated: Boolean(userId)
      }
    }));
  });
  
  // Subscribe to events for broadcasting
  setupEventSubscriptions(connectionRegistry);
  
  // Log connection stats periodically
  setInterval(() => {
    logger.debug(`WebSocket stats: ${connectionRegistry.getUserCount()} users, ${connectionRegistry.getConnectionCount()} connections`);
  }, 60000);
});

/**
 * Set up event subscriptions for real-time updates
 * @param registry Connection registry for sending messages
 */
function setupEventSubscriptions(registry: ConnectionRegistry) {
  // Points awarded event
  eventBus.subscribe(EventType.POINTS_AWARDED, (data) => {
    const { userId, amount, source } = data;
    registry.sendToUser(userId, {
      type: 'points.update',
      data: {
        amount,
        source,
        timestamp: new Date().toISOString(),
      },
    });
    logger.debug(`Sent points update to user ${userId}`);
  });
  
  // Achievement unlocked event
  eventBus.subscribe(EventType.ACHIEVEMENT_UNLOCKED, (data) => {
    const { userId, achievement } = data;
    registry.sendToUser(userId, {
      type: 'achievement.unlocked',
      data: {
        achievement,
        timestamp: new Date().toISOString(),
      },
    });
    logger.debug(`Sent achievement notification to user ${userId}`);
  });
  
  // Content created event
  eventBus.subscribe(EventType.CONTENT_CREATED, (data) => {
    registry.sendToAll({
      type: 'content.new',
      data: {
        id: data.id,
        author: data.author,
        preview: data.preview,
        timestamp: new Date().toISOString(),
      },
    });
    logger.debug('Broadcast new content to all users');
  });
  
  // Market milestone reached
  eventBus.subscribe(EventType.MILESTONE_REACHED, (data) => {
    registry.sendToAll({
      type: 'milestone.reached',
      data: {
        milestone: data.milestone,
        value: data.value,
        timestamp: new Date().toISOString(),
      },
    });
    logger.debug(`Broadcast milestone achievement: ${data.milestone}`);
  });
}