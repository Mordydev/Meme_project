import { FastifyInstance } from 'fastify';
import { TokenService } from '../../services/token-service';

/**
 * Get the current token price and recent history
 */
export async function getTokenPrice(fastify: FastifyInstance) {
  const tokenService = fastify.diContainer.resolve<TokenService>('tokenService');
  
  fastify.get('/api/token/price', {
    schema: {
      response: {
        200: {
          type: 'object',
          properties: {
            current: {
              type: 'object',
              properties: {
                price: { type: 'number' },
                marketCap: { type: 'number' },
                change24h: { type: 'number' },
                volume24h: { type: 'number' },
                timestamp: { type: 'string', format: 'date-time' }
              }
            }
          }
        }
      }
    },
    handler: async (request, reply) => {
      const currentPrice = await tokenService.getCurrentTokenPrice();
      
      return {
        current: currentPrice
      };
    }
  });
  
  fastify.get('/api/token/price/history', {
    schema: {
      querystring: {
        type: 'object',
        properties: {
          period: { type: 'string', enum: ['day', 'week', 'month', 'year'] }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            history: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  price: { type: 'number' },
                  marketCap: { type: 'number' },
                  timestamp: { type: 'string', format: 'date-time' }
                }
              }
            }
          }
        }
      }
    },
    handler: async (request, reply) => {
      const { period = 'week' } = request.query as { period?: 'day' | 'week' | 'month' | 'year' };
      
      const history = await tokenService.getTokenPriceHistory(period);
      
      return {
        history
      };
    }
  });
}
