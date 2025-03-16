/**
 * Charts API routes
 */
import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { TimePeriod } from '../../features/market/types';

/**
 * Chart route parameter schemas
 */
const symbolParamSchema = z.object({
  symbol: z.string().min(1).max(10)
});

const periodQuerySchema = z.object({
  period: z.enum(['1h', '1d', '1w', '1m', 'all']).default('1d')
});

const comparisonQuerySchema = z.object({
  symbols: z.string().min(1),
  period: z.enum(['1h', '1d', '1w', '1m', 'all']).default('1d')
});

const metricsQuerySchema = z.object({
  metrics: z.string().min(1)
});

/**
 * Charts API plugin
 */
const chartsRoutes: FastifyPluginAsync = async (fastify) => {
  // Get price chart data
  fastify.get<{
    Params: { symbol: string },
    Querystring: { period?: TimePeriod }
  }>('/price/:symbol', {
    schema: {
      params: symbolParamSchema,
      querystring: periodQuerySchema,
      response: {
        200: {
          type: 'object',
          properties: {
            data: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                labels: { type: 'array', items: { type: 'string' } },
                datasets: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      label: { type: 'string' },
                      data: { type: 'array', items: { type: 'number' } },
                      borderColor: { type: 'string' },
                      backgroundColor: { type: 'string' },
                      fill: { type: 'boolean' }
                    }
                  }
                },
                annotations: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      type: { type: 'string' },
                      mode: { type: 'string' },
                      scaleID: { type: 'string' },
                      value: { type: ['string', 'number'] },
                      borderColor: { type: 'string' },
                      label: {
                        type: 'object',
                        properties: {
                          content: { type: 'string' },
                          enabled: { type: 'boolean' }
                        }
                      }
                    }
                  }
                }
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
    const { period = '1d' } = request.query;
    
    try {
      // Get price chart data
      const chartData = await fastify.market.visualizationService.getPriceChart(symbol, period);
      
      // Return response
      return {
        data: chartData,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        }
      };
    } catch (error) {
      request.log.error('Error fetching price chart data', { 
        symbol, 
        period, 
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
  
  // Get market cap chart data
  fastify.get<{
    Params: { symbol: string },
    Querystring: { period?: TimePeriod }
  }>('/marketcap/:symbol', {
    schema: {
      params: symbolParamSchema,
      querystring: periodQuerySchema,
      response: {
        200: {
          type: 'object',
          properties: {
            data: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                labels: { type: 'array', items: { type: 'string' } },
                datasets: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      label: { type: 'string' },
                      data: { type: 'array', items: { type: 'number' } },
                      borderColor: { type: 'string' },
                      backgroundColor: { type: 'string' },
                      fill: { type: 'boolean' }
                    }
                  }
                }
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
    const { period = '1d' } = request.query;
    
    try {
      // Get market cap chart data
      const chartData = await fastify.market.visualizationService.getMarketCapChart(symbol, period);
      
      // Return response
      return {
        data: chartData,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        }
      };
    } catch (error) {
      request.log.error('Error fetching market cap chart data', { 
        symbol, 
        period, 
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
  
  // Get volume chart data
  fastify.get<{
    Params: { symbol: string },
    Querystring: { period?: TimePeriod }
  }>('/volume/:symbol', {
    schema: {
      params: symbolParamSchema,
      querystring: periodQuerySchema,
      response: {
        200: {
          type: 'object',
          properties: {
            data: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                labels: { type: 'array', items: { type: 'string' } },
                datasets: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      label: { type: 'string' },
                      data: { type: 'array', items: { type: 'number' } },
                      borderColor: { type: 'string' },
                      backgroundColor: { type: 'string' },
                      fill: { type: 'boolean' }
                    }
                  }
                }
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
    const { period = '1d' } = request.query;
    
    try {
      // Get volume chart data
      const chartData = await fastify.market.visualizationService.getVolumeChart(symbol, period);
      
      // Return response
      return {
        data: chartData,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        }
      };
    } catch (error) {
      request.log.error('Error fetching volume chart data', { 
        symbol, 
        period, 
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
  
  // Get milestone progress chart data
  fastify.get('/milestone-progress', {
    schema: {
      response: {
        200: {
          type: 'object',
          properties: {
            data: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                labels: { type: 'array', items: { type: 'string' } },
                datasets: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      label: { type: 'string' },
                      data: { type: 'array', items: { type: 'number' } },
                      borderColor: { type: 'string' },
                      backgroundColor: { type: 'string' },
                      fill: { type: 'boolean' }
                    }
                  }
                }
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
    try {
      // Get milestone progress chart data
      const chartData = await fastify.market.visualizationService.getMilestoneProgress();
      
      // Return response
      return {
        data: chartData,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        }
      };
    } catch (error) {
      request.log.error('Error fetching milestone progress chart data', { error });
      throw error;
    }
  });
  
  // Get comparison chart data
  fastify.get<{
    Querystring: { symbols: string, period?: TimePeriod }
  }>('/comparison', {
    schema: {
      querystring: comparisonQuerySchema,
      response: {
        200: {
          type: 'object',
          properties: {
            data: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                labels: { type: 'array', items: { type: 'string' } },
                datasets: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      label: { type: 'string' },
                      data: { type: 'array', items: { type: 'number' } },
                      borderColor: { type: 'string' },
                      backgroundColor: { type: 'string' },
                      fill: { type: 'boolean' }
                    }
                  }
                }
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
    const { symbols, period = '1d' } = request.query;
    const symbolArray = symbols.split(',').map(s => s.trim());
    
    try {
      // Get comparison chart data
      const chartData = await fastify.market.visualizationService.getComparisonChart(symbolArray, period);
      
      // Return response
      return {
        data: chartData,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        }
      };
    } catch (error) {
      request.log.error('Error fetching comparison chart data', { 
        symbols: symbolArray, 
        period, 
        error 
      });
      throw error;
    }
  });
  
  // Get market metrics chart data
  fastify.get<{
    Params: { symbol: string },
    Querystring: { metrics: string }
  }>('/metrics/:symbol', {
    schema: {
      params: symbolParamSchema,
      querystring: metricsQuerySchema,
      response: {
        200: {
          type: 'object',
          properties: {
            data: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                labels: { type: 'array', items: { type: 'string' } },
                datasets: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      label: { type: 'string' },
                      data: { type: 'array', items: { type: 'number' } },
                      borderColor: { type: 'string' },
                      backgroundColor: { type: 'string' },
                      fill: { type: 'boolean' }
                    }
                  }
                }
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
    const { metrics } = request.query;
    const metricsArray = metrics.split(',').map(m => m.trim());
    
    try {
      // Get market metrics chart data
      const chartData = await fastify.market.visualizationService.getMarketMetricsChart(symbol, metricsArray);
      
      // Return response
      return {
        data: chartData,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        }
      };
    } catch (error) {
      request.log.error('Error fetching market metrics chart data', { 
        symbol, 
        metrics: metricsArray, 
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
};

export default chartsRoutes;
