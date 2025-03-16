/**
 * Transaction feed API routes
 */
import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { logger } from '../../lib/logger';

const transactionRoutes: FastifyPluginAsync = async (fastify) => {
  /**
   * Get transaction feed with filtering and pagination
   */
  fastify.get('/', {
    schema: {
      querystring: z.object({
        limit: z.number().int().min(1).max(100).optional().default(50),
        offset: z.number().int().min(0).optional().default(0),
        types: z.string().optional(),
        minAmount: z.number().min(0).optional(),
        fromTimestamp: z.string().datetime().optional(),
        toTimestamp: z.string().datetime().optional(),
        significantOnly: z.boolean().optional().default(false)
      }),
      response: {
        200: z.object({
          data: z.array(z.object({
            txHash: z.string(),
            blockNumber: z.number(),
            timestamp: z.string().datetime(),
            type: z.enum(['buy', 'sell', 'transfer', 'liquidity', 'other']),
            amount: z.string(),
            amountUsd: z.number(),
            fromAddress: z.string(),
            toAddress: z.string(),
            signerLabel: z.string().optional(),
            isSignificant: z.boolean()
          })),
          pagination: z.object({
            total: z.number(),
            limit: z.number(),
            offset: z.number(),
            hasMore: z.boolean()
          }),
          meta: z.object({
            timestamp: z.string().datetime(),
            requestId: z.string()
          })
        })
      }
    }
  }, async (request, reply) => {
    const {
      limit,
      offset,
      types,
      minAmount,
      fromTimestamp,
      toTimestamp,
      significantOnly
    } = request.query;
    
    // Parse types string to array if provided
    const typesArray = types ? types.split(',').map(t => t.trim()) : undefined;
    
    try {
      // Get transactions from service
      const transactionService = fastify.market.transactionService;
      
      const transactions = await transactionService.getTransactions({
        limit,
        offset,
        types: typesArray,
        minAmount,
        fromTimestamp: fromTimestamp ? new Date(fromTimestamp) : undefined,
        toTimestamp: toTimestamp ? new Date(toTimestamp) : undefined,
        significantOnly
      });
      
      // Format response
      return {
        data: transactions.data.map(tx => ({
          ...tx,
          timestamp: tx.timestamp.toISOString()
        })),
        pagination: transactions.pagination,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        }
      };
    } catch (error) {
      logger.error('Failed to get transactions', { error });
      return reply.code(500).send({
        data: null,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        },
        errors: [
          {
            code: 'TRANSACTION_FETCH_ERROR',
            message: 'Failed to fetch transaction data',
            details: error.message
          }
        ]
      });
    }
  });
  
  /**
   * Get significant transactions
   */
  fastify.get('/significant', {
    schema: {
      querystring: z.object({
        limit: z.number().int().min(1).max(50).optional().default(10)
      }),
      response: {
        200: z.object({
          data: z.array(z.object({
            txHash: z.string(),
            blockNumber: z.number(),
            timestamp: z.string().datetime(),
            type: z.enum(['buy', 'sell', 'transfer', 'liquidity', 'other']),
            amount: z.string(),
            amountUsd: z.number(),
            fromAddress: z.string(),
            toAddress: z.string(),
            signerLabel: z.string().optional(),
            isSignificant: z.boolean()
          })),
          meta: z.object({
            timestamp: z.string().datetime(),
            requestId: z.string()
          })
        })
      }
    }
  }, async (request, reply) => {
    const { limit } = request.query;
    
    try {
      // Get significant transactions from service
      const transactionService = fastify.market.transactionService;
      
      const transactions = await transactionService.getSignificantTransactions(limit);
      
      // Format response
      return {
        data: transactions.map(tx => ({
          ...tx,
          timestamp: tx.timestamp.toISOString()
        })),
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        }
      };
    } catch (error) {
      logger.error('Failed to get significant transactions', { error });
      return reply.code(500).send({
        data: null,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        },
        errors: [
          {
            code: 'SIGNIFICANT_TX_FETCH_ERROR',
            message: 'Failed to fetch significant transactions',
            details: error.message
          }
        ]
      });
    }
  });
  
  /**
   * Get transaction volume statistics
   */
  fastify.get('/volume', {
    schema: {
      querystring: z.object({
        period: z.enum(['24h', '7d', '30d']).optional().default('24h')
      }),
      response: {
        200: z.object({
          data: z.object({
            period: z.string(),
            volume: z.record(z.string(), z.number()),
            count: z.record(z.string(), z.number()),
            averageSize: z.number()
          }),
          meta: z.object({
            timestamp: z.string().datetime(),
            requestId: z.string()
          })
        })
      }
    }
  }, async (request, reply) => {
    const { period } = request.query;
    
    try {
      // Get transaction volume from service
      const transactionService = fastify.market.transactionService;
      
      const volumeData = await transactionService.getTransactionVolume(period);
      
      // Format response
      return {
        data: volumeData,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        }
      };
    } catch (error) {
      logger.error('Failed to get transaction volume', { period, error });
      return reply.code(500).send({
        data: null,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        },
        errors: [
          {
            code: 'VOLUME_FETCH_ERROR',
            message: 'Failed to fetch transaction volume',
            details: error.message
          }
        ]
      });
    }
  });
  
  /**
   * Refresh transaction feed (force update)
   */
  fastify.post('/refresh', {
    schema: {
      response: {
        200: z.object({
          success: z.boolean(),
          meta: z.object({
            timestamp: z.string().datetime(),
            requestId: z.string()
          })
        })
      }
    }
  }, async (request, reply) => {
    try {
      // Refresh transaction feed
      const transactionService = fastify.market.transactionService;
      
      await transactionService.refreshTransactionFeed();
      
      return {
        success: true,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        }
      };
    } catch (error) {
      logger.error('Failed to refresh transaction feed', { error });
      return reply.code(500).send({
        success: false,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        },
        errors: [
          {
            code: 'TRANSACTION_REFRESH_ERROR',
            message: 'Failed to refresh transaction feed',
            details: error.message
          }
        ]
      });
    }
  });
};

export default transactionRoutes;
