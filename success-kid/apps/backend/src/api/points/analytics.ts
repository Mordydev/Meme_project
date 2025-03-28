/**
 * Points Analytics API
 * 
 * Endpoints for retrieving analytics data about the points system
 */
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { pointsAnalyticsService } from '../../services/points/analytics';
import { handleApiError } from '../../errors';

/**
 * Request params with user ID
 */
interface UserIdParams {
  userId: string;
}

/**
 * Query params for analytics
 */
interface AnalyticsQueryParams {
  timeframe?: string; // "today", "week", "month", "year"
}

/**
 * Points analytics routes
 */
export default async function pointsAnalyticsRoutes(fastify: FastifyInstance) {
  /**
   * @openapi
   * /api/v1/points/analytics/system:
   *   get:
   *     summary: Get system-wide points analytics
   *     description: Retrieves analytical data about the points system
   *     tags: [Points, Analytics]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: timeframe
   *         schema:
   *           type: string
   *           enum: [today, week, month, year]
   *           default: month
   *         description: Time period for analytics
   *     responses:
   *       200:
   *         description: System points analytics
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   type: object
   *                   properties:
   *                     totalPointsAwarded:
   *                       type: number
   *                     totalPointsRedeemed:
   *                       type: number
   *                     netPointsIssued:
   *                       type: number
   *                     activeUsers:
   *                       type: number
   *                     averagePointsPerUser:
   *                       type: number
   *                     topActivities:
   *                       type: array
   *                       items:
   *                         type: object
   *                         properties:
   *                           source:
   *                             type: string
   *                           percentage:
   *                             type: number
   *                     redemptionRate:
   *                       type: number
   *                 meta:
   *                   type: object
   *                   properties:
   *                     timestamp:
   *                       type: string
   *                       format: date-time
   *       401:
   *         description: Unauthorized
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       403:
   *         description: Forbidden - requires admin privileges
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  fastify.get<{ Querystring: AnalyticsQueryParams }>('/system', {
    schema: {
      tags: ['Points', 'Analytics'],
      querystring: {
        type: 'object',
        properties: {
          timeframe: { 
            type: 'string', 
            enum: ['today', 'week', 'month', 'year'],
            default: 'month'
          }
        }
      }
    },
    handler: async (request: FastifyRequest<{ Querystring: AnalyticsQueryParams }>, reply: FastifyReply) => {
      try {
        // Check if user has admin privileges
        const isAdmin = request.user?.isAdmin || false;
        if (!isAdmin) {
          return reply.code(403).send({
            data: null,
            meta: { timestamp: new Date().toISOString() },
            errors: [{ code: 'FORBIDDEN', message: 'Admin privileges required' }]
          });
        }
        
        // Get timeframe from query
        const timeframe = request.query.timeframe || 'month';
        
        // Get system metrics
        const metrics = await pointsAnalyticsService.getSystemMetrics(timeframe);
        
        // Send response
        return reply.code(200).send({
          data: metrics,
          meta: {
            timestamp: new Date().toISOString(),
          }
        });
      } catch (error) {
        return handleApiError(request, reply, error);
      }
    }
  });

  /**
   * @openapi
   * /api/v1/points/analytics/user/{userId}:
   *   get:
   *     summary: Get user points analytics
   *     description: Retrieves analytical data about a user's points activity
   *     tags: [Points, Analytics]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: userId
   *         schema:
   *           type: string
   *         required: true
   *         description: ID of the user
   *       - in: query
   *         name: timeframe
   *         schema:
   *           type: string
   *           enum: [today, week, month, year]
   *           default: month
   *         description: Time period for analytics
   *     responses:
   *       200:
   *         description: User points analytics
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   type: object
   *                   properties:
   *                     totalEarned:
   *                       type: number
   *                     totalRedeemed:
   *                       type: number
   *                     netBalance:
   *                       type: number
   *                     activityBreakdown:
   *                       type: array
   *                       items:
   *                         type: object
   *                         properties:
   *                           source:
   *                             type: string
   *                           amount:
   *                             type: number
   *                           percentage:
   *                             type: number
   *                     dailyAverage:
   *                       type: number
   *                     weeklyTrend:
   *                       type: array
   *                       items:
   *                         type: object
   *                         properties:
   *                           day:
   *                             type: string
   *                           amount:
   *                             type: number
   *                     comparisonToAverage:
   *                       type: number
   *                 meta:
   *                   type: object
   *                   properties:
   *                     timestamp:
   *                       type: string
   *                       format: date-time
   *       401:
   *         description: Unauthorized
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       403:
   *         description: Forbidden - requires admin privileges or self
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  fastify.get<{ Params: UserIdParams; Querystring: AnalyticsQueryParams }>('/user/:userId', {
    schema: {
      tags: ['Points', 'Analytics'],
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
          timeframe: { 
            type: 'string', 
            enum: ['today', 'week', 'month', 'year'],
            default: 'month'
          }
        }
      }
    },
    handler: async (request: FastifyRequest<{ Params: UserIdParams; Querystring: AnalyticsQueryParams }>, reply: FastifyReply) => {
      try {
        // Get user ID from path
        const { userId } = request.params;
        
        // Check if current user is authorized (admin or self)
        const currentUserId = request.user?.id;
        const isAdmin = request.user?.isAdmin || false;
        
        if (!currentUserId || (currentUserId !== userId && !isAdmin)) {
          return reply.code(403).send({
            data: null,
            meta: { timestamp: new Date().toISOString() },
            errors: [{ code: 'FORBIDDEN', message: 'Insufficient permissions' }]
          });
        }
        
        // Get timeframe from query
        const timeframe = request.query.timeframe || 'month';
        
        // Get user metrics
        const metrics = await pointsAnalyticsService.getUserMetrics(userId, timeframe);
        
        // Send response
        return reply.code(200).send({
          data: metrics,
          meta: {
            timestamp: new Date().toISOString(),
          }
        });
      } catch (error) {
        return handleApiError(request, reply, error);
      }
    }
  });

  /**
   * @openapi
   * /api/v1/points/analytics/anomalies:
   *   get:
   *     summary: Get points system anomalies
   *     description: Detects and returns unusual activity patterns in the points system
   *     tags: [Points, Analytics]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Detected anomalies
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
   *                       userId:
   *                         type: string
   *                       pattern:
   *                         type: string
   *                       confidence:
   *                         type: number
   *                       details:
   *                         type: object
   *                         properties:
   *                           expected:
   *                             type: number
   *                           actual:
   *                             type: number
   *                           deviation:
   *                             type: number
   *                           timeWindow:
   *                             type: string
   *                       timestamp:
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
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       403:
   *         description: Forbidden - requires admin privileges
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  fastify.get('/anomalies', {
    schema: {
      tags: ['Points', 'Analytics'],
    },
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        // Check if user has admin privileges
        const isAdmin = request.user?.isAdmin || false;
        if (!isAdmin) {
          return reply.code(403).send({
            data: null,
            meta: { timestamp: new Date().toISOString() },
            errors: [{ code: 'FORBIDDEN', message: 'Admin privileges required' }]
          });
        }
        
        // Detect anomalies
        const anomalies = await pointsAnalyticsService.detectAnomalies();
        
        // Send response
        return reply.code(200).send({
          data: anomalies,
          meta: {
            timestamp: new Date().toISOString(),
          }
        });
      } catch (error) {
        return handleApiError(request, reply, error);
      }
    }
  });
}
