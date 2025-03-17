import { FastifyInstance } from 'fastify';
import { 
  getUserIdentitiesHandler, 
  unlinkIdentityHandler, 
  getPrimaryIdentityHandler 
} from './handlers';
import { authMiddleware } from '../clerk/middleware';
import { AuthProvider } from './service';

// Set up provider schemas
const providerSchemas = [
  {
    $id: 'providerSchema',
    type: 'object',
    required: ['provider'],
    properties: {
      provider: { 
        type: 'string',
        enum: Object.values(AuthProvider)
      }
    }
  },
  {
    $id: 'userIdParamSchema',
    type: 'object',
    required: ['userId'],
    properties: {
      userId: { type: 'string' }
    }
  },
  {
    $id: 'identitiesResponseSchema',
    type: 'object',
    properties: {
      data: {
        type: 'object',
        properties: {
          identities: { 
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                email: { type: ['string', 'null'] },
                username: { type: ['string', 'null'] },
                displayName: { type: ['string', 'null'] },
                firstName: { type: ['string', 'null'] },
                lastName: { type: ['string', 'null'] },
                profileImageUrl: { type: ['string', 'null'] },
                provider: { type: 'string' },
                providerUserId: { type: ['string', 'null'] },
                emailVerified: { type: 'boolean' }
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
    $id: 'identityResponseSchema',
    type: 'object',
    properties: {
      data: {
        type: 'object',
        properties: {
          identity: { 
            type: 'object',
            properties: {
              id: { type: 'string' },
              email: { type: ['string', 'null'] },
              username: { type: ['string', 'null'] },
              displayName: { type: ['string', 'null'] },
              firstName: { type: ['string', 'null'] },
              lastName: { type: ['string', 'null'] },
              profileImageUrl: { type: ['string', 'null'] },
              provider: { type: 'string' },
              providerUserId: { type: ['string', 'null'] },
              emailVerified: { type: 'boolean' }
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
 * Provider routes registration
 */
export default async function routes(fastify: FastifyInstance): Promise<void> {
  // Register schemas
  for (const schema of providerSchemas) {
    fastify.addSchema(schema);
  }
  
  // Get current user's linked identities
  fastify.get(
    '/auth/identities',
    {
      schema: {
        response: {
          200: { $ref: 'identitiesResponseSchema' }
        }
      },
      preHandler: [authMiddleware()]
    },
    getUserIdentitiesHandler
  );
  
  // Get primary identity for a user
  fastify.get(
    '/auth/identities/:userId/primary',
    {
      schema: {
        params: { $ref: 'userIdParamSchema' },
        response: {
          200: { $ref: 'identityResponseSchema' }
        }
      },
      preHandler: [authMiddleware()]
    },
    getPrimaryIdentityHandler
  );
  
  // Unlink an identity provider
  fastify.delete(
    '/auth/identities',
    {
      schema: {
        body: { $ref: 'providerSchema' }
      },
      preHandler: [authMiddleware()]
    },
    unlinkIdentityHandler
  );
}
