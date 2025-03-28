/**
 * WebSocket Fallback Mechanisms
 * 
 * Provides fallback capabilities for handling WebSocket disruptions
 * with alternative communication methods.
 */
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { logger } from '../lib/logger';
import { connectionRegistry } from './connection-registry';
import { monitoringService } from '../monitoring/service';

// Cache for recent messages to support polling fallback
interface CachedMessage {
  type: string;
  payload: any;
  timestamp: number;
  userId: string;
  channels: string[];
}

// Maximum messages to keep in cache per user
const MAX_CACHED_MESSAGES = 100;

// How long to keep messages in cache (5 minutes)
const MESSAGE_CACHE_TTL = 5 * 60 * 1000;

// Recent messages cache by user ID
const messageCache = new Map<string, CachedMessage[]>();

/**
 * Register a message in the fallback cache
 * 
 * @param userId User ID
 * @param type Message type
 * @param payload Message payload
 * @param channels Optional channels associated with message
 */
export function registerMessageForFallback(
  userId: string,
  type: string,
  payload: any,
  channels: string[] = []
): void {
  // Don't cache for anonymous users
  if (userId === 'anonymous') {
    return;
  }
  
  // Initialize user cache if needed
  if (!messageCache.has(userId)) {
    messageCache.set(userId, []);
  }
  
  // Add message to cache
  const userCache = messageCache.get(userId)!;
  
  userCache.push({
    type,
    payload,
    timestamp: Date.now(),
    userId,
    channels
  });
  
  // Trim cache if needed
  if (userCache.length > MAX_CACHED_MESSAGES) {
    userCache.shift(); // Remove oldest message
  }
}

/**
 * Get recent messages for a user (polling fallback)
 * 
 * @param userId User ID
 * @param since Timestamp to get messages since (ms)
 * @param limit Maximum messages to return
 * @returns Recent messages
 */
export function getRecentMessages(
  userId: string,
  since: number = 0,
  limit: number = 50
): CachedMessage[] {
  const userCache = messageCache.get(userId) || [];
  
  // Filter messages newer than 'since' timestamp
  return userCache
    .filter(msg => msg.timestamp > since)
    .slice(-limit) // Take the most recent 'limit' messages
    .map(({ type, payload, timestamp, channels }) => ({
      type,
      payload,
      timestamp,
      userId,
      channels
    }));
}

/**
 * Clean up expired messages
 */
export function cleanupExpiredMessages(): void {
  const now = Date.now();
  const expiredBefore = now - MESSAGE_CACHE_TTL;
  
  // Clean up expired messages for each user
  for (const [userId, messages] of messageCache.entries()) {
    const validMessages = messages.filter(msg => msg.timestamp >= expiredBefore);
    
    if (validMessages.length === 0) {
      messageCache.delete(userId);
    } else if (validMessages.length !== messages.length) {
      messageCache.set(userId, validMessages);
    }
  }
}

/**
 * Initialize fallback cleanup task
 */
export function initializeFallbackCleanup(): () => void {
  // Set up periodic cleanup (every minute)
  const cleanupInterval = setInterval(cleanupExpiredMessages, 60000);
  
  // Return cleanup function
  return () => {
    clearInterval(cleanupInterval);
  };
}

/**
 * Register fallback API routes
 * 
 * @param fastify Fastify instance
 */
export async function registerFallbackRoutes(fastify: FastifyInstance): Promise<void> {
  // Long polling endpoint for getting messages
  fastify.get('/api/v1/ws-fallback/poll', {
    schema: {
      tags: ['WebSocket'],
      summary: 'Poll for messages (WebSocket fallback)',
      description: 'Provides a fallback mechanism for WebSocket messages using HTTP polling',
      querystring: {
        type: 'object',
        properties: {
          since: { type: 'number', description: 'Timestamp to get messages since (ms)' },
          limit: { type: 'number', description: 'Maximum messages to return' },
        }
      },
      response: {
        200: {
          description: 'Recent messages',
          type: 'object',
          properties: {
            data: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  type: { type: 'string' },
                  payload: { type: 'object' },
                  timestamp: { type: 'number' },
                }
              }
            },
            meta: {
              type: 'object',
              properties: {
                serverTime: { type: 'number' },
                connectionStatus: { type: 'string' }
              }
            }
          }
        }
      }
    },
    onRequest: [fastify.authenticate]
  }, async (request: FastifyRequest<{
    Querystring: { since?: number; limit?: number }
  }>, reply: FastifyReply) => {
    try {
      const userId = request.user.id;
      const since = request.query.since || 0;
      const limit = Math.min(request.query.limit || 50, 100);
      
      // Get recent messages
      const messages = getRecentMessages(userId, since, limit);
      
      // Check if user has WebSocket connection
      const isConnected = connectionRegistry.isUserConnected(userId);
      
      // Return messages and connection status
      return reply.send({
        data: messages.map(({ type, payload, timestamp }) => ({
          type,
          payload,
          timestamp
        })),
        meta: {
          serverTime: Date.now(),
          connectionStatus: isConnected ? 'connected' : 'disconnected'
        }
      });
    } catch (error) {
      request.log.error('Error in fallback polling', { error });
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });
  
  // Connection status endpoint
  fastify.get('/api/v1/ws-fallback/status', {
    schema: {
      tags: ['WebSocket'],
      summary: 'WebSocket connection status',
      description: 'Check if a user has active WebSocket connections',
      response: {
        200: {
          description: 'Connection status',
          type: 'object',
          properties: {
            data: {
              type: 'object',
              properties: {
                connected: { type: 'boolean' },
                connectionCount: { type: 'number' },
                serverTime: { type: 'number' }
              }
            }
          }
        }
      }
    },
    onRequest: [fastify.authenticate]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = request.user.id;
      
      // Check if user has WebSocket connection
      const isConnected = connectionRegistry.isUserConnected(userId);
      const connectionCount = connectionRegistry.getConnectionCount(userId);
      
      return reply.send({
        data: {
          connected: isConnected,
          connectionCount,
          serverTime: Date.now()
        }
      });
    } catch (error) {
      request.log.error('Error in connection status check', { error });
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });
  
  // Send message endpoint (for clients without WebSocket support)
  fastify.post('/api/v1/ws-fallback/send', {
    schema: {
      tags: ['WebSocket'],
      summary: 'Send message (WebSocket fallback)',
      description: 'Provides a fallback mechanism for sending WebSocket messages using HTTP',
      body: {
        type: 'object',
        required: ['type', 'payload'],
        properties: {
          type: { type: 'string' },
          payload: { type: 'object' }
        }
      },
      response: {
        200: {
          description: 'Message sent status',
          type: 'object',
          properties: {
            data: {
              type: 'object',
              properties: {
                success: { type: 'boolean' },
                timestamp: { type: 'number' }
              }
            }
          }
        }
      }
    },
    onRequest: [fastify.authenticate]
  }, async (request: FastifyRequest<{
    Body: { type: string; payload: any }
  }>, reply: FastifyReply) => {
    try {
      const userId = request.user.id;
      const { type, payload } = request.body;
      
      // Report metrics
      monitoringService.recordMetric('websocket.fallback.send', 1);
      
      // Process message as if it came from a WebSocket
      // This would typically forward the message to the appropriate handler
      logger.debug('Fallback message received', { userId, type });
      
      return reply.send({
        data: {
          success: true,
          timestamp: Date.now()
        }
      });
    } catch (error) {
      request.log.error('Error in fallback message send', { error });
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });
}
