import { FastifyRequest, FastifyReply } from 'fastify';
import { authService } from '../service';
import { sessionService } from '../../services/session-service';
import { logger } from '../../lib/logger';
import { 
  UnauthorizedError, 
  ValidationError, 
  ForbiddenError, 
  RateLimitExceededError
} from '../../lib/errors';
import { verifyClerkJWT, extractToken } from '../clerk/client';

/**
 * Handler for login endpoint
 * This is a placeholder for custom login logic - with Clerk, primary auth happens on frontend
 */
export async function loginHandler(
  request: FastifyRequest<{
    Body: { email: string; password: string };
  }>,
  reply: FastifyReply
) {
  const { email, password } = request.body;
  
  try {
    // Rate limiting check
    const isRateLimited = await authService.isLoginRateLimited(email, request.ip);
    
    if (isRateLimited) {
      throw new RateLimitExceededError('Too many login attempts. Please try again later.');
    }
    
    // This would be your actual authentication logic
    // For Clerk integration, most authentication happens client-side
    // This is a placeholder implementation
    logger.info('Login attempt', { email });
    
    // Always fail since we're using Clerk for auth
    await authService.handleLoginAttempt(email, false, request.ip);
    
    throw new UnauthorizedError('Please use Clerk authentication');
  } catch (error) {
    if (error instanceof UnauthorizedError || 
        error instanceof ForbiddenError || 
        error instanceof RateLimitExceededError) {
      throw error;
    }
    
    logger.error('Login error', { email, error });
    throw new UnauthorizedError('Authentication failed');
  }
}

/**
 * Handler for validating a JWT token and creating a session
 */
export async function validateTokenHandler(
  request: FastifyRequest<{
    Body: { token: string };
  }>,
  reply: FastifyReply
) {
  try {
    const { token } = request.body;
    
    // Validate token
    const user = await verifyClerkJWT(token);
    
    // Create session
    const session = await sessionService.createSession(user.id, {
      name: request.headers['user-agent'] || 'Unknown',
      ip: request.ip
    });
    
    // Set session cookie
    reply.setCookie('sessionId', session.id, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 14 * 24 * 60 * 60 // 14 days in seconds
    });
    
    return {
      data: {
        userId: user.id,
        sessionId: session.id,
        expiresAt: session.expiresAt
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
    
    logger.error('Token validation error', { error });
    throw new UnauthorizedError('Invalid authentication token');
  }
}

/**
 * Handler for logout
 */
export async function logoutHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    // Get session ID from cookie
    const sessionId = request.cookies.sessionId;
    
    if (sessionId && request.user) {
      // Revoke session
      await sessionService.revokeSession(sessionId);
    }
    
    // Clear session cookie
    reply.clearCookie('sessionId', {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    });
    
    return {
      data: {
        loggedOut: true
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: request.id
      }
    };
  } catch (error) {
    logger.error('Logout error', { error });
    
    // Still clear cookie even if there's an error
    reply.clearCookie('sessionId', {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    });
    
    return {
      data: {
        loggedOut: true
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: request.id
      }
    };
  }
}

/**
 * Handler to refresh a session
 */
export async function refreshSessionHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    if (!request.user) {
      throw new UnauthorizedError('Authentication required');
    }
    
    // Get session ID from cookie
    const sessionId = request.cookies.sessionId;
    
    if (!sessionId) {
      throw new UnauthorizedError('No active session');
    }
    
    // Extend session
    const session = await sessionService.extendSession(sessionId);
    
    if (!session) {
      throw new UnauthorizedError('Invalid session');
    }
    
    // Update session cookie
    reply.setCookie('sessionId', session.id, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 14 * 24 * 60 * 60 // 14 days in seconds
    });
    
    return {
      data: {
        sessionId: session.id,
        expiresAt: session.expiresAt
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
    
    logger.error('Session refresh error', { error });
    throw new UnauthorizedError('Session refresh failed');
  }
}

/**
 * Handler to get current user sessions
 */
export async function getSessionsHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    if (!request.user) {
      throw new UnauthorizedError('Authentication required');
    }
    
    // Get all sessions for user
    const sessions = await sessionService.getUserSessions(request.user.id);
    
    // Get current session ID
    const currentSessionId = request.cookies.sessionId;
    
    // Mark current session
    const sessionsWithCurrent = sessions.map(session => ({
      ...session,
      isCurrent: session.id === currentSessionId
    }));
    
    return {
      data: {
        sessions: sessionsWithCurrent
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
    
    logger.error('Get sessions error', { error });
    throw error;
  }
}

/**
 * Handler to revoke a specific session
 */
export async function revokeSessionHandler(
  request: FastifyRequest<{
    Params: { sessionId: string };
  }>,
  reply: FastifyReply
) {
  try {
    if (!request.user) {
      throw new UnauthorizedError('Authentication required');
    }
    
    const { sessionId } = request.params;
    
    // Revoke session (service handles security checks)
    await authService.revokeSession(sessionId, request.user.id);
    
    // If revoking current session, clear cookie
    const currentSessionId = request.cookies.sessionId;
    if (sessionId === currentSessionId) {
      reply.clearCookie('sessionId', {
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      });
    }
    
    return {
      data: {
        revoked: true,
        sessionId
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: request.id
      }
    };
  } catch (error) {
    if (error instanceof UnauthorizedError || error instanceof ForbiddenError) {
      throw error;
    }
    
    logger.error('Revoke session error', { error });
    throw error;
  }
}

/**
 * Handler to revoke all sessions except current
 */
export async function revokeAllSessionsHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    if (!request.user) {
      throw new UnauthorizedError('Authentication required');
    }
    
    // Get current session ID
    const currentSessionId = request.cookies.sessionId;
    
    if (!currentSessionId) {
      throw new ValidationError('No active session');
    }
    
    // Revoke all other sessions
    await authService.revokeAllOtherSessions(request.user.id, currentSessionId);
    
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
    if (error instanceof UnauthorizedError || 
        error instanceof ForbiddenError || 
        error instanceof ValidationError) {
      throw error;
    }
    
    logger.error('Revoke all sessions error', { error });
    throw error;
  }
}
