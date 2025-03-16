/**
 * Market cap API routes
 */
import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { TimePeriod, DataResolution } from '../../features/market/types';
import { logger } from '../../lib/logger';

const marketCapRoutes: FastifyPluginAsync = async (fastify) => {
  /**
   * Get current market cap for a token
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
            marketCap: z.string(),
            fullyDilutedMarketCap: z.string(),
            circulatingSupply: z.string(),
            totalSupply: z.string(),
            price: z.number(),
            lastUpdated: z.string().datetime()
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
      // Get market cap from service
      const marketCapService = fastify.market.marketCapService;
      
      const marketCap = forceRefresh 
        ? await marketCapService.refreshMarketCap(symbol)
        : await marketCapService.getMarketCap(symbol);
        
      return {
        data: {
          ...marketCap,
          lastUpdated: marketCap.lastUpdated.toISOString()
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        }
      };
    } catch (error) {
      logger.error('Failed to get market cap', { symbol, error });
      return reply.code(500).send({
        data: null,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        },
        errors: [
          {
            code: 'MARKET_CAP_FETCH_ERROR',
            message: 'Failed to fetch market cap data',
            details: error.message
          }
        ]
      });
    }
  });
  
  /**
   * Get historical market cap data
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
            marketCap: z.string(),
            price: z.number()
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
      // Get market cap history from service
      const marketCapService = fastify.market.marketCapService;
      
      const marketCapHistory = await marketCapService.getHistoricalMarketCap(
        symbol,
        period as TimePeriod,
        resolution as DataResolution | undefined
      );
      
      return {
        data: marketCapHistory.map(point => ({
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
      logger.error('Failed to get market cap history', { symbol, period, resolution, error });
      return reply.code(500).send({
        data: null,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        },
        errors: [
          {
            code: 'MARKET_CAP_HISTORY_ERROR',
            message: 'Failed to fetch market cap history',
            details: error.message
          }
        ]
      });
    }
  });
  
  /**
   * Get token supply data
   */
  fastify.get('/:symbol/supply', {
    schema: {
      params: z.object({
        symbol: z.string().min(1).max(10)
      }),
      response: {
        200: z.object({
          data: z.object({
            symbol: z.string(),
            circulatingSupply: z.string(),
            totalSupply: z.string(),
            lastUpdated: z.string().datetime()
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
    
    try {
      // Get supply data from service
      const marketCapService = fastify.market.marketCapService;
      
      const circulatingSupply = await marketCapService.getCirculatingSupply(symbol);
      const totalSupply = await marketCapService.getTotalSupply(symbol);
        
      return {
        data: {
          symbol,
          circulatingSupply,
          totalSupply,
          lastUpdated: new Date().toISOString()
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        }
      };
    } catch (error) {
      logger.error('Failed to get supply data', { symbol, error });
      return reply.code(500).send({
        data: null,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        },
        errors: [
          {
            code: 'SUPPLY_FETCH_ERROR',
            message: 'Failed to fetch supply data',
            details: error.message
          }
        ]
      });
    }
  });
};

export default marketCapRoutes;
