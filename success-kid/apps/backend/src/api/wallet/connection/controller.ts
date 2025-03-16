/**
 * Wallet Connection Controller
 * 
 * Handles wallet connection API endpoints
 */
import { FastifyRequest, FastifyReply } from 'fastify';
import { WalletConnectionService } from '../../../services/wallet/connection-service';
import { logger } from '../../../lib/logger';
import { WalletConnection } from '../../../models/wallet-connection';

/**
 * Initialize a wallet connection session
 * 
 * @route POST /api/wallet/connection/initialize
 */
interface InitializeWalletRequest {
  Body: {
    data: {
      walletType: string;
    }
  }
}

export async function initializeWallet(
  request: FastifyRequest<InitializeWalletRequest>,
  reply: FastifyReply
) {
  try {
    const { walletType } = request.body.data;
    const userId = request.user?.id;
    
    if (!userId) {
      return reply.code(401).send({
        data: null,
        errors: [
          {
            code: 'UNAUTHORIZED',
            message: 'You must be logged in to connect a wallet'
          }
        ],
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        }
      });
    }
    
    const walletConnectionService: WalletConnectionService = request.server.walletConnectionService;
    
    const result = await walletConnectionService.generateVerificationMessage(
      userId,
      walletType
    );
    
    return reply.code(200).send({
      data: {
        sessionId: result.sessionId,
        message: result.message,
        expiresAt: result.expiresAt.toISOString()
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: request.id
      }
    });
  } catch (error) {
    logger.error('Error initializing wallet connection:', error);
    
    return reply.code(error.statusCode || 500).send({
      data: null,
      errors: [
        {
          code: error.code || 'SERVER_ERROR',
          message: error.message || 'Could not initialize wallet connection. Please try again.',
          details: error.details
        }
      ],
      meta: {
        timestamp: new Date().toISOString(),
        requestId: request.id
      }
    });
  }
}

/**
 * Verify a wallet signature to confirm ownership
 * 
 * @route POST /api/wallet/connection/verify
 */
interface VerifyWalletRequest {
  Body: {
    data: {
      sessionId: string;
      address: string;
      signature: string;
    }
  }
}

export async function verifyWallet(
  request: FastifyRequest<VerifyWalletRequest>,
  reply: FastifyReply
) {
  try {
    const { sessionId, address, signature } = request.body.data;
    
    const walletConnectionService: WalletConnectionService = request.server.walletConnectionService;
    
    const result = await walletConnectionService.verifyWalletSignature(
      sessionId,
      signature,
      address
    );
    
    // Format wallet connection for response
    let walletData = null;
    if (result.walletConnection) {
      walletData = formatWalletConnection(result.walletConnection);
    }
    
    return reply.code(200).send({
      data: {
        verified: result.verified,
        ...walletData
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: request.id
      }
    });
  } catch (error) {
    logger.error('Error verifying wallet signature:', error);
    
    return reply.code(error.statusCode || 500).send({
      data: null,
      errors: [
        {
          code: error.code || 'SERVER_ERROR',
          message: error.message || 'Could not verify wallet ownership. Please try again.',
          details: error.details
        }
      ],
      meta: {
        timestamp: new Date().toISOString(),
        requestId: request.id
      }
    });
  }
}

/**
 * Get all wallet connections for the authenticated user
 * 
 * @route GET /api/wallet/connection
 */
export async function getUserWallets(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const userId = request.user?.id;
    
    if (!userId) {
      return reply.code(401).send({
        data: null,
        errors: [
          {
            code: 'UNAUTHORIZED',
            message: 'You must be logged in to view wallet connections'
          }
        ],
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        }
      });
    }
    
    const walletConnectionService: WalletConnectionService = request.server.walletConnectionService;
    const wallets = await walletConnectionService.getWalletsByUser(userId);
    
    // Format wallet connections for response
    const formattedWallets = wallets.map(formatWalletConnection);
    
    return reply.code(200).send({
      data: formattedWallets,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: request.id
      }
    });
  } catch (error) {
    logger.error('Error fetching user wallets:', error);
    
    return reply.code(error.statusCode || 500).send({
      data: null,
      errors: [
        {
          code: error.code || 'SERVER_ERROR',
          message: error.message || 'Could not fetch wallet connections. Please try again.',
          details: error.details
        }
      ],
      meta: {
        timestamp: new Date().toISOString(),
        requestId: request.id
      }
    });
  }
}

/**
 * Disconnect a wallet from the user account
 * 
 * @route DELETE /api/wallet/connection
 */
interface DisconnectWalletRequest {
  Body: {
    data: {
      address: string;
    }
  }
}

export async function disconnectWallet(
  request: FastifyRequest<DisconnectWalletRequest>,
  reply: FastifyReply
) {
  try {
    const { address } = request.body.data;
    const userId = request.user?.id;
    
    if (!userId) {
      return reply.code(401).send({
        data: null,
        errors: [
          {
            code: 'UNAUTHORIZED',
            message: 'You must be logged in to disconnect a wallet'
          }
        ],
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        }
      });
    }
    
    const walletConnectionService: WalletConnectionService = request.server.walletConnectionService;
    const success = await walletConnectionService.disconnectWallet(userId, address);
    
    return reply.code(200).send({
      data: {
        success
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: request.id
      }
    });
  } catch (error) {
    logger.error('Error disconnecting wallet:', error);
    
    return reply.code(error.statusCode || 500).send({
      data: null,
      errors: [
        {
          code: error.code || 'SERVER_ERROR',
          message: error.message || 'Could not disconnect wallet. Please try again.',
          details: error.details
        }
      ],
      meta: {
        timestamp: new Date().toISOString(),
        requestId: request.id
      }
    });
  }
}

/**
 * Get wallet connection history for the authenticated user
 * 
 * @route GET /api/wallet/connection/history
 */
interface ConnectionHistoryRequest {
  Querystring: {
    limit?: number;
  }
}

export async function getConnectionHistory(
  request: FastifyRequest<ConnectionHistoryRequest>,
  reply: FastifyReply
) {
  try {
    const { limit = 20 } = request.query;
    const userId = request.user?.id;
    
    if (!userId) {
      return reply.code(401).send({
        data: null,
        errors: [
          {
            code: 'UNAUTHORIZED',
            message: 'You must be logged in to view connection history'
          }
        ],
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        }
      });
    }
    
    const walletConnectionService: WalletConnectionService = request.server.walletConnectionService;
    const history = await walletConnectionService.getConnectionHistory(userId, limit);
    
    return reply.code(200).send({
      data: history,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: request.id
      }
    });
  } catch (error) {
    logger.error('Error fetching connection history:', error);
    
    return reply.code(error.statusCode || 500).send({
      data: null,
      errors: [
        {
          code: error.code || 'SERVER_ERROR',
          message: error.message || 'Could not fetch connection history. Please try again.',
          details: error.details
        }
      ],
      meta: {
        timestamp: new Date().toISOString(),
        requestId: request.id
      }
    });
  }
}

/**
 * Format a wallet connection for API response
 */
function formatWalletConnection(connection: WalletConnection) {
  return {
    id: connection.id,
    address: connection.wallet_address,
    isVerified: connection.is_verified,
    isPrimary: false, // This would be calculated based on user's primary wallet
    connectedAt: connection.connected_at.toISOString(),
    lastVerifiedAt: connection.last_verified_at ? connection.last_verified_at.toISOString() : null
  };
}
