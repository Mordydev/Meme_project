import { FastifyRequest, FastifyReply } from 'fastify';
import { verifySignature, isTokenHolder } from '../../lib/wallet-utils';

interface VerifyWalletRequest {
  Body: {
    data: {
      sessionId: string;
      address: string;
      signature: string;
    }
  }
}

/**
 * Verify a wallet signature to confirm ownership
 * 
 * @route POST /api/v1/wallet/verify
 */
export async function verify(
  request: FastifyRequest<VerifyWalletRequest>,
  reply: FastifyReply
) {
  try {
    const { sessionId, address, signature } = request.body.data;
    
    // Retrieve the session data
    const sessionData = await request.server.redis.get(`wallet:session:${sessionId}`);
    
    if (!sessionData) {
      return reply.code(400).send({
        data: null,
        errors: [
          {
            code: 'SESSION_EXPIRED',
            message: 'Wallet connection session has expired. Please try again.'
          }
        ],
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        }
      });
    }
    
    // Parse session data
    const { message, timestamp, walletType } = JSON.parse(sessionData);
    
    // Verify the signature against the message
    const isValid = await verifySignature(message, signature, address, walletType);
    
    if (!isValid) {
      return reply.code(400).send({
        data: null,
        errors: [
          {
            code: 'INVALID_SIGNATURE',
            message: 'Signature verification failed. Please try again.'
          }
        ],
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        }
      });
    }
    
    // In a real implementation, we would fetch the token balance from the blockchain
    // and determine if the user is a holder based on that balance
    const mockBalance = 1250.75;
    const isHolder = isTokenHolder(mockBalance);
    
    // Store the verified wallet in the user's session
    if (request.user) {
      // Associate wallet with user in database
      await request.server.db.users.update({
        where: { id: request.user.id },
        data: {
          walletAddress: address,
          walletVerified: true,
          walletConnectedAt: new Date()
        }
      });
    }
    
    // Clear the session data as it's no longer needed
    await request.server.redis.del(`wallet:session:${sessionId}`);
    
    return reply.code(200).send({
      data: {
        verified: true,
        address,
        isHolder,
        balance: mockBalance
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: request.id
      }
    });
  } catch (error) {
    request.log.error('Error verifying wallet signature:', error);
    
    return reply.code(500).send({
      data: null,
      errors: [
        {
          code: 'SERVER_ERROR',
          message: 'Could not verify wallet ownership. Please try again.'
        }
      ],
      meta: {
        timestamp: new Date().toISOString(),
        requestId: request.id
      }
    });
  }
}
