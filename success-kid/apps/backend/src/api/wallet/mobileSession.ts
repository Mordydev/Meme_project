import { FastifyRequest, FastifyReply } from 'fastify';
import { v4 as uuidv4 } from 'uuid';
import { createVerificationMessage, getWalletDeepLink } from '../../lib/wallet-utils';

interface MobileSessionRequest {
  Body: {
    data: {
      deviceType: 'ios' | 'android';
      walletType?: string;
    }
  }
}

/**
 * Create a mobile connection session for wallet connection
 * 
 * @route POST /api/v1/wallet/mobile/session
 */
export async function mobileSession(
  request: FastifyRequest<MobileSessionRequest>,
  reply: FastifyReply
) {
  try {
    const { deviceType, walletType = 'phantom' } = request.body.data;
    
    // Generate a unique session ID
    const sessionId = uuidv4();
    
    // Create a timestamp for the verification message
    const timestamp = Date.now();
    
    // Generate a verification message
    const message = createVerificationMessage(sessionId, timestamp);
    
    // Expiration time (5 minutes from now)
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
    
    // Create QR code data
    // In a real implementation, this would be a specially formatted JSON
    // that contains the connection params
    const qrCodeData = JSON.stringify({
      sessionId,
      message,
      type: 'wallet_connection'
    });
    
    // Create deep link based on device type
    // This is a simplified implementation - real implementation would have
    // more complex deep linking logic
    const deepLink = getWalletDeepLink(walletType, {
      sessionId,
      action: 'connect',
      redirect: 'success-kid://wallet/connect'
    });
    
    // Store session data in server cache for later verification
    await request.server.redis.set(
      `wallet:mobile:${sessionId}`,
      JSON.stringify({
        deviceType,
        walletType,
        message,
        timestamp,
        status: 'pending',
        userId: request.user?.id,
        createdAt: new Date().toISOString(),
        expiresAt
      }),
      'EX',
      300 // 5 minutes TTL
    );
    
    return reply.code(200).send({
      data: {
        sessionId,
        qrCodeData,
        deepLink,
        expiresAt
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: request.id
      }
    });
  } catch (error) {
    request.log.error('Error creating mobile wallet session:', error);
    
    return reply.code(500).send({
      data: null,
      errors: [
        {
          code: 'SERVER_ERROR',
          message: 'Could not create mobile connection session. Please try again.'
        }
      ],
      meta: {
        timestamp: new Date().toISOString(),
        requestId: request.id
      }
    });
  }
}
