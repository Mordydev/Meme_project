/**
 * Visualization API Routes
 * 
 * API endpoints for market data visualizations.
 */
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { visualizationService } from '../../market/visualization/service';
import { logger } from '../../lib/logger';
import { TimePeriod, DataResolution } from '../../models/entities/market/price.model';
import { ApiError } from '../../errors/api-error';
import { validationMiddleware } from '../../middleware/validation';
import { transactionMiddleware } from '../../middleware/transaction';
import { rateLimitMiddleware } from '../../middleware/rate-limit';

/**
 * Visualization routes registration
 * 
 * @param fastify Fastify instance
 * @param opts Options
 */
export const visualizationRoutes = async (fastify: FastifyInstance, opts: any) => {
  // Apply middleware
  fastify.addHook('preHandler', rateLimitMiddleware);
  fastify.addHook('preHandler', transactionMiddleware);
  
  /**
   * @openapi
   * /api/v1/market/chart/price/{symbol}:
   *   get:
   *     summary: Get price chart data
   *     tags: [Charts]
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
   *         description: Price chart data
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ChartData'
   */
  fastify.get(
    '/chart/price/:symbol',
    {
      schema: {
        params: {
          type: 'object',
          required: ['symbol'],
          properties: {
            symbol: { type: 'string', minLength: 1, maxLength: 10 }
          }
        },
        querystring: {
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
            }
          }
        }
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
        const chartData = await visualizationService.getPriceChart(
          symbol,
          period,
          resolution
        );
        
        return reply.code(200).send({
          data: chartData,
          meta: {
            timestamp: new Date().toISOString(),
            requestId: request.id
          }
        });
      } catch (error) {
        logger.error('Price chart API error', { symbol, period, error });
        throw new ApiError('Failed to generate price chart', 500);
      }
    }
  );
  
  /**
   * @openapi
   * /api/v1/market/chart/marketcap/{symbol}:
   *   get:
   *     summary: Get market cap chart data
   *     tags: [Charts]
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
   *         description: Market cap chart data
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ChartData'
   */
  fastify.get(
    '/chart/marketcap/:symbol',
    {
      schema: {
        params: {
          type: 'object',
          required: ['symbol'],
          properties: {
            symbol: { type: 'string', minLength: 1, maxLength: 10 }
          }
        },
        querystring: {
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
            }
          }
        }
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
        const chartData = await visualizationService.getMarketCapChart(
          symbol,
          period,
          resolution
        );
        
        return reply.code(200).send({
          data: chartData,
          meta: {
            timestamp: new Date().toISOString(),
            requestId: request.id
          }
        });
      } catch (error) {
        logger.error('Market cap chart API error', { symbol, period, error });
        throw new ApiError('Failed to generate market cap chart', 500);
      }
    }
  );
  
  /**
   * @openapi
   * /api/v1/market/chart/volume/{symbol}:
   *   get:
   *     summary: Get volume chart data
   *     tags: [Charts]
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
   *         description: Volume chart data
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ChartData'
   */
  fastify.get(
    '/chart/volume/:symbol',
    {
      schema: {
        params: {
          type: 'object',
          required: ['symbol'],
          properties: {
            symbol: { type: 'string', minLength: 1, maxLength: 10 }
          }
        },
        querystring: {
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
            }
          }
        }
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
        const chartData = await visualizationService.getVolumeChart(
          symbol,
          period,
          resolution
        );
        
        return reply.code(200).send({
          data: chartData,
          meta: {
            timestamp: new Date().toISOString(),
            requestId: request.id
          }
        });
      } catch (error) {
        logger.error('Volume chart API error', { symbol, period, error });
        throw new ApiError('Failed to generate volume chart', 500);
      }
    }
  );
  
  /**
   * @openapi
   * /api/v1/market/chart/milestones/{symbol}:
   *   get:
   *     summary: Get milestone progress chart
   *     tags: [Charts]
   *     parameters:
   *       - name: symbol
   *         in: path
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Milestone progress chart data
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ChartData'
   */
  fastify.get(
    '/chart/milestones/:symbol',
    {
      schema: {
        params: {
          type: 'object',
          required: ['symbol'],
          properties: {
            symbol: { type: 'string', minLength: 1, maxLength: 10 }
          }
        }
      },
      preHandler: validationMiddleware
    },
    async (request: FastifyRequest<{
      Params: { symbol: string };
    }>, reply: FastifyReply) => {
      const { symbol } = request.params;
      
      try {
        const chartData = await visualizationService.getMilestoneProgressChart(symbol);
        
        return reply.code(200).send({
          data: chartData,
          meta: {
            timestamp: new Date().toISOString(),
            requestId: request.id
          }
        });
      } catch (error) {
        logger.error('Milestone chart API error', { symbol, error });
        throw new ApiError('Failed to generate milestone chart', 500);
      }
    }
  );
  
  /**
   * @openapi
   * /api/v1/market/chart/comparison:
   *   get:
   *     summary: Get token comparison chart
   *     tags: [Charts]
   *     parameters:
   *       - name: symbols
   *         in: query
   *         required: true
   *         schema:
   *           type: string
   *           description: Comma-separated list of token symbols
   *       - name: period
   *         in: query
   *         required: false
   *         schema:
   *           type: string
   *           enum: [1h, 1d, 1w, 1m, all]
   *           default: 1d
   *     responses:
   *       200:
   *         description: Comparison chart data
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ChartData'
   */
  fastify.get(
    '/chart/comparison',
    {
      schema: {
        querystring: {
          type: 'object',
          required: ['symbols'],
          properties: {
            symbols: { 
              type: 'string',
              description: 'Comma-separated list of token symbols'
            },
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
      Querystring: { 
        symbols: string;
        period?: TimePeriod;
      };
    }>, reply: FastifyReply) => {
      const { symbols, period = TimePeriod.DAY_1 } = request.query;
      const symbolList = symbols.split(',').map(s => s.trim());
      
      if (symbolList.length === 0) {
        throw new ApiError('No symbols provided', 400);
      }
      
      try {
        const chartData = await visualizationService.getComparisonChart(
          symbolList,
          period
        );
        
        return reply.code(200).send({
          data: chartData,
          meta: {
            timestamp: new Date().toISOString(),
            requestId: request.id
          }
        });
      } catch (error) {
        logger.error('Comparison chart API error', { symbols, period, error });
        throw new ApiError('Failed to generate comparison chart', 500);
      }
    }
  );
  
  /**
   * @openapi
   * /api/v1/market/chart/metrics/{symbol}:
   *   get:
   *     summary: Get market metrics chart
   *     tags: [Charts]
   *     parameters:
   *       - name: symbol
   *         in: path
   *         required: true
   *         schema:
   *           type: string
   *       - name: metrics
   *         in: query
   *         required: false
   *         schema:
   *           type: string
   *           description: Comma-separated list of metrics (price, volume, marketCap)
   *           default: price,volume,marketCap
   *     responses:
   *       200:
   *         description: Market metrics chart data
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ChartData'
   */
  fastify.get(
    '/chart/metrics/:symbol',
    {
      schema: {
        params: {
          type: 'object',
          required: ['symbol'],
          properties: {
            symbol: { type: 'string', minLength: 1, maxLength: 10 }
          }
        },
        querystring: {
          type: 'object',
          properties: {
            metrics: { 
              type: 'string',
              description: 'Comma-separated list of metrics',
              default: 'price,volume,marketCap'
            }
          }
        }
      },
      preHandler: validationMiddleware
    },
    async (request: FastifyRequest<{
      Params: { symbol: string };
      Querystring: { metrics?: string };
    }>, reply: FastifyReply) => {
      const { symbol } = request.params;
      const { metrics = 'price,volume,marketCap' } = request.query;
      const metricsList = metrics.split(',').map(m => m.trim());
      
      try {
        const chartData = await visualizationService.getMarketMetricsChart(
          symbol,
          metricsList
        );
        
        return reply.code(200).send({
          data: chartData,
          meta: {
            timestamp: new Date().toISOString(),
            requestId: request.id
          }
        });
      } catch (error) {
        logger.error('Metrics chart API error', { symbol, metrics, error });
        throw new ApiError('Failed to generate metrics chart', 500);
      }
    }
  );
};
