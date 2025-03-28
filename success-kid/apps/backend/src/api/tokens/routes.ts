import { FastifyInstance } from 'fastify';
import { 
  refreshTokenHandler, 
  validateTokenHandler, 
  revokeTokenHandler 
} from './handlers';
import { rateLimit } from '../../middleware/rate-limit';

// Set up token schemas
const tokenSchemas = [
  {
    $id: 'refreshTokenSchema',
    type: 'object',
    required: ['refreshToken'],
    properties: {
      refreshToken: { type: 'string' }
    }
  },
  {
    $id: 'tokenSchema',
    type: 'object',
    required: ['token'],
    properties: {
      token: { type: 'string' }
    }
  },
  {
    $id: 'tokenResponseSchema',
    type: 'object',
    properties: {
      data: {
        type: 'object',
        properties: {
          accessToken: { type: 'string' }
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
 * Token routes registration
 */
export default async function routes(fastify: FastifyInstance): Promise<void> {
  // Register schemas
  for (const schema of tokenSchemas) {
    fastify.addSchema(schema);
  }
  
  // Set up rate limiting
  const tokenRateLimit = rateLimit({
    max: 10,
    timeWindow: '1 minute',
    errorMessage: 'Too many token operations, please try again later'
  });
  
  // Token refresh
  fastify.post(
    '/auth/refresh',
    {
      schema: {
        body: { $ref: 'refreshTokenSchema' },
        response: {
          200: { $ref: 'tokenResponseSchema' }
        }
      },
      preHandler: [tokenRateLimit]
    },
    refreshTokenHandler
  );
  
  // Token validation
  fastify.post(
    '/auth/validate',
    {
      schema: {
        body: { $ref: 'tokenSchema' }
      },
      preHandler: [tokenRateLimit]
    },
    validateTokenHandler
  );
  
  // Token revocation
  fastify.post(
    '/auth/revoke',
    {
      schema: {
        body: { $ref: 'tokenSchema' }
      }
    },
    revokeTokenHandler
  );
}
