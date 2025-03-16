/**
 * Wallet Connection Routes
 * 
 * These routes handle wallet connection and management.
 */
import { FastifyInstance } from 'fastify';
import { WalletConnectionController } from '../connection/controller';
import { WalletModule, getWalletModule } from '../index';

/**
 * Register wallet connection routes
 * 
 * @param fastify Fastify instance
 */
export async function registerWalletConnectionRoutes(fastify: FastifyInstance) {
  const walletModule = getWalletModule();
  
  if (!walletModule) {
    throw new Error('Wallet module not initialized');
  }
  
  const controller = walletModule.connectionController;
  
  // Connect wallet
  fastify.post('/connect', {
    schema: {
      description: 'Connect a wallet to the current user',
      tags: ['wallet'],
      body: {
        type: 'object',
        required: ['walletAddress'],
        properties: {
          walletAddress: { type: 'string' },
          walletType: { type: 'string', enum: ['phantom', 'solflare', 'other'] },
          isPrimary: { type: 'boolean' }
        }
      },
      response: {
        200: {
          description: 'Wallet connected successfully',
          type: 'object',
          properties: {
            data: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                user_id: { type: 'string' },
                wallet_address: { type: 'string' },
                wallet_type: { type: 'string' },
                is_verified: { type: 'boolean' },
                connected_at: { type: 'string', format: 'date-time' },
                last_verified_at: { type: 'string', format: 'date-time', nullable: true },
                display_name: { type: 'string', nullable: true },
                is_primary: { type: 'boolean' },
                metadata: { type: 'object' }
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
  }, controller.connectWallet.bind(controller));
  
  // Disconnect wallet
  fastify.post('/disconnect', {
    schema: {
      description: 'Disconnect a wallet from the current user',
      tags: ['wallet'],
      body: {
        type: 'object',
        required: ['walletAddress'],
        properties: {
          walletAddress: { type: 'string' }
        }
      },
      response: {
        200: {
          description: 'Wallet disconnected successfully',
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
    },
    onRequest: [fastify.authenticate]
  }, controller.disconnectWallet.bind(controller));
  
  // Get user's wallets
  fastify.get('/', {
    schema: {
      description: 'Get all wallets connected to the current user',
      tags: ['wallet'],
      response: {
        200: {
          description: 'List of connected wallets',
          type: 'object',
          properties: {
            data: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  user_id: { type: 'string' },
                  wallet_address: { type: 'string' },
                  wallet_type: { type: 'string' },
                  is_verified: { type: 'boolean' },
                  connected_at: { type: 'string', format: 'date-time' },
                  last_verified_at: { type: 'string', format: 'date-time', nullable: true },
                  display_name: { type: 'string', nullable: true },
                  is_primary: { type: 'boolean' },
                  metadata: { type: 'object' }
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
  }, controller.getUserWallets.bind(controller));
  
  // Set primary wallet
  fastify.post('/primary', {
    schema: {
      description: 'Set a wallet as primary for the current user',
      tags: ['wallet'],
      body: {
        type: 'object',
        required: ['walletAddress'],
        properties: {
          walletAddress: { type: 'string' }
        }
      },
      response: {
        200: {
          description: 'Wallet set as primary',
          type: 'object',
          properties: {
            data: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                user_id: { type: 'string' },
                wallet_address: { type: 'string' },
                wallet_type: { type: 'string' },
                is_verified: { type: 'boolean' },
                connected_at: { type: 'string', format: 'date-time' },
                last_verified_at: { type: 'string', format: 'date-time', nullable: true },
                display_name: { type: 'string', nullable: true },
                is_primary: { type: 'boolean' },
                metadata: { type: 'object' }
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
  }, controller.setPrimaryWallet.bind(controller));
}
