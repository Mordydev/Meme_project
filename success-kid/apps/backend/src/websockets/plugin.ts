/**
 * WebSocket Plugin for Fastify
 * 
 * Registers the WebSocket handler with Fastify and sets up connection management.
 * Includes enhanced features for performance, reliability, and security.
 */
import fp from 'fastify-plugin';
import { FastifyInstance } from 'fastify';
import { WebSocket } from 'ws';
import { WebSocketEventType, WebSocketMessage } from '@success-kid/api-types';
import { connectionRegistry } from './connection-registry';
import { recoveryService } from './recovery';
import { authenticateWebSocketConnection, isTokenAboutToExpire, generateRefreshResponse } from './auth';
import { processMessage } from './handlers';
import { logger } from '../lib/logger';
import { handleWebSocketError } from '../errors/handlers';
import { messageBatcher } from './message-batcher';
import { monitoringService } from '../monitoring/service';
import { presenceService } from '../presence/service';

// Declare TypeScript interface extensions
declare module 'ws' {
  interface WebSocket {
    connectionId?: string;
    userId?: string;
    token?: string;
    lastActivity?: number;
    metadata?: Record<string, any>;
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
  connectionTimeout: number;
  cleanupInterval: number;
  maxConnectionsPerUser: number;
  tokenRefreshThresholdSec: number;
  compressionThreshold: number;
  maxFrameSize: number;
  rateLimit: {
    maxMessagesPerMinute: number;
    burstLimit: number;
  };
}

/**
 * Default WebSocket configuration
 */
const defaultConfig: WebSocketConfig = {
  path: '/ws',
  maxPayloadSize: 1024 * 1024, // 1MB
  pingInterval: 30000, // 30 seconds
  auth: true,
  connectionTimeout: 30000, // 30 seconds without pong response
  cleanupInterval: 60000, // Clean stale connections every minute
  maxConnectionsPerUser: 5, // Maximum connections per user
  tokenRefreshThresholdSec: 300, // 5 minutes before token expiry
  compressionThreshold: 1024, // Compress messages larger than 1KB
  maxFrameSize: 100 * 1024, // 100KB max frame size
  rateLimit: {
    maxMessagesPerMinute: 300, // 5 messages per second
    burstLimit: 30, // 30 messages in short burst
  },
};

/**
 * Rate limiting tracker for WebSocket connections
 */
class RateLimiter {
  private messageCounters = new Map<string, { count: number; resetTime: number }>();
  private burstCounters = new Map<string, { count: number; resetTime: number }>();
  
  /**
   * Check if a message should be rate limited
   * 
   * @param connectionId Connection ID
   * @returns True if message should be allowed, false if rate limited
   */
  allowMessage(connectionId: string): boolean {
    const now = Date.now();
    
    // Check minute-based rate limit
    let minuteCounter = this.messageCounters.get(connectionId);
    
    if (!minuteCounter || minuteCounter.resetTime < now) {
      // Reset counter for new minute
      minuteCounter = {
        count: 0,
        resetTime: now + 60000 // Reset after 1 minute
      };
      this.messageCounters.set(connectionId, minuteCounter);
    }
    
    // Check burst rate limit (shorter time window)
    let burstCounter = this.burstCounters.get(connectionId);
    
    if (!burstCounter || burstCounter.resetTime < now) {
      // Reset counter for new burst window
      burstCounter = {
        count: 0,
        resetTime: now + 5000 // Reset after 5 seconds
      };
      this.burstCounters.set(connectionId, burstCounter);
    }
    
    // Increment counters
    minuteCounter.count++;
    burstCounter.count++;
    
    // Check if limits exceeded
    if (
      minuteCounter.count > defaultConfig.rateLimit.maxMessagesPerMinute ||
      burstCounter.count > defaultConfig.rateLimit.burstLimit
    ) {
      logger.warn('Rate limit exceeded for WebSocket connection', {
        connectionId,
        minuteCount: minuteCounter.count,
        burstCount: burstCounter.count,
      });
      
      return false;
    }
    
    return true;
  }
  
  /**
   * Reset rate limit counters for a connection
   * 
   * @param connectionId Connection ID
   */
  resetCounters(connectionId: string): void {
    this.messageCounters.delete(connectionId);
    this.burstCounters.delete(connectionId);
  }
  
