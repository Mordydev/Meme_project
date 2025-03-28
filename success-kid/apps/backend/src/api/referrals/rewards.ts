/**
 * Referral Rewards Routes
 * 
 * Routes for managing referral rewards
 */
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { getReferralRewardService, getReferralRateLimiter } from '../../services/referral';
import { handleApiError } from '../../errors';

/**
 * Interface for checking milestones body
 */
interface CheckMilestonesBody {
  data: {
    refereeId: string;
  };
}

/**
 * Interface for processing milestone body
 */
interface ProcessMilestoneBody {
  data: {
    referralId: string;
    type: string;
  };
}

/**
 * Interface for reward history query
 */
interface RewardHistoryQuery {
  limit?: number;
  offset?: number;
}

/**
 * Register referral reward routes
 */
export default function routes(fastify: FastifyInstance) {
  /**
   * @openapi
   * /api/v1/referrals/rewards/history:
   *   get:
   *     summary: Get reward history
   *     description: Retrieves the user's referral reward history
   *     tags: [Referrals, Rewards]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 20
   *         description: Maximum number of records to return
   *       - in: query
   *         name: offset
   *         schema:
   *           type: integer
   *           default: 0
   *         description: Number of records to skip
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
   *                     properties:
   *                       id:
   *                         type: string
   *                       referralId:
   *                         type: string
   *                       refereeId:
   *                         type: string
   *                       type:
   *                         type: string
   *                       pointsAmount:
   *                         type: integer
   *                       createdAt:
   *                         type: string
   *                         format: date-time
   *                       status:
   *                         type: string
   *                 meta:
   *                   type: object
   *                   properties:
   *                     timestamp:
   *                       type: string
   *                       format: date-time
   *                 pagination:
   *                   type: object
   *                   properties:
   *                     limit:
   *                       type: integer
   *                     offset:
   *                       type: integer
   *                     total:
   *                       type: integer
   *                     hasMore:
   *                       type: boolean
   *       401:
   *         description: Unauthorized
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  fastify.get<{ Querystring: RewardHistoryQuery }>('/rewards/history', {
    schema: {
      tags: ['Referrals', 'Rewards'],
      querystring: {
        type: 'object',
        properties: {
          limit: { type: 'integer', default: 20 },
          offset: { type: 'integer', default: 0 }
        }
      }
    },
    handler: async (request: FastifyRequest<{ Querystring: RewardHistoryQuery }>, reply: FastifyReply) => {
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
        
        // Get query parameters
        const limit = request.query.limit || 20;
        const offset = request.query.offset || 0;
        
        // Get reward service
        const rewardService = getReferralRewardService();
        
        // Get reward history
        const history = await rewardService.getRewardHistory(userId, limit, offset);
        
        // Calculate total (in a real implementation, this would be a separate query)
        const total = history.length + offset;
        
        // Send response
        return reply.code(200).send({
          data: history,
          meta: {
            timestamp: new Date().toISOString()
          },
          pagination: {
            limit,
            offset,
            total,
            hasMore: history.length === limit
          }
        });
      } catch (error) {
        return handleApiError(request, reply, error);
      }
    }
  });

  /**
   * @openapi
   * /api/v1/referrals/rewards/milestones:
   *   post:
   *     summary: Check referral milestones
   *     description: Checks for eligible milestones for a referred user
   *     tags: [Referrals, Rewards]
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
   *                 required: [refereeId]
   *                 properties:
   *                   refereeId:
   *                     type: string
   *     responses:
   *       200:
   *         description: Milestone check results
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
   *                       milestone:
   *                         type: string
   *                       eligible:
   *                         type: boolean
   *                       processed:
   *                         type: boolean
   *                       reason:
   *                         type: string
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
   */
  fastify.post<{ Body: CheckMilestonesBody }>('/rewards/milestones', {
    schema: {
      tags: ['Referrals', 'Rewards'],
      body: {
        type: 'object',
        required: ['data'],
        properties: {
          data: {
            type: 'object',
            required: ['refereeId'],
            properties: {
              refereeId: { type: 'string' }
            }
          }
        }
      }
    },
    handler: async (request: FastifyRequest<{ Body: CheckMilestonesBody }>, reply: FastifyReply) => {
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
        
        // Get request data
        const { refereeId } = request.body.data;
        
        // Get reward service
        const rewardService = getReferralRewardService();
        
        // Check milestones
        const milestones = await rewardService.checkReferralMilestones(refereeId);
        
        // Send response
        return reply.code(200).send({
          data: milestones,
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
   * /api/v1/referrals/rewards/process:
   *   post:
   *     summary: Process eligible milestones
   *     description: Processes all eligible milestones for a referred user
   *     tags: [Referrals, Rewards]
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
   *                 required: [refereeId]
   *                 properties:
   *                   refereeId:
   *                     type: string
   *     responses:
   *       200:
   *         description: Processing results
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   type: object
   *                   properties:
   *                     processed:
   *                       type: array
   *                       items:
   *                         type: string
   *                     failed:
   *                       type: array
   *                       items:
   *                         type: string
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
   *       429:
   *         description: Rate limit exceeded
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  fastify.post<{ Body: CheckMilestonesBody }>('/rewards/process', {
    schema: {
      tags: ['Referrals', 'Rewards'],
      body: {
        type: 'object',
        required: ['data'],
        properties: {
          data: {
            type: 'object',
            required: ['refereeId'],
            properties: {
              refereeId: { type: 'string' }
            }
          }
        }
      }
    },
    handler: async (request: FastifyRequest<{ Body: CheckMilestonesBody }>, reply: FastifyReply) => {
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
        
        // Check rate limits
        const rateLimiter = getReferralRateLimiter();
        const rateLimit = await rateLimiter.enforceRateLimit(userId, 'reward_redemption');
        
        if (!rateLimit.allowed) {
          return reply.code(429).send({
            data: null,
            meta: {
              timestamp: new Date().toISOString(),
              resetTime: rateLimit.resetTime
            },
            errors: [{
              code: 'RATE_LIMIT_EXCEEDED',
              message: 'Rate limit exceeded for reward processing'
            }]
          });
        }
        
        // Get request data
        const { refereeId } = request.body.data;
        
        // Get reward service
        const rewardService = getReferralRewardService();
        
        // Process eligible milestones
        const results = await rewardService.processEligibleMilestones(refereeId);
        
        // Send response
        return reply.code(200).send({
          data: results,
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
   * /api/v1/referrals/rewards/process-specific:
   *   post:
   *     summary: Process specific reward
   *     description: Processes a specific reward for a referral
   *     tags: [Referrals, Rewards]
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
   *                 required: [referralId, type]
   *                 properties:
   *                   referralId:
   *                     type: string
   *                   type:
   *                     type: string
   *                     enum: [signup, engagement, wallet_connection, points_milestone]
   *     responses:
   *       200:
   *         description: Processing result
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
   *                     rewardId:
   *                       type: string
   *                     alreadyProcessed:
   *                       type: boolean
   *                     conditionsNotMet:
   *                       type: boolean
   *                     error:
   *                       type: string
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
   *       429:
   *         description: Rate limit exceeded
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  fastify.post<{ Body: ProcessMilestoneBody }>('/rewards/process-specific', {
    schema: {
      tags: ['Referrals', 'Rewards'],
      body: {
        type: 'object',
        required: ['data'],
        properties: {
          data: {
            type: 'object',
            required: ['referralId', 'type'],
            properties: {
              referralId: { type: 'string' },
              type: { 
                type: 'string', 
                enum: ['signup', 'engagement', 'wallet_connection', 'points_milestone']
              }
            }
          }
        }
      }
    },
    handler: async (request: FastifyRequest<{ Body: ProcessMilestoneBody }>, reply: FastifyReply) => {
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
        
        // Get request data
        const { referralId, type } = request.body.data;
        
        // Get reward service
        const rewardService = getReferralRewardService();
        
        // Process the reward
        const result = await rewardService.processReferralReward(referralId, type);
        
        // Send response
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
  });

  /**
   * @openapi
   * /api/v1/referrals/rewards/calculate:
   *   get:
   *     summary: Calculate rewards
   *     description: Calculates reward summary for a user
   *     tags: [Referrals, Rewards]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Reward summary
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   type: object
   *                   properties:
   *                     totalRewards:
   *                       type: integer
   *                     pendingRewards:
   *                       type: integer
   *                     processedRewards:
   *                       type: integer
   *                     totalPointsEarned:
   *                       type: integer
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
  fastify.get('/rewards/calculate', {
    schema: {
      tags: ['Referrals', 'Rewards']
    },
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
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
        
        // Get reward service
        const rewardService = getReferralRewardService();
        
        // Calculate rewards
        const rewards = await rewardService.calculateRewards(userId);
        
        // Send response
        return reply.code(200).send({
          data: rewards,
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
