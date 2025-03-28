/**
 * Wallet Transactions Routes
 * 
 * These routes handle wallet transaction operations.
 */
import { FastifyInstance } from 'fastify';
import { WalletTransactionController } from '../transactions/controller';
import { WalletModule, getWalletModule } from '../index';

/**
 * Register wallet transactions routes
 * 
 * @param fastify Fastify instance
 */
export async function registerWalletTransactionsRoutes(fastify: FastifyInstance) {
  const walletModule = getWalletModule();
  
  if (!walletModule) {
    throw new Error('Wallet module not initialized');
  }
  
  const controller = walletModule.transactionController;
  
  // Get transactions for a wallet
  fastify.get('/address/:walletAddress', {
    schema: {
      description: 'Get transaction history for a specific wallet address',
      tags: ['wallet', 'transactions'],
      params: {
        type: 'object',
        required: ['walletAddress'],
        properties: {
          walletAddress: { type: 'string' }
        }
      },
      querystring: {
        type: 'object',
        properties: {
          limit: { type: 'integer', default: 10 },
          offset: { type: 'integer', default: 0 },
          type: { type: 'string', enum: ['in', 'out', 'self'] },
          status: { type: 'string', enum: ['pending', 'confirmed', 'failed', 'unknown'] },
          token: { type: 'string' },
          forceRefresh: { type: 'boolean' }
        }
      },
      response: {
        200: {
          description: 'Transaction history retrieved successfully',
          type: 'object',
          properties: {
            data: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  hash: { type: 'string' },
                  type: { type: 'string', enum: ['in', 'out', 'self'] },
                  tokenSymbol: { type: 'string' },
                  amount: { type: 'string' },
                  formattedAmount: { type: 'string' },
                  timestamp: { type: 'string', format: 'date-time' },
                  status: { type: 'string' },
                  fromAddress: { type: 'string', nullable: true },
                  toAddress: { type: 'string', nullable: true },
                  blockNumber: { type: 'integer', nullable: true }
                }
              }
            },
            meta: {
              type: 'object',
              properties: {
                timestamp: { type: 'string', format: 'date-time' },
                requestId: { type: 'string' }
              }
            },
            pagination: {
              type: 'object',
              properties: {
                total: { type: 'integer' },
                limit: { type: 'integer' },
                offset: { type: 'integer' },
                hasMore: { type: 'boolean' }
              }
            }
          }
        }
      }
    },
    onRequest: [fastify.authenticate]
  }, controller.getWalletTransactions.bind(controller));
  
  // Get transaction details
  fastify.get('/hash/:transactionHash', {
    schema: {
      description: 'Get details for a specific transaction by hash',
      tags: ['wallet', 'transactions'],
      params: {
        type: 'object',
        required: ['transactionHash'],
        properties: {
          transactionHash: { type: 'string' }
        }
      },
      response: {
        200: {
          description: 'Transaction details retrieved successfully',
          type: 'object',
          properties: {
            data: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                hash: { type: 'string' },
                type: { type: 'string', enum: ['in', 'out', 'self'] },
                tokenSymbol: { type: 'string' },
                amount: { type: 'string' },
                formattedAmount: { type: 'string' },
                timestamp: { type: 'string', format: 'date-time' },
                status: { type: 'string' },
                fromAddress: { type: 'string', nullable: true },
                toAddress: { type: 'string', nullable: true },
                blockNumber: { type: 'integer', nullable: true }
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
  }, controller.getTransactionDetails.bind(controller));
  
  // Sync transactions for a wallet
  fastify.post('/sync/:walletAddress', {
    schema: {
      description: 'Sync transaction history for a specific wallet address',
      tags: ['wallet', 'transactions'],
      params: {
        type: 'object',
        required: ['walletAddress'],
        properties: {
          walletAddress: { type: 'string' }
        }
      },
      response: {
        200: {
          description: 'Transactions synced successfully',
          type: 'object',
          properties: {
            data: {
              type: 'object',
              properties: {
                syncedTransactions: { type: 'integer' },
                walletAddress: { type: 'string' }
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
    },
    onRequest: [fastify.authenticate]
  }, controller.syncTransactions.bind(controller));
}
