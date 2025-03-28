import { FastifyRequest, FastifyReply } from 'fastify';
import { walletAuthService } from './service';
import { logger } from '../../lib/logger';
import { ValidationError, UnauthorizedError } from '../../lib/errors';

/**
 * Handler to generate a challenge message for wallet verification
 */
export async function generateChallengeHandler(
  request: FastifyRequest<{
    Body: {
      walletAddress: string;
    };
  }>,
  reply: FastifyReply
) {
  try {
    const { walletAddress } = request.body;
    
    if (!walletAddress) {
      throw new ValidationError('Wallet address is required');
    }
    
    // Generate challenge message
    const { message, nonce } = await walletAuthService.generateChallengeMessage(walletAddress);
    
    return {
      data: {
        message,
        nonce
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: request.id
      }
    };
  } catch (error) {
    logger.error('Error generating wallet challenge', { error });
    
    if (error instanceof ValidationError) {
      throw error;
    }
    
    throw new ValidationError('Failed to generate challenge');
  }
}

/**
 * Handler to verify a wallet signature
 */
export async function verifyWalletSignatureHandler(
  request: FastifyRequest<{
    Body: {
      walletAddress: string;
      signature: string;
      nonce: string;
    };
  }>,
  reply: FastifyReply
) {
  try {
    const { walletAddress, signature, nonce } = request.body;
    
    // Validate required fields
    if (!walletAddress) {
      throw new ValidationError('Wallet address is required');
    }
    
    if (!signature) {
      throw new ValidationError('Signature is required');
    }
    
    if (!nonce) {
      throw new ValidationError('Nonce is required');
    }
    
    // Verify signature
    const isValid = await walletAuthService.verifyWalletSignature(
      walletAddress,
      signature,
      nonce
    );
    
    if (!isValid) {
      throw new UnauthorizedError('Invalid wallet signature');
    }
    
    // If user is authenticated, link wallet to user
    if (request.user) {
      await walletAuthService.linkWalletToUser(request.user.id, walletAddress, true);
    }
    
    return {
      data: {
        verified: true,
        walletAddress
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: request.id
      }
    };
  } catch (error) {
    logger.error('Error verifying wallet signature', { error });
    
    if (error instanceof ValidationError || error instanceof UnauthorizedError) {
      throw error;
    }
    
    throw new ValidationError('Failed to verify wallet signature');
  }
}

/**
 * Handler to link a wallet to a user account
 */
export async function linkWalletHandler(
  request: FastifyRequest<{
    Body: {
      walletAddress: string;
    };
  }>,
  reply: FastifyReply
) {
  try {
    if (!request.user) {
      throw new UnauthorizedError('Authentication required');
    }
    
    const { walletAddress } = request.body;
    
    if (!walletAddress) {
      throw new ValidationError('Wallet address is required');
    }
    
    // Link wallet to user (unverified)
    await walletAuthService.linkWalletToUser(request.user.id, walletAddress, false);
    
    return {
      data: {
        linked: true,
        walletAddress,
        verified: false
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: request.id
      }
    };
  } catch (error) {
    logger.error('Error linking wallet to user', { error });
    
    if (error instanceof ValidationError || error instanceof UnauthorizedError) {
      throw error;
    }
    
    throw new ValidationError('Failed to link wallet');
  }
}

/**
 * Handler to unlink a wallet from a user account
 */
export async function unlinkWalletHandler(
  request: FastifyRequest<{
    Params: {
      walletAddress: string;
    };
  }>,
  reply: FastifyReply
) {
  try {
    if (!request.user) {
      throw new UnauthorizedError('Authentication required');
    }
    
    const { walletAddress } = request.params;
    
    if (!walletAddress) {
      throw new ValidationError('Wallet address is required');
    }
    
    // Unlink wallet from user
    await walletAuthService.unlinkWalletFromUser(request.user.id, walletAddress);
    
    return {
      data: {
        unlinked: true,
        walletAddress
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: request.id
      }
    };
  } catch (error) {
    logger.error('Error unlinking wallet from user', { error });
    
    if (error instanceof ValidationError || error instanceof UnauthorizedError) {
      throw error;
    }
    
    throw new ValidationError('Failed to unlink wallet');
  }
}
