/**
 * Wallet Verification Routes
 * 
 * These routes handle wallet verification operations.
 */
import { FastifyInstance } from 'fastify';
import { WalletVerificationController } from '../verification/controller';
import { WalletModule, getWalletModule } from '../index';

/**
 * Register wallet verification routes
 * 
 * @param fastify Fastify instance
 */
export async function registerWalletVerificationRoutes(fastify: FastifyInstance) {
  const walletModule = getWalletModule();
  
  if (!walletModule) {
    throw new Error('Wallet module not initialized');
  }
  
  const controller = walletModule.verificationController;
  
  // Generate verification message
  fastify.post('/message', {
    schema: {
      description: 'Generate a message to be signed by the wallet for verification',
      tags: ['wallet', 'verification'],
      body: {
        type: 'object',
        required: ['walletAddress'],
        properties: {
          walletAddress: { type: 'string' }
        }
      },
      response: {
        200: {
          description: 'Verification message generated successfully',
          type: 'object',
          properties: {
            data: {
              type: 'object',
              properties: {
                message: { type: 'string' },
                expiresAt: { type: 'string', format: 'date-time' }
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
  }, controller.generateMessage.bind(controller));
  
  // Verify signature
  fastify.post('/verify', {
    schema: {
      description: 'Verify a wallet signature to confirm ownership',
      tags: ['wallet', 'verification'],
      body: {
        type: 'object',
        required: ['walletAddress', 'signature', 'message'],
        properties: {
          walletAddress: { type: 'string' },
          signature: { type: 'string' },
          message: { type: 'string' }
        }
      },
      response: {
        200: {
          description: 'Wallet verified successfully',
          type: 'object',
          properties: {
            data: {
              type: 'object',
              properties: {
                isVerified: { type: 'boolean' },
                walletAddress: { type: 'string' },
                lastVerified: { type: 'string', format: 'date-time', nullable: true }
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
  }, controller.verifySignature.bind(controller));
  
  // Get verification status
  fastify.get('/status/:walletAddress', {
    schema: {
      description: 'Get verification status for a wallet',
      tags: ['wallet', 'verification'],
      params: {
        type: 'object',
        required: ['walletAddress'],
        properties: {
          walletAddress: { type: 'string' }
        }
      },
      response: {
        200: {
          description: 'Verification status retrieved successfully',
          type: 'object',
          properties: {
            data: {
              type: 'object',
              properties: {
                isVerified: { type: 'boolean' },
                walletAddress: { type: 'string' },
                lastVerified: { type: 'string', format: 'date-time', nullable: true }
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
  }, controller.getVerificationStatus.bind(controller));
}
