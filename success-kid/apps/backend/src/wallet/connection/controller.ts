/**
 * Wallet Connection Controller
 * 
 * Handles wallet connection HTTP requests.
 */
import { FastifyReply, FastifyRequest } from 'fastify';
import { WalletConnectionService } from './service';
import { logger } from '../../lib/logger';
import { ValidationError } from '../../errors';

/**
 * Connect wallet request
 */
interface ConnectWalletRequest {
  Body: {
    walletAddress: string;
    walletType?: string;
    isPrimary?: boolean;
  };
}

/**
 * Disconnect wallet request
 */
interface DisconnectWalletRequest {
  Body: {
    walletAddress: string;
  };
}

/**
 * Set primary wallet request
 */
interface SetPrimaryWalletRequest {
  Body: {
    walletAddress: string;
  };
}

/**
 * Wallet connection controller
 */
export class WalletConnectionController {
  /**
   * Create wallet connection controller
   * 
   * @param walletConnectionService Wallet connection service
   */
  constructor(private readonly walletConnectionService: WalletConnectionService) {}

  /**
   * Connect wallet to user account
   * 
   * @param request Connect wallet request
   * @param reply HTTP response
   */
  async connectWallet(
    request: FastifyRequest<ConnectWalletRequest>,
    reply: FastifyReply
  ) {
    try {
      const { walletAddress, walletType = 'phantom', isPrimary = false } = request.body;
      const userId = request.user.id;
      
      if (!walletAddress) {
        return reply.code(400).send({
          data: null,
          meta: {
            timestamp: new Date().toISOString(),
            requestId: request.id
          },
          errors: [
            {
              code: 'VALIDATION_ERROR',
              message: 'Wallet address is required'
            }
          ]
        });
      }
      
      const walletConnection = await this.walletConnectionService.connectWallet(
        userId,
        walletAddress,
        walletType,
        isPrimary
      );
      
      return reply.code(200).send({
        data: walletConnection,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        }
      });
    } catch (error) {
      logger.error('Error connecting wallet', {
        error: error instanceof Error ? error.message : String(error),
        requestId: request.id
      });
      
      if (error instanceof ValidationError) {
        return reply.code(400).send({
          data: null,
          meta: {
            timestamp: new Date().toISOString(),
            requestId: request.id
          },
          errors: [
            {
              code: 'VALIDATION_ERROR',
              message: error.message
            }
          ]
        });
      }
      
      return reply.code(500).send({
        data: null,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        },
        errors: [
          {
            code: 'SERVER_ERROR',
            message: 'Failed to connect wallet'
          }
        ]
      });
    }
  }

  /**
   * Disconnect wallet from user account
   * 
   * @param request Disconnect wallet request
   * @param reply HTTP response
   */
  async disconnectWallet(
    request: FastifyRequest<DisconnectWalletRequest>,
    reply: FastifyReply
  ) {
    try {
      const { walletAddress } = request.body;
      const userId = request.user.id;
      
      if (!walletAddress) {
        return reply.code(400).send({
          data: null,
          meta: {
            timestamp: new Date().toISOString(),
            requestId: request.id
          },
          errors: [
            {
              code: 'VALIDATION_ERROR',
              message: 'Wallet address is required'
            }
          ]
        });
      }
      
      const success = await this.walletConnectionService.disconnectWallet(
        userId,
        walletAddress
      );
      
      if (!success) {
        return reply.code(404).send({
          data: null,
          meta: {
            timestamp: new Date().toISOString(),
            requestId: request.id
          },
          errors: [
            {
              code: 'RESOURCE_NOT_FOUND',
              message: 'Wallet not found or not connected to this user'
            }
          ]
        });
      }
      
      return reply.code(200).send({
        data: { success: true },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        }
      });
    } catch (error) {
      logger.error('Error disconnecting wallet', {
        error: error instanceof Error ? error.message : String(error),
        requestId: request.id
      });
      
      return reply.code(500).send({
        data: null,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        },
        errors: [
          {
            code: 'SERVER_ERROR',
            message: 'Failed to disconnect wallet'
          }
        ]
      });
    }
  }

  /**
   * Get user's wallet connections
   * 
   * @param request HTTP request
   * @param reply HTTP response
   */
  async getUserWallets(
    request: FastifyRequest,
    reply: FastifyReply
  ) {
    try {
      const userId = request.user.id;
      
      const wallets = await this.walletConnectionService.getWalletsByUser(userId);
      
      return reply.code(200).send({
        data: wallets,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        }
      });
    } catch (error) {
      logger.error('Error getting user wallets', {
        error: error instanceof Error ? error.message : String(error),
        requestId: request.id
      });
      
      return reply.code(500).send({
        data: null,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        },
        errors: [
          {
            code: 'SERVER_ERROR',
            message: 'Failed to get user wallets'
          }
        ]
      });
    }
  }

  /**
   * Set primary wallet for user
   * 
   * @param request Set primary wallet request
   * @param reply HTTP response
   */
  async setPrimaryWallet(
    request: FastifyRequest<SetPrimaryWalletRequest>,
    reply: FastifyReply
  ) {
    try {
      const { walletAddress } = request.body;
      const userId = request.user.id;
      
      if (!walletAddress) {
        return reply.code(400).send({
          data: null,
          meta: {
            timestamp: new Date().toISOString(),
            requestId: request.id
          },
          errors: [
            {
              code: 'VALIDATION_ERROR',
              message: 'Wallet address is required'
            }
          ]
        });
      }
      
      const updatedWallet = await this.walletConnectionService.setPrimaryWallet(
        userId,
        walletAddress
      );
      
      if (!updatedWallet) {
        return reply.code(404).send({
          data: null,
          meta: {
            timestamp: new Date().toISOString(),
            requestId: request.id
          },
          errors: [
            {
              code: 'RESOURCE_NOT_FOUND',
              message: 'Wallet not found or not connected to this user'
            }
          ]
        });
      }
      
      return reply.code(200).send({
        data: updatedWallet,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        }
      });
    } catch (error) {
      logger.error('Error setting primary wallet', {
        error: error instanceof Error ? error.message : String(error),
        requestId: request.id
      });
      
      if (error instanceof ValidationError) {
        return reply.code(400).send({
          data: null,
          meta: {
            timestamp: new Date().toISOString(),
            requestId: request.id
          },
          errors: [
            {
              code: 'VALIDATION_ERROR',
              message: error.message
            }
          ]
        });
      }
      
      return reply.code(500).send({
        data: null,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        },
        errors: [
          {
            code: 'SERVER_ERROR',
            message: 'Failed to set primary wallet'
          }
        ]
      });
    }
  }
}
