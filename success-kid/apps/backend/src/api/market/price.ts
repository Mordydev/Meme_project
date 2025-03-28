/**
 * Price API Routes
 * 
 * API endpoints for token price data.
 */
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { priceService } from '../../market/price/service';
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
 * Price routes registration
 * 
 * @param fastify Fastify instance
 * @param opts Options
 */
export const priceRoutes = async (fastify: FastifyInstance, opts: any) => {
  // Apply middleware
  fastify.addHook('preHandler', rateLimitMiddleware);
  fastify.addHook('preHandler', transactionMiddleware);
  
  /**
   * @openapi
   * /api/v1/market/price/{symbol}:
   *   get:
   *     summary: Get current price for a token
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
   *         description: Current token price
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
   *                     priceUsd:
   *                       type: number
   *                     priceChange24h:
   *                       type: number
   *                     volume24h:
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
        const priceData = await priceService.getCurrentPrice(symbol, forceRefresh);
        
        return reply.code(200).send({
          data: priceData,
          meta: {
            timestamp: new Date().toISOString(),
            requestId: request.id
          }
        });
      } catch (error) {
        logger.error('Price API error', { symbol, error });
        throw new ApiError('Failed to get price data', 500);
      }
    }
  );
  
  /**
   * @openapi
   * /api/v1/market/price/{symbol}/history:
   *   get:
   *     summary: Get historical price data for a token
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
   *         description: Historical price data
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
   *                       price:
   *                         type: number
   *                       volume:
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
        forceRefresh?: boolean;
      };
    }>, reply: FastifyReply) => {
      const { symbol } = request.params;
      const { 
        period = TimePeriod.DAY_1,
        resolution
      } = request.query;
      
      try {
        const historyData = await priceService.getHistoricalPrices(
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
        logger.error('Price history API error', { symbol, period, error });
        throw new ApiError('Failed to get historical price data', 500);
      }
    }
  );
  
  /**
   * @openapi
   * /api/v1/market/price/multi:
   *   get:
   *     summary: Get prices for multiple tokens
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
   *         description: Multiple token prices
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   type: object
   *                   additionalProperties:
   *                     type: object
   *                     properties:
   *                       symbol:
   *                         type: string
   *                       priceUsd:
   *                         type: number
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
        const priceData = await priceService.getMultiplePrices(symbolList);
        
        return reply.code(200).send({
          data: priceData,
          meta: {
            timestamp: new Date().toISOString(),
            requestId: request.id
          }
        });
      } catch (error) {
        logger.error('Multi price API error', { symbols, error });
        throw new ApiError('Failed to get multiple prices', 500);
      }
    }
  );
};
