/**
 * JWT Authentication Middleware
 * 
 * Provides middleware for authenticating requests using JWT tokens
 */
import { FastifyRequest, FastifyReply } from 'fastify';
import { verifyToken } from './validation';
import { authService } from '../../services/auth-service';
import { logger } from '../../lib/logger';
import { UnauthorizedError, ForbiddenError } from '../../errors';

/**
 * Extract token from authorization header
 */
export function extractTokenFromHeader(authHeader?: string): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  return authHeader.split(' ')[1];
}

/**
 * Options for the JWT authentication middleware
 */
export interface JwtAuthOptions {
  required?: boolean;
  roles?: string[];
  resource?: string;
  action?: string;
  organizationId?: string;
}

/**
 * Middleware to authenticate requests using JWT
 */
export function jwtAuthMiddleware(options: JwtAuthOptions = { required: true }) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // Extract token from authorization header
      const token = extractTokenFromHeader(request.headers.authorization);
      
      if (!token) {
        if (options.required) {
          throw new UnauthorizedError('Authorization required');
        }
        return;
      }
      
      // Verify token
      const result = await verifyToken(token);
      
      if (!result.valid || !result.payload) {
        if (options.required) {
          throw new UnauthorizedError('Invalid or expired token');
        }
        return;
      }
      
      // Get user from payload
      const { sub: userId, jti: sessionId } = result.payload;
      
      // Get user from database
      const user = await authService.getUserById(userId);
      
      if (!user) {
        if (options.required) {
          throw new UnauthorizedError('User not found');
        }
        return;
      }
      
      // Add user and session to request
      request.user = user;
      request.session = { id: sessionId };
      
      // Check for required roles if specified
      if (options.roles && options.roles.length > 0) {
        const hasRole = await authService.hasAnyRole(userId, options.roles, options.organizationId);
        
        if (!hasRole) {
          const roleList = options.roles.join(', ');
          throw new ForbiddenError(`Access denied. Required roles: ${roleList}`);
        }
      }
      
      // Check for required permissions if specified
      if (options.resource && options.action) {
        const hasPermission = await authService.hasPermission(
          userId, 
          options.resource, 
          options.action, 
          options.organizationId
        );
        
        if (!hasPermission) {
          throw new ForbiddenError(
            `Access denied. Required permission: ${options.action} on ${options.resource}`
          );
        }
      }
    } catch (error) {
      if (error instanceof UnauthorizedError || error instanceof ForbiddenError) {
        throw error;
      }
      
      logger.error('JWT authentication error', { error });
      
      if (options.required) {
        throw new UnauthorizedError('Authentication failed');
      }
    }
  };
}

/**
 * Middleware to check if user has required roles
 * Must be used after jwtAuthMiddleware
 */
export function roleMiddleware(roles: string[], organizationId?: string) {
  return jwtAuthMiddleware({ required: true, roles, organizationId });
}

/**
 * Middleware to check if user has required permissions
 * Must be used after jwtAuthMiddleware
 */
export function permissionMiddleware(resource: string, action: string, organizationId?: string) {
  return jwtAuthMiddleware({ required: true, resource, action, organizationId });
}
