import { FastifyInstance } from 'fastify';
import { LeaderboardService } from '../../services/leaderboard-service';
import { LeaderboardCategory, LeaderboardPeriod } from '../../models/leaderboard';
import { authenticate } from '../../middleware/auth';

/**
 * Leaderboard routes
 */
export default async function (fastify: FastifyInstance) {
  const { leaderboardService } = fastify.services;

  /**
   * Get leaderboard for a specific category and period
   */
  fastify.get(
    '/api/leaderboard/:category',
    {
      schema: {
        params: {
          type: 'object',
          required: ['category'],
          properties: {
            category: { type: 'string', enum: Object.values(LeaderboardCategory) },
          },
        },
        querystring: {
          type: 'object',
          properties: {
            period: { type: 'string', enum: Object.values(LeaderboardPeriod), default: LeaderboardPeriod.ALL_TIME },
            limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
            offset: { type: 'integer', minimum: 0, default: 0 },
            includeUserRank: { type: 'boolean', default: false },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              data: {
                type: 'object',
                properties: {
                  entries: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        userId: { type: 'string' },
                        username: { type: 'string' },
                        displayName: { type: 'string' },
                        avatarUrl: { type: ['string', 'null'] },
                        score: { type: 'number' },
                        rank: { type: 'number' },
                      },
                    },
                  },
                  total: { type: 'number' },
                  userRank: {
                    type: ['object', 'null'],
                    properties: {
                      rank: { type: 'number' },
                      score: { type: 'number' },
                    },
                  },
                  period: { type: 'string' },
                  category: { type: 'string' },
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
      const { category } = request.params as { category: LeaderboardCategory };
      const { period, limit, offset, includeUserRank } = request.query as {
        period: LeaderboardPeriod;
        limit: number;
        offset: number;
        includeUserRank: boolean;
      };
      
      // Get user ID if authenticated and includeUserRank is true
      let userId: string | undefined;
      if (includeUserRank && request.headers.authorization) {
        try {
          const auth = await fastify.authenticate(request);
          userId = auth.userId;
        } catch (error) {
          // If authentication fails, just don't include user rank
          fastify.log.warn(
            { error },
            'Failed to authenticate for user rank in leaderboard'
          );
        }
      }
      
      const leaderboard = await leaderboardService.getLeaderboard(category, {
        period,
        limit,
        offset,
        userId,
      });
      
      return {
        data: leaderboard,
        meta: {
          requestId: request.id,
          timestamp: new Date().toISOString(),
        },
      };
    }
  );

  /**
   * Get current user's rank in a leaderboard
   */
  fastify.get(
    '/api/leaderboard/:category/me',
    {
      schema: {
        params: {
          type: 'object',
          required: ['category'],
          properties: {
            category: { type: 'string', enum: Object.values(LeaderboardCategory) },
          },
        },
        querystring: {
          type: 'object',
          properties: {
            period: { type: 'string', enum: Object.values(LeaderboardPeriod), default: LeaderboardPeriod.ALL_TIME },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              data: {
                type: ['object', 'null'],
                properties: {
                  rank: { type: 'number' },
                  score: { type: 'number' },
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
      const { category } = request.params as { category: LeaderboardCategory };
      const { period } = request.query as { period: LeaderboardPeriod };
      
      const userRank = await leaderboardService.getUserRank(
        request.userId,
        category,
        period
      );
      
      return {
        data: userRank,
        meta: {
          requestId: request.id,
          timestamp: new Date().toISOString(),
        },
      };
    }
  );

  /**
   * Get rank for a specific user in a leaderboard
   */
  fastify.get(
    '/api/leaderboard/:category/users/:userId',
    {
      schema: {
        params: {
          type: 'object',
          required: ['category', 'userId'],
          properties: {
            category: { type: 'string', enum: Object.values(LeaderboardCategory) },
            userId: { type: 'string' },
          },
        },
        querystring: {
          type: 'object',
          properties: {
            period: { type: 'string', enum: Object.values(LeaderboardPeriod), default: LeaderboardPeriod.ALL_TIME },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              data: {
                type: ['object', 'null'],
                properties: {
                  rank: { type: 'number' },
                  score: { type: 'number' },
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
      const { category, userId } = request.params as {
        category: LeaderboardCategory;
        userId: string;
      };
      const { period } = request.query as { period: LeaderboardPeriod };
      
      const userRank = await leaderboardService.getUserRank(
        userId,
        category,
        period
      );
      
      return {
        data: userRank,
        meta: {
          requestId: request.id,
          timestamp: new Date().toISOString(),
        },
      };
    }
  );
}
