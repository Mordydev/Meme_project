/**
 * Price API routes
 */
import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { TimePeriod, DataResolution } from '../../features/market/types';

/**
 * Price route parameter schemas
 */
const symbolParamSchema = z.object({
  symbol: z.string().min(1).max(10)
});

const priceHistoryQuerySchema = z.object({
  period: z.enum(['1h', '1d', '1w', '1m', 'all']).default('1d'),
  resolution: z.enum(['1m', '5m', '15m', '1h', '4h', '1d', '1w']).optional()
});

/**
 * Price API plugin
 */
const priceRoutes: FastifyPluginAsync = async (fastify) => {
  // Get current price for a token
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
                priceUsd: { type: 'number' },
                priceChange24h: { type: 'number' },
                priceChange7d: { type: 'number' },
                volume24h: { type: 'number' },
                lastUpdated: { type: 'string', format: 'date-time' },
                source: { type: 'string' }
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
      // Get price data
      let price;
      
      if (forceRefresh) {
        price = await fastify.market.priceService.refreshPrice(symbol);
      } else {
        price = await fastify.market.priceService.getCurrentPrice(symbol);
      }
      
      // Return response
      return {
        data: price,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        }
      };
    } catch (error) {
      request.log.error('Error fetching price', { symbol, error });
      
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
  
  // Get price history for a token
  fastify.get<{
    Params: { symbol: string },
    Querystring: { period?: TimePeriod, resolution?: DataResolution }
  }>('/:symbol/history', {
    schema: {
      params: symbolParamSchema,
      querystring: priceHistoryQuerySchema,
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
                  price: { type: 'number' },
                  volume: { type: 'number' }
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
      // Get price history
      const priceHistory = await fastify.market.priceService.getPriceHistory(
        symbol, 
        period,
        resolution
      );
      
      // Return response
      return {
        data: priceHistory,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id,
          period,
          resolution: resolution || 'auto'
        }
      };
    } catch (error) {
      request.log.error('Error fetching price history', { 
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
  
  // Get prices for multiple tokens
  fastify.get<{
    Querystring: { symbols: string }
  }>('/batch', {
    schema: {
      querystring: z.object({
        symbols: z.string().min(1)
      }),
      response: {
        200: {
          type: 'object',
          properties: {
            data: {
              type: 'object',
              additionalProperties: {
                type: 'object',
                properties: {
                  symbol: { type: 'string' },
                  priceUsd: { type: 'number' },
                  priceChange24h: { type: 'number' },
                  priceChange7d: { type: 'number' },
                  volume24h: { type: 'number' },
                  lastUpdated: { type: 'string', format: 'date-time' },
                  source: { type: 'string' }
                }
              }
            },
            meta: {
              type: 'object',
              properties: {
                timestamp: { type: 'string', format: 'date-time' },
                requestId: { type: 'string' },
                symbolCount: { type: 'number' }
              }
            }
          }
        }
      }
    }
  }, async (request, reply) => {
    const symbolsStr = request.query.symbols;
    const symbols = symbolsStr.split(',').map(s => s.trim());
    
    try {
      // Get prices for all symbols
      const prices = await fastify.market.priceService.getMultiplePrices(symbols);
      
      // Return response
      return {
        data: prices,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id,
          symbolCount: Object.keys(prices).length
        }
      };
    } catch (error) {
      request.log.error('Error fetching multiple prices', { 
        symbols,
        error 
      });
      
      throw error;
    }
  });
};

export default priceRoutes;
