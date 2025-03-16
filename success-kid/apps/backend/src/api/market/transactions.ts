/**
 * Transaction API Routes
 * 
 * API endpoints for token transaction data.
 */
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { transactionFeedService } from '../../market/transactions/service';
import { logger } from '../../lib/logger';
import { ApiError } from '../../errors/api-error';
import { validationMiddleware } from '../../middleware/validation';
import { transactionMiddleware } from '../../middleware/transaction';
import { rateLimitMiddleware } from '../../middleware/rate-limit';
import { TransactionType } from '../../models/entities/market/transaction.model';

/**
 * Transaction routes registration
 * 
 * @param fastify Fastify instance
 * @param opts Options
 */
export const transactionRoutes = async (fastify: FastifyInstance, opts: any) => {
  // Apply middleware
  fastify.addHook('preHandler', rateLimitMiddleware);
  fastify.addHook('preHandler', transactionMiddleware);
  
  /**
   * @openapi
   * /api/v1/market/transactions:
   *   get:
   *     summary: Get recent transactions
   *     tags: [Market]
   *     parameters:
   *       - name: symbol
   *         in: query
   *         required: false
   *         schema:
   *           type: string
   *           default: SKC
   *       - name: limit
   *         in: query
   *         required: false
   *         schema:
   *           type: integer
   *           default: 50
   *       - name: offset
   *         in: query
   *         required: false
   *         schema:
   *           type: integer
   *           default: 0
   *       - name: types
   *         in: query
   *         required: false
   *         schema:
   *           type: string
   *           description: Comma-separated list of transaction types
   *       - name: minAmount
   *         in: query
   *         required: false
   *         schema:
   *           type: number
   *       - name: fromTimestamp
   *         in: query
   *         required: false
   *         schema:
   *           type: string
   *           format: date-time
   *       - name: toTimestamp
   *         in: query
   *         required: false
   *         schema:
   *           type: string
   *           format: date-time
   *       - name: significantOnly
   *         in: query
   *         required: false
   *         schema:
   *           type: boolean
   *           default: false
   *     responses:
   *       200:
   *         description: Recent transactions
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   type: array
   *                   items:
   *                     $ref: '#/components/schemas/TransactionFeedItem'
   *                 pagination:
   *                   type: object
   *                   properties:
   *                     total:
   *                       type: integer
   *                     limit:
   *                       type: integer
   *                     offset:
   *                       type: integer
   *                     hasMore:
   *                       type: boolean
   */
  fastify.get(
    '/',
    {
      schema: {
        querystring: {
          type: 'object',
          properties: {
            symbol: { type: 'string', default: 'SKC' },
            limit: { type: 'integer', minimum: 1, maximum: 100, default: 50 },
            offset: { type: 'integer', minimum: 0, default: 0 },
            types: { type: 'string' },
            minAmount: { type: 'number', minimum: 0 },
            fromTimestamp: { type: 'string', format: 'date-time' },
            toTimestamp: { type: 'string', format: 'date-time' },
            significantOnly: { type: 'boolean', default: false }
          }
        }
      },
      preHandler: validationMiddleware
    },
    async (request: FastifyRequest<{
      Querystring: {
        symbol?: string;
        limit?: number;
        offset?: number;
        types?: string;
        minAmount?: number;
        fromTimestamp?: string;
        toTimestamp?: string;
        significantOnly?: boolean;
      };
    }>, reply: FastifyReply) => {
      const { 
        symbol = 'SKC',
        limit = 50,
        offset = 0,
        types,
        minAmount,
        fromTimestamp,
        toTimestamp,
        significantOnly = false
      } = request.query;
      
      // Parse transaction types
      let parsedTypes: TransactionType[] | undefined;
      if (types) {
        parsedTypes = types.split(',').map(t => t.trim()) as TransactionType[];
      }
      
      // Parse timestamps
      let fromDate: Date | undefined;
      let toDate: Date | undefined;
      
      if (fromTimestamp) {
        fromDate = new Date(fromTimestamp);
      }
      
      if (toTimestamp) {
        toDate = new Date(toTimestamp);
      }
      
      try {
        const transactions = await transactionFeedService.getTransactions({
          symbol,
          limit,
          offset,
          types: parsedTypes,
          minAmount,
          fromTimestamp: fromDate,
          toTimestamp: toDate,
          significantOnly
        });
        
        return reply.code(200).send({
          data: transactions.data,
          pagination: transactions.pagination,
          meta: {
            timestamp: new Date().toISOString(),
            requestId: request.id
          }
        });
      } catch (error) {
        logger.error('Transactions API error', { symbol, error });
        throw new ApiError('Failed to get transaction data', 500);
      }
    }
  );
  
  /**
   * @openapi
   * /api/v1/market/transactions/significant:
   *   get:
   *     summary: Get significant transactions
   *     tags: [Market]
   *     parameters:
   *       - name: symbol
   *         in: query
   *         required: false
   *         schema:
   *           type: string
   *           default: SKC
   *       - name: limit
   *         in: query
   *         required: false
   *         schema:
   *           type: integer
   *           default: 10
   *     responses:
   *       200:
   *         description: Significant transactions
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   type: array
   *                   items:
   *                     $ref: '#/components/schemas/TransactionFeedItem'
   */
  fastify.get(
    '/significant',
    {
      schema: {
        querystring: {
          type: 'object',
          properties: {
            symbol: { type: 'string', default: 'SKC' },
            limit: { type: 'integer', minimum: 1, maximum: 50, default: 10 }
          }
        }
      },
      preHandler: validationMiddleware
    },
    async (request: FastifyRequest<{
      Querystring: {
        symbol?: string;
        limit?: number;
      };
    }>, reply: FastifyReply) => {
      const { 
        symbol = 'SKC',
        limit = 10
      } = request.query;
      
      try {
        const transactions = await transactionFeedService.getSignificantTransactions(
          symbol,
          limit
        );
        
        return reply.code(200).send({
          data: transactions,
          meta: {
            timestamp: new Date().toISOString(),
            requestId: request.id
          }
        });
      } catch (error) {
        logger.error('Significant transactions API error', { symbol, error });
        throw new ApiError('Failed to get significant transaction data', 500);
      }
    }
  );
  
  /**
   * @openapi
   * /api/v1/market/transactions/{txHash}:
   *   get:
   *     summary: Get transaction details by hash
   *     tags: [Market]
   *     parameters:
   *       - name: txHash
   *         in: path
   *         required: true
   *         schema:
   *           type: string
   *       - name: symbol
   *         in: query
   *         required: false
   *         schema:
   *           type: string
   *           default: SKC
   *     responses:
   *       200:
   *         description: Transaction details
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   $ref: '#/components/schemas/TransactionFeedItem'
   *       404:
   *         description: Transaction not found
   */
  fastify.get(
    '/:txHash',
    {
      schema: {
        params: {
          type: 'object',
          required: ['txHash'],
          properties: {
            txHash: { type: 'string', minLength: 10 }
          }
        },
        querystring: {
          type: 'object',
          properties: {
            symbol: { type: 'string', default: 'SKC' }
          }
        }
      },
      preHandler: validationMiddleware
    },
    async (request: FastifyRequest<{
      Params: { txHash: string };
      Querystring: { symbol?: string };
    }>, reply: FastifyReply) => {
      const { txHash } = request.params;
      const { symbol = 'SKC' } = request.query;
      
      try {
        const transaction = await transactionFeedService.getTransaction(txHash, symbol);
        
        if (!transaction) {
          return reply.code(404).send({
            meta: {
              timestamp: new Date().toISOString(),
              requestId: request.id
            },
            errors: [
              {
                code: 'TRANSACTION_NOT_FOUND',
                message: `Transaction with hash ${txHash} not found`
              }
            ]
          });
        }
        
        return reply.code(200).send({
          data: transaction,
          meta: {
            timestamp: new Date().toISOString(),
            requestId: request.id
          }
        });
      } catch (error) {
        logger.error('Transaction detail API error', { txHash, symbol, error });
        throw new ApiError('Failed to get transaction details', 500);
      }
    }
  );
  
  /**
   * @openapi
   * /api/v1/market/transactions/volume:
   *   get:
   *     summary: Get transaction volume
   *     tags: [Market]
   *     parameters:
   *       - name: symbol
   *         in: query
   *         required: false
   *         schema:
   *           type: string
   *           default: SKC
   *       - name: period
   *         in: query
   *         required: false
   *         schema:
   *           type: string
   *           enum: [1h, 1d, 1w, 1m, all]
   *           default: 1d
   *     responses:
   *       200:
   *         description: Transaction volume data
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   type: object
   *                   properties:
   *                     total:
   *                       type: number
   *                     buy:
   *                       type: number
   *                     sell:
   *                       type: number
   */
  fastify.get(
    '/volume',
    {
      schema: {
        querystring: {
          type: 'object',
          properties: {
            symbol: { type: 'string', default: 'SKC' },
            period: { 
              type: 'string', 
              enum: ['1h', '1d', '1w', '1m', 'all'],
              default: '1d'
            }
          }
        }
      },
      preHandler: validationMiddleware
    },
    async (request: FastifyRequest<{
      Querystring: {
        symbol?: string;
        period?: string;
      };
    }>, reply: FastifyReply) => {
      const { 
        symbol = 'SKC',
        period = '1d'
      } = request.query;
      
      try {
        const volumeData = await transactionFeedService.getTransactionVolume(
          symbol,
          period
        );
        
        return reply.code(200).send({
          data: volumeData,
          meta: {
            timestamp: new Date().toISOString(),
            requestId: request.id,
            symbol,
            period
          }
        });
      } catch (error) {
        logger.error('Transaction volume API error', { symbol, period, error });
        throw new ApiError('Failed to get transaction volume data', 500);
      }
    }
  );
};
