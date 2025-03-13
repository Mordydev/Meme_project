import { FastifyRequest, FastifyReply } from 'fastify';
import { isTokenHolder } from '../../lib/wallet-utils';

/**
 * Get wallet data for the authenticated user
 * 
 * @route GET /api/v1/wallet
 */
export async function getWalletData(
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
            message: 'You must be logged in to access wallet data.'
          }
        ],
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        }
      });
    }
    
    // Get user data including wallet information
    const user = await request.server.db.users.findUnique({
      where: { id: request.user.id },
      select: {
        id: true,
        walletAddress: true,
        walletVerified: true,
        walletConnectedAt: true
      }
    });
    
    if (!user.walletAddress || !user.walletVerified) {
      return reply.code(404).send({
        data: null,
        errors: [
          {
            code: 'WALLET_NOT_CONNECTED',
            message: 'No wallet is connected to your account.'
          }
        ],
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        }
      });
    }
    
    // In a real implementation, we would fetch the token balance from the blockchain
    // For now, use mock data
    const mockBalance = 1250.75;
    const mockUsdValue = mockBalance * 0.1; // 10 cents per token
    const isHolder = isTokenHolder(mockBalance);
    
    return reply.code(200).send({
      data: {
        address: user.walletAddress,
        isConnected: true,
        isVerified: user.walletVerified,
        balance: mockBalance,
        usdValue: mockUsdValue,
        isHolder,
        connectedAt: user.walletConnectedAt.toISOString()
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: request.id
      }
    });
  } catch (error) {
    request.log.error('Error fetching wallet data:', error);
    
    return reply.code(500).send({
      data: null,
      errors: [
        {
          code: 'SERVER_ERROR',
          message: 'Could not fetch wallet data. Please try again.'
        }
      ],
      meta: {
        timestamp: new Date().toISOString(),
        requestId: request.id
      }
    });
  }
}
