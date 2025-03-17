/**
 * Referral Analytics Routes
 * 
 * Routes for analytics and reporting functionality
 */
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { getReferralAnalyticsService } from '../../services/referral';
import { handleApiError } from '../../errors';

/**
 * Analytics period query parameters
 */
interface AnalyticsPeriodQuery {
  period?: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'all';
}

/**
 * Report date range parameters
 */
interface ReportRangeBody {
  data: {
    startDate: string;
    endDate: string;
  };
}

/**
 * Register referral analytics routes
 */
export default function routes(fastify: FastifyInstance) {
  /**
   * @openapi
   * /api/v1/referrals/analytics/metrics:
   *   get:
   *     summary: Get referral metrics
   *     description: Retrieves analytics metrics for the referral program
   *     tags: [Referrals, Analytics]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: period
   *         schema:
   *           type: string
   *           enum: [daily, weekly, monthly, yearly, all]
   *           default: monthly
   *         description: Analysis period
   *     responses:
   *       200:
   *         description: Referral metrics
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   type: object
   *                   properties:
   *                     period:
   *                       type: string
   *                     visits:
   *                       type: integer
   *                     totalReferrals:
   *                       type: integer
   *                     uniqueReferrers:
   *                       type: integer
   *                     conversionRate:
   *                       type: number
   *                     totalRewards:
   *                       type: integer
   *                     rewardsPerReferral:
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
   *         description: Forbidden - Insufficient permissions
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  fastify.get<{ Querystring: AnalyticsPeriodQuery }>('/analytics/metrics', {
    schema: {
      tags: ['Referrals', 'Analytics'],
      querystring: {
        type: 'object',
        properties: {
          period: { 
            type: 'string',
            enum: ['daily', 'weekly', 'monthly', 'yearly', 'all'],
            default: 'monthly'
          }
        }
      }
    },
    handler: async (request: FastifyRequest<{ Querystring: AnalyticsPeriodQuery }>, reply: FastifyReply) => {
      try {
        // Check for admin permission
        const isAdmin = request.user?.isAdmin === true;
        if (!isAdmin) {
          return reply.code(403).send({
            data: null,
            meta: { timestamp: new Date().toISOString() },
            errors: [{ code: 'FORBIDDEN', message: 'Admin permission required' }]
          });
        }
        
        // Get period from query
        const period = request.query.period || 'monthly';
        
        // Get analytics service
        const analyticsService = getReferralAnalyticsService();
        
        // Get metrics
        const metrics = await analyticsService.getReferralMetrics(period);
        
        // Send response
        return reply.code(200).send({
          data: metrics,
          meta: {
            timestamp: new Date().toISOString()
          }
        });
      } catch (error) {
        return handleApiError(request, reply, error);
      }
    }
  });

  /**
   * @openapi
   * /api/v1/referrals/analytics/user:
   *   get:
   *     summary: Get user referral performance
   *     description: Retrieves analytics metrics for a specific user's referral activity
   *     tags: [Referrals, Analytics]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: period
   *         schema:
   *           type: string
   *           enum: [daily, weekly, monthly, yearly, all]
   *           default: monthly
   *         description: Analysis period
   *     responses:
   *       200:
   *         description: User referral performance
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   type: object
   *                   properties:
   *                     userId:
   *                       type: string
   *                     period:
   *                       type: string
   *                     totalReferrals:
   *                       type: integer
   *                     activeReferrals:
   *                       type: integer
   *                     conversionRate:
   *                       type: number
   *                     totalRewards:
   *                       type: integer
   *                     averageRewardPerReferral:
   *                       type: number
   *                     performance:
   *                       type: object
   *                       properties:
   *                         percentile:
   *                           type: number
   *                         rank:
   *                           type: integer
   *                         totalUsers:
   *                           type: integer
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
   */
  fastify.get<{ Querystring: AnalyticsPeriodQuery }>('/analytics/user', {
    schema: {
      tags: ['Referrals', 'Analytics'],
      querystring: {
        type: 'object',
        properties: {
          period: { 
            type: 'string',
            enum: ['daily', 'weekly', 'monthly', 'yearly', 'all'],
            default: 'monthly'
          }
        }
      }
    },
    handler: async (request: FastifyRequest<{ Querystring: AnalyticsPeriodQuery }>, reply: FastifyReply) => {
      try {
        // Get user ID from authentication
        const userId = request.user?.id;
        if (!userId) {
          return reply.code(401).send({
            data: null,
            meta: { timestamp: new Date().toISOString() },
            errors: [{ code: 'UNAUTHORIZED', message: 'Authentication required' }]
          });
        }
        
        // Get period from query
        const period = request.query.period || 'monthly';
        
        // Get analytics service
        const analyticsService = getReferralAnalyticsService();
        
        // Get performance
        const performance = await analyticsService.getUserReferralPerformance(userId, period);
        
        // Send response
        return reply.code(200).send({
          data: performance,
          meta: {
            timestamp: new Date().toISOString()
          }
        });
      } catch (error) {
        return handleApiError(request, reply, error);
      }
    }
  });

  /**
   * @openapi
   * /api/v1/referrals/analytics/funnel:
   *   get:
   *     summary: Get conversion funnel analysis
   *     description: Retrieves analytics for the referral conversion funnel
   *     tags: [Referrals, Analytics]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: period
   *         schema:
   *           type: string
   *           enum: [daily, weekly, monthly, yearly, all]
   *           default: monthly
   *         description: Analysis period
   *     responses:
   *       200:
   *         description: Conversion funnel analysis
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   type: object
   *                   properties:
   *                     total:
   *                       type: integer
   *                     stages:
   *                       type: array
   *                       items:
   *                         type: object
   *                         properties:
   *                           name:
   *                             type: string
   *                           count:
   *                             type: integer
   *                           conversionRate:
   *                             type: number
   *                           dropOff:
   *                             type: integer
   *                     overallConversion:
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
   *         description: Forbidden - Insufficient permissions
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  fastify.get<{ Querystring: AnalyticsPeriodQuery }>('/analytics/funnel', {
    schema: {
      tags: ['Referrals', 'Analytics'],
      querystring: {
        type: 'object',
        properties: {
          period: { 
            type: 'string',
            enum: ['daily', 'weekly', 'monthly', 'yearly', 'all'],
            default: 'monthly'
          }
        }
      }
    },
    handler: async (request: FastifyRequest<{ Querystring: AnalyticsPeriodQuery }>, reply: FastifyReply) => {
      try {
        // Check for admin permission
        const isAdmin = request.user?.isAdmin === true;
        if (!isAdmin) {
          return reply.code(403).send({
            data: null,
            meta: { timestamp: new Date().toISOString() },
            errors: [{ code: 'FORBIDDEN', message: 'Admin permission required' }]
          });
        }
        
        // Get period from query
        const period = request.query.period || 'monthly';
        
        // Get analytics service
        const analyticsService = getReferralAnalyticsService();
        
        // Get funnel analysis
        const funnel = await analyticsService.getConversionFunnelAnalysis(period);
        
        // Send response
        return reply.code(200).send({
          data: funnel,
          meta: {
            timestamp: new Date().toISOString()
          }
        });
      } catch (error) {
        return handleApiError(request, reply, error);
      }
    }
  });

  /**
   * @openapi
   * /api/v1/referrals/analytics/report:
   *   post:
   *     summary: Generate referral report
   *     description: Generates a comprehensive referral performance report for the specified date range
   *     tags: [Referrals, Analytics]
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
   *                 required: [startDate, endDate]
   *                 properties:
   *                   startDate:
   *                     type: string
   *                     format: date
   *                   endDate:
   *                     type: string
   *                     format: date
   *     responses:
   *       200:
   *         description: Referral report
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   type: object
   *                   properties:
   *                     startDate:
   *                       type: string
   *                       format: date
   *                     endDate:
   *                       type: string
   *                       format: date
   *                     summary:
   *                       type: object
   *                       properties:
   *                         totalReferrals:
   *                           type: integer
   *                         newReferrers:
   *                           type: integer
   *                         totalRewards:
   *                           type: integer
   *                         conversionRate:
   *                           type: number
   *                 meta:
   *                   type: object
   *                   properties:
   *                     timestamp:
   *                       type: string
   *                       format: date-time
   *       400:
   *         description: Invalid request
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       401:
   *         description: Unauthorized
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       403:
   *         description: Forbidden - Insufficient permissions
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  fastify.post<{ Body: ReportRangeBody }>('/analytics/report', {
    schema: {
      tags: ['Referrals', 'Analytics'],
      body: {
        type: 'object',
        required: ['data'],
        properties: {
          data: {
            type: 'object',
            required: ['startDate', 'endDate'],
            properties: {
              startDate: { type: 'string', format: 'date' },
              endDate: { type: 'string', format: 'date' }
            }
          }
        }
      }
    },
    handler: async (request: FastifyRequest<{ Body: ReportRangeBody }>, reply: FastifyReply) => {
      try {
        // Check for admin permission
        const isAdmin = request.user?.isAdmin === true;
        if (!isAdmin) {
          return reply.code(403).send({
            data: null,
            meta: { timestamp: new Date().toISOString() },
            errors: [{ code: 'FORBIDDEN', message: 'Admin permission required' }]
          });
        }
        
        // Get date range from body
        const { startDate, endDate } = request.body.data;
        
        // Parse dates
        const parsedStartDate = new Date(startDate);
        const parsedEndDate = new Date(endDate);
        
        // Validate date range
        if (parsedStartDate > parsedEndDate) {
          return reply.code(400).send({
            data: null,
            meta: { timestamp: new Date().toISOString() },
            errors: [{ 
              code: 'VALIDATION_ERROR', 
              message: 'Start date must be before end date' 
            }]
          });
        }
        
        // Get analytics service
        const analyticsService = getReferralAnalyticsService();
        
        // Generate report
        const report = await analyticsService.generateReferralReport(
          parsedStartDate,
          parsedEndDate
        );
        
        // Send response
        return reply.code(200).send({
          data: report,
          meta: {
            timestamp: new Date().toISOString()
          }
        });
      } catch (error) {
        return handleApiError(request, reply, error);
      }
    }
  });

  /**
   * @openapi
   * /api/v1/referrals/analytics/trends:
   *   get:
   *     summary: Get referral trends
   *     description: Retrieves trend data for referral growth analysis
   *     tags: [Referrals, Analytics]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Referral trends
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   type: object
   *                   properties:
   *                     daily:
   *                       type: array
   *                       items:
   *                         type: object
   *                         properties:
   *                           date:
   *                             type: string
   *                           referrals:
   *                             type: integer
   *                           rewards:
   *                             type: integer
   *                     weekly:
   *                       type: array
   *                       items:
   *                         type: object
   *                         properties:
   *                           week:
   *                             type: string
   *                           referrals:
   *                             type: integer
   *                           rewards:
   *                             type: integer
   *                     yearlyGrowth:
   *                       type: number
   *                     monthlyGrowth:
   *                       type: number
   *                     weeklyGrowth:
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
   *         description: Forbidden - Insufficient permissions
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  fastify.get('/analytics/trends', {
    schema: {
      tags: ['Referrals', 'Analytics']
    },
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        // Check for admin permission
        const isAdmin = request.user?.isAdmin === true;
        if (!isAdmin) {
          return reply.code(403).send({
            data: null,
            meta: { timestamp: new Date().toISOString() },
            errors: [{ code: 'FORBIDDEN', message: 'Admin permission required' }]
          });
        }
        
        // Get analytics service
        const analyticsService = getReferralAnalyticsService();
        
        // Get trends
        const trends = await analyticsService.getReferralTrends();
        
        // Send response
        return reply.code(200).send({
          data: trends,
          meta: {
            timestamp: new Date().toISOString()
          }
        });
      } catch (error) {
        return handleApiError(request, reply, error);
      }
    }
  });
}
