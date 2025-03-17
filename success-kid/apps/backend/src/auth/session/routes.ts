import { FastifyInstance } from 'fastify';
import { 
  getUserSessionsHandler, 
  revokeSessionHandler, 
  revokeAllSessionsHandler,
  checkSessionHandler
} from './handlers';
import { authMiddleware } from '../clerk/middleware';
import { authAuditMiddleware } from '../security/middleware';
import { AuthEvent } from '../security/audit-service';

// Set up session schemas
const sessionSchemas = [
  {
    $id: 'sessionIdParamSchema',
    type: 'object',
    required: ['sessionId'],
    properties: {
      sessionId: { type: 'string' }
    }
  },
  {
    $id: 'sessionsResponseSchema',
    type: 'object',
    properties: {
      data: {
        type: 'object',
        properties: {
          sessions: { 
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                userId: { type: 'string' },
                device: { 
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    type: { type: ['string', 'null'] },
                    os: { type: ['string', 'null'] },
                    browser: { type: ['string', 'null'] },
                    ip: { type: ['string', 'null'] },
                    location: { type: ['string', 'null'] }
                  }
                },
                createdAt: { type: 'string' },
                lastActiveAt: { type: 'string' },
                expiresAt: { type: 'string' },
                isActive: { type: 'boolean' },
                isCurrent: { type: 'boolean' }
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
  },
  {
    $id: 'sessionActionResponseSchema',
    type: 'object',
    properties: {
      data: {
        type: 'object',
        properties: {
          revoked: { type: 'boolean' }
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
  },
  {
    $id: 'sessionStatusResponseSchema',
    type: 'object',
    properties: {
      data: {
        type: 'object',
        properties: {
          active: { type: 'boolean' }
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
 * Session routes registration
 */
export default async function routes(fastify: FastifyInstance): Promise<void> {
  // Register schemas
  for (const schema of sessionSchemas) {
    fastify.addSchema(schema);
  }
  
  // Get user's active sessions
  fastify.get(
    '/auth/sessions',
    {
      schema: {
        response: {
          200: { $ref: 'sessionsResponseSchema' }
        }
      },
      preHandler: [
        authMiddleware(),
        authAuditMiddleware(AuthEvent.TOKEN_VALIDATION)
      ]
    },
    getUserSessionsHandler
  );
  
  // Revoke a specific session
  fastify.delete(
    '/auth/sessions/:sessionId',
    {
      schema: {
        params: { $ref: 'sessionIdParamSchema' },
        response: {
          200: { $ref: 'sessionActionResponseSchema' }
        }
      },
      preHandler: [
        authMiddleware(),
        authAuditMiddleware(AuthEvent.TOKEN_REVOCATION)
      ]
    },
    revokeSessionHandler
  );
  
  // Revoke all sessions except current
  fastify.delete(
    '/auth/sessions',
    {
      schema: {
        response: {
          200: { $ref: 'sessionActionResponseSchema' }
        }
      },
      preHandler: [
        authMiddleware(),
        authAuditMiddleware(AuthEvent.TOKEN_REVOCATION)
      ]
    },
    revokeAllSessionsHandler
  );
  
  // Check session status
  fastify.get(
    '/auth/session/status',
    {
      schema: {
        response: {
          200: { $ref: 'sessionStatusResponseSchema' }
        }
      }
    },
    checkSessionHandler
  );
}
