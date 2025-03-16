/**
 * Transaction feed API routes
 */
import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { TransactionFeedOptions } from '../../features/market/types';

/**
 * Transaction route parameter schemas
 */
const transactionQuerySchema = z.object({
  limit: z.number().int().min(1).max(100).default(50),
  offset: z.number().int().min(0).default(0),
  types: z.string().optional().transform(val => 
    val ? val.split(',').map(t => t.trim()) : undefined
  ),
  minAmount: z.number().min(0).optional(),
  fromTimestamp: z.string().optional().transform(val => 
    val ? new Date(val) : undefined
  ),
  toTimestamp: z.string().optional().transform(val => 
    val ? new Date(val) : undefined
  ),
  significantOnly: z.boolean().optional()
});

/**
 * Transaction API plugin
 */
const transactionRoutes: FastifyPluginAsync = async (fastify) => {
  // Get transaction feed
  fastify.get<{
    Querystring: TransactionFeedOptions
  }>('/', {
    schema: {
      querystring: transactionQuerySchema,
      response: {
        200: {
          type: 'object',
          properties: {
            data: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  txHash: { type: 'string' },
                  blockNumber: { type: 'number' },
                  timestamp: { type: 'string', format: 'date-time' },
                  type: { type: 'string', enum: ['buy', 'sell', 'transfer', 'liquidity', 'other'] },
                  amount: { type: 'string' },
                  amountUsd: { type: 'number' },
                  fromAddress: { type: 'string' },
                  toAddress: { type: 'string' },
                  signerLabel: { type: 'string' },
                  isSignificant: { type: 'boolean' }
                }
              }
            },
            pagination: {
              type: 'object',
              properties: {
                total: { type: 'number' },
                limit: { type: 'number' },
                offset: { type: 'number' },
                hasMore: { type: 'boolean' }
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
      // Get transaction feed
      const result = await fastify.market.transactionService.getTransactions(request.query);
      
      // Return response
      return {
        data: result.data,
        pagination: result.pagination,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        }
      };
    } catch (error) {
      request.log.error('Error fetching transaction feed', { 
        query: request.query,
        error 
      });
      throw error;
    }
  });
  
  // Get significant transactions
  fastify.get<{
    Querystring: { limit?: number }
  }>('/significant', {
    schema: {
      querystring: z.object({
        limit: z.number().int().min(1).max(100).default(10)
      }),
      response: {
        200: {
          type: 'object',
          properties: {
            data: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  txHash: { type: 'string' },
                  blockNumber: { type: 'number' },
                  timestamp: { type: 'string', format: 'date-time' },
                  type: { type: 'string', enum: ['buy', 'sell', 'transfer', 'liquidity', 'other'] },
                  amount: { type: 'string' },
                  amountUsd: { type: 'number' },
                  fromAddress: { type: 'string' },
                  toAddress: { type: 'string' },
                  signerLabel: { type: 'string' },
                  isSignificant: { type: 'boolean' }
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
    const { limit = 10 } = request.query;
    
    try {
      // Get significant transactions
      const transactions = await fastify.market.transactionService.getSignificantTransactions(limit);
      
      // Return response
      return {
        data: transactions,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        }
      };
    } catch (error) {
      request.log.error('Error fetching significant transactions', { 
        limit,
        error 
      });
      throw error;
    }
  });
  
  // Get transaction volume
  fastify.get<{
    Querystring: { period: string }
  }>('/volume', {
    schema: {
      querystring: z.object({
        period: z.string().default('24h')
      }),
      response: {
        200: {
          type: 'object',
          properties: {
            data: {
              type: 'object',
              properties: {
                period: { type: 'string' },
                volume: {
                  type: 'object',
                  properties: {
                    buy: { type: 'number' },
                    sell: { type: 'number' },
                    transfer: { type: 'number' },
                    liquidity: { type: 'number' },
                    total: { type: 'number' }
                  }
                },
                count: {
                  type: 'object',
                  properties: {
                    buy: { type: 'number' },
                    sell: { type: 'number' },
                    transfer: { type: 'number' },
                    liquidity: { type: 'number' },
                    total: { type: 'number' }
                  }
                },
                averageSize: { type: 'number' }
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
    const { period = '24h' } = request.query;
    
    try {
      // Get transaction volume
      const volume = await fastify.market.transactionService.getTransactionVolume(period);
      
      // Return response
      return {
        data: volume,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        }
      };
    } catch (error) {
      request.log.error('Error fetching transaction volume', { 
        period,
        error 
      });
      throw error;
    }
  });
  
  // Refresh transaction feed
  fastify.post('/refresh', {
    schema: {
      response: {
        200: {
          type: 'object',
          properties: {
            data: {
              type: 'object',
              properties: {
                success: { type: 'boolean' }
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
      // Refresh transaction feed
      await fastify.market.transactionService.refreshTransactionFeed();
      
      // Return response
      return {
        data: {
          success: true
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        }
      };
    } catch (error) {
      request.log.error('Error refreshing transaction feed', { error });
      throw error;
    }
  });
};

export default transactionRoutes;
