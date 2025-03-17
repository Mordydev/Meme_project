/**
 * Wallet Route Schemas
 * 
 * OpenAPI route schemas for wallet-related endpoints
 */
import { FastifyInstance } from 'fastify';

/**
 * Register schemas for wallet routes
 * @param fastify Fastify instance
 */
export function walletRouteSchemas(fastify: FastifyInstance): void {
  // POST /api/v1/wallet/connect
  fastify.addSchema({
    $id: 'connectWalletRouteSchema',
    schema: {
      summary: 'Connect wallet',
      description: 'Connect a wallet to the user account',
      tags: ['Wallet'],
      body: {
        content: {
          'application/json': {
            schema: { $ref: 'connectWallet#' },
          },
        },
      },
      response: {
        200: {
          description: 'Wallet connected successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  data: { $ref: 'walletConnection#' },
                  meta: {
                    type: 'object',
                    properties: {
                      timestamp: { type: 'string', format: 'date-time' },
                      requestId: { type: 'string' },
                    },
                  },
                },
              },
            },
          },
        },
        400: { $ref: '#/components/responses/BadRequest' },
        401: { $ref: '#/components/responses/Unauthorized' },
        409: {
          description: 'Wallet already connected',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
            },
          },
        },
      },
      security: [{ bearerAuth: [] }],
    },
  });

  // POST /api/v1/wallet/verify
  fastify.addSchema({
    $id: 'verifyWalletRouteSchema',
    schema: {
      summary: 'Verify wallet ownership',
      description: 'Verify wallet ownership through signature validation',
      tags: ['Wallet'],
      body: {
        content: {
          'application/json': {
            schema: { $ref: 'verifyWallet#' },
          },
        },
      },
      response: {
        200: {
          description: 'Wallet verification successful',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  data: { $ref: 'verifyWalletResponse#' },
                  meta: {
                    type: 'object',
                    properties: {
                      timestamp: { type: 'string', format: 'date-time' },
                      requestId: { type: 'string' },
                    },
                  },
                },
              },
            },
          },
        },
        400: { $ref: '#/components/responses/BadRequest' },
        401: { $ref: '#/components/responses/Unauthorized' },
      },
      security: [{ bearerAuth: [] }],
    },
  });

  // GET /api/v1/wallet/connect/status
  fastify.addSchema({
    $id: 'getWalletStatusSchema',
    schema: {
      summary: 'Get wallet connection status',
      description: 'Retrieves the current wallet connection status for the authenticated user',
      tags: ['Wallet'],
      response: {
        200: {
          description: 'Wallet connection status',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  data: { $ref: 'walletConnection#' },
                  meta: {
                    type: 'object',
                    properties: {
                      timestamp: { type: 'string', format: 'date-time' },
                      requestId: { type: 'string' },
                    },
                  },
                },
              },
            },
          },
        },
        401: { $ref: '#/components/responses/Unauthorized' },
        404: {
          description: 'No wallet connected',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
            },
          },
        },
      },
      security: [{ bearerAuth: [] }],
    },
  });
}
