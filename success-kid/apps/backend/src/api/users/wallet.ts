/**
 * Wallet Connection API
 * 
 * Handlers for wallet connection endpoints
 */
import { FastifyRequest, FastifyReply } from 'fastify';
import { walletService } from '../../services/wallet-service';
import { authMiddleware } from '../../auth';
import { walletConnectionRateLimiter } from '../../auth/rate-limiting';
import { logger } from '../../lib/logger';
import { BadRequestError, ValidationError } from '../../errors';
import { z } from 'zod';

// Input validation schemas
const connectWalletSchema = z.object({
  walletAddress: z.string().min(1, 'Wallet address is required'),
  signature: z.string().min(1, 'Signature is required'),
  chainType: z.enum(['evm', 'solana']).default('solana'),
  message: z.string().optional(),
});

const disconnectWalletSchema = z.object({
  walletAddress: z.string().min(1, 'Wallet address is required'),
});

/**
 * Connect wallet to user account
 */
export async function connectWallet(
  request: FastifyRequest<{ Body: z.infer<typeof connectWalletSchema> }>, 
  reply: FastifyReply
) {
  try {
    const userId = request.user.id;
    const { walletAddress, signature, chainType, message } = request.body;
    
    // Validate input
    try {
      connectWalletSchema.parse(request.body);
    } catch (error) {
      throw new ValidationError('Invalid input', error);
    }
    
    // Connect wallet
    const walletConnection = await walletService.connectWallet(
      userId,
      walletAddress,
      signature,
      chainType,
      message
    );
    
    // Return result
    return reply.send({
      data: {
        connected: true,
        walletAddress: walletConnection.wallet_address,
        isVerified: walletConnection.is_verified,
        connectedAt: walletConnection.connected_at
      },
      meta: {
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Error connecting wallet', { error, userId: request.user?.id });
    throw error;
  }
}

/**
 * Disconnect wallet from user account
 */
export async function disconnectWallet(
  request: FastifyRequest<{ Body: z.infer<typeof disconnectWalletSchema> }>, 
  reply: FastifyReply
) {
  try {
    const userId = request.user.id;
    const { walletAddress } = request.body;
    
    // Validate input
    try {
      disconnectWalletSchema.parse(request.body);
    } catch (error) {
      throw new ValidationError('Invalid input', error);
    }
    
    // Check if the wallet is connected
    const walletConnection = await walletService.getWalletConnection(userId, walletAddress);
    if (!walletConnection) {
      throw new BadRequestError('Wallet not connected to this account');
    }
    
    // Disconnect wallet
    await walletService.disconnectWallet(userId, walletAddress);
    
    // Return result
    return reply.send({
      data: {
        disconnected: true,
        walletAddress
      },
      meta: {
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Error disconnecting wallet', { error, userId: request.user?.id });
    throw error;
  }
}

/**
 * Get user's connected wallets
 */
export async function getUserWallets(request: FastifyRequest, reply: FastifyReply) {
  try {
    const userId = request.user.id;
    
    // Get connected wallets
    const wallets = await walletService.getUserWallets(userId);
    
    // Return result
    return reply.send({
      data: wallets.map(wallet => ({
        walletAddress: wallet.wallet_address,
        isVerified: wallet.is_verified,
        connectedAt: wallet.connected_at,
        lastVerifiedAt: wallet.last_verified_at
      })),
      meta: {
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Error getting user wallets', { error, userId: request.user?.id });
    throw error;
  }
}

/**
 * Get signature message for wallet verification
 */
export async function getSignatureMessage(
  request: FastifyRequest<{ Params: { walletAddress: string } }>, 
  reply: FastifyReply
) {
  try {
    const { walletAddress } = request.params;
    
    // Generate message
    const message = walletService.getSignatureMessage(walletAddress);
    
    // Return message
    return reply.send({
      data: {
        message,
        walletAddress
      },
      meta: {
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Error getting signature message', { error, walletAddress: request.params.walletAddress });
    throw error;
  }
}

/**
 * Register wallet routes
 */
export function registerWalletRoutes(fastify: any) {
  // Connect wallet
  fastify.post(
    '/api/v1/users/wallet/connect',
    { 
      preHandler: [
        authMiddleware({ required: true }),
        walletConnectionRateLimiter()
      ]
    },
    connectWallet
  );
  
  // Disconnect wallet
  fastify.post(
    '/api/v1/users/wallet/disconnect',
    { preHandler: authMiddleware({ required: true }) },
    disconnectWallet
  );
  
  // Get user's connected wallets
  fastify.get(
    '/api/v1/users/wallet',
    { preHandler: authMiddleware({ required: true }) },
    getUserWallets
  );
  
  // Get signature message for wallet verification
  fastify.get(
    '/api/v1/users/wallet/message/:walletAddress',
    { preHandler: authMiddleware({ required: true }) },
    getSignatureMessage
  );
}
