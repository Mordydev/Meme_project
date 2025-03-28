/**
 * Level API Routes
 * 
 * API endpoints for user levels, XP tracking, and level progression.
 */
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { handleApiError } from '../../errors';

/**
 * Request parameters with user ID
 */
interface UserParams {
  userId: string;
}

/**
 * Request pagination parameters for XP transactions
 */
interface PaginationParams {
  limit?: number;
  offset?: number;
}

/**
 * XP award request body
 */
interface XpAwardRequest {
  data: {
    amount: number;
    source: string;
    referenceId?: string;
  };
}

/**
 * Level routes
 */
export default async function levelRoutes(fastify: FastifyInstance) {
  /**
   * @openapi
   * /api/v1/levels:
   *   get:
   *     summary: Get all level definitions
   *     description: Retrieves all level definitions with required XP and benefits
   *     tags: [Levels]
   *     responses:
   *       200:
   *         description: List of level definitions
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
   *                       level:
   *                         type: integer
   *                       title:
   *                         type: string
   *                       xp_required:
   *                         type: integer
   *                       benefits:
   *                         type: array
   *                         items:
   *                           type: string
   *                       points_reward:
   *                         type: integer
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
        const levels = await fastify.achievements.levelService.getAllLevelDefinitions();
        
        return reply.code(200).send({
          data: levels,
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
   * /api/v1/levels/{level}:
   *   get:
   *     summary: Get level definition by level number
   *     description: Retrieves information about a specific level
   *     tags: [Levels]
   *     parameters:
   *       - in: path
   *         name: level
   *         required: true
   *         schema:
   *           type: integer
   *         description: Level number
   *     responses:
   *       200:
   *         description: Level definition
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   type: object
   *                   properties:
   *                     level:
   *                       type: integer
   *                     title:
   *                       type: string
   *                     xp_required:
   *                       type: integer
   *                     benefits:
   *                       type: array
   *                       items:
   *                         type: string
   *                     points_reward:
   *                       type: integer
   *                 meta:
   *                   type: object
   *                   properties:
   *                     timestamp:
   *                       type: string
   *                       format: date-time
   *       404:
   *         description: Level not found
   */
  fastify.get<{ Params: { level: number } }>(
    '/:level',
    {
      schema: {
        params: {
          type: 'object',
          required: ['level'],
          properties: {
            level: { type: 'number' }
          }
        }
      }
    },
    async (request: FastifyRequest<{ Params: { level: number } }>, reply: FastifyReply) => {
      try {
        const { level } = request.params;
        
        const levelDefinition = await fastify.achievements.levelService.getLevelDefinition(level);
        
        if (!levelDefinition) {
          return reply.code(404).send({
            data: null,
            meta: { timestamp: new Date().toISOString() },
            errors: [{ code: 'RESOURCE_NOT_FOUND', message: 'Level not found' }]
          });
        }
        
        return reply.code(200).send({
          data: levelDefinition,
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
   * /api/v1/levels/user:
   *   get:
   *     summary: Get current user's level
   *     description: Retrieves level information for the authenticated user
   *     tags: [Levels]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: User's level information
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   type: object
   *                   properties:
   *                     level:
   *                       type: integer
   *                     current_xp:
   *                       type: integer
   *                     nextLevel:
   *                       type: object
   *                       nullable: true
   *                     xpToNextLevel:
   *                       type: integer
   *                     percentToNextLevel:
   *                       type: integer
   *                     levelTitle:
   *                       type: string
   *                     benefits:
   *                       type: array
   *                       items:
   *                         type: string
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
        
        const userLevel = await fastify.achievements.levelService.getUserLevel(userId);
        
        return reply.code(200).send({
          data: userLevel,
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
   * /api/v1/levels/user/{userId}:
   *   get:
   *     summary: Get level for a specific user
   *     description: Retrieves level information for a specific user
   *     tags: [Levels]
   *     parameters:
   *       - in: path
   *         name: userId
   *         required: true
   *         schema:
   *           type: string
   *         description: User ID
   *     responses:
   *       200:
   *         description: User's level information
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   type: object
   *                   properties:
   *                     level:
   *                       type: integer
   *                     levelTitle:
   *                       type: string
   *                     benefits:
   *                       type: array
   *                       items:
   *                         type: string
   *                 meta:
   *                   type: object
   *                   properties:
   *                     timestamp:
   *                       type: string
   *                       format: date-time
   *       404:
   *         description: User not found
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
        
        const userLevel = await fastify.achievements.levelService.getUserLevel(userId);
        
        // For other users, we only return the level, not detailed XP information
        return reply.code(200).send({
          data: {
            level: userLevel.level,
            levelTitle: userLevel.levelTitle,
            benefits: userLevel.benefits
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
   * /api/v1/levels/xp:
   *   get:
   *     summary: Get XP transactions for current user
   *     description: Retrieves XP transaction history for the authenticated user
   *     tags: [Levels]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 20
   *         description: Maximum number of transactions to return
   *       - in: query
   *         name: offset
   *         schema:
   *           type: integer
   *           default: 0
   *         description: Number of transactions to skip
   *     responses:
   *       200:
   *         description: XP transaction history
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
   *                       amount:
   *                         type: integer
   *                       source:
   *                         type: string
   *                       reference_id:
   *                         type: string
   *                         nullable: true
   *                       created_at:
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
  fastify.get<{ Querystring: PaginationParams }>(
    '/xp',
    {
      schema: {
        querystring: {
          type: 'object',
          properties: {
            limit: { type: 'number', default: 20 },
            offset: { type: 'number', default: 0 }
          }
        }
      }
    },
    async (request: FastifyRequest<{ Querystring: PaginationParams }>, reply: FastifyReply) => {
      try {
        const userId = request.user?.id;
        if (!userId) {
          return reply.code(401).send({
            data: null,
            meta: { timestamp: new Date().toISOString() },
            errors: [{ code: 'UNAUTHORIZED', message: 'Authentication required' }]
          });
        }
        
        const { limit = 20, offset = 0 } = request.query;
        
        const transactions = await fastify.achievements.levelService.getXpTransactions(
          userId, limit, offset
        );
        
        return reply.code(200).send({
          data: transactions,
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
   * /api/v1/levels/xp/values:
   *   get:
   *     summary: Get XP values for different activities
   *     description: Retrieves the amount of XP awarded for different activities
   *     tags: [Levels]
   *     responses:
   *       200:
   *         description: XP values by activity
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   type: object
   *                   additionalProperties:
   *                     type: integer
   *                 meta:
   *                   type: object
   *                   properties:
   *                     timestamp:
   *                       type: string
   *                       format: date-time
   */
  fastify.get(
    '/xp/values',
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const xpValues = fastify.achievements.levelService.getXpValues();
        
        return reply.code(200).send({
          data: xpValues,
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
   * /api/v1/levels/xp:
   *   post:
   *     summary: Award XP to current user
   *     description: Awards XP to the authenticated user and checks for level up
   *     tags: [Levels]
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
   *                 required: [amount, source]
   *                 properties:
   *                   amount:
   *                     type: integer
   *                     description: Amount of XP to award
   *                   source:
   *                     type: string
   *                     description: Source of XP (e.g., content_creation)
   *                   referenceId:
   *                     type: string
   *                     description: Optional reference ID
   *     responses:
   *       200:
   *         description: XP awarded successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   type: object
   *                   properties:
   *                     previousLevel:
   *                       type: integer
   *                     currentLevel:
   *                       type: integer
   *                     totalXp:
   *                       type: integer
   *                     xpGained:
   *                       type: integer
   *                     xpToNextLevel:
   *                       type: integer
   *                     levelUp:
   *                       type: boolean
   *                     levelProgress:
   *                       type: integer
   *                 meta:
   *                   type: object
   *                   properties:
   *                     timestamp:
   *                       type: string
   *                       format: date-time
   *       401:
   *         description: Unauthorized
   *       400:
   *         description: Invalid request
   */
  fastify.post<{ Body: XpAwardRequest }>(
    '/xp',
    {
      schema: {
        body: {
          type: 'object',
          required: ['data'],
          properties: {
            data: {
              type: 'object',
              required: ['amount', 'source'],
              properties: {
                amount: { type: 'number' },
                source: { type: 'string' },
                referenceId: { type: 'string' }
              }
            }
          }
        }
      }
    },
    async (request: FastifyRequest<{ Body: XpAwardRequest }>, reply: FastifyReply) => {
      try {
        const userId = request.user?.id;
        if (!userId) {
          return reply.code(401).send({
            data: null,
            meta: { timestamp: new Date().toISOString() },
            errors: [{ code: 'UNAUTHORIZED', message: 'Authentication required' }]
          });
        }
        
        const { amount, source, referenceId } = request.body.data;
        
        // Validate amount
        if (amount <= 0) {
          return reply.code(400).send({
            data: null,
            meta: { timestamp: new Date().toISOString() },
            errors: [{ code: 'VALIDATION_ERROR', message: 'XP amount must be positive' }]
          });
        }
        
        // Add XP and check for level up
        const result = await fastify.achievements.levelService.addXP({
          userId,
          amount,
          source,
          referenceId
        });
        
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
   * /api/v1/levels/admin/award:
   *   post:
   *     summary: Award XP to a user (admin only)
   *     description: Manually awards XP to a specified user
   *     tags: [Levels]
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
   *                 required: [userId, amount]
   *                 properties:
   *                   userId:
   *                     type: string
   *                   amount:
   *                     type: integer
   *                   reason:
   *                     type: string
   *     responses:
   *       200:
   *         description: XP awarded successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   type: object
   *                   properties:
   *                     previousLevel:
   *                       type: integer
   *                     currentLevel:
   *                       type: integer
   *                     totalXp:
   *                       type: integer
   *                     xpGained:
   *                       type: integer
   *                     levelUp:
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
        amount: number; 
        reason?: string; 
      } 
    } 
  }>(
    '/admin/award',
    {
      schema: {
        body: {
          type: 'object',
          required: ['data'],
          properties: {
            data: {
              type: 'object',
              required: ['userId', 'amount'],
              properties: {
                userId: { type: 'string' },
                amount: { type: 'number' },
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
          amount: number; 
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
        
        const { userId, amount, reason } = request.body.data;
        
        // Add XP and check for level up
        const result = await fastify.achievements.levelService.addXP({
          userId,
          amount,
          source: 'admin_award',
          referenceId: reason
        });
        
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
}
