import { FastifyRequest, FastifyReply } from 'fastify';
import { logger } from '../../lib/logger';
import { redisClient } from '../../lib/redis-client';
import { AppError } from '../../errors/app-error';
import { ErrorCode } from '../../errors/error-codes';
import { verifyWalletSignature } from '../../auth/verification/wallet-verification';

interface VerifyWalletRequest {
  data: {
    sessionId: string;
    address: string;
    signature: string;
  };
}

/**
 * Verify wallet ownership with signature
 * 
 * @route POST /api/v1/wallet/verify
 */
export async function verifyWallet(
  request: FastifyRequest<{ Body: VerifyWalletRequest }>,
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
            message: 'You must be logged in to verify a wallet.'
          }
        ],
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        }
      });
    }

    const { sessionId, address, signature } = request.body.data;

    // Validate inputs
    if (!sessionId || !address || !signature) {
      throw new AppError(
        'Missing required fields',
        ErrorCode.INVALID_INPUT,
        { requiredFields: ['sessionId', 'address', 'signature'] },
        400
      );
    }

    // Get session information from Redis
    const sessionData = await redisClient.get(`wallet:session:${sessionId}`);
    if (!sessionData) {
      throw new AppError(
        'Invalid or expired session',
        ErrorCode.WALLET_SESSION_EXPIRED,
        { sessionId },
        400
      );
    }

    const session = JSON.parse(sessionData);

    // Verify the session belongs to the current user
    if (session.userId !== request.user.id) {
      throw new AppError(
        'Session does not belong to this user',
        ErrorCode.UNAUTHORIZED,
        { sessionId },
        403
      );
    }

    // Verify wallet address
    if (session.walletAddress !== address) {
      throw new AppError(
        'Wallet address does not match session',
        ErrorCode.WALLET_ADDRESS_MISMATCH,
        { expected: session.walletAddress, received: address },
        400
      );
    }

    // Verify signature
    const isValid = verifyWalletSignature(
      address,
      session.message,
      signature,
      session.chainType || 'solana'
    );

    if (!isValid) {
      throw new AppError(
        'Signature verification failed',
        ErrorCode.WALLET_VERIFICATION_FAILED,
        { address },
        400
      );
    }

    // Save wallet connection to database
    await request.server.db.walletConnections.upsert({
      where: {
        userId_address: {
          userId: request.user.id,
          address
        }
      },
      update: {
        isVerified: true,
        lastVerifiedAt: new Date()
      },
      create: {
        userId: request.user.id,
        address,
        chainType: session.chainType || 'solana',
        isVerified: true,
        connectedAt: new Date(),
        lastVerifiedAt: new Date()
      }
    });

    // Update user record with connected wallet
    await request.server.db.users.update({
      where: { id: request.user.id },
      data: {
        walletAddress: address,
        walletVerified: true,
        walletConnectedAt: new Date()
      }
    });

    // Delete the session after successful verification
    await redisClient.del(`wallet:session:${sessionId}`);

    logger.info('Wallet verified successfully', {
      userId: request.user.id,
      address,
      sessionId
    });

    return reply.code(200).send({
      data: {
        verified: true,
        address
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: request.id
      }
    });
  } catch (error) {
    logger.error('Failed to verify wallet', { error });

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
          message: 'An unexpected error occurred while verifying wallet.'
        }
      ],
      meta: {
        timestamp: new Date().toISOString(),
        requestId: request.id
      }
    });
  }
}
