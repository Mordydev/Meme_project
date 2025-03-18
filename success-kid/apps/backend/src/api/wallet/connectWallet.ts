import { FastifyRequest, FastifyReply } from 'fastify';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../../lib/logger';
import { redisClient } from '../../lib/redis-client';
import { AppError } from '../../errors/app-error';
import { ErrorCode } from '../../errors/error-codes';

interface ConnectWalletRequest {
  data: {
    walletAddress: string;
    chainType?: 'solana' | 'evm';
  };
}

/**
 * Initiate a wallet connection session
 * 
 * @route POST /api/v1/wallet/connect
 */
export async function connectWallet(
  request: FastifyRequest<{ Body: ConnectWalletRequest }>,
  reply: FastifyReply
) {
  try {
    // Ensure user is authenticated
    if (!request.user) {
      return reply.code(401).send({
        data: null,
        errors: [
          {
            code: 'UNAUTHENTICATED',
            message: 'You must be logged in to connect a wallet.'
          }
        ],
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        }
      });
    }

    const { walletAddress, chainType = 'solana' } = request.body.data;

    // Validate wallet address
    if (!walletAddress) {
      throw new AppError(
        'Wallet address is required',
        ErrorCode.INVALID_INPUT,
        { field: 'walletAddress' },
        400
      );
    }

    // Create a session ID for the wallet connection verification
    const sessionId = uuidv4();
    const timestamp = Date.now();

    // Create a unique message for the user to sign
    const message = `Sign this message to verify you own this wallet address: ${walletAddress}\n\nThis signature will not trigger a blockchain transaction or cost any gas fees.\n\nDomain: success-kid.com\nSession ID: ${sessionId}\nTimestamp: ${timestamp}`;

    // Store the session information for 15 minutes
    await redisClient.set(
      `wallet:session:${sessionId}`,
      JSON.stringify({
        userId: request.user.id,
        walletAddress,
        chainType,
        message,
        timestamp,
        createdAt: new Date().toISOString()
      }),
      'EX',
      900 // 15 minutes
    );

    logger.info('Wallet connection initiated', {
      userId: request.user.id,
      walletAddress,
      sessionId
    });

    return reply.code(200).send({
      data: {
        sessionId,
        message
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: request.id
      }
    });
  } catch (error) {
    logger.error('Failed to initiate wallet connection', { error });

    if (error instanceof AppError) {
      return reply.code(error.statusCode).send({
        data: null,
        errors: [
          {
            code: error.code,
            message: error.message,
            details: error.details
          }
        ],
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        }
      });
    }

    return reply.code(500).send({
      data: null,
      errors: [
        {
          code: 'SERVER_ERROR',
          message: 'An unexpected error occurred while initiating wallet connection.'
        }
      ],
      meta: {
        timestamp: new Date().toISOString(),
        requestId: request.id
      }
    });
  }
}
