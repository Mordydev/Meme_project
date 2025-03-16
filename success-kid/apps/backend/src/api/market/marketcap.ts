/**
 * Market cap API routes
 */
import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { TimePeriod, DataResolution } from '../../features/market/types';

/**
 * Market cap route parameter schemas
 */
const symbolParamSchema = z.object({
  symbol: z.string().min(1).max(10)
});

const marketCapHistoryQuerySchema = z.object({
  period: z.enum(['1h', '1d', '1w', '1m', 'all']).default('1d'),
  resolution: z.enum(['1m', '5m', '15m', '1h', '4h', '1d', '1w']).optional()
});

/**
 * Market cap API plugin
 */
const marketCapRoutes: FastifyPluginAsync = async (fastify) => {
  // Get current market cap for a token
  fastify.get<{
    Params: { symbol: string },
    Querystring: { forceRefresh?: boolean }
  }>('/:symbol', {
    schema: {
      params: symbolParamSchema,
      querystring: z.object({
        forceRefresh: z.boolean().optional()
      }),
      response: {
        200: {
          type: 'object',
          properties: {
            data: {
              type: 'object',
              properties: {
                symbol: { type: 'string' },
                marketCap: { type: 'string' },
                fullyDilutedMarketCap: { type: 'string' },
                circulatingSupply: { type: 'string' },
                totalSupply: { type: 'string' },
                price: { type: 'number' },
                lastUpdated: { type: 'string', format: 'date-time' }
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
    const { symbol } = request.params;
    const { forceRefresh } = request.query;
    
    try {
      // Get market cap data
      let marketCap;
      
      if (forceRefresh) {
        marketCap = await fastify.market.marketCapService.refreshMarketCap(symbol);
      } else {
        marketCap = await fastify.market.marketCapService.getMarketCap(symbol);
      }
      
      // Return response
      return {
        data: marketCap,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        }
      };
    } catch (error) {
      request.log.error('Error fetching market cap', { symbol, error });
      
      // Handle error
      if (error.message?.includes('not configured')) {
        return reply.code(404).send({
          errors: [{
            code: 'TOKEN_NOT_FOUND',
            message: `Token ${symbol} not found or not supported`
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
  
  // Get market cap history for a token
  fastify.get<{
    Params: { symbol: string },
    Querystring: { period?: TimePeriod, resolution?: DataResolution }
  }>('/:symbol/history', {
    schema: {
      params: symbolParamSchema,
      querystring: marketCapHistoryQuerySchema,
      response: {
        200: {
          type: 'object',
          properties: {
            data: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  timestamp: { type: 'string', format: 'date-time' },
                  marketCap: { type: 'string' },
                  price: { type: 'number' }
                }
              }
            },
            meta: {
              type: 'object',
              properties: {
                timestamp: { type: 'string', format: 'date-time' },
                requestId: { type: 'string' },
                period: { type: 'string' },
                resolution: { type: 'string' }
              }
            }
          }
        }
      }
    }
  }, async (request, reply) => {
    const { symbol } = request.params;
    const { period = '1d', resolution } = request.query;
    
    try {
      // Get market cap history
      const marketCapHistory = await fastify.market.marketCapService.getHistoricalMarketCap(
        symbol, 
        period,
        resolution
      );
      
      // Return response
      return {
        data: marketCapHistory,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id,
          period,
          resolution: resolution || 'auto'
        }
      };
    } catch (error) {
      request.log.error('Error fetching market cap history', { 
        symbol, 
        period, 
        resolution,
        error 
      });
      
      // Handle error
      if (error.message?.includes('not configured')) {
        return reply.code(404).send({
          errors: [{
            code: 'TOKEN_NOT_FOUND',
            message: `Token ${symbol} not found or not supported`
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
  
  // Get circulating supply for a token
  fastify.get<{
    Params: { symbol: string }
  }>('/:symbol/circulating-supply', {
    schema: {
      params: symbolParamSchema,
      response: {
        200: {
          type: 'object',
          properties: {
            data: {
              type: 'object',
              properties: {
                symbol: { type: 'string' },
                circulatingSupply: { type: 'string' }
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
    const { symbol } = request.params;
    
    try {
      // Get circulating supply
      const circulatingSupply = await fastify.market.marketCapService.getCirculatingSupply(symbol);
      
      // Return response
      return {
        data: {
          symbol,
          circulatingSupply
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        }
      };
    } catch (error) {
      request.log.error('Error fetching circulating supply', { symbol, error });
      
      // Handle error
      if (error.message?.includes('not configured')) {
        return reply.code(404).send({
          errors: [{
            code: 'TOKEN_NOT_FOUND',
            message: `Token ${symbol} not found or not supported`
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
  
  // Get total supply for a token
  fastify.get<{
    Params: { symbol: string }
  }>('/:symbol/total-supply', {
    schema: {
      params: symbolParamSchema,
      response: {
        200: {
          type: 'object',
          properties: {
            data: {
              type: 'object',
              properties: {
                symbol: { type: 'string' },
                totalSupply: { type: 'string' }
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
    const { symbol } = request.params;
    
    try {
      // Get total supply
      const totalSupply = await fastify.market.marketCapService.getTotalSupply(symbol);
      
      // Return response
      return {
        data: {
          symbol,
          totalSupply
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        }
      };
    } catch (error) {
      request.log.error('Error fetching total supply', { symbol, error });
      
      // Handle error
      if (error.message?.includes('not configured')) {
        return reply.code(404).send({
          errors: [{
            code: 'TOKEN_NOT_FOUND',
            message: `Token ${symbol} not found or not supported`
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
};

export default marketCapRoutes;
