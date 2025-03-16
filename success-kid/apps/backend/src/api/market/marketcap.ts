/**
 * Market Cap API Routes
 * 
 * API endpoints for token market capitalization data.
 */
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { marketCapService } from '../../market/marketcap/service';
import { logger } from '../../lib/logger';
import { TimePeriod, DataResolution } from '../../models/entities/market/price.model';
import { ApiError } from '../../errors/api-error';
import { validationMiddleware } from '../../middleware/validation';
import { transactionMiddleware } from '../../middleware/transaction';
import { rateLimitMiddleware } from '../../middleware/rate-limit';

// Parameter schemas
const symbolParamSchema = {
  type: 'object',
  required: ['symbol'],
  properties: {
    symbol: { type: 'string', minLength: 1, maxLength: 10 }
  }
};

const historyQuerySchema = {
  type: 'object',
  properties: {
    period: { 
      type: 'string', 
      enum: Object.values(TimePeriod),
      default: TimePeriod.DAY_1
    },
    resolution: { 
      type: 'string', 
      enum: Object.values(DataResolution)
    },
    forceRefresh: { 
      type: 'boolean',
      default: false
    }
  }
};

/**
 * Market cap routes registration
 * 
 * @param fastify Fastify instance
 * @param opts Options
 */
export const marketCapRoutes = async (fastify: FastifyInstance, opts: any) => {
  // Apply middleware
  fastify.addHook('preHandler', rateLimitMiddleware);
  fastify.addHook('preHandler', transactionMiddleware);
  
  /**
   * @openapi
   * /api/v1/market/cap/{symbol}:
   *   get:
   *     summary: Get current market cap for a token
   *     tags: [Market]
   *     parameters:
   *       - name: symbol
   *         in: path
   *         required: true
   *         schema:
   *           type: string
   *       - name: forceRefresh
   *         in: query
   *         required: false
   *         schema:
   *           type: boolean
   *     responses:
   *       200:
   *         description: Current market cap data
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   type: object
   *                   properties:
   *                     symbol:
   *                       type: string
   *                     marketCap:
   *                       type: string
   *                     fullyDilutedMarketCap:
   *                       type: string
   *                     circulatingSupply:
   *                       type: string
   *                     totalSupply:
   *                       type: string
   *                     price:
   *                       type: number
   *                     lastUpdated:
   *                       type: string
   *                       format: date-time
   */
  fastify.get(
    '/:symbol',
    { 
      schema: { params: symbolParamSchema },
      preHandler: validationMiddleware
    },
    async (request: FastifyRequest<{
      Params: { symbol: string };
      Querystring: { forceRefresh?: boolean };
    }>, reply: FastifyReply) => {
      const { symbol } = request.params;
      const { forceRefresh = false } = request.query;
      
      try {
        const marketCapData = await marketCapService.getMarketCap(symbol, forceRefresh);
        
        return reply.code(200).send({
          data: marketCapData,
          meta: {
            timestamp: new Date().toISOString(),
            requestId: request.id
          }
        });
      } catch (error) {
        logger.error('Market cap API error', { symbol, error });
        throw new ApiError('Failed to get market cap data', 500);
      }
    }
  );
  
  /**
   * @openapi
   * /api/v1/market/cap/{symbol}/history:
   *   get:
   *     summary: Get historical market cap data for a token
   *     tags: [Market]
   *     parameters:
   *       - name: symbol
   *         in: path
   *         required: true
   *         schema:
   *           type: string
   *       - name: period
   *         in: query
   *         required: false
   *         schema:
   *           type: string
   *           enum: [1h, 1d, 1w, 1m, all]
   *           default: 1d
   *       - name: resolution
   *         in: query
   *         required: false
   *         schema:
   *           type: string
   *           enum: [1m, 5m, 15m, 1h, 4h, 1d, 1w]
   *     responses:
   *       200:
   *         description: Historical market cap data
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   type: array
   *                   items:
   *                     type: object
   *                     properties:
   *                       timestamp:
   *                         type: string
   *                         format: date-time
   *                       marketCap:
   *                         type: string
   *                       price:
   *                         type: number
   */
  fastify.get(
    '/:symbol/history',
    { 
      schema: { 
        params: symbolParamSchema,
        querystring: historyQuerySchema
      },
      preHandler: validationMiddleware
    },
    async (request: FastifyRequest<{
      Params: { symbol: string };
      Querystring: { 
        period?: TimePeriod;
        resolution?: DataResolution;
      };
    }>, reply: FastifyReply) => {
      const { symbol } = request.params;
      const { 
        period = TimePeriod.DAY_1,
        resolution
      } = request.query;
      
      try {
        const historyData = await marketCapService.getHistoricalMarketCap(
          symbol,
          period,
          resolution
        );
        
        return reply.code(200).send({
          data: historyData,
          meta: {
            timestamp: new Date().toISOString(),
            requestId: request.id,
            period,
            resolution
          }
        });
      } catch (error) {
        logger.error('Market cap history API error', { symbol, period, error });
        throw new ApiError('Failed to get historical market cap data', 500);
      }
    }
  );
  
  /**
   * @openapi
   * /api/v1/market/cap/{symbol}/supply:
   *   get:
   *     summary: Get token supply information
   *     tags: [Market]
   *     parameters:
   *       - name: symbol
   *         in: path
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Token supply information
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   type: object
   *                   properties:
   *                     circulatingSupply:
   *                       type: string
   *                     totalSupply:
   *                       type: string
   */
  fastify.get(
    '/:symbol/supply',
    { 
      schema: { params: symbolParamSchema },
      preHandler: validationMiddleware
    },
    async (request: FastifyRequest<{
      Params: { symbol: string };
    }>, reply: FastifyReply) => {
      const { symbol } = request.params;
      
      try {
        const circulatingSupply = await marketCapService.getCirculatingSupply(symbol);
        const totalSupply = await marketCapService.getTotalSupply(symbol);
        
        return reply.code(200).send({
          data: {
            circulatingSupply,
            totalSupply
          },
          meta: {
            timestamp: new Date().toISOString(),
            requestId: request.id
          }
        });
      } catch (error) {
        logger.error('Supply API error', { symbol, error });
        throw new ApiError('Failed to get supply data', 500);
      }
    }
  );
  
  /**
   * @openapi
   * /api/v1/market/cap/{symbol}/change:
   *   get:
   *     summary: Get market cap change over a period
   *     tags: [Market]
   *     parameters:
   *       - name: symbol
   *         in: path
   *         required: true
   *         schema:
   *           type: string
   *       - name: period
   *         in: query
   *         required: false
   *         schema:
   *           type: string
   *           enum: [1h, 1d, 1w, 1m, all]
   *           default: 1d
   *     responses:
   *       200:
   *         description: Market cap change data
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   type: object
   *                   properties:
   *                     symbol:
   *                       type: string
   *                     period:
   *                       type: string
   *                     changePercent:
   *                       type: number
   */
  fastify.get(
    '/:symbol/change',
    { 
      schema: { 
        params: symbolParamSchema,
        querystring: {
          type: 'object',
          properties: {
            period: { 
              type: 'string', 
              enum: Object.values(TimePeriod),
              default: TimePeriod.DAY_1
            }
          }
        }
      },
      preHandler: validationMiddleware
    },
    async (request: FastifyRequest<{
      Params: { symbol: string };
      Querystring: { period?: TimePeriod };
    }>, reply: FastifyReply) => {
      const { symbol } = request.params;
      const { period = TimePeriod.DAY_1 } = request.query;
      
      try {
        const changePercent = await marketCapService.getMarketCapChange(symbol, period);
        
        return reply.code(200).send({
          data: {
            symbol,
            period,
            changePercent
          },
          meta: {
            timestamp: new Date().toISOString(),
            requestId: request.id
          }
        });
      } catch (error) {
        logger.error('Market cap change API error', { symbol, period, error });
        throw new ApiError('Failed to get market cap change data', 500);
      }
    }
  );
  
  /**
   * @openapi
   * /api/v1/market/cap/multi:
   *   get:
   *     summary: Get market cap for multiple tokens
   *     tags: [Market]
   *     parameters:
   *       - name: symbols
   *         in: query
   *         required: true
   *         schema:
   *           type: string
   *           description: Comma-separated list of token symbols
   *     responses:
   *       200:
   *         description: Multiple token market caps
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   type: object
   *                   additionalProperties:
   *                     $ref: '#/components/schemas/MarketCapData'
   */
  fastify.get(
    '/multi',
    {
      schema: {
        querystring: {
          type: 'object',
          required: ['symbols'],
          properties: {
            symbols: { 
              type: 'string',
              description: 'Comma-separated list of token symbols'
            }
          }
        }
      },
      preHandler: validationMiddleware
    },
    async (request: FastifyRequest<{
      Querystring: { symbols: string };
    }>, reply: FastifyReply) => {
      const { symbols } = request.query;
      const symbolList = symbols.split(',').map(s => s.trim());
      
      if (symbolList.length === 0) {
        throw new ApiError('No symbols provided', 400);
      }
      
      if (symbolList.length > 10) {
        throw new ApiError('Too many symbols (max 10)', 400);
      }
      
      try {
        const marketCapData = await marketCapService.getMultipleMarketCaps(symbolList);
        
        return reply.code(200).send({
          data: marketCapData,
          meta: {
            timestamp: new Date().toISOString(),
            requestId: request.id
          }
        });
      } catch (error) {
        logger.error('Multi market cap API error', { symbols, error });
        throw new ApiError('Failed to get multiple market caps', 500);
      }
    }
  );
};
