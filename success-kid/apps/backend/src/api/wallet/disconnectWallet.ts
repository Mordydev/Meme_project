import { FastifyRequest, FastifyReply } from 'fastify';
import { logger } from '../../lib/logger';
import { AppError } from '../../errors/app-error';
import { ErrorCode } from '../../errors/error-codes';

/**
 * Disconnect wallet from user account
 * 
 * @route POST /api/v1/wallet/disconnect
 */
export async function disconnectWallet(
  request: FastifyRequest,
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
            message: 'You must be logged in to disconnect a wallet.'
          }
        ],
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        }
      });
    }

    // Get current user
    const user = await request.server.db.users.findUnique({
      where: { id: request.user.id },
      select: {
        id: true,
        walletAddress: true,
        walletVerified: true
      }
    });

    // Check if user has a connected wallet
    if (!user?.walletAddress) {
      throw new AppError(
        'No wallet is currently connected',
        ErrorCode.WALLET_NOT_CONNECTED,
        { userId: request.user.id },
        400
      );
    }

    // Update user record to remove wallet connection
    await request.server.db.users.update({
      where: { id: request.user.id },
      data: {
        walletAddress: null,
        walletVerified: false,
        walletConnectedAt: null
      }
    });

    // Update wallet connection record
    await request.server.db.walletConnections.updateMany({
      where: {
        userId: request.user.id,
        address: user.walletAddress
      },
      data: {
        isVerified: false,
        disconnectedAt: new Date()
      }
    });

    logger.info('Wallet disconnected successfully', {
      userId: request.user.id,
      walletAddress: user.walletAddress
    });

    return reply.code(200).send({
      data: {
        success: true
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: request.id
      }
    });
  } catch (error) {
    logger.error('Failed to disconnect wallet', { error });

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
          message: 'An unexpected error occurred while disconnecting wallet.'
        }
      ],
      meta: {
        timestamp: new Date().toISOString(),
        requestId: request.id
      }
    });
  }
}
