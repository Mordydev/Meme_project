import { FastifyRequest, FastifyReply } from 'fastify';
import { v4 as uuidv4 } from 'uuid';
import { createVerificationMessage } from '../../lib/wallet-utils';

interface InitializeWalletRequest {
  Body: {
    data: {
      walletType: string;
    }
  }
}

/**
 * Initialize a wallet connection session and return a message to sign
 * 
 * @route POST /api/v1/wallet/initialize
 */
export async function initialize(
  request: FastifyRequest<InitializeWalletRequest>,
  reply: FastifyReply
) {
  try {
    const { walletType } = request.body.data;
    
    // Generate a unique session ID
    const sessionId = uuidv4();
    
    // Create a timestamp for the verification message
    const timestamp = Date.now();
    
    // Generate a verification message
    // In a real implementation, we would store this in a database or cache
    // along with the sessionId for later verification
    const message = createVerificationMessage(sessionId, timestamp);
    
    // Store session data in server cache for later verification
    await request.server.redis.set(
      `wallet:session:${sessionId}`,
      JSON.stringify({
        walletType,
        timestamp,
        message,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString() // 5 minutes expiry
      }),
      'EX',
      300 // 5 minutes TTL
    );
    
    return reply.code(200).send({
      data: {
        message,
        sessionId
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: request.id
      }
    });
  } catch (error) {
    request.log.error('Error initializing wallet connection:', error);
    
    return reply.code(500).send({
      data: null,
      errors: [
        {
          code: 'SERVER_ERROR',
          message: 'Could not initialize wallet connection. Please try again.'
        }
      ],
      meta: {
        timestamp: new Date().toISOString(),
        requestId: request.id
      }
    });
  }
}
