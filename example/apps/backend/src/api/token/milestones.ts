import { FastifyInstance } from 'fastify';
import { TokenService } from '../../services/token-service';

/**
 * Get token market cap milestones and current progress
 */
export async function getTokenMilestones(fastify: FastifyInstance) {
  const tokenService = fastify.diContainer.resolve<TokenService>('tokenService');
  
  fastify.get('/api/token/milestones', {
    schema: {
      response: {
        200: {
          type: 'object',
          properties: {
            milestones: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                  targetValue: { type: 'number' },
                  description: { type: 'string' },
                  achieved: { type: 'boolean' },
                  achievedAt: { type: ['string', 'null'], format: 'date-time' }
                }
              }
            }
          }
        }
      }
    },
    handler: async (request, reply) => {
      const milestones = await tokenService.getTokenMilestones();
      
      return {
        milestones
      };
    }
  });
  
  fastify.get('/api/token/milestones/progress', {
    schema: {
      response: {
        200: {
          type: 'object',
          properties: {
            currentValue: { type: 'number' },
            nextMilestone: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                targetValue: { type: 'number' },
                description: { type: 'string' },
                percentComplete: { type: 'number' }
              }
            },
            recentMilestones: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                  achievedAt: { type: 'string', format: 'date-time' }
                }
              }
            }
          }
        }
      }
    },
    handler: async (request, reply) => {
      const progress = await tokenService.getCurrentMilestoneProgress();
      
      return progress;
    }
  });
}
