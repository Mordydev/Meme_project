import { FastifyRequest, FastifyReply } from 'fastify';
import { 
  sendEmailVerification, 
  verifyEmail, 
  sendPasswordReset,
  sendAccountRecovery,
  processPasswordReset,
  processAccountRecovery,
  generateRecoveryCodes,
  verifyRecoveryCode
} from '../verification';
import { logger } from '../../lib/logger';
import { NotFoundError, ValidationError, UnauthorizedError } from '../../lib/errors';

/**
 * Send email verification
 */
export async function sendEmailVerificationHandler(
  request: FastifyRequest<{
    Body: { email: string };
  }>,
  reply: FastifyReply
) {
  try {
    const { email } = request.body;
    
    if (!request.user) {
      throw new UnauthorizedError('Authentication required');
    }
    
    // Send verification email
    await sendEmailVerification(
      request.user.id,
      email,
      request.user.displayName
    );
    
    return {
      data: {
        sent: true,
        email
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: request.id
      }
    };
  } catch (error) {
    logger.error('Send email verification error', { error });
    throw error;
  }
}

/**
 * Verify email with token
 */
export async function verifyEmailHandler(
  request: FastifyRequest<{
    Params: { token: string };
  }>,
  reply: FastifyReply
) {
  try {
    const { token } = request.params;
    
    // Verify email
    const userId = await verifyEmail(token);
    
    if (!userId) {
      throw new ValidationError('Invalid or expired verification token');
    }
    
    // In a real app, update user record to mark email as verified
    
    return {
      data: {
        verified: true
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: request.id
      }
    };
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }
    
    logger.error('Verify email error', { error });
    throw error;
  }
}

/**
 * Send password reset email
 */
export async function sendPasswordResetHandler(
  request: FastifyRequest<{
    Body: { email: string };
  }>,
  reply: FastifyReply
) {
  try {
    const { email } = request.body;
    
    // In a real app, look up user by email
    // For now, just create a placeholder user ID
    const userId = 'user_' + Math.random().toString(36).substring(2, 15);
    
    // Send password reset email
    await sendPasswordReset(userId, email);
    
    // Always return success even if email doesn't exist (security best practice)
    return {
      data: {
        sent: true
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: request.id
      }
    };
  } catch (error) {
    logger.error('Send password reset error', { error });
    
    // Always return success even if there's an error (security best practice)
    return {
      data: {
        sent: true
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: request.id
      }
    };
  }
}

/**
 * Reset password with token
 */
export async function resetPasswordHandler(
  request: FastifyRequest<{
    Body: { token: string; password: string };
  }>,
  reply: FastifyReply
) {
  try {
    const { token, password } = request.body;
    
    // Validate password
    if (password.length < 8) {
      throw new ValidationError('Password must be at least 8 characters');
    }
    
    // Process password reset
    const userId = await processPasswordReset(token, password);
    
    if (!userId) {
      throw new ValidationError('Invalid or expired reset token');
    }
    
    // In a real app, update user's password in database
    
    return {
      data: {
        reset: true
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: request.id
      }
    };
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }
    
    logger.error('Reset password error', { error });
    throw error;
  }
}

/**
 * Send account recovery email
 */
export async function sendAccountRecoveryHandler(
  request: FastifyRequest<{
    Body: { email: string };
  }>,
  reply: FastifyReply
) {
  try {
    const { email } = request.body;
    
    // In a real app, look up user by email
    // For now, just create a placeholder user ID
    const userId = 'user_' + Math.random().toString(36).substring(2, 15);
    
    // Send account recovery email
    await sendAccountRecovery(userId, email);
    
    // Always return success even if email doesn't exist (security best practice)
    return {
      data: {
        sent: true
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: request.id
      }
    };
  } catch (error) {
    logger.error('Send account recovery error', { error });
    
    // Always return success even if there's an error (security best practice)
    return {
      data: {
        sent: true
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: request.id
      }
    };
  }
}

/**
 * Generate recovery codes for a user
 */
export async function generateRecoveryCodesHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    if (!request.user) {
      throw new UnauthorizedError('Authentication required');
    }
    
    // Generate recovery codes
    const codes = await generateRecoveryCodes(request.user.id);
    
    return {
      data: {
        codes
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: request.id
      }
    };
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      throw error;
    }
    
    logger.error('Generate recovery codes error', { error });
    throw error;
  }
}

/**
 * Verify a recovery code
 */
export async function verifyRecoveryCodeHandler(
  request: FastifyRequest<{
    Body: { userId: string; code: string };
  }>,
  reply: FastifyReply
) {
  try {
    const { userId, code } = request.body;
    
    // Verify recovery code
    const isValid = await verifyRecoveryCode(userId, code);
    
    if (!isValid) {
      throw new ValidationError('Invalid recovery code');
    }
    
    // In a real app, allow user to reset password or access account
    
    return {
      data: {
        valid: true,
        userId
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: request.id
      }
    };
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }
    
    logger.error('Verify recovery code error', { error });
    throw error;
  }
}
