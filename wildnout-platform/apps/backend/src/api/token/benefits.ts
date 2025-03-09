import { FastifyInstance } from 'fastify';
import { TokenService } from '../../services/token-service';

/**
 * Get user token benefits
 */
export async function getUserBenefits(fastify: FastifyInstance) {
  const tokenService = fastify.diContainer.resolve<TokenService>('tokenService');
  
  fastify.get('/api/token/benefits', {
    onRequest: [fastify.authenticate],
    schema: {
      response: {
        200: {
          type: 'object',
          properties: {
            holdings: { type: 'number' },
            tier: { type: 'string', enum: ['bronze', 'silver', 'gold', 'platinum'] },
            updatedAt: { type: 'string', format: 'date-time' },
            multiplier: { type: 'number' },
            benefits: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                  description: { type: 'string' },
                  status: { type: 'string', enum: ['active', 'inactive'] },
                  activatedAt: { type: 'string', format: 'date-time' }
                }
              }
            }
          }
        }
      }
    },
    handler: async (request, reply) => {
      const userId = request.user.id;
      
      // Get user benefits
      const benefits = await tokenService.getUserBenefits(userId);
      
      if (!benefits) {
        // Return default benefits for user with no wallet
        return {
          holdings: 0,
          tier: 'bronze',
          updatedAt: new Date().toISOString(),
          multiplier: 1,
          benefits: []
        };
      }
      
      return benefits;
    }
  });
  
  fastify.post('/api/token/benefits/refresh', {
    onRequest: [fastify.authenticate],
    schema: {
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            benefits: {
              type: 'object',
              properties: {
                holdings: { type: 'number' },
                tier: { type: 'string', enum: ['bronze', 'silver', 'gold', 'platinum'] },
                updatedAt: { type: 'string', format: 'date-time' },
                multiplier: { type: 'number' }
              }
            }
          }
        }
      }
    },
    handler: async (request, reply) => {
      const userId = request.user.id;
      
      // Force refresh user benefits
      const success = await tokenService.refreshUserBenefits(userId);
      
      // Get updated benefits
      const benefits = await tokenService.getUserBenefits(userId);
      
      return {
        success,
        benefits: benefits || {
          holdings: 0,
          tier: 'bronze',
          updatedAt: new Date().toISOString(),
          multiplier: 1,
          benefits: []
        }
      };
    }
  });
}
