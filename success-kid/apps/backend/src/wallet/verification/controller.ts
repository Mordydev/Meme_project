/**
 * Wallet Verification Controller
 * 
 * Handles wallet verification HTTP requests.
 */
import { FastifyReply, FastifyRequest } from 'fastify';
import { WalletVerificationService } from './service';
import { logger } from '../../lib/logger';
import { ValidationError, NotFoundError } from '../../errors';

/**
 * Generate verification message request
 */
interface GenerateMessageRequest {
  Body: {
    walletAddress: string;
  };
}

/**
 * Verify signature request
 */
interface VerifySignatureRequest {
  Body: {
    walletAddress: string;
    signature: string;
    message: string;
  };
}

/**
 * Get verification status request
 */
interface GetVerificationStatusRequest {
  Params: {
    walletAddress: string;
  };
}

/**
 * Wallet verification controller
 */
export class WalletVerificationController {
  /**
   * Create wallet verification controller
   * 
   * @param walletVerificationService Wallet verification service
   */
  constructor(private readonly walletVerificationService: WalletVerificationService) {}

  /**
   * Generate verification message
   * 
   * @param request Generate message request
   * @param reply HTTP response
   */
  async generateMessage(
    request: FastifyRequest<GenerateMessageRequest>,
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
      
      const message = this.walletVerificationService.generateVerificationMessage(
        userId,
        walletAddress
      );
      
      return reply.code(200).send({
        data: {
          message: message.message,
          expiresAt: new Date(message.expiresAt).toISOString()
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        }
      });
    } catch (error) {
      logger.error('Error generating verification message', {
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
            message: 'Failed to generate verification message'
          }
        ]
      });
    }
  }

  /**
   * Verify wallet signature
   * 
   * @param request Verify signature request
   * @param reply HTTP response
   */
  async verifySignature(
    request: FastifyRequest<VerifySignatureRequest>,
    reply: FastifyReply
  ) {
    try {
      const { walletAddress, signature, message } = request.body;
      const userId = request.user.id;
      
      if (!walletAddress || !signature || !message) {
        return reply.code(400).send({
          data: null,
          meta: {
            timestamp: new Date().toISOString(),
            requestId: request.id
          },
          errors: [
            {
              code: 'VALIDATION_ERROR',
              message: 'Wallet address, signature, and message are required'
            }
          ]
        });
      }
      
      const updatedWallet = await this.walletVerificationService.verifySignature(
        userId,
        walletAddress,
        signature,
        message
      );
      
      return reply.code(200).send({
        data: {
          isVerified: updatedWallet.is_verified,
          walletAddress: updatedWallet.wallet_address,
          lastVerified: updatedWallet.last_verified_at
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        }
      });
    } catch (error) {
      logger.error('Error verifying signature', {
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
      
      if (error instanceof NotFoundError) {
        return reply.code(404).send({
          data: null,
          meta: {
            timestamp: new Date().toISOString(),
            requestId: request.id
          },
          errors: [
            {
              code: 'RESOURCE_NOT_FOUND',
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
            message: 'Failed to verify signature'
          }
        ]
      });
    }
  }

  /**
   * Get verification status
   * 
   * @param request Get verification status request
   * @param reply HTTP response
   */
  async getVerificationStatus(
    request: FastifyRequest<GetVerificationStatusRequest>,
    reply: FastifyReply
  ) {
    try {
      const { walletAddress } = request.params;
      const userId = request.user.id;
      
      const status = await this.walletVerificationService.getVerificationStatus(
        userId,
        walletAddress
      );
      
      return reply.code(200).send({
        data: status,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        }
      });
    } catch (error) {
      logger.error('Error getting verification status', {
        error: error instanceof Error ? error.message : String(error),
        requestId: request.id
      });
      
      if (error instanceof NotFoundError) {
        return reply.code(404).send({
          data: null,
          meta: {
            timestamp: new Date().toISOString(),
            requestId: request.id
          },
          errors: [
            {
              code: 'RESOURCE_NOT_FOUND',
              message: error.message
            }
          ]
        });
      }
      
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
            message: 'Failed to get verification status'
          }
        ]
      });
    }
  }
}
