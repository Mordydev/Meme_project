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
import transactionVerification from '../../middleware/transaction-verification';

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
};

export default pointsRoutes;
