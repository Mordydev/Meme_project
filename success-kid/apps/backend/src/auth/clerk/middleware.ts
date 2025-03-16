/**
 * Clerk Authentication Middleware
 * 
 * Provides middleware for authenticating requests using Clerk
 */
import { FastifyRequest, FastifyReply } from 'fastify';
import { verifyClerkJWT } from './client';
import { AuthOptions } from './types';
import { authService } from '../../services/auth-service';
import { sessionService } from '../../services/session-service';
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
 * Middleware to authenticate requests using Clerk JWT
 * Adds the authenticated user to the request object
 * 
 * @param options Authentication options
 */
export function authMiddleware(options: AuthOptions = { required: true }) {
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
      
      // Verify Clerk JWT
      const clerkUser = await verifyClerkJWT(token);
      
      if (!clerkUser) {
        if (options.required) {
          throw new UnauthorizedError('Invalid authentication token');
        }
        return;
      }
      
      // Try to get user from our database
      const user = await authService.getUserByExternalId(clerkUser.id);
      
      if (!user && options.required) {
        throw new UnauthorizedError('User not found');
      }
      
      if (user) {
        // Add user to request
        request.user = user;
        
        // Check for required roles if specified
        if (options.roles && options.roles.length > 0) {
          const hasRole = await authService.hasAnyRole(user.id, options.roles, options.organizationId);
          
          if (!hasRole) {
            const roleList = options.roles.join(', ');
            throw new ForbiddenError(`Access denied. Required roles: ${roleList}`);
          }
        }
        
        // Check for required permissions if specified
        if (options.resource && options.action) {
          const hasPermission = await authService.hasPermission(
            user.id, 
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
        
        // All checks passed
        return;
      }
    } catch (error) {
      if (error instanceof UnauthorizedError || error instanceof ForbiddenError) {
        throw error;
      }
      
      logger.error('Authentication error', { error });
      
      if (options.required) {
        throw new UnauthorizedError('Authentication failed');
      }
    }
  };
}

/**
 * Middleware to check if user has required roles
 * Must be used after authMiddleware
 * 
 * @deprecated Use authMiddleware with roles option instead
 */
export function roleMiddleware(roles: string[], organizationId?: string) {
  return authMiddleware({ required: true, roles, organizationId });
}

/**
 * Middleware to check if user has required permissions
 * Must be used after authMiddleware
 * 
 * @deprecated Use authMiddleware with resource and action options instead
 */
export function permissionMiddleware(resource: string, action: string, organizationId?: string) {
  return authMiddleware({ required: true, resource, action, organizationId });
}

/**
 * Middleware to verify Clerk webhook signature
 */
export async function clerkWebhookMiddleware(request: FastifyRequest, reply: FastifyReply) {
  // TODO: Implement webhook signature verification
  // This would verify that the webhook is actually from Clerk
  // using the webhook secret and the signature in the request headers
}
