import { FastifyRequest, FastifyReply } from 'fastify';
import { tokenService, TokenType } from './service';
import { logger } from '../../lib/logger';
import { ValidationError, UnauthorizedError } from '../../lib/errors';

/**
 * Handle token refreshing
 */
export async function refreshTokenHandler(
  request: FastifyRequest<{
    Body: {
      refreshToken: string;
    };
  }>,
  reply: FastifyReply
) {
  try {
    const { refreshToken } = request.body;
    
    if (!refreshToken) {
      throw new ValidationError('Refresh token is required');
    }
    
    // Refresh tokens
    const tokens = await tokenService.refreshTokens(refreshToken);
    
    // Set refresh token in HTTP-only cookie
    reply.setCookie('refreshToken', tokens.refreshToken, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 // 7 days in seconds
    });
    
    return {
      data: {
        accessToken: tokens.accessToken
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: request.id
      }
    };
  } catch (error) {
    logger.error('Token refresh error', { error });
    
    if (error instanceof ValidationError || error instanceof UnauthorizedError) {
      throw error;
    }
    
    throw new UnauthorizedError('Token refresh failed');
  }
}

/**
 * Handle token validation
 */
export async function validateTokenHandler(
  request: FastifyRequest<{
    Body: {
      token: string;
    };
  }>,
  reply: FastifyReply
) {
  try {
    const { token } = request.body;
    
    if (!token) {
      throw new ValidationError('Token is required');
    }
    
    // Verify token
    const payload = await tokenService.verifyToken(token, TokenType.ACCESS);
    
    return {
      data: {
        valid: true,
        userId: payload.sub
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: request.id
      }
    };
  } catch (error) {
    logger.error('Token validation error', { error });
    
    if (error instanceof ValidationError || error instanceof UnauthorizedError) {
      throw error;
    }
    
    return {
      data: {
        valid: false,
        reason: 'Invalid token'
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: request.id
      }
    };
  }
}

/**
 * Handle token revocation
 */
export async function revokeTokenHandler(
  request: FastifyRequest<{
    Body: {
      token: string;
    };
  }>,
  reply: FastifyReply
) {
  try {
    const { token } = request.body;
    
    if (!token) {
      throw new ValidationError('Token is required');
    }
    
    // Revoke token
    await tokenService.revokeToken(token);
    
    // If revoking refresh token from cookie, clear it
    const refreshToken = request.cookies.refreshToken;
    if (refreshToken === token) {
      reply.clearCookie('refreshToken', {
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      });
    }
    
    return {
      data: {
        revoked: true
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: request.id
      }
    };
  } catch (error) {
    logger.error('Token revocation error', { error });
    
    if (error instanceof ValidationError) {
      throw error;
    }
    
    // Even if there's an error, pretend it worked for security
    return {
      data: {
        revoked: true
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: request.id
      }
    };
  }
}
