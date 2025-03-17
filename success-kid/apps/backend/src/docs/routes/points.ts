/**
 * Points Route Schemas
 * 
 * OpenAPI route schemas for points-related endpoints
 */
import { FastifyInstance } from 'fastify';

/**
 * Register schemas for points routes
 * @param fastify Fastify instance
 */
export function pointsRouteSchemas(fastify: FastifyInstance): void {
  // GET /api/v1/points/history
  fastify.addSchema({
    $id: 'getPointsHistorySchema',
    schema: {
      summary: 'Get points transaction history',
      description: 'Retrieves the points transaction history for the authenticated user',
      tags: ['Points'],
      response: {
        200: {
          description: 'Successful response',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  data: { $ref: 'pointsHistory#' },
                  meta: {
                    type: 'object',
                    properties: {
                      timestamp: { type: 'string', format: 'date-time' },
                      requestId: { type: 'string' },
                    },
                  },
                  pagination: {
                    type: 'object',
                    properties: {
                      page: { type: 'integer' },
                      pageSize: { type: 'integer' },
                      totalItems: { type: 'integer' },
                      totalPages: { type: 'integer' },
                    },
                  },
                },
              },
            },
          },
        },
        401: { $ref: '#/components/responses/Unauthorized' },
      },
      security: [{ bearerAuth: [] }],
    },
  });

  // GET /api/v1/points/balance
  fastify.addSchema({
    $id: 'getPointsBalanceSchema',
    schema: {
      summary: 'Get points balance',
      description: 'Retrieves the current points balance for the authenticated user',
      tags: ['Points'],
      response: {
        200: {
          description: 'Successful response',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  data: { $ref: 'pointsBalance#' },
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
      },
      security: [{ bearerAuth: [] }],
    },
  });

  // POST /api/v1/points/award
  fastify.addSchema({
    $id: 'awardPointsSchema',
    schema: {
      summary: 'Award points to a user',
      description: 'Awards points to a user for a specific activity',
      tags: ['Points'],
      body: {
        content: {
          'application/json': {
            schema: { $ref: 'awardPoints#' },
          },
        },
      },
      response: {
        200: {
          description: 'Points awarded successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  data: { $ref: 'awardPointsResponse#' },
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
        403: { $ref: '#/components/responses/Forbidden' },
      },
      security: [{ bearerAuth: [] }],
    },
  });

  // POST /api/v1/points/redeem
  fastify.addSchema({
    $id: 'redeemPointsSchema',
    schema: {
      summary: 'Redeem points for tokens',
      description: 'Converts Success Points to SKC tokens',
      tags: ['Points'],
      body: {
        content: {
          'application/json': {
            schema: { $ref: 'redeemPoints#' },
          },
        },
      },
      response: {
        200: {
          description: 'Points redeemed successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  data: { $ref: 'redeemPointsResponse#' },
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
        403: { $ref: '#/components/responses/Forbidden' },
      },
      security: [{ bearerAuth: [] }],
    },
  });
}
