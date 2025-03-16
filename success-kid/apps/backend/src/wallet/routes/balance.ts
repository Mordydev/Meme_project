/**
 * Wallet Balance Routes
 * 
 * These routes handle wallet balance operations.
 */
import { FastifyInstance } from 'fastify';
import { WalletBalanceController } from '../balance/controller';
import { WalletModule, getWalletModule } from '../index';

/**
 * Register wallet balance routes
 * 
 * @param fastify Fastify instance
 */
export async function registerWalletBalanceRoutes(fastify: FastifyInstance) {
  const walletModule = getWalletModule();
  
  if (!walletModule) {
    throw new Error('Wallet module not initialized');
  }
  
  const controller = walletModule.balanceController;
  
  // Get wallet balance
  fastify.get('/address/:walletAddress', {
    schema: {
      description: 'Get balance for a specific wallet address',
      tags: ['wallet', 'balance'],
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
          forceRefresh: { type: 'boolean' }
        }
      },
      response: {
        200: {
          description: 'Wallet balance retrieved successfully',
          type: 'object',
          properties: {
            data: {
              type: 'object',
              properties: {
                address: { type: 'string' },
                tokenSymbol: { type: 'string' },
                balance: { type: 'string' },
                formattedBalance: { type: 'string' },
                usdValue: { type: 'number', nullable: true },
                lastUpdated: { type: 'string', format: 'date-time' }
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
  }, controller.getWalletBalance.bind(controller));
  
  // Get balances for all user wallets
  fastify.get('/user/all', {
    schema: {
      description: 'Get balances for all wallets connected to the current user',
      tags: ['wallet', 'balance'],
      querystring: {
        type: 'object',
        properties: {
          forceRefresh: { type: 'boolean' }
        }
      },
      response: {
        200: {
          description: 'Wallet balances retrieved successfully',
          type: 'object',
          properties: {
            data: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  address: { type: 'string' },
                  tokenSymbol: { type: 'string' },
                  balance: { type: 'string' },
                  formattedBalance: { type: 'string' },
                  usdValue: { type: 'number', nullable: true },
                  lastUpdated: { type: 'string', format: 'date-time' }
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
    },
    onRequest: [fastify.authenticate]
  }, controller.getUserWalletsBalance.bind(controller));
  
  // Get balance for user's primary wallet
  fastify.get('/user/primary', {
    schema: {
      description: 'Get balance for the current user\'s primary wallet',
      tags: ['wallet', 'balance'],
      querystring: {
        type: 'object',
        properties: {
          forceRefresh: { type: 'boolean' }
        }
      },
      response: {
        200: {
          description: 'Primary wallet balance retrieved successfully',
          type: 'object',
          properties: {
            data: {
              type: 'object',
              properties: {
                address: { type: 'string' },
                tokenSymbol: { type: 'string' },
                balance: { type: 'string' },
                formattedBalance: { type: 'string' },
                usdValue: { type: 'number', nullable: true },
                lastUpdated: { type: 'string', format: 'date-time' }
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
  }, controller.getPrimaryWalletBalance.bind(controller));
}
