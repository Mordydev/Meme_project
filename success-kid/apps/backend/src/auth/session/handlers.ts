import { FastifyRequest, FastifyReply } from 'fastify';
import { sessionService } from './service';
import { logger } from '../../lib/logger';
import { UnauthorizedError, ValidationError, ForbiddenError } from '../../lib/errors';
import { securityAuditService, AuthEvent } from '../security/audit-service';

/**
 * Handler to get active sessions for the current user
 */
export async function getUserSessionsHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    if (!request.user) {
      throw new UnauthorizedError('Authentication required');
    }
    
    // Get all sessions for the user
    const sessions = await sessionService.getUserSessions(request.user.id);
    
    // Determine current session
    const currentSessionId = request.cookies.sessionId;
    
    // Add flag for current session
    const formattedSessions = sessions.map(session => ({
      ...session,
      isCurrent: session.id === currentSessionId
    }));
    
    return {
      data: {
        sessions: formattedSessions
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: request.id
      }
    };
  } catch (error) {
    logger.error('Error getting user sessions', { error });
    
    if (error instanceof UnauthorizedError) {
      throw error;
    }
    
    throw new Error('Failed to retrieve session information');
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
    
    if (!sessionId) {
      throw new ValidationError('Session ID is required');
    }
    
    // Get the session to check ownership
    const session = await sessionService.getSession(sessionId);
    
    if (!session) {
      // For security, don't reveal that the session doesn't exist
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
    
    // Security check: Only allow users to revoke their own sessions
    // unless they have admin permissions
    if (session.userId !== request.user.id && request.user.role !== 'admin') {
      throw new ForbiddenError('Cannot revoke another user\'s session');
    }
    
    // Revoke the session
    await sessionService.revokeSession(sessionId);
    
    // Log the action
    await securityAuditService.logAuthEvent(
      AuthEvent.TOKEN_REVOCATION,
      {
        userId: session.userId,
        sessionId,
        revokedBy: request.user.id
      }
    );
    
    // If revoking current session, clear the cookie
    if (sessionId === request.cookies.sessionId) {
      reply.clearCookie('sessionId', {
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
    logger.error('Error revoking session', { error });
    
    if (error instanceof UnauthorizedError || 
        error instanceof ValidationError || 
        error instanceof ForbiddenError) {
      throw error;
    }
    
    throw new Error('Failed to revoke session');
  }
}

/**
 * Handler to revoke all sessions except current
 */
export async function revokeAllSessionsHandler(request: FastifyRequest, reply: FastifyReply) {
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
    await sessionService.revokeAllUserSessions(request.user.id, currentSessionId);
    
    // Log the action
    await securityAuditService.logAuthEvent(
      AuthEvent.TOKEN_REVOCATION,
      {
        userId: request.user.id,
        action: 'revoke_all_sessions',
        excludedSessionId: currentSessionId
      }
    );
    
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
    logger.error('Error revoking all sessions', { error });
    
    if (error instanceof UnauthorizedError || 
        error instanceof ValidationError) {
      throw error;
    }
    
    throw new Error('Failed to revoke sessions');
  }
}

/**
 * Handler to check session status
 */
export async function checkSessionHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    // Get current session ID
    const sessionId = request.cookies.sessionId;
    
    if (!sessionId) {
      return {
        data: {
          active: false
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        }
      };
    }
    
    // Check if session is valid
    const isValid = await sessionService.isSessionValid(sessionId);
    
    return {
      data: {
        active: isValid
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: request.id
      }
    };
  } catch (error) {
    logger.error('Error checking session', { error });
    
    // Default to inactive for security
    return {
      data: {
        active: false
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: request.id
      }
    };
  }
}
