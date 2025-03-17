/**
 * Points API Routes
 * 
 * Handles API endpoints for user points operations
 */
import { FastifyPluginAsync } from 'fastify';
import { createUserPointsSchema, PointsSourceEnum } from '../../models/user-points';
import { validate } from '../../middleware/validation';
import { z } from 'zod';
import { 
  getPointsBalance, 
  getPointsHistory, 
  awardPoints, 
  getDailyCaps,
  getRedemptionEligibility,
  redeemPoints
} from './handlers';
import {
  getFlaggedRedemptions,
  reviewRedemption,
  getRedemptionStats,
  getRedemptionById
} from './admin-handlers';
import transactionVerification from '../../middleware/transaction-verification';
import { checkAdminAccess } from '../../middleware/auth';

// Request schemas
const getUserPointsQuerySchema = z.object({
  limit: z.string().transform(val => parseInt(val, 10)).pipe(z.number().int().min(1).max(100)).optional(),
  offset: z.string().transform(val => parseInt(val, 10)).pipe(z.number().int().min(0)).optional(),
  source: PointsSourceEnum.optional()
});

const getUserPointsParamsSchema = z.object({
  userId: z.string()
});

const awardPointsSchema = z.object({
  userId: z.string(),
  amount: z.number().int().positive(),
  source: PointsSourceEnum,
  referenceId: z.string().optional(),
  description: z.string().optional(),
  skipVerification: z.boolean().optional(),
  skipCaps: z.boolean().optional()
});

const redeemPointsSchema = z.object({
  userId: z.string(),
  amount: z.number().int().min(1000),
  walletAddress: z.string().optional()
});

const reviewRedemptionSchema = z.object({
  action: z.enum(['approve', 'reject']),
  reason: z.string().min(5)
});

const redemptionIdParamSchema = z.object({
  id: z.string().uuid()
});

const flaggedRedemptionsQuerySchema = z.object({
  limit: z.string().transform(val => parseInt(val, 10)).pipe(z.number().int().min(1).max(100)).optional(),
  offset: z.string().transform(val => parseInt(val, 10)).pipe(z.number().int().min(0)).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional()
});

const redemptionStatsQuerySchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional()
});

// Route plugin
const pointsRoutes: FastifyPluginAsync = async (fastify) => {
  // Register transaction verification for idempotency
  fastify.register(async (instance) => {
    instance.addHook('preHandler', transactionVerification);
    
    /**
     * POST /api/v1/points/award
     * Award points to a user
     */
    instance.post(
      '/points/award',
      {
        preHandler: [
          validate(awardPointsSchema)
        ]
      },
      awardPoints
    );
    
    /**
     * POST /api/v1/points/redeem
     * Redeem points for tokens
     */
    instance.post(
      '/points/redeem',
      {
        preHandler: [
          validate(redeemPointsSchema)
        ]
      },
      redeemPoints
    );
  });
  
  /**
   * GET /api/v1/points/balance/:userId
   * Get user points balance
   */
  fastify.get(
    '/points/balance/:userId',
    {
      preHandler: [
        validate(getUserPointsParamsSchema, { source: 'params' })
      ]
    },
    getPointsBalance
  );
  
  /**
   * GET /api/v1/points/history/:userId
   * Get user points history
   */
  fastify.get(
    '/points/history/:userId',
    {
      preHandler: [
        validate(getUserPointsParamsSchema, { source: 'params' }),
        validate(getUserPointsQuerySchema, { source: 'query' })
      ]
    },
    getPointsHistory
  );
  
  /**
   * GET /api/v1/points/caps/:userId
   * Get daily caps status for a user
   */
  fastify.get(
    '/points/caps/:userId',
    {
      preHandler: [
        validate(getUserPointsParamsSchema, { source: 'params' })
      ]
    },
    getDailyCaps
  );
  
  /**
   * GET /api/v1/points/redemption/eligibility/:userId
   * Get redemption eligibility for a user
   */
  fastify.get(
    '/points/redemption/eligibility/:userId',
    {
      preHandler: [
        validate(getUserPointsParamsSchema, { source: 'params' })
      ]
    },
    getRedemptionEligibility
  );
  
  /**
   * GET /api/v1/leaderboard/points
   * Get points leaderboard
   */
  fastify.get(
    '/leaderboard/points',
    {
      schema: {
        querystring: {
          timeframe: { type: 'string', enum: ['day', 'week', 'month', 'all'] },
          limit: { type: 'integer', minimum: 1, maximum: 100 },
          offset: { type: 'integer', minimum: 0 }
        }
      }
    },
    async (request, reply) => {
      const query = request.query as any;
      const { timeframe = 'all', limit = 10, offset = 0 } = query;
      
      const { userPoints } = fastify.db.repositories;
      
      // Get leaderboard
      const leaderboard = await userPoints.getPointsLeaderboard({
        timeframe,
        limit,
        offset
      });
      
      return reply.send({
        data: {
          leaderboard,
          timeframe
        }
      });
    }
  );
  
  // Admin routes for redemption management
  fastify.register(async (instance) => {
    // Add admin access check to all routes in this plugin
    instance.addHook('preHandler', checkAdminAccess('points:admin'));
    
    /**
     * GET /api/v1/admin/points/redemptions/flagged
     * Get all flagged redemptions for admin review
     */
    instance.get(
      '/admin/points/redemptions/flagged',
      {
        preHandler: [
          validate(flaggedRedemptionsQuerySchema, { source: 'query' })
        ]
      },
      getFlaggedRedemptions
    );
    
    /**
     * POST /api/v1/admin/points/redemptions/:id/review
     * Review a flagged redemption (approve or reject)
     */
    instance.post(
      '/admin/points/redemptions/:id/review',
      {
        preHandler: [
          validate(redemptionIdParamSchema, { source: 'params' }),
          validate(reviewRedemptionSchema)
        ]
      },
      reviewRedemption
    );
    
    /**
     * GET /api/v1/admin/points/redemptions/stats
     * Get redemption statistics
     */
    instance.get(
      '/admin/points/redemptions/stats',
      {
        preHandler: [
          validate(redemptionStatsQuerySchema, { source: 'query' })
        ]
      },
      getRedemptionStats
    );
    
    /**
     * GET /api/v1/admin/points/redemptions/:id
     * Get detailed redemption information
     */
    instance.get(
      '/admin/points/redemptions/:id',
      {
        preHandler: [
          validate(redemptionIdParamSchema, { source: 'params' })
        ]
      },
      getRedemptionById
    );
  });
};

export default pointsRoutes;
