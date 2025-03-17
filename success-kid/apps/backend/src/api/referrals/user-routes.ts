/**
 * Referral User Routes
 * 
 * API routes for user referral statistics, rewards, and network
 */
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { createReferralServices } from '../../services/referrals';
import { 
  referralStatsSchema, 
  referralConversionsSchema, 
  rewardHistorySchema, 
  processRewardSchema,
  referralNetworkSchema
} from './schemas';
import { handleApiError } from '../../lib/errors';

export default async function referralUserRoutes(fastify: FastifyInstance) {
  const { pointsService } = fastify.services;
  const { referralService } = createReferralServices(fastify.db, pointsService);

  /**
   * Get user's referral statistics
   * 
   * @openapi
   * /api/v1/referrals/stats:
   *   get:
   *     summary: Get user's referral statistics
   *     tags: [Referrals]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Referral statistics
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   type: object
   *                   properties:
   *                     totalVisits:
   *                       type: number
   *                     uniqueVisitors:
   *                       type: number
   *                     conversions:
   *                       type: number
   *                     conversionRate:
   *                       type: number
   *                     totalRewards:
   *                       type: number
   *                     totalPointsAwarded:
   *                       type: number
   *                     pendingRewards:
   *                       type: number
   *                     rewardsHistory:
   *                       type: object
   */
  fastify.get(
    '/stats',
    {
      schema: referralStatsSchema,
      onRequest: [fastify.authenticate]
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const userId = request.user.id;
        const stats = await referralService.getReferralStatistics(userId);

        return reply.code(200).send({
          data: stats,
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
   * Get user's referral conversions
   * 
   * @openapi
   * /api/v1/referrals/conversions:
   *   get:
   *     summary: Get user's referral conversions
   *     tags: [Referrals]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - name: limit
   *         in: query
   *         schema:
   *           type: number
   *           default: 20
   *       - name: offset
   *         in: query
   *         schema:
   *           type: number
   *           default: 0
   *     responses:
   *       200:
   *         description: Referral conversions
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   type: array
   *                   items:
   *                     type: object
   *                 pagination:
   *                   type: object
   */
  fastify.get(
    '/conversions',
    {
      schema: referralConversionsSchema,
      onRequest: [fastify.authenticate]
    },
    async (request: FastifyRequest<{
      Querystring: { limit?: number; offset?: number }
    }>, reply: FastifyReply) => {
      try {
        const userId = request.user.id;
        const { limit = 20, offset = 0 } = request.query;

        const result = await referralService.getReferralConversions(userId, { limit, offset });

        return reply.code(200).send({
          data: result.data,
          meta: {
            timestamp: new Date().toISOString()
          },
          pagination: result.pagination
        });
      } catch (error) {
        return handleApiError(request, reply, error);
      }
    }
  );

  /**
   * Get user's reward history
   * 
   * @openapi
   * /api/v1/referrals/rewards:
   *   get:
   *     summary: Get user's reward history
   *     tags: [Referrals]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - name: limit
   *         in: query
   *         schema:
   *           type: number
   *           default: 20
   *       - name: offset
   *         in: query
   *         schema:
   *           type: number
   *           default: 0
   *       - name: status
   *         in: query
   *         schema:
   *           type: string
   *           enum: [pending, processed, rejected]
   *     responses:
   *       200:
   *         description: Reward history
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   type: array
   *                   items:
   *                     type: object
   *                 pagination:
   *                   type: object
   */
  fastify.get(
    '/rewards',
    {
      schema: rewardHistorySchema,
      onRequest: [fastify.authenticate]
    },
    async (request: FastifyRequest<{
      Querystring: { 
        limit?: number; 
        offset?: number;
        status?: string | string[];
      }
    }>, reply: FastifyReply) => {
      try {
        const userId = request.user.id;
        const { limit = 20, offset = 0, status } = request.query;

        const result = await referralService.getRewardHistory(userId, { 
          limit, 
          offset,
          status: status as any
        });

        return reply.code(200).send({
          data: result.data,
          meta: {
            timestamp: new Date().toISOString()
          },
          pagination: result.pagination
        });
      } catch (error) {
        return handleApiError(request, reply, error);
      }
    }
  );

  /**
   * Process a referral reward (admin only)
   * 
   * @openapi
   * /api/v1/referrals/process-reward:
   *   post:
   *     summary: Process a referral reward (admin only)
   *     tags: [Referrals]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [referralId, type]
   *             properties:
   *               referralId:
   *                 type: string
   *               type:
   *                 type: string
   *                 enum: [signup, engagement, wallet_connection, points_milestone]
   *     responses:
   *       200:
   *         description: Reward processing result
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
   */
  fastify.post(
    '/process-reward',
    {
      schema: processRewardSchema,
      onRequest: [fastify.authenticate, fastify.authorizeAdmin]
    },
    async (request: FastifyRequest<{
      Body: {
        referralId: string;
        type: 'signup' | 'engagement' | 'wallet_connection' | 'points_milestone';
      }
    }>, reply: FastifyReply) => {
      try {
        const { referralId, type } = request.body;
        const result = await referralService.processReferralReward(referralId, type);

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
   * Get user's referral network
   * 
   * @openapi
   * /api/v1/referrals/network:
   *   get:
   *     summary: Get user's referral network
   *     tags: [Referrals]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - name: levels
   *         in: query
   *         schema:
   *           type: number
   *           default: 1
   *     responses:
   *       200:
   *         description: Referral network
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
   *                     level:
   *                       type: number
   *                     children:
   *                       type: array
   *                     totalReferrals:
   *                       type: number
   *                     activeReferrals:
   *                       type: number
   */
  fastify.get(
    '/network',
    {
      schema: referralNetworkSchema,
      onRequest: [fastify.authenticate]
    },
    async (request: FastifyRequest<{
      Querystring: { levels?: number }
    }>, reply: FastifyReply) => {
      try {
        const userId = request.user.id;
        const { levels = 1 } = request.query;

        const network = await referralService.getUserReferralNetwork(userId, levels);

        return reply.code(200).send({
          data: network,
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
   * Check if user was referred
   * 
   * @openapi
   * /api/v1/referrals/was-referred:
   *   get:
   *     summary: Check if user was referred
   *     tags: [Referrals]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Referral information
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   type: object
   *                   properties:
   *                     wasReferred:
   *                       type: boolean
   *                     referrerId:
   *                       type: string
   *                     referralCode:
   *                       type: string
   */
  fastify.get(
    '/was-referred',
    {
      onRequest: [fastify.authenticate]
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const userId = request.user.id;
        const result = await referralService.wasUserReferred(userId);

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
