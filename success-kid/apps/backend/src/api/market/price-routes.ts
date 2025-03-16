/**
 * Price data API routes
 */
import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { TimePeriod, DataResolution } from '../../features/market/types';
import { logger } from '../../lib/logger';

const priceRoutes: FastifyPluginAsync = async (fastify) => {
  /**
   * Get current price for a token
   */
  fastify.get('/:symbol', {
    schema: {
      params: z.object({
        symbol: z.string().min(1).max(10)
      }),
      querystring: z.object({
        forceRefresh: z.boolean().optional().default(false)
      }),
      response: {
        200: z.object({
          data: z.object({
            symbol: z.string(),
            priceUsd: z.number(),
            priceChange24h: z.number(),
            priceChange7d: z.number().optional(),
            volume24h: z.number(),
            lastUpdated: z.string().datetime(),
            source: z.string()
          }),
          meta: z.object({
            timestamp: z.string().datetime(),
            requestId: z.string()
          })
        })
      }
    }
  }, async (request, reply) => {
    const { symbol } = request.params;
    const { forceRefresh } = request.query;
    
    try {
      // Get price from service
      const priceService = fastify.market.priceService;
      
      const price = forceRefresh 
        ? await priceService.refreshPrice(symbol)
        : await priceService.getCurrentPrice(symbol);
        
      return {
        data: {
          ...price,
          lastUpdated: price.lastUpdated.toISOString()
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        }
      };
    } catch (error) {
      logger.error('Failed to get price', { symbol, error });
      return reply.code(500).send({
        data: null,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        },
        errors: [
          {
            code: 'PRICE_FETCH_ERROR',
            message: 'Failed to fetch price data',
            details: error.message
          }
        ]
      });
    }
  });
  
  /**
   * Get historical price data
   */
  fastify.get('/:symbol/history', {
    schema: {
      params: z.object({
        symbol: z.string().min(1).max(10)
      }),
      querystring: z.object({
        period: z.enum(['1h', '1d', '1w', '1m', 'all'] as const).optional().default('1d'),
        resolution: z.enum(['1m', '5m', '15m', '1h', '4h', '1d', '1w'] as const).optional()
      }),
      response: {
        200: z.object({
          data: z.array(z.object({
            timestamp: z.string().datetime(),
            price: z.number(),
            volume: z.number().optional()
          })),
          meta: z.object({
            timestamp: z.string().datetime(),
            requestId: z.string(),
            period: z.string(),
            resolution: z.string().optional()
          })
        })
      }
    }
  }, async (request, reply) => {
    const { symbol } = request.params;
    const { period, resolution } = request.query;
    
    try {
      // Get price history from service
      const priceService = fastify.market.priceService;
      
      const priceHistory = await priceService.getPriceHistory(
        symbol,
        period as TimePeriod,
        resolution as DataResolution | undefined
      );
      
      return {
        data: priceHistory.map(point => ({
          ...point,
          timestamp: point.timestamp.toISOString()
        })),
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id,
          period,
          resolution: resolution || undefined
        }
      };
    } catch (error) {
      logger.error('Failed to get price history', { symbol, period, resolution, error });
      return reply.code(500).send({
        data: null,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        },
        errors: [
          {
            code: 'PRICE_HISTORY_ERROR',
            message: 'Failed to fetch price history',
            details: error.message
          }
        ]
      });
    }
  });
  
  /**
   * Get multiple prices at once
   */
  fastify.get('/multi', {
    schema: {
      querystring: z.object({
        symbols: z.string().min(1)
      }),
      response: {
        200: z.object({
          data: z.record(z.string(), z.object({
            symbol: z.string(),
            priceUsd: z.number(),
            priceChange24h: z.number(),
            priceChange7d: z.number().optional(),
            volume24h: z.number(),
            lastUpdated: z.string().datetime(),
            source: z.string()
          })),
          meta: z.object({
            timestamp: z.string().datetime(),
            requestId: z.string()
          })
        })
      }
    }
  }, async (request, reply) => {
    const { symbols } = request.query;
    const symbolArray = symbols.split(',').map(s => s.trim());
    
    try {
      // Get prices from service
      const priceService = fastify.market.priceService;
      
      const prices = await priceService.getMultiplePrices(symbolArray);
      
      // Format the response
      const formattedPrices = Object.entries(prices).reduce((acc, [symbol, price]) => {
        acc[symbol] = {
          ...price,
          lastUpdated: price.lastUpdated.toISOString()
        };
        return acc;
      }, {} as Record<string, any>);
      
      return {
        data: formattedPrices,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        }
      };
    } catch (error) {
      logger.error('Failed to get multiple prices', { symbols, error });
      return reply.code(500).send({
        data: null,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        },
        errors: [
          {
            code: 'MULTI_PRICE_FETCH_ERROR',
            message: 'Failed to fetch multiple prices',
            details: error.message
          }
        ]
      });
    }
  });
};

export default priceRoutes;
