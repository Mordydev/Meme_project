import { FastifyInstance } from 'fastify';
import { TokenService } from '../../services/token-service';

/**
 * Get recent token transactions
 */
export async function getTokenTransactions(fastify: FastifyInstance) {
  const tokenService = fastify.diContainer.resolve<TokenService>('tokenService');
  
  fastify.get('/api/token/transactions', {
    schema: {
      querystring: {
        type: 'object',
        properties: {
          limit: { type: 'integer', minimum: 1, maximum: 100 }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            transactions: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  transactionHash: { type: 'string' },
                  fromAddress: { type: 'string' },
                  toAddress: { type: 'string' },
                  amount: { type: 'number' },
                  blockNumber: { type: 'integer' },
                  timestamp: { type: 'string', format: 'date-time' }
                }
              }
            }
          }
        }
      }
    },
    handler: async (request, reply) => {
      const { limit = 20 } = request.query as { limit?: number };
      
      const transactions = await tokenService.getRecentTransactions(limit);
      
      return {
        transactions
      };
    }
  });
  
  fastify.get('/api/token/transactions/:hash', {
    schema: {
      params: {
        type: 'object',
        required: ['hash'],
        properties: {
          hash: { type: 'string' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            transaction: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                transactionHash: { type: 'string' },
                fromAddress: { type: 'string' },
                toAddress: { type: 'string' },
                amount: { type: 'number' },
                blockNumber: { type: 'integer' },
                blockConfirmations: { type: 'integer' },
                fee: { type: 'number' },
                status: { type: 'string', enum: ['success', 'pending', 'failed'] },
                timestamp: { type: 'string', format: 'date-time' }
              }
            }
          }
        },
        404: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' }
          }
        }
      }
    },
    handler: async (request, reply) => {
      const { hash } = request.params as { hash: string };
      
      try {
        // Get transaction details from blockchain
        const txDetails = await fastify.diContainer.resolve('blockchainService').getTransaction(hash);
        
        if (!txDetails) {
          return reply.code(404).send({
            error: 'not_found',
            message: 'Transaction not found'
          });
        }
        
        // Format and return transaction details
        // In a real implementation, this would transform blockchain data to a standard format
        // For now, return placeholder data
        return {
          transaction: {
            id: hash,
            transactionHash: hash,
            fromAddress: txDetails.from || '0x...',
            toAddress: txDetails.to || '0x...',
            amount: txDetails.amount || 0,
            blockNumber: txDetails.blockNumber || 0,
            blockConfirmations: txDetails.confirmations || 0,
            fee: txDetails.fee || 0,
            status: txDetails.status || 'success',
            timestamp: txDetails.timestamp || new Date().toISOString()
          }
        };
      } catch (error) {
        request.log.error({ error, hash }, 'Failed to get transaction details');
        
        return reply.code(500).send({
          error: 'blockchain_error',
          message: 'Failed to retrieve transaction details'
        });
      }
    }
  });
}
