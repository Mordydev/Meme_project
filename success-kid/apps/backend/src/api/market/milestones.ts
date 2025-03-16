/**
 * Milestones API routes
 */
import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';

/**
 * Milestone route parameter schemas
 */
const milestoneIdParamSchema = z.object({
  id: z.string().min(1)
});

const milestoneTypeQuerySchema = z.object({
  type: z.enum(['marketCap', 'price', 'holders']).default('marketCap')
});

/**
 * Milestones API plugin
 */
const milestonesRoutes: FastifyPluginAsync = async (fastify) => {
  // Get all milestones
  fastify.get('/', {
    schema: {
      response: {
        200: {
          type: 'object',
          properties: {
            data: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                  description: { type: 'string' },
                  targetValue: { type: 'string' },
                  type: { type: 'string', enum: ['marketCap', 'price', 'holders'] },
                  achieved: { type: 'boolean' },
                  achievedAt: { type: 'string', format: 'date-time', nullable: true },
                  nextMilestoneId: { type: 'string', nullable: true },
                  previousMilestoneId: { type: 'string', nullable: true }
                }
              }
            },
            meta: {
              type: 'object',
              properties: {
                timestamp: { type: 'string', format: 'date-time' },
                requestId: { type: 'string' }
              }
            }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      // Get all milestones
      const milestones = await fastify.market.milestoneService.getMilestones();
      
      // Return response
      return {
        data: milestones,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        }
      };
    } catch (error) {
      request.log.error('Error fetching milestones', { error });
      throw error;
    }
  });
  
  // Get current milestone for a type
  fastify.get<{
    Querystring: { type: string }
  }>('/current', {
    schema: {
      querystring: milestoneTypeQuerySchema,
      response: {
        200: {
          type: 'object',
          properties: {
            data: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                description: { type: 'string' },
                targetValue: { type: 'string' },
                type: { type: 'string', enum: ['marketCap', 'price', 'holders'] },
                achieved: { type: 'boolean' },
                achievedAt: { type: 'string', format: 'date-time', nullable: true },
                nextMilestoneId: { type: 'string', nullable: true },
                previousMilestoneId: { type: 'string', nullable: true }
              }
            },
            meta: {
              type: 'object',
              properties: {
                timestamp: { type: 'string', format: 'date-time' },
                requestId: { type: 'string' }
              }
            }
          }
        }
      }
    }
  }, async (request, reply) => {
    const { type = 'marketCap' } = request.query;
    
    try {
      // Get current milestone
      const milestone = await fastify.market.milestoneService.getCurrentMilestone(type);
      
      // Return response
      return {
        data: milestone,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        }
      };
    } catch (error) {
      request.log.error('Error fetching current milestone', { type, error });
      
      // Handle invalid type error
      if (error.message?.includes('Invalid milestone type')) {
        return reply.code(400).send({
          errors: [{
            code: 'INVALID_MILESTONE_TYPE',
            message: `Invalid milestone type: ${type}`
          }],
          meta: {
            timestamp: new Date().toISOString(),
            requestId: request.id
          }
        });
      }
      
      throw error;
    }
  });
  
  // Get milestone progress
  fastify.get<{
    Params: { id: string }
  }>('/:id/progress', {
    schema: {
      params: milestoneIdParamSchema,
      response: {
        200: {
          type: 'object',
          properties: {
            data: {
              type: 'object',
              properties: {
                milestone: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    name: { type: 'string' },
                    description: { type: 'string' },
                    targetValue: { type: 'string' },
                    type: { type: 'string', enum: ['marketCap', 'price', 'holders'] },
                    achieved: { type: 'boolean' }
                  }
                },
                currentValue: { type: 'string' },
                percentComplete: { type: 'number' },
                remaining: { type: 'string' }
              }
            },
            meta: {
              type: 'object',
              properties: {
                timestamp: { type: 'string', format: 'date-time' },
                requestId: { type: 'string' }
              }
            }
          }
        }
      }
    }
  }, async (request, reply) => {
    const { id } = request.params;
    
    try {
      // Get milestone progress
      const progress = await fastify.market.milestoneService.getMilestoneProgress(id);
      
      // Return response
      return {
        data: progress,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        }
      };
    } catch (error) {
      request.log.error('Error fetching milestone progress', { id, error });
      
      // Handle milestone not found error
      if (error.message?.includes('Milestone not found')) {
        return reply.code(404).send({
          errors: [{
            code: 'MILESTONE_NOT_FOUND',
            message: `Milestone not found: ${id}`
          }],
          meta: {
            timestamp: new Date().toISOString(),
            requestId: request.id
          }
        });
      }
      
      throw error;
    }
  });
  
  // Check milestones (admin only)
  fastify.post('/check', {
    schema: {
      response: {
        200: {
          type: 'object',
          properties: {
            data: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                  achieved: { type: 'boolean' },
                  achievedAt: { type: 'string', format: 'date-time' }
                }
              }
            },
            meta: {
              type: 'object',
              properties: {
                timestamp: { type: 'string', format: 'date-time' },
                requestId: { type: 'string' }
              }
            }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      // Check admin permissions
      /* 
      if (!request.user.isAdmin) {
        return reply.code(403).send({
          errors: [{
            code: 'FORBIDDEN',
            message: 'Admin access required'
          }],
          meta: {
            timestamp: new Date().toISOString(),
            requestId: request.id
          }
        });
      }
      */
      
      // Check milestones
      const achievedMilestones = await fastify.market.milestoneService.checkMilestones();
      
      // Return response
      return {
        data: achievedMilestones.map(m => ({
          id: m.id,
          name: m.name,
          achieved: m.achieved,
          achievedAt: m.achievedAt
        })),
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        }
      };
    } catch (error) {
      request.log.error('Error checking milestones', { error });
      throw error;
    }
  });
};

export default milestonesRoutes;
