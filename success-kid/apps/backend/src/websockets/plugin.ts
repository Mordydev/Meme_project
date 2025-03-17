/**
 * WebSocket Plugin for Fastify
 * 
 * Registers the WebSocket handler with Fastify and sets up connection management.
 */
import fp from 'fastify-plugin';
import { FastifyInstance } from 'fastify';
import { WebSocket } from 'ws';
import { connectionManager } from './connection-manager';
import { recoveryService } from './recovery';
import { authenticateWebSocketConnection, extractToken, mockAuthenticateToken } from './auth';
import { processMessage } from './handlers';
import { logger } from '../lib/logger';
import { handleWebSocketError } from '../errors/handlers';

// Declare TypeScript interface extensions
declare module 'ws' {
  interface WebSocket {
    connectionId?: string;
  }
}

/**
 * WebSocket configuration interface
 */
interface WebSocketConfig {
  path: string;
  maxPayloadSize: number;
  pingInterval: number;
  auth: boolean;
}

/**
 * Default WebSocket configuration
 */
const defaultConfig: WebSocketConfig = {
  path: '/ws',
  maxPayloadSize: 1024 * 1024, // 1MB
  pingInterval: 30000, // 30 seconds
  auth: true,
};

/**
 * Fastify plugin for WebSocket functionality
 */
export default fp(async function(fastify: FastifyInstance, options: Partial<WebSocketConfig> = {}) {
  // Merge with default config
  const config = { ...defaultConfig, ...options };
  
  // Register WebSocket plugin if not already registered
  if (!fastify.websocketServer) {
    await fastify.register(require('@fastify/websocket'), {
      options: { maxPayload: config.maxPayloadSize }
    });
  }
  
  // Register WebSocket handler at configured path
  fastify.get(config.path, { websocket: true }, (connection, request) => {
    // Generate connection ID for reconnection
    const connectionId = request.query.connectionId || recoveryService.generateConnectionId();
    
    // Authenticate the connection
    let userId: string | null = null;
    
    if (config.auth) {
      // Try to authenticate via Fastify auth
      userId = authenticateWebSocketConnection(request);
      
      // If not authenticated and in dev mode, try token-based auth
      if (!userId && process.env.NODE_ENV !== 'production') {
        const token = extractToken(request.raw);
        if (token) {
          userId = mockAuthenticateToken(token);
        }
      }
      
      // If still not authenticated, close the connection
      if (!userId) {
        connection.socket.send(JSON.stringify({
          type: 'error',
          payload: { message: 'Unauthorized' }
        }));
        connection.socket.close(1008, 'Unauthorized');
        return;
      }
      
      // Store the connection ID on the socket
      connection.socket.connectionId = connectionId;
      
      // Save authentication info for reconnection
      recoveryService.saveConnectionState(connectionId, {
        connectionId,
        userId: userId,
        subscriptions: [],
        lastSeen: new Date(),
        metadata: { source: 'websocket' }
      }).catch(error => {
        logger.error('Failed to save connection state', { error, userId, connectionId });
      });
    } else {
      // For non-authenticated routes, use a generic user ID
      userId = 'anonymous';
    }
    
    // Register connection with manager
    connectionManager.add(userId, connection.socket);
    
    // Send welcome message
    connection.socket.send(JSON.stringify({
      type: 'system',
      payload: { 
        message: 'Connected successfully',
        connectionId: connectionId 
      }
    }));
    
    // Setup heartbeat interval to detect disconnections
    const pingInterval = setInterval(() => {
      if (connection.socket.readyState === WebSocket.OPEN) {
        try {
          connection.socket.ping();
        } catch (error) {
          logger.error('WebSocket ping error', { error, userId });
        }
      }
    }, config.pingInterval);
    
    // Setup message handler
    connection.socket.on('message', (message: Buffer) => {
      try {
        // Parse message as JSON
        const parsedMessage = JSON.parse(message.toString());
        
        // Handle subscription requests
        if (parsedMessage.type === 'subscribe' && connection.socket.connectionId) {
          const channels = parsedMessage.payload?.channels || [];
          
          // Store subscriptions for reconnection
          for (const channel of channels) {
            recoveryService.addSubscription(connection.socket.connectionId, channel)
              .catch(error => {
                logger.error('Failed to store subscription', { error, userId, channel });
              });
          }
        }
        
        // Process message
        processMessage(connection.socket, parsedMessage, userId!);
      } catch (error) {
        handleWebSocketError(connection.socket, error);
      }
    });
    
    // Handle connection close
    connection.socket.on('close', (code: number, reason: string) => {
      // Clean up resources
      clearInterval(pingInterval);
      
      // Remove from connection manager
      connectionManager.remove(userId!, connection.socket);
      
      logger.debug(`WebSocket connection closed: ${code} ${reason}`, { userId });
    });
    
    // Handle connection errors
    connection.socket.on('error', (error: Error) => {
      logger.error('WebSocket connection error', { error, userId });
      
      // Clean up on error
      clearInterval(pingInterval);
      connectionManager.remove(userId!, connection.socket);
    });
    
    // Log connection established
    logger.debug('WebSocket connection established', { userId });
  });
  
  // Log WebSocket server started
  fastify.log.info(`WebSocket server initialized at ${config.path}`);
  
  // Expose connection manager through Fastify instance
  fastify.decorate('wsConnections', connectionManager);
});
