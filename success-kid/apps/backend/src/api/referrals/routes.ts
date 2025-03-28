/**
 * Referral Routes
 * 
 * Routes for core referral functionality
 */
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { getReferralService, getReferralRateLimiter } from '../../services/referral';
import { handleApiError } from '../../errors';

/**
 * Interface for getReferrals query params
 */
interface GetReferralsQuery {
  limit?: number;
  offset?: number;
  status?: string;
}

/**
 * Interface for createReferral body
 */
interface CreateReferralBody {
  data: {
    referredId: string;
    referralCode?: string;
    source?: string;
    metadata?: Record<string, any>;
  };
}

/**
 * Interface for processReferralMilestone body
 */
interface ProcessMilestoneBody {
  data: {
    referredId: string;
    milestone: string;
  };
}

/**
 * Register referral routes
 */
export default function routes(fastify: FastifyInstance) {
  /**
   * @openapi
   * /api/v1/referrals/mine:
   *   get:
   *     summary: Get user's referrals
   *     description: Retrieves referrals made by the authenticated user
   *     tags: [Referrals]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 20
   *         description: Maximum number of referrals to return
   *       - in: query
   *         name: offset
   *         schema:
   *           type: integer
   *           default: 0
   *         description: Number of referrals to skip
   *       - in: query
   *         name: status
   *         schema:
   *           type: string
   *           enum: [pending, completed, converted, rewarded, expired, invalid]
   *         description: Filter by referral status
   *     responses:
   *       200:
   *         description: User's referrals
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
   *                         format: uuid
   *                       referredId:
   *                         type: string
   *                         format: uuid
   *                       status:
   *                         type: string
   *                         enum: [pending, completed, converted, rewarded, expired, invalid]
   *                       createdAt:
   *                         type: string
   *                         format: date-time
   *                       convertedAt:
   *                         type: string
   *                         format: date-time
   *                         nullable: true
   *                       rewardedAt:
   *                         type: string
   *                         format: date-time
   *                         nullable: true
   *                       rewardAmount:
   *                         type: integer
   *                         nullable: true
   *                 meta:
   *                   type: object
   *                   properties:
   *                     timestamp:
   *                       type: string
   *                       format: date-time
   *                 pagination:
   *                   type: object
   *                   properties:
   *                     total:
   *                       type: integer
   *                     limit:
   *                       type: integer
   *                     offset:
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
  fastify.get<{ Querystring: GetReferralsQuery }>('/mine', {
    schema: {
      tags: ['Referrals'],
      querystring: {
        type: 'object',
        properties: {
          limit: { type: 'integer', default: 20 },
          offset: { type: 'integer', default: 0 },
          status: { 
            type: 'string',
            enum: ['pending', 'completed', 'converted', 'rewarded', 'expired', 'invalid']
          }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            data: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string', format: 'uuid' },
                  referredId: { type: 'string', format: 'uuid' },
                  status: { 
                    type: 'string', 
                    enum: ['pending', 'completed', 'converted', 'rewarded', 'expired', 'invalid'] 
                  },
                  createdAt: { type: 'string', format: 'date-time' },
                  convertedAt: { type: ['string', 'null'], format: 'date-time' },
                  rewardedAt: { type: ['string', 'null'], format: 'date-time' },
                  rewardAmount: { type: ['integer', 'null'] }
                }
              }
            },
            meta: {
              type: 'object',
              properties: {
                timestamp: { type: 'string', format: 'date-time' }
              }
            },
            pagination: {
              type: 'object',
              properties: {
                total: { type: 'integer' },
                limit: { type: 'integer' },
                offset: { type: 'integer' },
                hasMore: { type: 'boolean' }
              }
            }
          }
        }
      }
    },
    handler: async (request: FastifyRequest<{ Querystring: GetReferralsQuery }>, reply: FastifyReply) => {
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
        
        // Get referral service
        const referralService = getReferralService();
        
        // Get user's referrals
        const referrals = await referralService.getUserReferrals(userId, limit, offset);
        
        // Get total count for pagination
        const stats = await referralService.getUserReferralStats(userId);
        const total = stats.referrals.total;
        
        // Transform referrals for API response
        const transformedReferrals = referrals.map(r => ({
          id: r.id,
          referredId: r.referred_id,
          status: r.status,
          createdAt: r.created_at,
          convertedAt: r.converted_at,
          rewardedAt: r.rewarded_at,
          rewardAmount: r.reward_amount
        }));
        
        // Send response
        return reply.code(200).send({
          data: transformedReferrals,
          meta: {
            timestamp: new Date().toISOString()
          },
          pagination: {
            total,
            limit,
            offset,
            hasMore: offset + referrals.length < total
          }
        });
      } catch (error) {
        return handleApiError(request, reply, error);
      }
    }
  });

  /**
   * @openapi
   * /api/v1/referrals/network:
   *   get:
   *     summary: Get user's referral network
   *     description: Retrieves the user's referral network for visualization
   *     tags: [Referrals]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: depth
   *         schema:
   *           type: integer
   *           default: 2
   *           minimum: 1
   *           maximum: 3
   *         description: Maximum depth of the network to retrieve
   *     responses:
   *       200:
   *         description: User's referral network
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
   *                       type: integer
   *                     children:
   *                       type: array
   *                       items:
   *                         $ref: '#/components/schemas/ReferralNode'
   *                     totalReferrals:
   *                       type: integer
   *                     activeReferrals:
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
  fastify.get<{ Querystring: { depth?: number } }>('/network', {
    schema: {
      tags: ['Referrals'],
      querystring: {
        type: 'object',
        properties: {
          depth: { 
            type: 'integer', 
            default: 2,
            minimum: 1,
            maximum: 3
          }
        }
      }
    },
    handler: async (request: FastifyRequest<{ Querystring: { depth?: number } }>, reply: FastifyReply) => {
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
        
        // Get depth parameter
        const depth = request.query.depth || 2;
        
        // Get referral service
        const referralService = getReferralService();
        
        // Get user's referral network
        const network = await referralService.getUserReferralNetwork(userId, depth);
        
        // Send response
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
  });

  /**
   * @openapi
   * /api/v1/referrals/info:
   *   get:
   *     summary: Get user's referral info
   *     description: Retrieves information about how the user was referred
   *     tags: [Referrals]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: User's referral info
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
   *                       format: uuid
   *                       nullable: true
   *                     referralDate:
   *                       type: string
   *                       format: date-time
   *                       nullable: true
   *                     status:
   *                       type: string
   *                       enum: [pending, completed, converted, rewarded, expired, invalid]
   *                       nullable: true
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
  fastify.get('/info', {
    schema: {
      tags: ['Referrals']
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
        
        // Get referral service
        const referralService = getReferralService();
        
        // Get user's referral info
        const info = await referralService.getUserReferralInfo(userId);
        
        // Send response
        return reply.code(200).send({
          data: info,
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
   * /api/v1/referrals/create:
   *   post:
   *     summary: Create a referral relationship
   *     description: Creates a referral relationship between the authenticated user and another user
   *     tags: [Referrals]
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
   *                 required: [referredId]
   *                 properties:
   *                   referredId:
   *                     type: string
   *                     format: uuid
   *                   referralCode:
   *                     type: string
   *                   source:
   *                     type: string
   *                   metadata:
   *                     type: object
   *     responses:
   *       201:
   *         description: Referral created successfully
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
   *                       format: uuid
   *                     referrerId:
   *                       type: string
   *                       format: uuid
   *                     referredId:
   *                       type: string
   *                       format: uuid
   *                     status:
   *                       type: string
   *                       enum: [pending, completed, converted, rewarded, expired, invalid]
   *                     createdAt:
   *                       type: string
   *                       format: date-time
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
   *       409:
   *         description: Conflict - referral already exists
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  fastify.post<{ Body: CreateReferralBody }>('/create', {
    schema: {
      tags: ['Referrals'],
      body: {
        type: 'object',
        required: ['data'],
        properties: {
          data: {
            type: 'object',
            required: ['referredId'],
            properties: {
              referredId: { type: 'string', format: 'uuid' },
              referralCode: { type: 'string' },
              source: { type: 'string' },
              metadata: { type: 'object' }
            }
          }
        }
      }
    },
    handler: async (request: FastifyRequest<{ Body: CreateReferralBody }>, reply: FastifyReply) => {
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
        
        // Get rate limiter
        const rateLimiter = getReferralRateLimiter();
        
        // Check rate limits
        const rateLimit = await rateLimiter.enforceRateLimit(userId, 'referral_creation');
        if (!rateLimit.allowed) {
          return reply.code(429).send({
            data: null,
            meta: { 
              timestamp: new Date().toISOString(),
              resetTime: rateLimit.resetTime
            },
            errors: [{ 
              code: 'RATE_LIMIT_EXCEEDED', 
              message: 'Rate limit exceeded for referral creation'
            }]
          });
        }
        
        // Get request data
        const { referredId, referralCode, source, metadata } = request.body.data;
        
        // Get referral service
        const referralService = getReferralService();
        
        // Create referral
        const referral = await referralService.createReferral({
          referrer_id: userId,
          referred_id: referredId,
          referral_code: referralCode,
          source: source || 'api',
          metadata
        });
        
        // Send response
        return reply.code(201).send({
          data: {
            id: referral.id,
            referrerId: referral.referrer_id,
            referredId: referral.referred_id,
            status: referral.status,
            createdAt: referral.created_at
          },
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
   * /api/v1/referrals/milestone:
   *   post:
   *     summary: Process a referral milestone
   *     description: Processes a milestone event for a referred user, potentially triggering rewards
   *     tags: [Referrals]
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
   *                 required: [referredId, milestone]
   *                 properties:
   *                   referredId:
   *                     type: string
   *                     format: uuid
   *                   milestone:
   *                     type: string
   *                     enum: [signup_completion, wallet_connection, first_post, first_comment, points_milestone_1000]
   *     responses:
   *       200:
   *         description: Milestone processed successfully
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
   *                     processed:
   *                       type: boolean
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
  fastify.post<{ Body: ProcessMilestoneBody }>('/milestone', {
    schema: {
      tags: ['Referrals'],
      body: {
        type: 'object',
        required: ['data'],
        properties: {
          data: {
            type: 'object',
            required: ['referredId', 'milestone'],
            properties: {
              referredId: { type: 'string', format: 'uuid' },
              milestone: { 
                type: 'string',
                enum: [
                  'signup_completion',
                  'wallet_connection',
                  'first_post',
                  'first_comment',
                  'points_milestone_1000'
                ]
              }
            }
          }
        }
      }
    },
    handler: async (request: FastifyRequest<{ Body: ProcessMilestoneBody }>, reply: FastifyReply) => {
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
        
        // Check if the user is admin or the referred user
        const isAdmin = request.user?.isAdmin === true;
        const isSelfReferral = userId === request.body.data.referredId;
        
        // Only admins can process milestones for other users
        if (!isAdmin && !isSelfReferral) {
          return reply.code(403).send({
            data: null,
            meta: { timestamp: new Date().toISOString() },
            errors: [{ 
              code: 'FORBIDDEN', 
              message: 'You can only process milestones for yourself' 
            }]
          });
        }
        
        // Get request data
        const { referredId, milestone } = request.body.data;
        
        // Get referral service
        const referralService = getReferralService();
        
        // Process milestone
        const processed = await referralService.processReferralMilestone(
          referredId,
          milestone
        );
        
        // Send response
        return reply.code(200).send({
          data: {
            success: true,
            processed
          },
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
