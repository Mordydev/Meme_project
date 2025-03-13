import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';

interface PointsAwardRequest {
  data: {
    amount: number;
    source: string;
    referenceId?: string;
  };
}

interface PointsRedeemRequest {
  data: {
    amount: number;
  };
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
      // In a real implementation, this would fetch data from a service
      return reply.code(200).send({
        data: {
          balance: 1250,
          transactions: [
            {
              id: 'tx_123456',
              amount: 50,
              source: 'content_creation',
              referenceId: 'post_123',
              createdAt: new Date().toISOString(),
              description: 'Created a new post',
            },
            {
              id: 'tx_123455',
              amount: 20,
              source: 'daily_login',
              createdAt: new Date().toISOString(),
              description: 'Daily login bonus',
            },
          ],
          today: {
            earned: 150,
            limits: {
              content_creation: {
                used: 100,
                limit: 200,
                remaining: 100,
              },
              daily_login: {
                used: 20,
                limit: 20,
                remaining: 0,
              },
            },
          },
        },
        meta: {
          timestamp: new Date().toISOString(),
        },
      });
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
   *                     transaction:
   *                       type: object
   *                       properties:
   *                         id:
   *                           type: string
   *                           example: "tx_123456"
   *                         createdAt:
   *                           type: string
   *                           format: date-time
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
            },
          },
        },
      },
    },
    handler: async (request: FastifyRequest<{ Body: PointsAwardRequest }>, reply: FastifyReply) => {
      const { amount, source, referenceId } = request.body.data;
      
      // In a real implementation, this would call a service
      return reply.code(200).send({
        data: {
          success: true,
          amount,
          newBalance: 1300, // would be calculated
          transaction: {
            id: 'tx_' + Date.now().toString(),
            createdAt: new Date().toISOString(),
          },
        },
        meta: {
          timestamp: new Date().toISOString(),
        },
      });
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
            },
          },
        },
      },
    },
    handler: async (request: FastifyRequest<{ Body: PointsRedeemRequest }>, reply: FastifyReply) => {
      const { amount } = request.body.data;
      
      // Calculate token amount (100 SP = 1 SKC)
      const tokenAmount = amount / 100;
      
      // In a real implementation, this would queue a redemption request
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      
      return reply.code(202).send({
        data: {
          success: true,
          requestId: 'req_' + Date.now().toString(),
          pointsAmount: amount,
          tokenAmount,
          status: 'pending',
          estimatedProcessingTime: nextWeek.toISOString(),
        },
        meta: {
          timestamp: new Date().toISOString(),
        },
      });
    },
  });
}
