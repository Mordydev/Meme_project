/**
 * Streak API Routes
 * 
 * API endpoints for streak tracking, maintenance, and rewards.
 */
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { handleApiError } from '../../errors';

/**
 * Request parameters with streak ID
 */
interface StreakParams {
  id: string;
}

/**
 * Request parameters with user ID
 */
interface UserParams {
  userId: string;
}

/**
 * Streak activity request body
 */
interface StreakActivityRequest {
  data: {
    activityType: string;
  };
}

/**
 * Streak routes
 */
export default async function streakRoutes(fastify: FastifyInstance) {
  /**
   * @openapi
   * /api/v1/streaks:
   *   get:
   *     summary: Get all streak definitions
   *     description: Retrieves all streak types and their thresholds
   *     tags: [Streaks]
   *     responses:
   *       200:
   *         description: List of streak definitions
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
   *                       activity_type:
   *                         type: string
   *                       period_type:
   *                         type: string
   *                       thresholds:
   *                         type: array
   *                         items:
   *                           type: object
   *                       bonus_formula:
   *                         type: string
   *                 meta:
   *                   type: object
   *                   properties:
   *                     timestamp:
   *                       type: string
   *                       format: date-time
   */
  fastify.get(
    '/',
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const streaks = await fastify.achievements.streakService.getAllStreakDefinitions();
        
        return reply.code(200).send({
          data: streaks,
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
   * /api/v1/streaks/{id}:
   *   get:
   *     summary: Get streak definition by ID
   *     description: Retrieves information about a specific streak type
   *     tags: [Streaks]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Streak ID
   *     responses:
   *       200:
   *         description: Streak definition
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
   *                     activity_type:
   *                       type: string
   *                     period_type:
   *                       type: string
   *                     thresholds:
   *                       type: array
   *                       items:
   *                         type: object
   *                     bonus_formula:
   *                       type: string
   *                 meta:
   *                   type: object
   *                   properties:
   *                     timestamp:
   *                       type: string
   *                       format: date-time
   *       404:
   *         description: Streak not found
   */
  fastify.get<{ Params: StreakParams }>(
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
    async (request: FastifyRequest<{ Params: StreakParams }>, reply: FastifyReply) => {
      try {
        const { id } = request.params;
        
        const streak = await fastify.achievements.streakService.getStreakDefinition(id);
        
        if (!streak) {
          return reply.code(404).send({
            data: null,
            meta: { timestamp: new Date().toISOString() },
            errors: [{ code: 'RESOURCE_NOT_FOUND', message: 'Streak not found' }]
          });
        }
        
        return reply.code(200).send({
          data: streak,
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
   * /api/v1/streaks/user:
   *   get:
   *     summary: Get current user's streaks
   *     description: Retrieves streaks for the authenticated user
   *     tags: [Streaks]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: User's streaks
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
   *                       streak:
   *                         type: object
   *                       current_count:
   *                         type: integer
   *                       longest_count:
   *                         type: integer
   *                       last_activity_date:
   *                         type: string
   *                         format: date-time
   *                         nullable: true
   *                       next_milestone:
   *                         type: integer
   *                         nullable: true
   *                       milestone_progress:
   *                         type: integer
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
        
        const streaks = await fastify.achievements.streakService.getUserStreaks(userId);
        
        return reply.code(200).send({
          data: streaks,
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
   * /api/v1/streaks/user/{userId}:
   *   get:
   *     summary: Get streaks for a specific user
   *     description: Retrieves streaks for a specific user
   *     tags: [Streaks]
   *     parameters:
   *       - in: path
   *         name: userId
   *         required: true
   *         schema:
   *           type: string
   *         description: User ID
   *     responses:
   *       200:
   *         description: User's streaks
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   type: object
   *                   properties:
   *                     streaks:
   *                       type: array
   *                       items:
   *                         type: object
   *                         properties:
   *                           streak_name:
   *                             type: string
   *                           current_count:
   *                             type: integer
   *                           longest_count:
   *                             type: integer
   *                     best_streak:
   *                       type: object
   *                       properties:
   *                         streak_name:
   *                           type: string
   *                         count:
   *                           type: integer
   *                 meta:
   *                   type: object
   *                   properties:
   *                     timestamp:
   *                       type: string
   *                       format: date-time
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
        
        const streaks = await fastify.achievements.streakService.getUserStreaks(userId);
        
        // For other users, we only return limited streak info
        const publicStreakData = streaks.map(streak => ({
          streak_name: streak.streak.name,
          current_count: streak.current_count,
          longest_count: streak.longest_count
        }));
        
        // Find best streak (highest current count)
        const bestStreak = publicStreakData.reduce((best, current) => 
          current.current_count > best.count ? { streak_name: current.streak_name, count: current.current_count } : best, 
          { streak_name: '', count: 0 }
        );
        
        return reply.code(200).send({
          data: {
            streaks: publicStreakData,
            best_streak: bestStreak.count > 0 ? bestStreak : null
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

  /**
   * @openapi
   * /api/v1/streaks/{id}/status:
   *   get:
   *     summary: Get user's status for a specific streak
   *     description: Retrieves detailed status for a specific streak for the authenticated user
   *     tags: [Streaks]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Streak ID
   *     responses:
   *       200:
   *         description: Streak status
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   type: object
   *                   properties:
   *                     current_count:
   *                       type: integer
   *                     longest_count:
   *                       type: integer
   *                     last_activity_date:
   *                       type: string
   *                       format: date-time
   *                       nullable: true
   *                     grace_period_used:
   *                       type: boolean
   *                     next_milestone:
   *                       type: integer
   *                       nullable: true
   *                     milestone_progress:
   *                       type: integer
   *                     isActive:
   *                       type: boolean
   *                     today_recorded:
   *                       type: boolean
   *                     streak_definition:
   *                       type: object
   *                 meta:
   *                   type: object
   *                   properties:
   *                     timestamp:
   *                       type: string
   *                       format: date-time
   *       401:
   *         description: Unauthorized
   *       404:
   *         description: Streak not found
   */
  fastify.get<{ Params: StreakParams }>(
    '/:id/status',
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
    async (request: FastifyRequest<{ Params: StreakParams }>, reply: FastifyReply) => {
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
        
        const streakStatus = await fastify.achievements.streakService.getStreakStatus(userId, id);
        
        if (!streakStatus) {
          return reply.code(404).send({
            data: null,
            meta: { timestamp: new Date().toISOString() },
            errors: [{ code: 'RESOURCE_NOT_FOUND', message: 'Streak not found' }]
          });
        }
        
        return reply.code(200).send({
          data: streakStatus,
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
   * /api/v1/streaks/record:
   *   post:
   *     summary: Record streak activity
   *     description: Records activity for a streak for the authenticated user
   *     tags: [Streaks]
   *     security:
   *       - bearerAuth: []
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
   *                 required: [activityType]
   *                 properties:
   *                   activityType:
   *                     type: string
   *                     description: Type of activity to record (e.g., login, content_creation)
   *     responses:
   *       200:
   *         description: Streak activity recorded successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   type: object
   *                   properties:
   *                     currentStreak:
   *                       type: integer
   *                     streakUpdated:
   *                       type: boolean
   *                     lastActivityDate:
   *                       type: string
   *                       format: date-time
   *                     milestoneReached:
   *                       type: integer
   *                       nullable: true
   *                     gracePeriodUsed:
   *                       type: boolean
   *                 meta:
   *                   type: object
   *                   properties:
   *                     timestamp:
   *                       type: string
   *                       format: date-time
   *       401:
   *         description: Unauthorized
   *       400:
   *         description: Invalid activity type
   */
  fastify.post<{ Body: StreakActivityRequest }>(
    '/record',
    {
      schema: {
        body: {
          type: 'object',
          required: ['data'],
          properties: {
            data: {
              type: 'object',
              required: ['activityType'],
              properties: {
                activityType: { type: 'string' }
              }
            }
          }
        }
      }
    },
    async (request: FastifyRequest<{ Body: StreakActivityRequest }>, reply: FastifyReply) => {
      try {
        const userId = request.user?.id;
        if (!userId) {
          return reply.code(401).send({
            data: null,
            meta: { timestamp: new Date().toISOString() },
            errors: [{ code: 'UNAUTHORIZED', message: 'Authentication required' }]
          });
        }
        
        const { activityType } = request.body.data;
        
        // Check if activity type is valid
        const validActivityTypes = await fastify.achievements.streakService.getValidActivityTypes();
        if (!validActivityTypes.includes(activityType)) {
          return reply.code(400).send({
            data: null,
            meta: { timestamp: new Date().toISOString() },
            errors: [{ code: 'VALIDATION_ERROR', message: 'Invalid activity type' }]
          });
        }
        
        // Record activity
        const result = await fastify.achievements.streakService.recordActivity(userId, activityType);
        
        return reply.code(200).send({
          data: result,
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
   * Admin routes
   */

  /**
   * @openapi
   * /api/v1/streaks/reset:
   *   post:
   *     summary: Reset streaks (admin only)
   *     description: Resets streaks that have expired (admin only)
   *     tags: [Streaks]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Streaks reset successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   type: object
   *                   properties:
   *                     resetCount:
   *                       type: integer
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
   */
  fastify.post(
    '/reset',
    async (request: FastifyRequest, reply: FastifyReply) => {
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
        
        // Reset expired streaks
        const resetCount = await fastify.achievements.streakService.resetExpiredStreaks();
        
        return reply.code(200).send({
          data: {
            resetCount
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

  /**
   * @openapi
   * /api/v1/streaks/admin/record:
   *   post:
   *     summary: Manually record streak activity for a user (admin only)
   *     description: Manually records activity for a user's streak (admin only)
   *     tags: [Streaks]
   *     security:
   *       - bearerAuth: []
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
   *                 required: [userId, activityType]
   *                 properties:
   *                   userId:
   *                     type: string
   *                   activityType:
   *                     type: string
   *                   reason:
   *                     type: string
   *     responses:
   *       200:
   *         description: Streak activity recorded successfully
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
   *                     currentStreak:
   *                       type: integer
   *                     streakUpdated:
   *                       type: boolean
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
   */
  fastify.post<{ 
    Body: { 
      data: { 
        userId: string; 
        activityType: string; 
        reason?: string; 
      } 
    } 
  }>(
    '/admin/record',
    {
      schema: {
        body: {
          type: 'object',
          required: ['data'],
          properties: {
            data: {
              type: 'object',
              required: ['userId', 'activityType'],
              properties: {
                userId: { type: 'string' },
                activityType: { type: 'string' },
                reason: { type: 'string' }
              }
            }
          }
        }
      }
    },
    async (request: FastifyRequest<{ 
      Body: { 
        data: { 
          userId: string; 
          activityType: string; 
          reason?: string; 
        } 
      } 
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
        
        const { userId, activityType } = request.body.data;
        
        // Record activity
        const result = await fastify.achievements.streakService.recordActivity(userId, activityType);
        
        return reply.code(200).send({
          data: {
            success: true,
            ...result
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
