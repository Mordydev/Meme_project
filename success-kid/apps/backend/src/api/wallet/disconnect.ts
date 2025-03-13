import { FastifyRequest, FastifyReply } from 'fastify';

/**
 * Disconnect wallet from user account
 * 
 * @route DELETE /api/v1/wallet
 */
export async function disconnect(
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
    
    // Check if user has a wallet connected
    const user = await request.server.db.users.findUnique({
      where: { id: request.user.id },
      select: {
        walletAddress: true,
        walletVerified: true
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
    
    // Update user record to remove wallet connection
    await request.server.db.users.update({
      where: { id: request.user.id },
      data: {
        walletAddress: null,
        walletVerified: false,
        walletConnectedAt: null
      }
    });
    
    return reply.code(200).send({
      data: {
        success: true,
        disconnectedAt: new Date().toISOString()
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: request.id
      }
    });
  } catch (error) {
    request.log.error('Error disconnecting wallet:', error);
    
    return reply.code(500).send({
      data: null,
      errors: [
        {
          code: 'SERVER_ERROR',
          message: 'Could not disconnect wallet. Please try again.'
        }
      ],
      meta: {
        timestamp: new Date().toISOString(),
        requestId: request.id
      }
    });
  }
}
