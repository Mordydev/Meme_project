/**
 * Leaderboard API Routes
 * 
 * API endpoints for leaderboards, rankings, and user positions across different categories.
 */
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { handleApiError } from '../../errors';

/**
 * Request parameters for leaderboard category and period
 */
interface LeaderboardParams {
  category: string;
  period: string;
}

/**
 * Request parameters with user ID
 */
interface UserParams {
  userId: string;
}

/**
 * Request query parameters for leaderboard pagination
 */
interface LeaderboardQueryParams {
  limit?: number;
  offset?: number;
}

/**
 * Leaderboard routes
 */
export default async function leaderboardRoutes(fastify: FastifyInstance) {
  /**
   * @openapi
   * /api/v1/leaderboards/categories:
   *   get:
   *     summary: Get available leaderboard categories
   *     description: Retrieves all available categories for leaderboards
   *     tags: [Leaderboards]
   *     responses:
   *       200:
   *         description: List of leaderboard categories
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
   *                 meta:
   *                   type: object
   *                   properties:
   *                     timestamp:
   *                       type: string
   *                       format: date-time
   */
  fastify.get(
    '/categories',
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const categories = await fastify.achievements.leaderboardService.getLeaderboardCategories();
        
        return reply.code(200).send({
          data: categories,
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
   * /api/v1/leaderboards/periods:
   *   get:
   *     summary: Get available leaderboard time periods
   *     description: Retrieves all available time periods for leaderboards
   *     tags: [Leaderboards]
   *     responses:
   *       200:
   *         description: List of leaderboard time periods
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
   *                 meta:
   *                   type: object
   *                   properties:
   *                     timestamp:
   *                       type: string
   *                       format: date-time
   */
  fastify.get(
    '/periods',
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const periods = await fastify.achievements.leaderboardService.getLeaderboardPeriods();
        
        return reply.code(200).send({
          data: periods,
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
   * /api/v1/leaderboards/{category}/{period}:
   *   get:
   *     summary: Get leaderboard for a specific category and period
   *     description: Retrieves rankings for a specific leaderboard category and time period
   *     tags: [Leaderboards]
   *     parameters:
   *       - in: path
   *         name: category
   *         required: true
   *         schema:
   *           type: string
   *           enum: [points, content, engagement, achievements, referrals, streak, level, composite]
   *         description: Leaderboard category
   *       - in: path
   *         name: period
   *         required: true
   *         schema:
   *           type: string
   *           enum: [daily, weekly, monthly, seasonal, allTime]
   *         description: Time period
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 100
   *         description: Maximum number of entries to return
   *       - in: query
   *         name: offset
   *         schema:
   *           type: integer
   *           default: 0
   *         description: Number of entries to skip
   *     responses:
   *       200:
   *         description: Leaderboard entries
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   type: object
   *                   properties:
   *                     entries:
   *                       type: array
   *                       items:
   *                         type: object
   *                         properties:
   *                           user_id:
   *                             type: string
   *                           username:
   *                             type: string
   *                           display_name:
   *                             type: string
   *                           avatar_url:
   *                             type: string
   *                           rank:
   *                             type: integer
   *                           score:
   *                             type: number
   *                           previous_rank:
   *                             type: integer
   *                             nullable: true
   *                           level:
   *                             type: integer
   *                     total_count:
   *                       type: integer
   *                     category:
   *                       type: string
   *                     period:
   *                       type: string
   *                     last_updated:
   *                       type: string
   *                       format: date-time
   *                 meta:
   *                   type: object
   *                   properties:
   *                     timestamp:
   *                       type: string
   *                       format: date-time
   *       400:
   *         description: Invalid category or period
   */
  fastify.get<{ 
    Params: LeaderboardParams; 
    Querystring: LeaderboardQueryParams;
  }>(
    '/:category/:period',
    {
      schema: {
        params: {
          type: 'object',
          required: ['category', 'period'],
          properties: {
            category: { type: 'string' },
            period: { type: 'string' }
          }
        },
        querystring: {
          type: 'object',
          properties: {
            limit: { type: 'number', default: 100 },
            offset: { type: 'number', default: 0 }
          }
        }
      }
    },
    async (request: FastifyRequest<{ 
      Params: LeaderboardParams; 
      Querystring: LeaderboardQueryParams;
    }>, reply: FastifyReply) => {
      try {
        const { category, period } = request.params;
        const { limit = 100, offset = 0 } = request.query;
        
        // Validate category and period
        const validCategories = await fastify.achievements.leaderboardService.getLeaderboardCategories();
        const validCategoryIds = validCategories.map(c => c.id);
        
        if (!validCategoryIds.includes(category)) {
          return reply.code(400).send({
            data: null,
            meta: { timestamp: new Date().toISOString() },
            errors: [{ 
              code: 'VALIDATION_ERROR', 
              message: `Invalid category: ${category}. Valid categories are: ${validCategoryIds.join(', ')}` 
            }]
          });
        }
        
        const validPeriods = await fastify.achievements.leaderboardService.getLeaderboardPeriods();
        const validPeriodIds = validPeriods.map(p => p.id);
        
        if (!validPeriodIds.includes(period)) {
          return reply.code(400).send({
            data: null,
            meta: { timestamp: new Date().toISOString() },
            errors: [{ 
              code: 'VALIDATION_ERROR', 
              message: `Invalid period: ${period}. Valid periods are: ${validPeriodIds.join(', ')}` 
            }]
          });
        }
        
        // Get leaderboard
        const leaderboard = await fastify.achievements.leaderboardService.getLeaderboard(
          category,
          period,
          { limit, offset }
        );
        
        return reply.code(200).send({
          data: leaderboard,
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
   * /api/v1/leaderboards/{category}/{period}/user:
   *   get:
   *     summary: Get current user's position in a leaderboard
   *     description: Retrieves the authenticated user's position in a specific leaderboard
   *     tags: [Leaderboards]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: category
   *         required: true
   *         schema:
   *           type: string
   *           enum: [points, content, engagement, achievements, referrals, streak, level, composite]
   *         description: Leaderboard category
   *       - in: path
   *         name: period
   *         required: true
   *         schema:
   *           type: string
   *           enum: [daily, weekly, monthly, seasonal, allTime]
   *         description: Time period
   *     responses:
   *       200:
   *         description: User's leaderboard position
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   type: object
   *                   properties:
   *                     rank:
   *                       type: integer
   *                     score:
   *                       type: number
   *                     previous_rank:
   *                       type: integer
   *                       nullable: true
   *                     total_participants:
   *                       type: integer
   *                     percentile:
   *                       type: number
   *                     nearby_users:
   *                       type: array
   *                       items:
   *                         type: object
   *                         properties:
   *                           user_id:
   *                             type: string
   *                           username:
   *                             type: string
   *                           rank:
   *                             type: integer
   *                           score:
   *                             type: number
   *                 meta:
   *                   type: object
   *                   properties:
   *                     timestamp:
   *                       type: string
   *                       format: date-time
   *       401:
   *         description: Unauthorized
   *       400:
   *         description: Invalid category or period
   *       404:
   *         description: User not on leaderboard
   */
  fastify.get<{ Params: LeaderboardParams }>(
    '/:category/:period/user',
    {
      schema: {
        params: {
          type: 'object',
          required: ['category', 'period'],
          properties: {
            category: { type: 'string' },
            period: { type: 'string' }
          }
        }
      }
    },
    async (request: FastifyRequest<{ Params: LeaderboardParams }>, reply: FastifyReply) => {
      try {
        const userId = request.user?.id;
        if (!userId) {
          return reply.code(401).send({
            data: null,
            meta: { timestamp: new Date().toISOString() },
            errors: [{ code: 'UNAUTHORIZED', message: 'Authentication required' }]
          });
        }
        
        const { category, period } = request.params;
        
        // Validate category and period (simplified validation)
        const validCategories = ['points', 'content', 'engagement', 'achievements', 'referrals', 'streak', 'level', 'composite'];
        const validPeriods = ['daily', 'weekly', 'monthly', 'seasonal', 'allTime'];
        
        if (!validCategories.includes(category)) {
          return reply.code(400).send({
            data: null,
            meta: { timestamp: new Date().toISOString() },
            errors: [{ 
              code: 'VALIDATION_ERROR', 
              message: `Invalid category: ${category}. Valid categories are: ${validCategories.join(', ')}` 
            }]
          });
        }
        
        if (!validPeriods.includes(period)) {
          return reply.code(400).send({
            data: null,
            meta: { timestamp: new Date().toISOString() },
            errors: [{ 
              code: 'VALIDATION_ERROR', 
              message: `Invalid period: ${period}. Valid periods are: ${validPeriods.join(', ')}` 
            }]
          });
        }
        
        // Get user's rank
        const userRank = await fastify.achievements.leaderboardService.getUserRank(
          userId,
          category,
          period
        );
        
        if (!userRank) {
          return reply.code(404).send({
            data: null,
            meta: { timestamp: new Date().toISOString() },
            errors: [{ code: 'RESOURCE_NOT_FOUND', message: 'User not on leaderboard' }]
          });
        }
        
        return reply.code(200).send({
          data: userRank,
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
   * /api/v1/leaderboards/{category}/{period}/user/{userId}:
   *   get:
   *     summary: Get a specific user's position in a leaderboard
   *     description: Retrieves a specific user's position in a leaderboard
   *     tags: [Leaderboards]
   *     parameters:
   *       - in: path
   *         name: category
   *         required: true
   *         schema:
   *           type: string
   *           enum: [points, content, engagement, achievements, referrals, streak, level, composite]
   *         description: Leaderboard category
   *       - in: path
   *         name: period
   *         required: true
   *         schema:
   *           type: string
   *           enum: [daily, weekly, monthly, seasonal, allTime]
   *         description: Time period
   *       - in: path
   *         name: userId
   *         required: true
   *         schema:
   *           type: string
   *         description: User ID
   *     responses:
   *       200:
   *         description: User's leaderboard position
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   type: object
   *                   properties:
   *                     rank:
   *                       type: integer
   *                     score:
   *                       type: number
   *                     previous_rank:
   *                       type: integer
   *                       nullable: true
   *                     total_participants:
   *                       type: integer
   *                     percentile:
   *                       type: number
   *                 meta:
   *                   type: object
   *                   properties:
   *                     timestamp:
   *                       type: string
   *                       format: date-time
   *       400:
   *         description: Invalid category or period
   *       404:
   *         description: User not on leaderboard
   */
  fastify.get<{ Params: LeaderboardParams & UserParams }>(
    '/:category/:period/user/:userId',
    {
      schema: {
        params: {
          type: 'object',
          required: ['category', 'period', 'userId'],
          properties: {
            category: { type: 'string' },
            period: { type: 'string' },
            userId: { type: 'string' }
          }
        }
      }
    },
    async (request: FastifyRequest<{ Params: LeaderboardParams & UserParams }>, reply: FastifyReply) => {
      try {
        const { category, period, userId } = request.params;
        
        // Validate category and period (simplified validation)
        const validCategories = ['points', 'content', 'engagement', 'achievements', 'referrals', 'streak', 'level', 'composite'];
        const validPeriods = ['daily', 'weekly', 'monthly', 'seasonal', 'allTime'];
        
        if (!validCategories.includes(category)) {
          return reply.code(400).send({
            data: null,
            meta: { timestamp: new Date().toISOString() },
            errors: [{ 
              code: 'VALIDATION_ERROR', 
              message: `Invalid category: ${category}. Valid categories are: ${validCategories.join(', ')}` 
            }]
          });
        }
        
        if (!validPeriods.includes(period)) {
          return reply.code(400).send({
            data: null,
            meta: { timestamp: new Date().toISOString() },
            errors: [{ 
              code: 'VALIDATION_ERROR', 
              message: `Invalid period: ${period}. Valid periods are: ${validPeriods.join(', ')}` 
            }]
          });
        }
        
        // Get user's rank
        const userRank = await fastify.achievements.leaderboardService.getUserRank(
          userId,
          category,
          period
        );
        
        if (!userRank) {
          return reply.code(404).send({
            data: null,
            meta: { timestamp: new Date().toISOString() },
            errors: [{ code: 'RESOURCE_NOT_FOUND', message: 'User not on leaderboard' }]
          });
        }
        
        // For other users, we return limited data (no nearby users)
        const publicUserRank = {
          rank: userRank.rank,
          score: userRank.score,
          previous_rank: userRank.previous_rank,
          total_participants: userRank.total_participants,
          percentile: userRank.percentile
        };
        
        return reply.code(200).send({
          data: publicUserRank,
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
   * /api/v1/leaderboards/user/summary:
   *   get:
   *     summary: Get current user's summary across all leaderboards
   *     description: Retrieves the authenticated user's summary across all leaderboards
   *     tags: [Leaderboards]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: User's leaderboard summary
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   type: object
   *                   properties:
   *                     best_category:
   *                       type: object
   *                       properties:
   *                         category:
   *                           type: string
   *                         period:
   *                           type: string
   *                         rank:
   *                           type: integer
   *                         percentile:
   *                           type: number
   *                     all_time_ranks:
   *                       type: array
   *                       items:
   *                         type: object
   *                         properties:
   *                           category:
   *                             type: string
   *                           rank:
   *                             type: integer
   *                           percentile:
   *                             type: number
   *                     total_leaderboards:
   *                       type: integer
   *                     leaderboards_in_top_ten_percent:
   *                       type: integer
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
    '/user/summary',
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
        
        const summary = await fastify.achievements.leaderboardService.getUserLeaderboardSummary(userId);
        
        return reply.code(200).send({
          data: summary,
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
   * /api/v1/leaderboards/{category}/{period}/history:
   *   get:
   *     summary: Get historical snapshots of a leaderboard
   *     description: Retrieves historical snapshots of a leaderboard for trend analysis
   *     tags: [Leaderboards]
   *     parameters:
   *       - in: path
   *         name: category
   *         required: true
   *         schema:
   *           type: string
   *           enum: [points, content, engagement, achievements, referrals, streak, level, composite]
   *         description: Leaderboard category
   *       - in: path
   *         name: period
   *         required: true
   *         schema:
   *           type: string
   *           enum: [daily, weekly, monthly, seasonal, allTime]
   *         description: Time period
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 30
   *         description: Maximum number of historical entries to return
   *     responses:
   *       200:
   *         description: Historical leaderboard snapshots
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
   *                       category:
   *                         type: string
   *                       period:
   *                         type: string
   *                       snapshot_date:
   *                         type: string
   *                         format: date
   *                       top_users:
   *                         type: array
   *                         items:
   *                           type: object
   *                 meta:
   *                   type: object
   *                   properties:
   *                     timestamp:
   *                       type: string
   *                       format: date-time
   *       400:
   *         description: Invalid category or period
   */
  fastify.get<{ 
    Params: LeaderboardParams; 
    Querystring: { limit?: number } 
  }>(
    '/:category/:period/history',
    {
      schema: {
        params: {
          type: 'object',
          required: ['category', 'period'],
          properties: {
            category: { type: 'string' },
            period: { type: 'string' }
          }
        },
        querystring: {
          type: 'object',
          properties: {
            limit: { type: 'number', default: 30 }
          }
        }
      }
    },
    async (request: FastifyRequest<{ 
      Params: LeaderboardParams; 
      Querystring: { limit?: number } 
    }>, reply: FastifyReply) => {
      try {
        const { category, period } = request.params;
        const { limit = 30 } = request.query;
        
        // Validate category and period (simplified validation)
        const validCategories = ['points', 'content', 'engagement', 'achievements', 'referrals', 'streak', 'level', 'composite'];
        const validPeriods = ['daily', 'weekly', 'monthly', 'seasonal', 'allTime'];
        
        if (!validCategories.includes(category)) {
          return reply.code(400).send({
            data: null,
            meta: { timestamp: new Date().toISOString() },
            errors: [{ 
              code: 'VALIDATION_ERROR', 
              message: `Invalid category: ${category}. Valid categories are: ${validCategories.join(', ')}` 
            }]
          });
        }
        
        if (!validPeriods.includes(period)) {
          return reply.code(400).send({
            data: null,
            meta: { timestamp: new Date().toISOString() },
            errors: [{ 
              code: 'VALIDATION_ERROR', 
              message: `Invalid period: ${period}. Valid periods are: ${validPeriods.join(', ')}` 
            }]
          });
        }
        
        // Get historical snapshots
        const snapshots = await fastify.achievements.leaderboardService.getLeaderboardHistory(
          category,
          period,
          limit
        );
        
        return reply.code(200).send({
          data: snapshots,
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
   * /api/v1/leaderboards/user/{userId}/history:
   *   get:
   *     summary: Get a user's ranking history
   *     description: Retrieves historical rankings for a specific user
   *     tags: [Leaderboards]
   *     parameters:
   *       - in: path
   *         name: userId
   *         required: true
   *         schema:
   *           type: string
   *         description: User ID
   *       - in: query
   *         name: category
   *         schema:
   *           type: string
   *           enum: [points, content, engagement, achievements, referrals, streak, level, composite]
   *         description: Optional filter by category
   *       - in: query
   *         name: period
   *         schema:
   *           type: string
   *           enum: [daily, weekly, monthly, seasonal, allTime]
   *         description: Optional filter by period
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 30
   *         description: Maximum number of historical entries to return
   *     responses:
   *       200:
   *         description: User's ranking history
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
   *                       category:
   *                         type: string
   *                       period:
   *                         type: string
   *                       rank:
   *                         type: integer
   *                       score:
   *                         type: number
   *                       date:
   *                         type: string
   *                         format: date
   *                       percentile:
   *                         type: number
   *                 meta:
   *                   type: object
   *                   properties:
   *                     timestamp:
   *                       type: string
   *                       format: date-time
   */
  fastify.get<{ 
    Params: UserParams; 
    Querystring: { 
      category?: string; 
      period?: string; 
      limit?: number;
    } 
  }>(
    '/user/:userId/history',
    {
      schema: {
        params: {
          type: 'object',
          required: ['userId'],
          properties: {
            userId: { type: 'string' }
          }
        },
        querystring: {
          type: 'object',
          properties: {
            category: { type: 'string' },
            period: { type: 'string' },
            limit: { type: 'number', default: 30 }
          }
        }
      }
    },
    async (request: FastifyRequest<{ 
      Params: UserParams; 
      Querystring: { 
        category?: string; 
        period?: string; 
        limit?: number;
      } 
    }>, reply: FastifyReply) => {
      try {
        const { userId } = request.params;
        const { category, period, limit = 30 } = request.query;
        
        // Get user's ranking history
        const history = await fastify.achievements.leaderboardService.getUserRankHistory(
          userId,
          {
            category,
            period,
            limit
          }
        );
        
        return reply.code(200).send({
          data: history,
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
   * /api/v1/leaderboards/refresh:
   *   post:
   *     summary: Manually refresh leaderboards (admin only)
   *     description: Manually triggers a refresh of the specified leaderboard
   *     tags: [Leaderboards]
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
   *                 required: [category, period]
   *                 properties:
   *                   category:
   *                     type: string
   *                     enum: [points, content, engagement, achievements, referrals, streak, level, composite]
   *                   period:
   *                     type: string
   *                     enum: [daily, weekly, monthly, seasonal, allTime]
   *     responses:
   *       200:
   *         description: Leaderboard refreshed successfully
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
   *                     entries_processed:
   *                       type: integer
   *                     timestamp:
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
   */
  fastify.post<{ 
    Body: { 
      data: { 
        category: string; 
        period: string;
      } 
    } 
  }>(
    '/refresh',
    {
      schema: {
        body: {
          type: 'object',
          required: ['data'],
          properties: {
            data: {
              type: 'object',
              required: ['category', 'period'],
              properties: {
                category: { type: 'string' },
                period: { type: 'string' }
              }
            }
          }
        }
      }
    },
    async (request: FastifyRequest<{ 
      Body: { 
        data: { 
          category: string; 
          period: string;
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
        
        const { category, period } = request.body.data;
        
        // Refresh leaderboard
        const result = await fastify.achievements.leaderboardService.refreshLeaderboard(category, period);
        
        return reply.code(200).send({
          data: {
            success: true,
            entries_processed: result.entriesProcessed,
            timestamp: result.timestamp
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
   * /api/v1/leaderboards/snapshot:
   *   post:
   *     summary: Create a leaderboard snapshot (admin only)
   *     description: Manually creates a historical snapshot of the current leaderboard
   *     tags: [Leaderboards]
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
   *                 required: [category, period]
   *                 properties:
   *                   category:
   *                     type: string
   *                     enum: [points, content, engagement, achievements, referrals, streak, level, composite]
   *                   period:
   *                     type: string
   *                     enum: [daily, weekly, monthly, seasonal, allTime]
   *     responses:
   *       200:
   *         description: Snapshot created successfully
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
   *                     snapshot_id:
   *                       type: string
   *                     snapshot_date:
   *                       type: string
   *                       format: date
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
        category: string; 
        period: string;
      } 
    } 
  }>(
    '/snapshot',
    {
      schema: {
        body: {
          type: 'object',
          required: ['data'],
          properties: {
            data: {
              type: 'object',
              required: ['category', 'period'],
              properties: {
                category: { type: 'string' },
                period: { type: 'string' }
              }
            }
          }
        }
      }
    },
    async (request: FastifyRequest<{ 
      Body: { 
        data: { 
          category: string; 
          period: string;
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
        
        const { category, period } = request.body.data;
        
        // Create snapshot
        const snapshot = await fastify.achievements.leaderboardService.createLeaderboardSnapshot(
          category,
          period
        );
        
        return reply.code(200).send({
          data: {
            success: true,
            snapshot_id: snapshot.id,
            snapshot_date: snapshot.snapshot_date
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
