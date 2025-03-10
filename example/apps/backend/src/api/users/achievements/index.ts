import { FastifyInstance } from 'fastify';
import { authenticate } from '../../../middleware/auth';
import { AchievementService } from '../../../services/achievement-service';

/**
 * User achievement routes
 */
export default async function (fastify: FastifyInstance) {
  const achievementService = new AchievementService(fastify);

  /**
   * Get all achievements
   */
  fastify.get(
    '/api/achievements',
    {
      schema: {
        response: {
          200: {
            type: 'object',
            properties: {
              data: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    title: { type: 'string' },
                    description: { type: 'string' },
                    category: { type: 'string' },
                    tier: { type: 'string' },
                    icon: { type: 'string' },
                    pointsReward: { type: 'number' },
                    criteria: { type: 'string' },
                    createdAt: { type: 'string' },
                    updatedAt: { type: 'string' },
                  },
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
      const achievements = await achievementService.getAllAchievements();
      
      return {
        data: achievements,
        meta: {
          requestId: request.id,
          timestamp: new Date().toISOString(),
        },
      };
    }
  );

  /**
   * Get achievements by category
   */
  fastify.get(
    '/api/achievements/category/:category',
    {
      schema: {
        params: {
          type: 'object',
          required: ['category'],
          properties: {
            category: { type: 'string' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              data: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    title: { type: 'string' },
                    description: { type: 'string' },
                    category: { type: 'string' },
                    tier: { type: 'string' },
                    icon: { type: 'string' },
                    pointsReward: { type: 'number' },
                    criteria: { type: 'string' },
                    createdAt: { type: 'string' },
                    updatedAt: { type: 'string' },
                  },
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
      const { category } = request.params as { category: string };
      const achievements = await achievementService.getAchievementsByCategory(category);
      
      return {
        data: achievements,
        meta: {
          requestId: request.id,
          timestamp: new Date().toISOString(),
        },
      };
    }
  );

  /**
   * Get achievements for current user
   */
  fastify.get(
    '/api/users/achievements',
    {
      schema: {
        response: {
          200: {
            type: 'object',
            properties: {
              data: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    userId: { type: 'string' },
                    achievementId: { type: 'string' },
                    progress: { type: 'number' },
                    unlockedAt: { type: ['string', 'null'] },
                    createdAt: { type: 'string' },
                    updatedAt: { type: 'string' },
                    achievement: {
                      type: 'object',
                      properties: {
                        id: { type: 'string' },
                        title: { type: 'string' },
                        description: { type: 'string' },
                        category: { type: 'string' },
                        tier: { type: 'string' },
                        icon: { type: 'string' },
                        pointsReward: { type: 'number' },
                        criteria: { type: 'string' },
                      },
                    },
                  },
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
      const userAchievements = await achievementService.getUserAchievements(request.userId);
      
      return {
        data: userAchievements,
        meta: {
          requestId: request.id,
          timestamp: new Date().toISOString(),
        },
      };
    }
  );

  /**
   * Get achievements for a specific user
   */
  fastify.get(
    '/api/users/:userId/achievements',
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
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    userId: { type: 'string' },
                    achievementId: { type: 'string' },
                    progress: { type: 'number' },
                    unlockedAt: { type: ['string', 'null'] },
                    createdAt: { type: 'string' },
                    updatedAt: { type: 'string' },
                    achievement: {
                      type: 'object',
                      properties: {
                        id: { type: 'string' },
                        title: { type: 'string' },
                        description: { type: 'string' },
                        category: { type: 'string' },
                        tier: { type: 'string' },
                        icon: { type: 'string' },
                        pointsReward: { type: 'number' },
                        criteria: { type: 'string' },
                      },
                    },
                  },
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
      const userAchievements = await achievementService.getUserAchievements(userId);
      
      return {
        data: userAchievements,
        meta: {
          requestId: request.id,
          timestamp: new Date().toISOString(),
        },
      };
    }
  );

  /**
   * Update achievement progress (admin/system only)
   */
  fastify.post(
    '/api/users/achievements/:achievementId/progress',
    {
      schema: {
        params: {
          type: 'object',
          required: ['achievementId'],
          properties: {
            achievementId: { type: 'string' },
          },
        },
        body: {
          type: 'object',
          required: ['progress'],
          properties: {
            progress: { type: 'number' },
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
                  achievementId: { type: 'string' },
                  progress: { type: 'number' },
                  unlockedAt: { type: ['string', 'null'] },
                  updated: { type: 'boolean' },
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
      const { achievementId } = request.params as { achievementId: string };
      const { progress } = request.body as { progress: number };
      
      const updatedAchievement = await achievementService.updateAchievementProgress(
        request.userId,
        achievementId,
        progress
      );
      
      return {
        data: {
          ...updatedAchievement,
          updated: true,
        },
        meta: {
          requestId: request.id,
          timestamp: new Date().toISOString(),
        },
      };
    }
  );
}
