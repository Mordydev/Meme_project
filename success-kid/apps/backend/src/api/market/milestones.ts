/**
 * Milestone API Routes
 * 
 * API endpoints for market milestones.
 */
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { milestoneService } from '../../market/milestones/service';
import { logger } from '../../lib/logger';
import { ApiError } from '../../errors/api-error';
import { validationMiddleware } from '../../middleware/validation';
import { transactionMiddleware } from '../../middleware/transaction';
import { rateLimitMiddleware } from '../../middleware/rate-limit';
import { MilestoneType } from '../../models/entities/market/milestone.model';

/**
 * Milestone routes registration
 * 
 * @param fastify Fastify instance
 * @param opts Options
 */
export const milestoneRoutes = async (fastify: FastifyInstance, opts: any) => {
  // Apply middleware
  fastify.addHook('preHandler', rateLimitMiddleware);
  fastify.addHook('preHandler', transactionMiddleware);
  
  /**
   * @openapi
   * /api/v1/market/milestones:
   *   get:
   *     summary: Get all milestones for a token
   *     tags: [Market]
   *     parameters:
   *       - name: symbol
   *         in: query
   *         required: false
   *         schema:
   *           type: string
   *           default: SKC
   *     responses:
   *       200:
   *         description: List of milestones
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   type: array
   *                   items:
   *                     $ref: '#/components/schemas/Milestone'
   */
  fastify.get(
    '/',
    {
      schema: {
        querystring: {
          type: 'object',
          properties: {
            symbol: { type: 'string', default: 'SKC' }
          }
        }
      },
      preHandler: validationMiddleware
    },
    async (request: FastifyRequest<{
      Querystring: { symbol?: string };
    }>, reply: FastifyReply) => {
      const { symbol = 'SKC' } = request.query;
      
      try {
        const milestones = await milestoneService.getMilestones(symbol);
        
        return reply.code(200).send({
          data: milestones,
          meta: {
            timestamp: new Date().toISOString(),
            requestId: request.id
          }
        });
      } catch (error) {
        logger.error('Milestones API error', { symbol, error });
        throw new ApiError('Failed to get milestones', 500);
      }
    }
  );
  
  /**
   * @openapi
   * /api/v1/market/milestones/current:
   *   get:
   *     summary: Get current milestone
   *     tags: [Market]
   *     parameters:
   *       - name: symbol
   *         in: query
   *         required: false
   *         schema:
   *           type: string
   *           default: SKC
   *       - name: type
   *         in: query
   *         required: false
   *         schema:
   *           type: string
   *           enum: [marketCap, price, holders]
   *           default: marketCap
   *     responses:
   *       200:
   *         description: Current milestone
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   $ref: '#/components/schemas/Milestone'
   */
  fastify.get(
    '/current',
    {
      schema: {
        querystring: {
          type: 'object',
          properties: {
            symbol: { type: 'string', default: 'SKC' },
            type: { 
              type: 'string', 
              enum: Object.values(MilestoneType),
              default: MilestoneType.MARKET_CAP
            }
          }
        }
      },
      preHandler: validationMiddleware
    },
    async (request: FastifyRequest<{
      Querystring: { 
        symbol?: string;
        type?: MilestoneType;
      };
    }>, reply: FastifyReply) => {
      const { 
        symbol = 'SKC',
        type = MilestoneType.MARKET_CAP
      } = request.query;
      
      try {
        const milestone = await milestoneService.getCurrentMilestone(symbol, type);
        
        if (!milestone) {
          return reply.code(404).send({
            meta: {
              timestamp: new Date().toISOString(),
              requestId: request.id
            },
            errors: [
              {
                code: 'MILESTONE_NOT_FOUND',
                message: `No current milestone found for ${symbol}`
              }
            ]
          });
        }
        
        return reply.code(200).send({
          data: milestone,
          meta: {
            timestamp: new Date().toISOString(),
            requestId: request.id
          }
        });
      } catch (error) {
        logger.error('Current milestone API error', { symbol, type, error });
        throw new ApiError('Failed to get current milestone', 500);
      }
    }
  );
  
  /**
   * @openapi
   * /api/v1/market/milestones/{id}:
   *   get:
   *     summary: Get milestone by ID
   *     tags: [Market]
   *     parameters:
   *       - name: id
   *         in: path
   *         required: true
   *         schema:
   *           type: string
   *       - name: symbol
   *         in: query
   *         required: false
   *         schema:
   *           type: string
   *           default: SKC
   *     responses:
   *       200:
   *         description: Milestone details
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   $ref: '#/components/schemas/Milestone'
   *       404:
   *         description: Milestone not found
   */
  fastify.get(
    '/:id',
    {
      schema: {
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string' }
          }
        },
        querystring: {
          type: 'object',
          properties: {
            symbol: { type: 'string', default: 'SKC' }
          }
        }
      },
      preHandler: validationMiddleware
    },
    async (request: FastifyRequest<{
      Params: { id: string };
      Querystring: { symbol?: string };
    }>, reply: FastifyReply) => {
      const { id } = request.params;
      const { symbol = 'SKC' } = request.query;
      
      try {
        const milestone = await milestoneService.getMilestone(id, symbol);
        
        if (!milestone) {
          return reply.code(404).send({
            meta: {
              timestamp: new Date().toISOString(),
              requestId: request.id
            },
            errors: [
              {
                code: 'MILESTONE_NOT_FOUND',
                message: `Milestone with ID ${id} not found`
              }
            ]
          });
        }
        
        return reply.code(200).send({
          data: milestone,
          meta: {
            timestamp: new Date().toISOString(),
            requestId: request.id
          }
        });
      } catch (error) {
        logger.error('Milestone detail API error', { id, symbol, error });
        throw new ApiError('Failed to get milestone details', 500);
      }
    }
  );
  
  /**
   * @openapi
   * /api/v1/market/milestones/{id}/progress:
   *   get:
   *     summary: Get milestone progress
   *     tags: [Market]
   *     parameters:
   *       - name: id
   *         in: path
   *         required: true
   *         schema:
   *           type: string
   *       - name: symbol
   *         in: query
   *         required: false
   *         schema:
   *           type: string
   *           default: SKC
   *     responses:
   *       200:
   *         description: Milestone progress
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   $ref: '#/components/schemas/MilestoneProgress'
   *       404:
   *         description: Milestone not found
   */
  fastify.get(
    '/:id/progress',
    {
      schema: {
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string' }
          }
        },
        querystring: {
          type: 'object',
          properties: {
            symbol: { type: 'string', default: 'SKC' }
          }
        }
      },
      preHandler: validationMiddleware
    },
    async (request: FastifyRequest<{
      Params: { id: string };
      Querystring: { symbol?: string };
    }>, reply: FastifyReply) => {
      const { id } = request.params;
      const { symbol = 'SKC' } = request.query;
      
      try {
        const progress = await milestoneService.getMilestoneProgress(id, symbol);
        
        if (!progress) {
          return reply.code(404).send({
            meta: {
              timestamp: new Date().toISOString(),
              requestId: request.id
            },
            errors: [
              {
                code: 'MILESTONE_NOT_FOUND',
                message: `Milestone with ID ${id} not found`
              }
            ]
          });
        }
        
        return reply.code(200).send({
          data: progress,
          meta: {
            timestamp: new Date().toISOString(),
            requestId: request.id
          }
        });
      } catch (error) {
        logger.error('Milestone progress API error', { id, symbol, error });
        throw new ApiError('Failed to get milestone progress', 500);
      }
    }
  );
  
  /**
   * @openapi
   * /api/v1/market/milestones/check:
   *   post:
   *     summary: Manually check for milestone achievements (admin only)
   *     tags: [Market]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               symbol:
   *                 type: string
   *                 default: SKC
   *     responses:
   *       200:
   *         description: Newly achieved milestones
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   type: array
   *                   items:
   *                     $ref: '#/components/schemas/Milestone'
   *       403:
   *         description: Unauthorized
   */
  fastify.post(
    '/check',
    {
      schema: {
        body: {
          type: 'object',
          properties: {
            symbol: { type: 'string', default: 'SKC' }
          }
        }
      },
      preValidation: async (request, reply) => {
        // In a real implementation, check admin role here
        const isAdmin = true; // Placeholder
        
        if (!isAdmin) {
          return reply.code(403).send({
            meta: {
              timestamp: new Date().toISOString(),
              requestId: request.id
            },
            errors: [
              {
                code: 'UNAUTHORIZED',
                message: 'Admin role required'
              }
            ]
          });
        }
      },
      preHandler: validationMiddleware
    },
    async (request: FastifyRequest<{
      Body: { symbol?: string };
    }>, reply: FastifyReply) => {
      const { symbol = 'SKC' } = request.body;
      
      try {
        const achievements = await milestoneService.checkMilestones(symbol);
        
        return reply.code(200).send({
          data: achievements,
          meta: {
            timestamp: new Date().toISOString(),
            requestId: request.id,
            count: achievements.length
          }
        });
      } catch (error) {
        logger.error('Milestone check API error', { symbol, error });
        throw new ApiError('Failed to check milestones', 500);
      }
    }
  );
};
