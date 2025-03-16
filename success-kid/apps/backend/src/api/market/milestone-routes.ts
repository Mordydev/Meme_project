/**
 * Milestone API routes
 */
import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { logger } from '../../lib/logger';

const milestoneRoutes: FastifyPluginAsync = async (fastify) => {
  /**
   * Get all milestones
   */
  fastify.get('/', {
    schema: {
      response: {
        200: z.object({
          data: z.array(z.object({
            id: z.string(),
            name: z.string(),
            description: z.string(),
            targetValue: z.string(),
            type: z.enum(['marketCap', 'price', 'holders']),
            achieved: z.boolean(),
            achievedAt: z.string().datetime().nullable(),
            nextMilestoneId: z.string().nullable(),
            previousMilestoneId: z.string().nullable()
          })),
          meta: z.object({
            timestamp: z.string().datetime(),
            requestId: z.string()
          })
        })
      }
    }
  }, async (request, reply) => {
    try {
      // Get milestones from service
      const milestoneService = fastify.market.milestoneService;
      
      const milestones = await milestoneService.getMilestones();
      
      // Format response
      return {
        data: milestones.map(milestone => ({
          ...milestone,
          achievedAt: milestone.achievedAt ? milestone.achievedAt.toISOString() : null,
          nextMilestoneId: milestone.nextMilestoneId || null,
          previousMilestoneId: milestone.previousMilestoneId || null
        })),
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        }
      };
    } catch (error) {
      logger.error('Failed to get milestones', { error });
      return reply.code(500).send({
        data: null,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        },
        errors: [
          {
            code: 'MILESTONE_FETCH_ERROR',
            message: 'Failed to fetch milestones',
            details: error.message
          }
        ]
      });
    }
  });
  
  /**
   * Get current milestone for a specific type
   */
  fastify.get('/current/:type', {
    schema: {
      params: z.object({
        type: z.enum(['marketCap', 'price', 'holders'])
      }),
      response: {
        200: z.object({
          data: z.object({
            id: z.string(),
            name: z.string(),
            description: z.string(),
            targetValue: z.string(),
            type: z.enum(['marketCap', 'price', 'holders']),
            achieved: z.boolean(),
            achievedAt: z.string().datetime().nullable(),
            nextMilestoneId: z.string().nullable(),
            previousMilestoneId: z.string().nullable()
          }),
          meta: z.object({
            timestamp: z.string().datetime(),
            requestId: z.string()
          })
        })
      }
    }
  }, async (request, reply) => {
    const { type } = request.params;
    
    try {
      // Get current milestone from service
      const milestoneService = fastify.market.milestoneService;
      
      const milestone = await milestoneService.getCurrentMilestone(type);
      
      // Format response
      return {
        data: {
          ...milestone,
          achievedAt: milestone.achievedAt ? milestone.achievedAt.toISOString() : null,
          nextMilestoneId: milestone.nextMilestoneId || null,
          previousMilestoneId: milestone.previousMilestoneId || null
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        }
      };
    } catch (error) {
      logger.error('Failed to get current milestone', { type, error });
      return reply.code(500).send({
        data: null,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        },
        errors: [
          {
            code: 'CURRENT_MILESTONE_ERROR',
            message: 'Failed to fetch current milestone',
            details: error.message
          }
        ]
      });
    }
  });
  
  /**
   * Get milestone progress
   */
  fastify.get('/:id/progress', {
    schema: {
      params: z.object({
        id: z.string()
      }),
      response: {
        200: z.object({
          data: z.object({
            milestone: z.object({
              id: z.string(),
              name: z.string(),
              description: z.string(),
              targetValue: z.string(),
              type: z.enum(['marketCap', 'price', 'holders']),
              achieved: z.boolean(),
              achievedAt: z.string().datetime().nullable(),
              nextMilestoneId: z.string().nullable(),
              previousMilestoneId: z.string().nullable()
            }),
            currentValue: z.string(),
            percentComplete: z.number(),
            remaining: z.string()
          }),
          meta: z.object({
            timestamp: z.string().datetime(),
            requestId: z.string()
          })
        })
      }
    }
  }, async (request, reply) => {
    const { id } = request.params;
    
    try {
      // Get milestone progress from service
      const milestoneService = fastify.market.milestoneService;
      
      const progress = await milestoneService.getMilestoneProgress(id);
      
      // Format response
      return {
        data: {
          milestone: {
            ...progress.milestone,
            achievedAt: progress.milestone.achievedAt ? progress.milestone.achievedAt.toISOString() : null,
            nextMilestoneId: progress.milestone.nextMilestoneId || null,
            previousMilestoneId: progress.milestone.previousMilestoneId || null
          },
          currentValue: progress.currentValue,
          percentComplete: progress.percentComplete,
          remaining: progress.remaining
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        }
      };
    } catch (error) {
      logger.error('Failed to get milestone progress', { id, error });
      return reply.code(500).send({
        data: null,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        },
        errors: [
          {
            code: 'MILESTONE_PROGRESS_ERROR',
            message: 'Failed to fetch milestone progress',
            details: error.message
          }
        ]
      });
    }
  });
  
  /**
   * Check for milestone updates
   */
  fastify.post('/check', {
    schema: {
      response: {
        200: z.object({
          data: z.array(z.object({
            id: z.string(),
            name: z.string(),
            description: z.string(),
            targetValue: z.string(),
            type: z.enum(['marketCap', 'price', 'holders']),
            achieved: z.boolean(),
            achievedAt: z.string().datetime().nullable(),
            nextMilestoneId: z.string().nullable(),
            previousMilestoneId: z.string().nullable()
          })),
          meta: z.object({
            timestamp: z.string().datetime(),
            requestId: z.string()
          })
        })
      }
    }
  }, async (request, reply) => {
    try {
      // Check for milestone updates
      const milestoneService = fastify.market.milestoneService;
      
      const updatedMilestones = await milestoneService.checkMilestones();
      
      // Format response
      return {
        data: updatedMilestones.map(milestone => ({
          ...milestone,
          achievedAt: milestone.achievedAt ? milestone.achievedAt.toISOString() : null,
          nextMilestoneId: milestone.nextMilestoneId || null,
          previousMilestoneId: milestone.previousMilestoneId || null
        })),
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        }
      };
    } catch (error) {
      logger.error('Failed to check milestones', { error });
      return reply.code(500).send({
        data: null,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        },
        errors: [
          {
            code: 'MILESTONE_CHECK_ERROR',
            message: 'Failed to check milestones',
            details: error.message
          }
        ]
      });
    }
  });
};

export default milestoneRoutes;
