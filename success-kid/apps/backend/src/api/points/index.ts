/**
 * Points API Routes
 * 
 * API endpoints for the Success Points system, including balance checking,
 * transaction history, points awarding, and token redemption.
 */
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { pointsService, redemptionService } from '../../services';
import { handleApiError } from '../../errors';
import { PointsSource } from '../../models/entities/points.model';
import pointsAnalyticsRoutes from './analytics';

/**
 * Request body for awarding points
 */
interface PointsAwardRequest {
  data: {
    amount: number;
    source: PointsSource;
    referenceId?: string;
    description?: string;
  };
}

/**
 * Request body for redeeming points
 */
interface PointsRedeemRequest {
  data: {
    amount: number;
    walletAddress?: string;
  };
}

/**
 * Request params with user ID
 */
interface UserIdParams {
  userId: string;
}

/**
 * Query params for transaction history
 */
interface TransactionQueryParams {
  limit?: number;
  offset?: number;
  source?: string;
}

/**
 * Points API routes
 */
export default async function pointsRoutes(fastify: FastifyInstance) {
  /**
   * @openapi
   * /api/v1/points/balance:
   *   get:
   *     summary: Get user points balance
   *     description: Retrieves the user's current points balance and recent transactions
   *     tags: [Points]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: User points balance
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   type: object
   *                   properties:
   *                     balance:
   *                       type: number
   *                       example: 1250
   *                     transactions:
   *                       type: array
   *                       items:
   *                         type: object
   *                         properties:
   *                           id:
   *                             type: string
   *                             example: "tx_123456"
   *                           amount:
   *                             type: number
   *                             example: 50
   *                           source:
   *                             type: string
   *                             example: "content_creation"
   *                           referenceId:
   *                             type: string
   *                             example: "post_123"
   *                           createdAt:
   *                             type: string
   *                             format: date-time
   *                           description:
   *                             type: string
   *                             example: "Created a new post"
   *                     today:
   *                       type: object
   *                       properties:
   *                         earned:
   *                           type: number
   *                           example: 150
   *                         limits:
   *                           type: object
   *                           additionalProperties:
   *                             type: object
   *                             properties:
   *                               used:
   *                                 type: number
   *                               limit:
   *                                 type: number
   *                               remaining:
   *                                 type: number
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
  fastify.get('/balance', {
    schema: {
      tags: ['Points'],
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
        
        // Get balance and recent transactions
        const balance = await pointsService.getUserBalance(userId);
        const transactions = await pointsService.getUserTransactions(userId, 10);
        
        // Get daily caps
        const caps = await pointsService.getAllDailyCaps(userId);
        
        // Format daily caps for response
        const limits: Record<string, any> = {};
        let todayEarned = 0;
        
        caps.forEach((cap, source) => {
          limits[source] = {
            used: cap.current,
            limit: cap.limit,
            remaining: cap.remaining
          };
          
          todayEarned += cap.current;
        });
        
        // Send response
        return reply.code(200).send({
          data: {
            balance,
            transactions: transactions.map(tx => ({
              id: tx.id,
              amount: tx.amount,
              source: tx.source,
              referenceId: tx.reference_id,
              createdAt: tx.created_at,
              description: tx.description
            })),
            today: {
              earned: todayEarned,
              limits
            }
          },
          meta: {
            timestamp: new Date().toISOString(),
          },
        });
      } catch (error) {
        return handleApiError(request, reply, error);
      }
    },
  });

  /**
   * @openapi
   * /api/v1/points/transactions:
   *   get:
   *     summary: Get points transaction history
   *     description: Retrieves the user's points transaction history with pagination
   *     tags: [Points]
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
   *       - in: query
   *         name: source
   *         schema:
   *           type: string
   *         description: Filter by transaction source
   *     responses:
   *       200:
   *         description: Points transaction history
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
   *                         type: number
   *                       source:
   *                         type: string
   *                       referenceId:
   *                         type: string
   *                       createdAt:
   *                         type: string
   *                         format: date-time
   *                       description:
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
   *                     total:
   *                       type: number
   *                     limit:
   *                       type: number
   *                     offset:
   *                       type: number
   *                     hasMore:
   *                       type: boolean
   *       401:
   *         description: Unauthorized
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  fastify.get<{ Querystring: TransactionQueryParams }>('/transactions', {
    schema: {
      tags: ['Points'],
      querystring: {
        type: 'object',
        properties: {
          limit: { type: 'integer', default: 20 },
          offset: { type: 'integer', default: 0 },
          source: { type: 'string' }
        }
      }
    },
    handler: async (request: FastifyRequest<{ Querystring: TransactionQueryParams }>, reply: FastifyReply) => {
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
        const source = request.query.source;
        
        // Get transactions (filtering by source would be implemented in a more complete version)
        const transactions = await pointsService.getUserTransactions(userId, limit, offset);
        
        // TODO: Get total count for pagination
        const total = 100; // This would be fetched from the service
        
        // Send response
        return reply.code(200).send({
          data: transactions.map(tx => ({
            id: tx.id,
            amount: tx.amount,
            source: tx.source,
            referenceId: tx.reference_id,
            createdAt: tx.created_at,
            description: tx.description
          })),
          meta: {
            timestamp: new Date().toISOString(),
          },
          pagination: {
            total,
            limit,
            offset,
            hasMore: offset + transactions.length < total
          }
        });
      } catch (error) {
        return handleApiError(request, reply, error);
      }
    },
  });

  /**
   * @openapi
   * /api/v1/points/award:
   *   post:
   *     summary: Award points to user
   *     description: Awards points to the user for a specific activity
   *     tags: [Points]
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
   *                     type: number
   *                     description: Number of points to award
   *                     example: 50
   *                     minimum: 1
   *                   source:
   *                     type: string
   *                     description: Source or reason for the points
   *                     example: "content_creation"
   *                   referenceId:
   *                     type: string
   *                     description: Optional reference ID (e.g., content ID)
   *                     example: "post_123"
   *                   description:
   *                     type: string
   *                     description: Optional description
   *                     example: "Created an insightful post"
   *     responses:
   *       200:
   *         description: Points awarded successfully
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
   *                       example: true
   *                     amount:
   *                       type: number
   *                       example: 50
   *                     newBalance:
   *                       type: number
   *                       example: 1300
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
  fastify.post<{ Body: PointsAwardRequest }>('/award', {
    schema: {
      tags: ['Points'],
      body: {
        type: 'object',
        required: ['data'],
        properties: {
          data: {
            type: 'object',
            required: ['amount', 'source'],
            properties: {
              amount: { type: 'number', minimum: 1 },
              source: { type: 'string' },
              referenceId: { type: 'string' },
              description: { type: 'string' }
            },
          },
        },
      },
    },
    handler: async (request: FastifyRequest<{ Body: PointsAwardRequest }>, reply: FastifyReply) => {
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
        const { amount, source, referenceId, description } = request.body.data;
        
        // Award points
        const result = await pointsService.awardPoints({
          userId,
          amount,
          source: source as PointsSource,
          referenceId,
          description
        });
        
        // Send response
        return reply.code(200).send({
          data: {
            success: result.success,
            amount: result.amount,
            newBalance: result.total
          },
          meta: {
            timestamp: new Date().toISOString(),
          },
        });
      } catch (error) {
        return handleApiError(request, reply, error);
      }
    },
  });

  /**
   * @openapi
   * /api/v1/points/redeem:
   *   post:
   *     summary: Redeem points for tokens
   *     description: Converts Success Points to SKC tokens
   *     tags: [Points]
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
   *                 required: [amount]
   *                 properties:
   *                   amount:
   *                     type: number
   *                     description: Number of points to redeem
   *                     example: 1000
   *                     minimum: 1000
   *                   walletAddress:
   *                     type: string
   *                     description: Optional wallet address (if not already connected)
   *                     example: "0x1234567890abcdef"
   *     responses:
   *       202:
   *         description: Redemption request accepted
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
   *                       example: true
   *                     requestId:
   *                       type: string
   *                       example: "req_123456"
   *                     pointsAmount:
   *                       type: number
   *                       example: 1000
   *                     tokenAmount:
   *                       type: number
   *                       example: 10
   *                     status:
   *                       type: string
   *                       enum: [pending, processing, completed, failed]
   *                       example: "pending"
   *                     estimatedProcessingTime:
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
   *       402:
   *         description: Insufficient points
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  fastify.post<{ Body: PointsRedeemRequest }>('/redeem', {
    schema: {
      tags: ['Points'],
      body: {
        type: 'object',
        required: ['data'],
        properties: {
          data: {
            type: 'object',
            required: ['amount'],
            properties: {
              amount: { type: 'number', minimum: 1000 },
              walletAddress: { type: 'string' }
            },
          },
        },
      },
    },
    handler: async (request: FastifyRequest<{ Body: PointsRedeemRequest }>, reply: FastifyReply) => {
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
        const { amount, walletAddress } = request.body.data;
        
        // Get wallet address (in a real implementation, we would check if user has a connected wallet)
        const userWalletAddress = walletAddress || 'sample_wallet_address'; // This would come from the wallet service
        
        // Request redemption
        const redemption = await redemptionService.requestRedemption({
          userId,
          pointsAmount: amount,
          walletAddress: userWalletAddress
        });
        
        // Calculate estimated processing time (1 week from now)
        const estimatedProcessingTime = new Date();
        estimatedProcessingTime.setDate(estimatedProcessingTime.getDate() + 7);
        
        // Send response
        return reply.code(202).send({
          data: {
            success: true,
            requestId: redemption.id,
            pointsAmount: redemption.pointsAmount,
            tokenAmount: redemption.tokenAmount,
            status: redemption.status,
            estimatedProcessingTime: estimatedProcessingTime.toISOString(),
          },
          meta: {
            timestamp: new Date().toISOString(),
          },
        });
      } catch (error) {
        return handleApiError(request, reply, error);
      }
    },
  });
  
  /**
   * @openapi
   * /api/v1/points/redemptions:
   *   get:
   *     summary: Get redemption history
   *     description: Retrieves the user's redemption history
   *     tags: [Points]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 20
   *         description: Maximum number of redemptions to return
   *       - in: query
   *         name: offset
   *         schema:
   *           type: integer
   *           default: 0
   *         description: Number of redemptions to skip
   *     responses:
   *       200:
   *         description: Redemption history
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
   *                       pointsAmount:
   *                         type: number
   *                       tokenAmount:
   *                         type: number
   *                       status:
   *                         type: string
   *                         enum: [pending, processing, completed, failed]
   *                       createdAt:
   *                         type: string
   *                         format: date-time
   *                       processedAt:
   *                         type: string
   *                         format: date-time
   *                       transactionHash:
   *                         type: string
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
  fastify.get<{ Querystring: TransactionQueryParams }>('/redemptions', {
    schema: {
      tags: ['Points'],
      querystring: {
        type: 'object',
        properties: {
          limit: { type: 'integer', default: 20 },
          offset: { type: 'integer', default: 0 }
        }
      }
    },
    handler: async (request: FastifyRequest<{ Querystring: TransactionQueryParams }>, reply: FastifyReply) => {
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
        
        // Get redemption history
        const redemptions = await redemptionService.getUserRedemptions(userId, limit, offset);
        
        // Send response
        return reply.code(200).send({
          data: redemptions.map(r => ({
            id: r.id,
            pointsAmount: r.pointsAmount,
            tokenAmount: r.tokenAmount,
            status: r.status,
            createdAt: r.createdAt,
            processedAt: r.processedAt,
            transactionHash: r.transactionHash
          })),
          meta: {
            timestamp: new Date().toISOString(),
          }
        });
      } catch (error) {
        return handleApiError(request, reply, error);
      }
    },
  });
  
  // Register analytics routes under /analytics prefix
  fastify.register(pointsAnalyticsRoutes, { prefix: '/analytics' });
}
