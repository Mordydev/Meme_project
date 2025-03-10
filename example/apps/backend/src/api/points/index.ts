import { FastifyInstance } from 'fastify';
import { PointsService } from '../../services/points-service';
import { PointsSource } from '../../models/points';
import { authenticate } from '../../middleware/auth';

/**
 * Points routes
 */
export default async function (fastify: FastifyInstance) {
  const { pointsService } = fastify.services;

  /**
   * Get current user's points balance
   */
  fastify.get(
    '/api/points/balance',
    {
      schema: {
        response: {
          200: {
            type: 'object',
            properties: {
              data: {
                type: 'object',
                properties: {
                  userId: { type: 'string' },
                  totalPoints: { type: 'number' },
                  level: { type: 'number' },
                  lastUpdated: { type: 'string' },
                },
              },
              meta: {
                type: 'object',
                properties: {
                  requestId: { type: 'string' },
                  timestamp: { type: 'string' },
                },
              },
            },
          },
        },
      },
      preHandler: [authenticate],
    },
    async (request, reply) => {
      const pointsBalance = await pointsService.getUserPointsBalance(request.userId);
      
      return {
        data: pointsBalance,
        meta: {
          requestId: request.id,
          timestamp: new Date().toISOString(),
        },
      };
    }
  );

  /**
   * Get user's points transactions
   */
  fastify.get(
    '/api/points/transactions',
    {
      schema: {
        querystring: {
          type: 'object',
          properties: {
            limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
            offset: { type: 'integer', minimum: 0, default: 0 },
            source: { type: 'string', enum: [...Object.values(PointsSource)] },
            startDate: { type: 'string', format: 'date-time' },
            endDate: { type: 'string', format: 'date-time' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              data: {
                type: 'object',
                properties: {
                  transactions: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        id: { type: 'string' },
                        userId: { type: 'string' },
                        amount: { type: 'number' },
                        source: { type: 'string' },
                        detail: { type: ['string', 'null'] },
                        multiplier: { type: 'number' },
                        referenceId: { type: ['string', 'null'] },
                        referenceType: { type: ['string', 'null'] },
                        createdAt: { type: 'string' },
                      },
                    },
                  },
                  total: { type: 'number' },
                },
              },
              meta: {
                type: 'object',
                properties: {
                  requestId: { type: 'string' },
                  timestamp: { type: 'string' },
                },
              },
            },
          },
        },
      },
      preHandler: [authenticate],
    },
    async (request, reply) => {
      const { limit, offset, source, startDate, endDate } = request.query as {
        limit: number;
        offset: number;
        source?: PointsSource;
        startDate?: string;
        endDate?: string;
      };
      
      const options: any = { limit, offset };
      
      if (source) {
        options.source = source;
      }
      
      if (startDate) {
        options.startDate = new Date(startDate);
      }
      
      if (endDate) {
        options.endDate = new Date(endDate);
      }
      
      const transactions = await pointsService.getUserTransactions(
        request.userId,
        options
      );
      
      return {
        data: transactions,
        meta: {
          requestId: request.id,
          timestamp: new Date().toISOString(),
        },
      };
    }
  );

  /**
   * Award points to a user (admin only)
   */
  fastify.post(
    '/api/admin/points/award',
    {
      schema: {
        body: {
          type: 'object',
          required: ['userId', 'amount', 'source'],
          properties: {
            userId: { type: 'string' },
            amount: { type: 'number', minimum: 1 },
            source: { type: 'string', enum: [...Object.values(PointsSource)] },
            detail: { type: 'string' },
            multiplier: { type: 'number', minimum: 1 },
            referenceId: { type: 'string' },
            referenceType: { type: 'string' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              data: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  userId: { type: 'string' },
                  amount: { type: 'number' },
                  source: { type: 'string' },
                  detail: { type: ['string', 'null'] },
                  multiplier: { type: 'number' },
                  referenceId: { type: ['string', 'null'] },
                  referenceType: { type: ['string', 'null'] },
                  createdAt: { type: 'string' },
                },
              },
              meta: {
                type: 'object',
                properties: {
                  requestId: { type: 'string' },
                  timestamp: { type: 'string' },
                },
              },
            },
          },
        },
      },
      preHandler: [authenticate, async (request, reply) => {
        // Check if user is an admin
        const { userId } = request;
        const isAdmin = await fastify.services.userService.isUserAdmin(userId);
        
        if (!isAdmin) {
          return reply.code(403).send({
            error: {
              code: 'forbidden',
              message: 'Admin access required',
            },
            meta: {
              requestId: request.id,
              timestamp: new Date().toISOString(),
            },
          });
        }
      }],
    },
    async (request, reply) => {
      const { userId, amount, source, detail, multiplier, referenceId, referenceType } = 
        request.body as {
          userId: string;
          amount: number;
          source: PointsSource;
          detail?: string;
          multiplier?: number;
          referenceId?: string;
          referenceType?: string;
        };
      
      const transaction = await pointsService.awardPoints(
        userId,
        amount,
        source,
        {
          detail,
          multiplier,
          referenceId,
          referenceType,
        }
      );
      
      return {
        data: transaction,
        meta: {
          requestId: request.id,
          timestamp: new Date().toISOString(),
        },
      };
    }
  );

  /**
   * Get another user's points balance (public)
   */
  fastify.get(
    '/api/users/:userId/points',
    {
      schema: {
        params: {
          type: 'object',
          required: ['userId'],
          properties: {
            userId: { type: 'string' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              data: {
                type: 'object',
                properties: {
                  userId: { type: 'string' },
                  totalPoints: { type: 'number' },
                  level: { type: 'number' },
                  lastUpdated: { type: 'string' },
                },
              },
              meta: {
                type: 'object',
                properties: {
                  requestId: { type: 'string' },
                  timestamp: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const { userId } = request.params as { userId: string };
      const pointsBalance = await pointsService.getUserPointsBalance(userId);
      
      return {
        data: pointsBalance,
        meta: {
          requestId: request.id,
          timestamp: new Date().toISOString(),
        },
      };
    }
  );
}
