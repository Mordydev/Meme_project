/**
 * Achievement API Routes
 * 
 * API endpoints for achievements, including listing, user progress, and unlocking.
 */
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { handleApiError } from '../../errors';

/**
 * Request parameters with achievement ID
 */
interface AchievementParams {
  id: string;
}

/**
 * Request parameters with user ID
 */
interface UserParams {
  userId: string;
}

/**
 * Request query parameters for achievement filtering
 */
interface AchievementQueryParams {
  category?: string;
  difficulty?: string;
  is_public?: boolean;
  search?: string;
}

/**
 * Achievement routes
 */
export default async function achievementRoutes(fastify: FastifyInstance) {
  /**
   * @openapi
   * /api/v1/achievements:
   *   get:
   *     summary: Get all achievements
   *     description: Retrieves all achievements with optional filtering
   *     tags: [Achievements]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: category
   *         schema:
   *           type: string
   *           enum: [content, community, points, profile, wallet, streak, referral, special, hidden]
   *         description: Filter by achievement category
   *       - in: query
   *         name: difficulty
   *         schema:
   *           type: string
   *           enum: [common, uncommon, rare, epic, legendary]
   *         description: Filter by achievement difficulty
   *       - in: query
   *         name: is_public
   *         schema:
   *           type: boolean
   *         description: Filter public/hidden achievements
   *       - in: query
   *         name: search
   *         schema:
   *           type: string
   *         description: Search term for achievement name/description
   *     responses:
   *       200:
   *         description: List of achievements
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   type: array
   *                   items:
   *                     type: object
   *                     properties:
   *                       id:
   *                         type: string
   *                       name:
   *                         type: string
   *                       description:
   *                         type: string
   *                       image_url:
   *                         type: string
   *                       points_reward:
   *                         type: integer
   *                       difficulty:
   *                         type: string
   *                       category:
   *                         type: string
   *                       is_public:
   *                         type: boolean
   *                 meta:
   *                   type: object
   *                   properties:
   *                     timestamp:
   *                       type: string
   *                       format: date-time
   *       401:
   *         description: Unauthorized
   */
  fastify.get<{ Querystring: AchievementQueryParams }>(
    '/',
    {
      schema: {
        querystring: {
          type: 'object',
          properties: {
            category: { type: 'string' },
            difficulty: { type: 'string' },
            is_public: { type: 'boolean' },
            search: { type: 'string' }
          }
        }
      }
    },
    async (request: FastifyRequest<{ Querystring: AchievementQueryParams }>, reply: FastifyReply) => {
      try {
        const { category, difficulty, is_public, search } = request.query;
        
        const filter = {
          ...(category ? { category } : {}),
          ...(difficulty ? { difficulty } : {}),
          ...(is_public !== undefined ? { is_public } : {}),
          ...(search ? { search } : {})
        };
        
        const achievements = await fastify.achievements.achievementService.getAchievements(
          Object.keys(filter).length > 0 ? filter : undefined
        );
        
        // Filter out hidden achievements for non-admin users
        // This would be enhanced with proper authorization logic
        const isAdmin = false; // Placeholder for actual admin check
        
        const filteredAchievements = isAdmin 
          ? achievements 
          : achievements.filter(a => a.is_public);
        
        return reply.code(200).send({
          data: filteredAchievements,
          meta: {
            timestamp: new Date().toISOString()
          }
        });
      } catch (error) {
        return handleApiError(request, reply, error);
      }
    }
  );

  /**
   * @openapi
   * /api/v1/achievements/{id}:
   *   get:
   *     summary: Get achievement by ID
   *     description: Retrieves a specific achievement by ID
   *     tags: [Achievements]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Achievement ID
   *     responses:
   *       200:
   *         description: Achievement details
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   type: object
   *                   properties:
   *                     id:
   *                       type: string
   *                     name:
   *                       type: string
   *                     description:
   *                       type: string
   *                     image_url:
   *                       type: string
   *                     points_reward:
   *                       type: integer
   *                     difficulty:
   *                       type: string
   *                     category:
   *                       type: string
   *                     is_public:
   *                       type: boolean
   *                 meta:
   *                   type: object
   *                   properties:
   *                     timestamp:
   *                       type: string
   *                       format: date-time
   *       404:
   *         description: Achievement not found
   *       401:
   *         description: Unauthorized
   */
  fastify.get<{ Params: AchievementParams }>(
    '/:id',
    {
      schema: {
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string' }
          }
        }
      }
    },
    async (request: FastifyRequest<{ Params: AchievementParams }>, reply: FastifyReply) => {
      try {
        const { id } = request.params;
        
        const achievement = await fastify.achievements.achievementService.getAchievementById(id);
        
        if (!achievement) {
          return reply.code(404).send({
            data: null,
            meta: { timestamp: new Date().toISOString() },
            errors: [{ code: 'RESOURCE_NOT_FOUND', message: 'Achievement not found' }]
          });
        }
        
        // Check if hidden achievement and not admin
        // This would be enhanced with proper authorization logic
        const isAdmin = false; // Placeholder for actual admin check
        
        if (!achievement.is_public && !isAdmin) {
          return reply.code(404).send({
            data: null,
            meta: { timestamp: new Date().toISOString() },
            errors: [{ code: 'RESOURCE_NOT_FOUND', message: 'Achievement not found' }]
          });
        }
        
        return reply.code(200).send({
          data: achievement,
          meta: {
            timestamp: new Date().toISOString()
          }
        });
      } catch (error) {
        return handleApiError(request, reply, error);
      }
    }
  );

  /**
   * @openapi
   * /api/v1/achievements/user:
   *   get:
   *     summary: Get current user's achievements
   *     description: Retrieves achievements for the authenticated user
   *     tags: [Achievements]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: User's achievements
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   type: array
   *                   items:
   *                     type: object
   *                     properties:
   *                       achievement:
   *                         type: object
   *                       unlocked_at:
   *                         type: string
   *                         format: date-time
   *                       progress:
   *                         type: object
   *                 meta:
   *                   type: object
   *                   properties:
   *                     timestamp:
   *                       type: string
   *                       format: date-time
   *       401:
   *         description: Unauthorized
   */
  fastify.get(
    '/user',
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const userId = request.user?.id;
        if (!userId) {
          return reply.code(401).send({
            data: null,
            meta: { timestamp: new Date().toISOString() },
            errors: [{ code: 'UNAUTHORIZED', message: 'Authentication required' }]
          });
        }
        
        const achievements = await fastify.achievements.achievementService.getUserAchievements(userId, true);
        
        return reply.code(200).send({
          data: achievements,
          meta: {
            timestamp: new Date().toISOString()
          }
        });
      } catch (error) {
        return handleApiError(request, reply, error);
      }
    }
  );

  /**
   * @openapi
   * /api/v1/achievements/user/{userId}:
   *   get:
   *     summary: Get user's achievements by user ID
   *     description: Retrieves achievements for a specific user
   *     tags: [Achievements]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: userId
   *         required: true
   *         schema:
   *           type: string
   *         description: User ID
   *     responses:
   *       200:
   *         description: User's achievements
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   type: array
   *                   items:
   *                     type: object
   *                     properties:
   *                       achievement:
   *                         type: object
   *                       unlocked_at:
   *                         type: string
   *                         format: date-time
   *                 meta:
   *                   type: object
   *                   properties:
   *                     timestamp:
   *                       type: string
   *                       format: date-time
   *       401:
   *         description: Unauthorized
   */
  fastify.get<{ Params: UserParams }>(
    '/user/:userId',
    {
      schema: {
        params: {
          type: 'object',
          required: ['userId'],
          properties: {
            userId: { type: 'string' }
          }
        }
      }
    },
    async (request: FastifyRequest<{ Params: UserParams }>, reply: FastifyReply) => {
      try {
        const { userId } = request.params;
        
        // Get unlocked achievements only (no progress for other users)
        const achievements = await fastify.achievements.achievementService.getUserAchievements(userId, false);
        
        // Only include unlocked achievements
        const unlockedAchievements = achievements.filter(a => a.unlocked_at);
        
        return reply.code(200).send({
          data: unlockedAchievements,
          meta: {
            timestamp: new Date().toISOString()
          }
        });
      } catch (error) {
        return handleApiError(request, reply, error);
      }
    }
  );

  /**
   * @openapi
   * /api/v1/achievements/{id}/progress:
   *   get:
   *     summary: Get achievement progress
   *     description: Retrieves current user's progress for a specific achievement
   *     tags: [Achievements]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Achievement ID
   *     responses:
   *       200:
   *         description: Achievement progress
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   type: object
   *                   properties:
   *                     currentValue:
   *                       type: number
   *                     targetValue:
   *                       type: number
   *                     percentComplete:
   *                       type: number
   *                     isComplete:
   *                       type: boolean
   *                 meta:
   *                   type: object
   *                   properties:
   *                     timestamp:
   *                       type: string
   *                       format: date-time
   *       401:
   *         description: Unauthorized
   *       404:
   *         description: Achievement not found
   */
  fastify.get<{ Params: AchievementParams }>(
    '/:id/progress',
    {
      schema: {
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string' }
          }
        }
      }
    },
    async (request: FastifyRequest<{ Params: AchievementParams }>, reply: FastifyReply) => {
      try {
        const userId = request.user?.id;
        if (!userId) {
          return reply.code(401).send({
            data: null,
            meta: { timestamp: new Date().toISOString() },
            errors: [{ code: 'UNAUTHORIZED', message: 'Authentication required' }]
          });
        }
        
        const { id } = request.params;
        
        // Check if achievement exists
        const achievement = await fastify.achievements.achievementService.getAchievementById(id);
        if (!achievement) {
          return reply.code(404).send({
            data: null,
            meta: { timestamp: new Date().toISOString() },
            errors: [{ code: 'RESOURCE_NOT_FOUND', message: 'Achievement not found' }]
          });
        }
        
        // Get progress
        const progress = await fastify.achievements.achievementService.getAchievementProgress(userId, id);
        
        if (!progress) {
          // No progress yet, return default values
          return reply.code(200).send({
            data: {
              currentValue: 0,
              targetValue: 1, // Default target value
              percentComplete: 0,
              isComplete: false
            },
            meta: {
              timestamp: new Date().toISOString()
            }
          });
        }
        
        return reply.code(200).send({
          data: progress,
          meta: {
            timestamp: new Date().toISOString()
          }
        });
      } catch (error) {
        return handleApiError(request, reply, error);
      }
    }
  );

  /**
   * Admin routes below
   * (These would be protected with admin authentication in a real implementation)
   */

  /**
   * @openapi
   * /api/v1/achievements/{id}/unlock:
   *   post:
   *     summary: Manually unlock an achievement (admin only)
   *     description: Manually awards an achievement to a user
   *     tags: [Achievements]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Achievement ID
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [data]
   *             properties:
   *               data:
   *                 type: object
   *                 required: [userId]
   *                 properties:
   *                   userId:
   *                     type: string
   *                     description: User ID to unlock achievement for
   *     responses:
   *       200:
   *         description: Achievement unlocked successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   type: object
   *                   properties:
   *                     success:
   *                       type: boolean
   *                     achievement:
   *                       type: object
   *                     unlocked_at:
   *                       type: string
   *                       format: date-time
   *                 meta:
   *                   type: object
   *                   properties:
   *                     timestamp:
   *                       type: string
   *                       format: date-time
   *       401:
   *         description: Unauthorized
   *       403:
   *         description: Forbidden - Admin only
   *       404:
   *         description: Achievement not found
   */
  fastify.post<{ 
    Params: AchievementParams;
    Body: { data: { userId: string } };
  }>(
    '/:id/unlock',
    {
      schema: {
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string' }
          }
        },
        body: {
          type: 'object',
          required: ['data'],
          properties: {
            data: {
              type: 'object',
              required: ['userId'],
              properties: {
                userId: { type: 'string' }
              }
            }
          }
        }
      }
    },
    async (request: FastifyRequest<{ 
      Params: AchievementParams;
      Body: { data: { userId: string } };
    }>, reply: FastifyReply) => {
      try {
        // Check if user is admin
        const isAdmin = false; // Placeholder for actual admin check
        
        if (!isAdmin) {
          return reply.code(403).send({
            data: null,
            meta: { timestamp: new Date().toISOString() },
            errors: [{ code: 'FORBIDDEN', message: 'Admin access required' }]
          });
        }
        
        const { id } = request.params;
        const { userId } = request.body.data;
        
        // Check if achievement exists
        const achievement = await fastify.achievements.achievementService.getAchievementById(id);
        if (!achievement) {
          return reply.code(404).send({
            data: null,
            meta: { timestamp: new Date().toISOString() },
            errors: [{ code: 'RESOURCE_NOT_FOUND', message: 'Achievement not found' }]
          });
        }
        
        // Unlock the achievement
        const userAchievement = await fastify.achievements.achievementService.manuallyUnlockAchievement(
          userId, id
        );
        
        return reply.code(200).send({
          data: {
            success: true,
            achievement,
            unlocked_at: userAchievement.unlocked_at
          },
          meta: {
            timestamp: new Date().toISOString()
          }
        });
      } catch (error) {
        return handleApiError(request, reply, error);
      }
    }
  );
}
