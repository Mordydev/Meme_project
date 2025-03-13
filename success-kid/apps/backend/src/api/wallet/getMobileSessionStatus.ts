import { FastifyRequest, FastifyReply } from 'fastify';

interface MobileSessionParams {
  Params: {
    sessionId: string;
  }
}

/**
 * Check the status of a mobile wallet connection session
 * 
 * @route GET /api/v1/wallet/mobile/session/:sessionId
 */
export async function getMobileSessionStatus(
  request: FastifyRequest<MobileSessionParams>,
  reply: FastifyReply
) {
  try {
    const { sessionId } = request.params;
    
    // Retrieve session data from Redis
    const sessionData = await request.server.redis.get(`wallet:mobile:${sessionId}`);
    
    if (!sessionData) {
      return reply.code(404).send({
        data: null,
        errors: [
          {
            code: 'SESSION_NOT_FOUND',
            message: 'Mobile connection session not found or expired.'
          }
        ],
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        }
      });
    }
    
    // Parse session data
    const session = JSON.parse(sessionData);
    
    // Check if session has expired
    if (new Date(session.expiresAt) < new Date()) {
      return reply.code(410).send({
        data: {
          status: 'expired',
          expiresAt: session.expiresAt
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        }
      });
    }
    
    // Return session status
    const responseData = {
      status: session.status,
      expiresAt: session.expiresAt
    };
    
    // If session is connected, include the wallet address
    if (session.status === 'connected' && session.walletAddress) {
      responseData['address'] = session.walletAddress;
    }
    
    return reply.code(200).send({
      data: responseData,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: request.id
      }
    });
  } catch (error) {
    request.log.error('Error checking mobile session status:', error);
    
    return reply.code(500).send({
      data: null,
      errors: [
        {
          code: 'SERVER_ERROR',
          message: 'Could not check mobile session status. Please try again.'
        }
      ],
      meta: {
        timestamp: new Date().toISOString(),
        requestId: request.id
      }
    });
  }
}
