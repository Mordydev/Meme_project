import { FastifyInstance } from 'fastify';
import { 
  generateChallengeHandler, 
  verifyWalletSignatureHandler,
  linkWalletHandler,
  unlinkWalletHandler
} from './handlers';
import { authMiddleware, optionalAuth } from '../clerk/middleware';
import { rateLimit } from '../../middleware/rate-limit';

// Set up wallet authentication route schemas
const walletSchemas = [
  {
    $id: 'walletChallengeSchema',
    type: 'object',
    required: ['walletAddress'],
    properties: {
      walletAddress: { type: 'string' }
    }
  },
  {
    $id: 'walletVerifySchema',
    type: 'object',
    required: ['walletAddress', 'signature', 'nonce'],
    properties: {
      walletAddress: { type: 'string' },
      signature: { type: 'string' },
      nonce: { type: 'string' }
    }
  },
  {
    $id: 'walletLinkSchema',
    type: 'object',
    required: ['walletAddress'],
    properties: {
      walletAddress: { type: 'string' }
    }
  },
  {
    $id: 'walletAddressParamSchema',
    type: 'object',
    required: ['walletAddress'],
    properties: {
      walletAddress: { type: 'string' }
    }
  }
];

/**
 * Wallet authentication routes registration
 */
export default async function routes(fastify: FastifyInstance): Promise<void> {
  // Register schemas
  for (const schema of walletSchemas) {
    fastify.addSchema(schema);
  }
  
  // Set up rate limiting
  const walletRateLimit = rateLimit({
    max: 10,
    timeWindow: '1 minute',
    errorMessage: 'Too many wallet authentication attempts, please try again later'
  });
  
  // Challenge generation - publicly accessible
  fastify.post(
    '/wallet/challenge',
    {
      schema: {
        body: { $ref: 'walletChallengeSchema' },
        response: {
          200: {
            type: 'object',
            properties: {
              data: {
                type: 'object',
                properties: {
                  message: { type: 'string' },
                  nonce: { type: 'string' }
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
        }
      },
      preHandler: [walletRateLimit]
    },
    generateChallengeHandler
  );
  
  // Signature verification - can work with or without authenticated user
  fastify.post(
    '/wallet/verify',
    {
      schema: {
        body: { $ref: 'walletVerifySchema' },
        response: {
          200: {
            type: 'object',
            properties: {
              data: {
                type: 'object',
                properties: {
                  verified: { type: 'boolean' },
                  walletAddress: { type: 'string' }
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
        }
      },
      preHandler: [optionalAuth, walletRateLimit]
    },
    verifyWalletSignatureHandler
  );
  
  // Link wallet - requires authenticated user
  fastify.post(
    '/wallet/link',
    {
      schema: {
        body: { $ref: 'walletLinkSchema' },
        response: {
          200: {
            type: 'object',
            properties: {
              data: {
                type: 'object',
                properties: {
                  linked: { type: 'boolean' },
                  walletAddress: { type: 'string' },
                  verified: { type: 'boolean' }
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
        }
      },
      preHandler: [authMiddleware(), walletRateLimit]
    },
    linkWalletHandler
  );
  
  // Unlink wallet - requires authenticated user
  fastify.delete(
    '/wallet/:walletAddress',
    {
      schema: {
        params: { $ref: 'walletAddressParamSchema' },
        response: {
          200: {
            type: 'object',
            properties: {
              data: {
                type: 'object',
                properties: {
                  unlinked: { type: 'boolean' },
                  walletAddress: { type: 'string' }
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
        }
      },
      preHandler: [authMiddleware()]
    },
    unlinkWalletHandler
  );
}
