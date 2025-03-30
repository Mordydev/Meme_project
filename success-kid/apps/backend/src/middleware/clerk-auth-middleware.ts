import { FastifyRequest, FastifyReply } from 'fastify';
import { verifyClerkJWT, extractToken, ClerkUser } from '../lib/clerk/client';
import { UnauthorizedError, ForbiddenError } from '../lib/errors';
import { logger } from '../lib/logger';
import { sessionService } from '../services/session-service';

/**
 * Authentication options
 */
export interface AuthOptions {
  required?: boolean;
  roles?: string[];
}

/**
 * Auth middleware to verify JWT tokens and extract user information
 */
export function authMiddleware(options: AuthOptions = { required: true }) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // Extract token from Authorization header
      const token = extractToken(request.headers.authorization);
      
      if (!token) {
        if (options.required) {
          throw new UnauthorizedError('Authentication required');
        }
        return;
      }
      
      // Verify and decode JWT
      let user: ClerkUser;
      try {
        user = await verifyClerkJWT(token);
      } catch (error) {
        if (options.required) {
          throw new UnauthorizedError('Invalid authentication token');
        }
        return;
      }
      
      // Check if user has required roles (if specified)
      if (options.roles && options.roles.length > 0) {
        const userRole = user.role || ''; // Provide default empty string
        const hasRole = options.roles.includes(userRole);
        
        if (!hasRole) {
          throw new ForbiddenError(`Required role: ${options.roles.join(' or ')}`);
        }
      }
      
      // Add user to request
      request.user = {
        id: user.id,
        email: user.email || '',
        displayName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username || user.email || 'Unknown',
        role: user.role || 'user',
        firstName: user.firstName,
        lastName: user.lastName,
        profileImageUrl: user.profileImageUrl,
        metadata: user.metadata
      };
      
      // Record session activity for user (without blocking the request)
      if (request.user) {
        const sessionId = request.cookies.sessionId;
        
        if (sessionId) {
          sessionService.updateSessionActivity(sessionId)
            .catch(error => {
              logger.error('Failed to update session activity', { error, sessionId });
            });
        }
      }
    } catch (error) {
      if (error instanceof UnauthorizedError || error instanceof ForbiddenError) {
        throw error;
      }
      
      logger.error('Auth middleware error', { error });
      
      if (options.required) {
        throw new UnauthorizedError('Authentication failed');
      }
    }
  };
}

// Specific role-based middleware factories
export const requiresAdmin = authMiddleware({ required: true, roles: ['admin'] });
export const requiresModerator = authMiddleware({ required: true, roles: ['admin', 'moderator'] });
export const requiresUser = authMiddleware({ required: true });
export const optionalAuth = authMiddleware({ required: false });
