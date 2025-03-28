/**
 * Referral Network Routes
 * 
 * Routes for multi-level referral network functionality
 */
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { getReferralNetworkService } from '../../services/referral';
import { handleApiError } from '../../errors';

/**
 * Interface for network query parameters
 */
interface NetworkQuery {
  depth?: number;
}

/**
 * Interface for referral path parameters
 */
interface PathParams {
  userId: string;
}

/**
 * Interface for network rewards body
 */
interface NetworkRewardsBody {
  data: {
    referralId: string;
    baseReward?: number;
  };
}

/**
 * Register referral network routes
 */
export default function routes(fastify: FastifyInstance) {
  /**
   * @openapi
   * /api/v1/referrals/network/tree:
   *   get:
   *     summary: Get referral network tree
   *     description: Retrieves the user's complete referral network as a tree structure
   *     tags: [Referrals, Network]
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
   *         description: Referral network tree
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
  fastify.get<{ Querystring: NetworkQuery }>('/network/tree', {
    schema: {
      tags: ['Referrals', 'Network'],
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
    handler: async (request: FastifyRequest<{ Querystring: NetworkQuery }>, reply: FastifyReply) => {
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
        
        // Get network service
        const networkService = getReferralNetworkService();
        
        // Get network tree
        const network = await networkService.getUserReferralNetwork(userId, depth);
        
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
   * /api/v1/referrals/network/path/{userId}:
   *   get:
   *     summary: Get referral path
   *     description: Retrieves the referral path between the authenticated user and the specified user
   *     tags: [Referrals, Network]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: userId
   *         required: true
   *         schema:
   *           type: string
   *         description: User ID to find path to
   *     responses:
   *       200:
   *         description: Referral path
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   type: object
   *                   properties:
   *                     path:
   *                       type: array
   *                       items:
   *                         type: object
   *                         properties:
   *                           userId:
   *                             type: string
   *                           level:
   *                             type: integer
   *                           referralDate:
   *                             type: string
   *                             format: date-time
   *                     length:
   *                       type: integer
   *                     found:
   *                       type: boolean
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
   *       404:
   *         description: Path not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  fastify.get<{ Params: PathParams }>('/network/path/:userId', {
    schema: {
      tags: ['Referrals', 'Network'],
      params: {
        type: 'object',
        required: ['userId'],
        properties: {
          userId: { type: 'string' }
        }
      }
    },
    handler: async (request: FastifyRequest<{ Params: PathParams }>, reply: FastifyReply) => {
      try {
        // Get current user ID from authentication
        const userId = request.user?.id;
        if (!userId) {
          return reply.code(401).send({
            data: null,
            meta: { timestamp: new Date().toISOString() },
            errors: [{ code: 'UNAUTHORIZED', message: 'Authentication required' }]
          });
        }
        
        // Get target user ID from path
        const targetUserId = request.params.userId;
        
        // Get network service
        const networkService = getReferralNetworkService();
        
        // Get referral path
        const path = await networkService.getReferralPath(userId, targetUserId);
        
        // Check if path was found
        if (!path.found) {
          return reply.code(404).send({
            data: null,
            meta: { timestamp: new Date().toISOString() },
            errors: [{ 
              code: 'NOT_FOUND', 
              message: 'No referral path found between the users' 
            }]
          });
        }
        
        // Send response
        return reply.code(200).send({
          data: path,
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
   * /api/v1/referrals/network/upline:
   *   get:
   *     summary: Get referral upline
   *     description: Retrieves the user's referral path going up the chain (referrers)
   *     tags: [Referrals, Network]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: depth
   *         schema:
   *           type: integer
   *           default: 3
   *           minimum: 1
   *           maximum: 5
   *         description: Maximum depth of the upline to retrieve
   *     responses:
   *       200:
   *         description: Referral upline
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   type: object
   *                   properties:
   *                     path:
   *                       type: array
   *                       items:
   *                         type: object
   *                         properties:
   *                           userId:
   *                             type: string
   *                           level:
   *                             type: integer
   *                           referralDate:
   *                             type: string
   *                             format: date-time
   *                     length:
   *                       type: integer
   *                     found:
   *                       type: boolean
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
  fastify.get<{ Querystring: NetworkQuery }>('/network/upline', {
    schema: {
      tags: ['Referrals', 'Network'],
      querystring: {
        type: 'object',
        properties: {
          depth: {
            type: 'integer',
            default: 3,
            minimum: 1,
            maximum: 5
          }
        }
      }
    },
    handler: async (request: FastifyRequest<{ Querystring: NetworkQuery }>, reply: FastifyReply) => {
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
        const depth = request.query.depth || 3;
        
        // Get network service
        const networkService = getReferralNetworkService();
        
        // Get referral upline
        const upline = await networkService.getReferralUpline(userId, depth);
        
        // Send response
        return reply.code(200).send({
          data: upline,
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
   * /api/v1/referrals/network/rewards:
   *   get:
   *     summary: Calculate network rewards
   *     description: Calculates potential network rewards for the user
   *     tags: [Referrals, Network]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: depth
   *         schema:
   *           type: integer
   *           default: 3
   *           minimum: 1
   *           maximum: 3
   *         description: Maximum depth to calculate rewards for
   *     responses:
   *       200:
   *         description: Network rewards
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   type: object
   *                   properties:
   *                     totalRewards:
   *                       type: number
   *                     byLevel:
   *                       type: array
   *                       items:
   *                         type: object
   *                         properties:
   *                           level:
   *                             type: integer
   *                           count:
   *                             type: integer
   *                           points:
   *                             type: number
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
  fastify.get<{ Querystring: NetworkQuery }>('/network/rewards', {
    schema: {
      tags: ['Referrals', 'Network'],
      querystring: {
        type: 'object',
        properties: {
          depth: {
            type: 'integer',
            default: 3,
            minimum: 1,
            maximum: 3
          }
        }
      }
    },
    handler: async (request: FastifyRequest<{ Querystring: NetworkQuery }>, reply: FastifyReply) => {
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
        const depth = request.query.depth || 3;
        
        // Get network service
        const networkService = getReferralNetworkService();
        
        // Calculate network rewards
        const rewards = await networkService.calculateNetworkRewards(userId, depth);
        
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

  /**
   * @openapi
   * /api/v1/referrals/network/process-reward:
   *   post:
   *     summary: Process network reward
   *     description: Processes multi-level network rewards for a referral
   *     tags: [Referrals, Network]
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
   *                 required: [referralId]
   *                 properties:
   *                   referralId:
   *                     type: string
   *                   baseReward:
   *                     type: integer
   *                     default: 500
   *     responses:
   *       200:
   *         description: Network reward result
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
   *                     rewardedLevels:
   *                       type: array
   *                       items:
   *                         type: integer
   *                     totalPoints:
   *                       type: integer
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
   */
  fastify.post<{ Body: NetworkRewardsBody }>('/network/process-reward', {
    schema: {
      tags: ['Referrals', 'Network'],
      body: {
        type: 'object',
        required: ['data'],
        properties: {
          data: {
            type: 'object',
            required: ['referralId'],
            properties: {
              referralId: { type: 'string' },
              baseReward: { type: 'integer', default: 500 }
            }
          }
        }
      }
    },
    handler: async (request: FastifyRequest<{ Body: NetworkRewardsBody }>, reply: FastifyReply) => {
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
        const { referralId, baseReward = 500 } = request.body.data;
        
        // Get network service
        const networkService = getReferralNetworkService();
        
        // Process network reward
        const result = await networkService.processNetworkReward(referralId, baseReward);
        
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
}
