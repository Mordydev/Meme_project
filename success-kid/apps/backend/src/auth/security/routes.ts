import { FastifyInstance } from 'fastify';
import { 
  getUserAuthHistoryHandler, 
  getSuspiciousActivityHandler 
} from './handlers';
import { authMiddleware, requiresAdmin } from '../clerk/middleware';

// Set up security schemas
const securitySchemas = [
  {
    $id: 'userIdParamSchema',
    type: 'object',
    required: ['userId'],
    properties: {
      userId: { type: 'string' }
    }
  },
  {
    $id: 'limitQuerySchema',
    type: 'object',
    properties: {
      limit: { type: 'integer', minimum: 1, maximum: 100 }
    }
  },
  {
    $id: 'eventsResponseSchema',
    type: 'object',
    properties: {
      data: {
        type: 'object',
        properties: {
          events: { 
            type: 'array',
            items: {
              type: 'object',
              properties: {
                event: { type: 'string' },
                timestamp: { type: 'string' },
                userId: { type: ['string', 'null'] },
                ip: { type: ['string', 'null'] },
                userAgent: { type: ['string', 'null'] },
                requestId: { type: ['string', 'null'] },
                data: { type: 'object' }
              }
            }
          }
        }
      },
      meta: {
        type: 'object',
        properties: {
          timestamp: { type: 'string' },
          requestId: { type: 'string' }
        }
      }
    }
  }
];

/**
 * Security routes registration
 */
export default async function routes(fastify: FastifyInstance): Promise<void> {
  // Register schemas
  for (const schema of securitySchemas) {
    fastify.addSchema(schema);
  }
  
  // User auth history
  fastify.get(
    '/auth/history/:userId',
    {
      schema: {
        params: { $ref: 'userIdParamSchema' },
        querystring: { $ref: 'limitQuerySchema' },
        response: {
          200: { $ref: 'eventsResponseSchema' }
        }
      },
      preHandler: [authMiddleware()]
    },
    getUserAuthHistoryHandler
  );
  
  // Suspicious activity (admin only)
  fastify.get(
    '/admin/security/suspicious',
    {
      schema: {
        querystring: { $ref: 'limitQuerySchema' },
        response: {
          200: { $ref: 'eventsResponseSchema' }
        }
      },
      preHandler: [requiresAdmin]
    },
    getSuspiciousActivityHandler
  );
}
