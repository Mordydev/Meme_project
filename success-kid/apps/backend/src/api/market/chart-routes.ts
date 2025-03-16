/**
 * Chart data API routes
 */
import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { TimePeriod } from '../../features/market/types';
import { logger } from '../../lib/logger';

const chartRoutes: FastifyPluginAsync = async (fastify) => {
  /**
   * Get price chart data
   */
  fastify.get('/price/:symbol', {
    schema: {
      params: z.object({
        symbol: z.string().min(1).max(10)
      }),
      querystring: z.object({
        period: z.enum(['1h', '1d', '1w', '1m', 'all'] as const).optional().default('1d')
      }),
      response: {
        200: z.object({
          data: z.object({
            title: z.string(),
            labels: z.array(z.string()),
            datasets: z.array(z.object({
              label: z.string(),
              data: z.array(z.number()),
              borderColor: z.string(),
              backgroundColor: z.string(),
              fill: z.boolean(),
              borderDash: z.array(z.number()).optional()
            })),
            annotations: z.array(z.object({
              type: z.string(),
              mode: z.string(),
              scaleID: z.string(),
              value: z.union([z.string(), z.number()]),
              borderColor: z.string(),
              label: z.object({
                content: z.string(),
                enabled: z.boolean()
              }).optional()
            })).optional(),
            options: z.record(z.string(), z.any()).optional()
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
    const { period } = request.query;
    
    try {
      // Get price chart data from service
      const visualizationService = fastify.market.visualizationService;
      
      const chartData = await visualizationService.getPriceChart(symbol, period as TimePeriod);
      
      // Return chart data
      return {
        data: chartData,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        }
      };
    } catch (error) {
      logger.error('Failed to get price chart data', { symbol, period, error });
      return reply.code(500).send({
        data: null,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        },
        errors: [
          {
            code: 'PRICE_CHART_ERROR',
            message: 'Failed to fetch price chart data',
            details: error.message
          }
        ]
      });
    }
  });
  
  /**
   * Get market cap chart data
   */
  fastify.get('/marketcap/:symbol', {
    schema: {
      params: z.object({
        symbol: z.string().min(1).max(10)
      }),
      querystring: z.object({
        period: z.enum(['1h', '1d', '1w', '1m', 'all'] as const).optional().default('1d')
      }),
      response: {
        200: z.object({
          data: z.object({
            title: z.string(),
            labels: z.array(z.string()),
            datasets: z.array(z.object({
              label: z.string(),
              data: z.array(z.number()),
              borderColor: z.string(),
              backgroundColor: z.string(),
              fill: z.boolean(),
              borderDash: z.array(z.number()).optional()
            })),
            annotations: z.array(z.object({
              type: z.string(),
              mode: z.string(),
              scaleID: z.string(),
              value: z.union([z.string(), z.number()]),
              borderColor: z.string(),
              label: z.object({
                content: z.string(),
                enabled: z.boolean()
              }).optional()
            })).optional(),
            options: z.record(z.string(), z.any()).optional()
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
    const { period } = request.query;
    
    try {
      // Get market cap chart data from service
      const visualizationService = fastify.market.visualizationService;
      
      const chartData = await visualizationService.getMarketCapChart(symbol, period as TimePeriod);
      
      // Return chart data
      return {
        data: chartData,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        }
      };
    } catch (error) {
      logger.error('Failed to get market cap chart data', { symbol, period, error });
      return reply.code(500).send({
        data: null,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        },
        errors: [
          {
            code: 'MARKETCAP_CHART_ERROR',
            message: 'Failed to fetch market cap chart data',
            details: error.message
          }
        ]
      });
    }
  });
  
  /**
   * Get volume chart data
   */
  fastify.get('/volume/:symbol', {
    schema: {
      params: z.object({
        symbol: z.string().min(1).max(10)
      }),
      querystring: z.object({
        period: z.enum(['1h', '1d', '1w', '1m', 'all'] as const).optional().default('1d')
      }),
      response: {
        200: z.object({
          data: z.object({
            title: z.string(),
            labels: z.array(z.string()),
            datasets: z.array(z.object({
              label: z.string(),
              data: z.array(z.number()),
              borderColor: z.string(),
              backgroundColor: z.string(),
              fill: z.boolean(),
              borderDash: z.array(z.number()).optional()
            })),
            options: z.record(z.string(), z.any()).optional()
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
    const { period } = request.query;
    
    try {
      // Get volume chart data from service
      const visualizationService = fastify.market.visualizationService;
      
      const chartData = await visualizationService.getVolumeChart(symbol, period as TimePeriod);
      
      // Return chart data
      return {
        data: chartData,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        }
      };
    } catch (error) {
      logger.error('Failed to get volume chart data', { symbol, period, error });
      return reply.code(500).send({
        data: null,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        },
        errors: [
          {
            code: 'VOLUME_CHART_ERROR',
            message: 'Failed to fetch volume chart data',
            details: error.message
          }
        ]
      });
    }
  });
  
  /**
   * Get milestone progress chart
   */
  fastify.get('/milestones', {
    schema: {
      response: {
        200: z.object({
          data: z.object({
            title: z.string(),
            labels: z.array(z.string()),
            datasets: z.array(z.object({
              label: z.string(),
              data: z.array(z.number()),
              borderColor: z.string(),
              backgroundColor: z.string(),
              fill: z.boolean(),
              borderDash: z.array(z.number()).optional()
            })),
            options: z.record(z.string(), z.any()).optional()
          }),
          meta: z.object({
            timestamp: z.string().datetime(),
            requestId: z.string()
          })
        })
      }
    }
  }, async (request, reply) => {
    try {
      // Get milestone progress chart data from service
      const visualizationService = fastify.market.visualizationService;
      
      const chartData = await visualizationService.getMilestoneProgress();
      
      // Return chart data
      return {
        data: chartData,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        }
      };
    } catch (error) {
      logger.error('Failed to get milestone progress chart data', { error });
      return reply.code(500).send({
        data: null,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        },
        errors: [
          {
            code: 'MILESTONE_CHART_ERROR',
            message: 'Failed to fetch milestone progress chart data',
            details: error.message
          }
        ]
      });
    }
  });
  
  /**
   * Get comparison chart for multiple tokens
   */
  fastify.get('/comparison', {
    schema: {
      querystring: z.object({
        symbols: z.string().min(1),
        period: z.enum(['1h', '1d', '1w', '1m', 'all'] as const).optional().default('1w')
      }),
      response: {
        200: z.object({
          data: z.object({
            title: z.string(),
            labels: z.array(z.string()),
            datasets: z.array(z.object({
              label: z.string(),
              data: z.array(z.number()),
              borderColor: z.string(),
              backgroundColor: z.string(),
              fill: z.boolean(),
              borderDash: z.array(z.number()).optional()
            })),
            options: z.record(z.string(), z.any()).optional()
          }),
          meta: z.object({
            timestamp: z.string().datetime(),
            requestId: z.string()
          })
        })
      }
    }
  }, async (request, reply) => {
    const { symbols, period } = request.query;
    const symbolArray = symbols.split(',').map(s => s.trim());
    
    try {
      // Get comparison chart data from service
      const visualizationService = fastify.market.visualizationService;
      
      const chartData = await visualizationService.getComparisonChart(symbolArray, period as TimePeriod);
      
      // Return chart data
      return {
        data: chartData,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        }
      };
    } catch (error) {
      logger.error('Failed to get comparison chart data', { symbols, period, error });
      return reply.code(500).send({
        data: null,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        },
        errors: [
          {
            code: 'COMPARISON_CHART_ERROR',
            message: 'Failed to fetch comparison chart data',
            details: error.message
          }
        ]
      });
    }
  });
  
  /**
   * Get multi-metric chart for a token
   */
  fastify.get('/metrics/:symbol', {
    schema: {
      params: z.object({
        symbol: z.string().min(1).max(10)
      }),
      querystring: z.object({
        metrics: z.string().min(1)
      }),
      response: {
        200: z.object({
          data: z.object({
            title: z.string(),
            labels: z.array(z.string()),
            datasets: z.array(z.object({
              label: z.string(),
              data: z.array(z.number()),
              borderColor: z.string(),
              backgroundColor: z.string(),
              fill: z.boolean(),
              borderDash: z.array(z.number()).optional()
            })),
            options: z.record(z.string(), z.any()).optional()
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
    const { metrics } = request.query;
    const metricsArray = metrics.split(',').map(m => m.trim());
    
    try {
      // Get metrics chart data from service
      const visualizationService = fastify.market.visualizationService;
      
      const chartData = await visualizationService.getMarketMetricsChart(symbol, metricsArray);
      
      // Return chart data
      return {
        data: chartData,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        }
      };
    } catch (error) {
      logger.error('Failed to get metrics chart data', { symbol, metrics, error });
      return reply.code(500).send({
        data: null,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        },
        errors: [
          {
            code: 'METRICS_CHART_ERROR',
            message: 'Failed to fetch metrics chart data',
            details: error.message
          }
        ]
      });
    }
  });
};

export default chartRoutes;
