import { Server } from 'http';
import { FastifyInstance } from 'fastify';
import { WebSocketService } from './websocket-service';

/**
 * Initialize WebSocket server
 */
export function initializeWebSockets(
  httpServer: Server, 
  fastify: FastifyInstance
): WebSocketService {
  // Create WebSocket service
  const webSocketService = new WebSocketService(
    httpServer,
    fastify,
    fastify.services.eventEmitter,
    fastify.log
  );
  
  // Add to fastify instance for use in other parts of the app
  fastify.decorate('websocket', webSocketService);
  
  return webSocketService;
}
