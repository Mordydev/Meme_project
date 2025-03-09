import { FastifyInstance } from 'fastify';
import { authenticate } from '../middleware/authenticate';

/**
 * Register WebSocket-related routes
 */
export async function registerWebSocketRoutes(fastify: FastifyInstance): Promise<void> {
  /**
   * @route GET /api/websocket/health
   * @description Get WebSocket health status
   * @auth Requires authentication for detailed stats
   */
  fastify.get('/api/websocket/health', {
    schema: {
      response: {
        200: {
          type: 'object',
          properties: {
            status: { type: 'string' },
            timestamp: { type: 'string', format: 'date-time' },
            server: { type: 'string' },
            version: { type: 'string' }
          }
        }
      }
    }
  }, async (request, reply) => {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      server: request.hostname,
      version: '1.0.0'
    };
  });
  
  /**
   * @route GET /api/websocket/stats
   * @description Get WebSocket statistics
   * @auth Requires authentication with admin role
   */
  fastify.get('/api/websocket/stats', {
    onRequest: [authenticate],
    schema: {
      response: {
        200: {
          type: 'object',
          properties: {
            connections: { type: 'integer' },
            users: { type: 'integer' },
            channels: { type: 'integer' },
            timestamp: { type: 'string', format: 'date-time' }
          }
        }
      }
    }
  }, async (request, reply) => {
    // Check if user has admin role
    const isAdmin = request.user?.role === 'admin';
    
    if (!isAdmin) {
      return reply.status(403).send({
        error: {
          code: 'forbidden',
          message: 'Admin role required'
        }
      });
    }
    
    const stats = fastify.websocket.getStats();
    
    return {
      ...stats,
      timestamp: new Date().toISOString()
    };
  });
}
