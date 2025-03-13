import { FastifyRequest } from 'fastify';
import { WebSocket } from 'ws';
import { logger } from '../lib/logger';

/**
 * Parse and process incoming WebSocket messages
 * @param socket WebSocket connection
 * @param userId User identifier (null if not authenticated)
 * @param message Raw message from client
 */
export function processMessage(socket: WebSocket, userId: string | null, message: string) {
  try {
    const parsedMessage = JSON.parse(message);
    
    // Handle different message types
    switch (parsedMessage.type) {
      case 'ping':
        // Simple ping-pong for connection health checks
        socket.send(JSON.stringify({ type: 'pong' }));
        break;
        
      case 'subscribe':
        // Handle channel subscription for targeted updates
        if (parsedMessage.channels && Array.isArray(parsedMessage.channels)) {
          logger.info(`User ${userId} subscribing to channels:`, parsedMessage.channels);
          // In a real implementation, this would register subscriptions to specific channels
          socket.send(JSON.stringify({
            type: 'subscribe:confirmation',
            data: {
              channels: parsedMessage.channels,
              timestamp: new Date().toISOString()
            }
          }));
        }
        break;
        
      default:
        logger.warn(`Unknown message type: ${parsedMessage.type}`);
        socket.send(JSON.stringify({
          type: 'error',
          data: {
            message: 'Unknown message type',
            code: 'UNKNOWN_MESSAGE_TYPE'
          }
        }));
    }
  } catch (error) {
    logger.error('Error processing WebSocket message', error);
    socket.send(JSON.stringify({
      type: 'error',
      data: { 
        message: 'Invalid message format',
        code: 'INVALID_FORMAT' 
      }
    }));
  }
}

/**
 * Authenticate a WebSocket connection from the request
 * @param request Fastify request object
 * @returns User ID if authenticated, null otherwise
 */
export function authenticateConnection(request: FastifyRequest): string | null {
  // In production, this would verify a token from the request
  // and extract the user ID from it
  
  if (request.headers.authorization) {
    try {
      // This is a simplified example - in production would verify JWT token
      const token = request.headers.authorization.replace('Bearer ', '');
      
      // Mock user extraction - in production would decode JWT
      if (token && token !== 'invalid') {
        // Simplified user extraction from token for demonstration
        return token.includes('user_') ? token : `user_${Math.floor(Math.random() * 1000)}`;
      }
    } catch (error) {
      logger.error('WebSocket authentication error', error);
    }
  }

  // No valid authentication
  return null;
}