  /**
   * Clean up stale rate limit counters
   */
  cleanupStaleCounters(): void {
    const now = Date.now();
    
    // Clean up minute counters
    for (const [connectionId, counter] of this.messageCounters.entries()) {
      if (counter.resetTime < now) {
        this.messageCounters.delete(connectionId);
      }
    }
    
    // Clean up burst counters
    for (const [connectionId, counter] of this.burstCounters.entries()) {
      if (counter.resetTime < now) {
        this.burstCounters.delete(connectionId);
      }
    }
  }
}

// Create rate limiter instance
const rateLimiter = new RateLimiter();

/**
 * Fastify plugin for WebSocket functionality
 */
export default fp(async function(fastify: FastifyInstance, options: Partial<WebSocketConfig> = {}) {
  // Merge with default config
  const config = { ...defaultConfig, ...options };
  
  // Register WebSocket plugin if not already registered
  if (!fastify.websocketServer) {
    await fastify.register(require('@fastify/websocket'), {
      options: { 
        maxPayload: config.maxPayloadSize,
        clientTracking: true,
        perMessageDeflate: {
          zlibDeflateOptions: {
            level: 6, // Compression level (1-9, 9 being highest)
            memLevel: 7, // Memory usage (1-9, 9 being highest)
          },
          threshold: config.compressionThreshold, // Only compress messages larger than this
        },
        maxReceivedFrameSize: config.maxFrameSize,
      }
    });
  }
  
  // Setup cleanup interval for stale connections
  const cleanupInterval = setInterval(() => {
    try {
      const closed = connectionRegistry.cleanupStaleConnections();
      
      if (closed > 0) {
        logger.info(`Cleaned up ${closed} stale WebSocket connections`);
      }
      
      // Also clean up rate limiter
      rateLimiter.cleanupStaleCounters();
      
      // Report metrics
      monitoringService.recordMetric('websocket.connections.active', connectionRegistry.getConnectionCount());
      monitoringService.recordMetric('websocket.connections.users', connectionRegistry.getUserCount());
    } catch (error) {
      logger.error('Error cleaning up stale connections', { error });
    }
  }, config.cleanupInterval);
  
  // Clean up on server close
  fastify.addHook('onClose', (instance, done) => {
    clearInterval(cleanupInterval);
    
    // Gracefully close all WebSocket connections
    connectionRegistry.closeAll(1001, 'Server shutting down');
    
    // Report final metrics
    monitoringService.recordMetric('websocket.connections.active', 0);
    monitoringService.recordMetric('websocket.connections.users', 0);
    
    done();
  });
  
  // Register WebSocket handler at configured path
  fastify.get(config.path, { websocket: true }, async (connection, request) => {
    // Generate connection ID for reconnection
    const connectionId = request.query.connectionId || recoveryService.generateConnectionId();
    
    // Authenticate the connection
    let userId: string | null = null;
    let token: string | null = null;
    
    if (config.auth) {
      // Extract token from query
      token = request.query.token as string;
      
      // Authenticate via the auth service
      userId = await authenticateWebSocketConnection(request);
      
      // If not authenticated, close the connection
      if (!userId) {
        const errorMessage: WebSocketMessage = {
          type: WebSocketEventType.ERROR,
          payload: { 
            code: 'UNAUTHORIZED',
            message: 'Authentication required' 
          },
          meta: {
            timestamp: new Date().toISOString()
          }
        };
        
        connection.socket.send(JSON.stringify(errorMessage));
        connection.socket.close(1008, 'Unauthorized');
        
        // Report authentication failure
        monitoringService.recordMetric('websocket.auth.failures', 1);
        
        return;
      }
      
      // Check if user has too many connections
      const userConnectionCount = connectionRegistry.getConnectionCount(userId);
      
      if (userConnectionCount >= config.maxConnectionsPerUser) {
        const errorMessage: WebSocketMessage = {
          type: WebSocketEventType.ERROR,
          payload: { 
            code: 'TOO_MANY_CONNECTIONS',
            message: `Maximum of ${config.maxConnectionsPerUser} connections allowed` 
          },
          meta: {
            timestamp: new Date().toISOString()
          }
        };
        
        connection.socket.send(JSON.stringify(errorMessage));
        connection.socket.close(1013, 'Too many connections');
        
        logger.warn(`User exceeded maximum WebSocket connections: ${userId}`, {
          connectionCount: userConnectionCount,
          maxConnections: config.maxConnectionsPerUser
        });
        
        return;
      }
    } else {
      // For non-authenticated routes, use a generic user ID
      userId = 'anonymous';
    }
    
    // Store connection ID, user ID, and token on the socket for easy reference
    connection.socket.connectionId = connectionId;
    connection.socket.userId = userId;
    connection.socket.token = token;
    connection.socket.lastActivity = Date.now();
    connection.socket.metadata = { 
      source: 'websocket',
      ip: request.ip,
      userAgent: request.headers['user-agent'],
      query: request.query
    };
    
    // Setup ping timeout tracking
    let pingTimeout: NodeJS.Timeout | null = null;
    
    const heartbeat = () => {
      // Update last activity
      connection.socket.lastActivity = Date.now();
      
      // Clear existing timeout
      if (pingTimeout) {
        clearTimeout(pingTimeout);
      }
      
      // Set new timeout
      pingTimeout = setTimeout(() => {
        logger.warn('WebSocket ping timeout', { userId, connectionId });
        
        // Close connection on ping timeout
        if (connection.socket.readyState === WebSocket.OPEN) {
          connection.socket.terminate();
        }
      }, config.connectionTimeout);
    };
    
    // Initial heartbeat
    heartbeat();
    
    // Register connection with registry
    connectionRegistry.add(userId, connection.socket, connectionId, { 
      source: 'websocket',
      ip: request.ip,
      userAgent: request.headers['user-agent'],
      query: request.query
    });
    
    // Save authentication info for reconnection
    recoveryService.saveConnectionState(connectionId, {
      connectionId,
      userId: userId,
      subscriptions: [],
      lastSeen: new Date(),
      metadata: { 
        source: 'websocket',
        ip: request.ip,
        userAgent: request.headers['user-agent']
      }
    }).catch(error => {
      logger.error('Failed to save connection state', { error, userId, connectionId });
    });
    
    // Update presence for authenticated users
    if (userId !== 'anonymous') {
      await presenceService.updatePresenceFromWebSocket(userId, {
        connectionId,
        ip: request.ip,
        userAgent: request.headers['user-agent']
      });
    }
    
    // Report connection metrics
    monitoringService.recordMetric('websocket.connections.active', connectionRegistry.getConnectionCount());
    monitoringService.recordMetric('websocket.connections.users', connectionRegistry.getUserCount());
    
    // Send welcome message
    const welcomeMessage: WebSocketMessage = {
      type: WebSocketEventType.CONNECT,
      payload: { 
        message: 'Connected successfully',
        connectionId: connectionId
      },
      meta: {
        timestamp: new Date().toISOString()
      }
    };
    
    connection.socket.send(JSON.stringify(welcomeMessage));
    
    // Setup token refresh checking
    let tokenRefreshInterval: NodeJS.Timeout | null = null;
    
    if (token) {
      // Check token expiry every minute
      tokenRefreshInterval = setInterval(() => {
        if (
          connection.socket.token && 
          connection.socket.readyState === WebSocket.OPEN &&
          isTokenAboutToExpire(connection.socket.token, config.tokenRefreshThresholdSec)
        ) {
          // Send token refresh notification
          const refreshMessage = generateRefreshResponse(connection.socket.token);
          connection.socket.send(JSON.stringify(refreshMessage));
        }
      }, 60000); // Check every minute
    }
    
    // Setup ping interval for keeping connection alive
    const pingInterval = setInterval(() => {
      if (connection.socket.readyState === WebSocket.OPEN) {
        try {
          connection.socket.ping();
        } catch (error) {
          logger.error('WebSocket ping error', { error, userId, connectionId });
        }
      } else {
        clearInterval(pingInterval);
      }
    }, config.pingInterval);
    
    // Handle pong response
    connection.socket.on('pong', () => {
      // Reset heartbeat timeout
      heartbeat();
    });
    
    // Setup message handler
    connection.socket.on('message', (message: Buffer) => {
      try {
        // Update last activity timestamp
        connection.socket.lastActivity = Date.now();
        
        // Apply rate limiting
        if (!rateLimiter.allowMessage(connectionId)) {
          // Send rate limit error
          const errorMessage: WebSocketMessage = {
            type: WebSocketEventType.ERROR,
            payload: {
              code: 'RATE_LIMIT_EXCEEDED',
              message: 'Message rate limit exceeded, please slow down',
            },
            meta: {
              timestamp: new Date().toISOString()
            }
          };
          
          connection.socket.send(JSON.stringify(errorMessage));
          
          // Report rate limiting
          monitoringService.recordMetric('websocket.rate_limits', 1);
          
          return;
        }
        
        // Parse message as JSON
        const parsedMessage = JSON.parse(message.toString()) as WebSocketMessage;
        
        // Handle subscription requests
        if (parsedMessage.type === WebSocketEventType.SUBSCRIBE && connection.socket.connectionId) {
          const channels = parsedMessage.payload?.channels || [];
          
          // Subscribe to channels
          for (const channel of channels) {
            connectionRegistry.subscribe(connection.socket.connectionId, channel);
            
            // Store subscriptions for reconnection
            recoveryService.addSubscription(connection.socket.connectionId, channel)
              .catch(error => {
                logger.error('Failed to store subscription', { error, userId, channel });
              });
          }
          
          // Send confirmation
          connection.socket.send(JSON.stringify({
            type: WebSocketEventType.SUBSCRIBED,
            payload: {
              channels,
              message: 'Subscribed successfully'
            },
            meta: {
              timestamp: new Date().toISOString()
            }
          }));
          
          return;
        }
        
        // Process message
        processMessage(connection.socket, parsedMessage, userId!);
        
        // Report message metrics
        monitoringService.recordMetric('websocket.messages.received', 1);
      } catch (error) {
        handleWebSocketError(connection.socket, error);
        
        // Report error metrics
        monitoringService.recordMetric('websocket.errors', 1);
      }
    });
    
    // Handle connection close
    connection.socket.on('close', (code: number, reason: string) => {
      // Clean up resources
      if (pingTimeout) {
        clearTimeout(pingTimeout);
      }
      
      if (tokenRefreshInterval) {
        clearInterval(tokenRefreshInterval);
      }
      
      clearInterval(pingInterval);
      
      // Remove from connection registry
      connectionRegistry.remove(connectionId);
      
      // Reset rate limiter
      rateLimiter.resetCounters(connectionId);
      
      // Update presence if authenticated user
      if (userId !== 'anonymous' && userId !== null) {
        presenceService.setUserOffline(userId).catch(error => {
          logger.error('Failed to update presence on disconnect', { error, userId });
        });
      }
      
      // Flush any pending messages
      messageBatcher.flush(connection.socket);
      
      // Report metrics
      monitoringService.recordMetric('websocket.connections.active', connectionRegistry.getConnectionCount());
      monitoringService.recordMetric('websocket.connections.users', connectionRegistry.getUserCount());
      monitoringService.recordMetric('websocket.disconnections', 1);
      
      logger.debug(`WebSocket connection closed: ${code} ${reason}`, { userId, connectionId });
    });
    
    // Handle connection errors
    connection.socket.on('error', (error: Error) => {
      logger.error('WebSocket connection error', { error, userId, connectionId });
      
      // Clean up on error
      if (pingTimeout) {
        clearTimeout(pingTimeout);
      }
      
      if (tokenRefreshInterval) {
        clearInterval(tokenRefreshInterval);
      }
      
      clearInterval(pingInterval);
      
      // Remove from connection registry
      connectionRegistry.remove(connectionId);
      
      // Reset rate limiter
      rateLimiter.resetCounters(connectionId);
      
      // Report error metrics
      monitoringService.recordMetric('websocket.errors', 1);
    });
    
    // Check for reconnection state
    if (request.query.reconnect === 'true') {
      // Attempt to restore connection state
      const reconnectResult = await recoveryService.handleReconnection(
        connectionId,
        userId
      );
      
      if (reconnectResult.success) {
        // Send reconnection success message
        connection.socket.send(JSON.stringify({
          type: 'reconnect.success',
          payload: {
            message: 'Reconnection successful',
            restoredSubscriptions: reconnectResult.restoredSubscriptions,
            missedEvents: reconnectResult.missedEvents
          }
        }));
        
        // Report metrics
        monitoringService.recordMetric('websocket.reconnections.success', 1);
      } else {
        // Send reconnection status
        connection.socket.send(JSON.stringify({
          type: 'reconnect.failed',
          payload: {
            message: `Reconnection failed: ${reconnectResult.reason}`,
            reason: reconnectResult.reason
          }
        }));
        
        // Report metrics
        monitoringService.recordMetric('websocket.reconnections.failed', 1);
      }
    }
    
    // Log connection established
    logger.debug('WebSocket connection established', { userId, connectionId });
  });
  
  // Log WebSocket server started
  fastify.log.info(`WebSocket server initialized at ${config.path}`);
  
  // Expose connection registry and message batcher through Fastify instance
  fastify.decorate('wsConnections', connectionRegistry);
  fastify.decorate('wsMessageBatcher', messageBatcher);
});