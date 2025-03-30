import { FastifyRequest, FastifyReply } from 'fastify';
import { verifyClerkJWT, ClerkUser } from '../lib/clerk/client';
import { logger } from '../lib/logger';

/**
 * Middleware to authenticate requests using JWT
 * Adds the authenticated user to the request object
 */
export async function authMiddleware(request: FastifyRequest, reply: FastifyReply) {
  try {
    const authHeader = request.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return reply.code(401).send({ 
        error: 'Unauthorized', 
        message: 'Authorization header missing or invalid format'
      });
    }
    
    const token = authHeader.split(' ')[1];
    
    const clerkUser = await verifyClerkJWT(token);
    
    if (!clerkUser) {
      return reply.code(401).send({ 
        error: 'Unauthorized', 
        message: 'Invalid or expired token'
      });
    }
    
    // Add user to request for downstream handlers
    // Map ClerkUser to the expected request.user format
    request.user = {
      id: clerkUser.id,
      email: clerkUser.email || '',
      role: clerkUser.role || 'user',
      firstName: clerkUser.firstName,
      lastName: clerkUser.lastName,
      profileImageUrl: clerkUser.profileImageUrl
    };
  } catch (error) {
    logger.error('Authentication failed', { error });
    return reply.code(401).send({ 
      error: 'Unauthorized', 
      message: 'Authentication failed'
    });
  }
}

/**
 * Middleware to optionally authenticate requests using JWT
 * Adds the authenticated user to the request object if successful,
 * but allows the request to proceed even if authentication fails.
 */
export async function authOptionalMiddleware(request: FastifyRequest, reply: FastifyReply) {
  try {
    const authHeader = request.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const clerkUser = await verifyClerkJWT(token);

      if (clerkUser) {
        // Add user to request if token is valid
        request.user = {
          id: clerkUser.id,
          email: clerkUser.email || '',
          role: clerkUser.role || 'user',
          firstName: clerkUser.firstName,
          lastName: clerkUser.lastName,
          profileImageUrl: clerkUser.profileImageUrl
        };
      }
      // If token is invalid or missing, proceed without setting request.user
    }
  } catch (error) {
    // Log the error but allow the request to proceed
    const errorMessage = error instanceof Error ? error.message : 'Unknown error during optional auth check';
    logger.warn('Optional authentication check failed', { error: errorMessage });
  }
  // Always proceed, regardless of authentication success/failure
}

/**
 * Middleware to check if user has required roles
 * Must be used after authMiddleware
 */
export function roleMiddleware(roles: string[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.user) {
      return reply.code(401).send({ 
        error: 'Unauthorized', 
        message: 'Authentication required'
      });
    }
    
    if (!roles.includes(request.user.role)) {
      return reply.code(403).send({ 
        error: 'Forbidden', 
        message: 'Insufficient permissions'
      });
    }
  };
}

// Type augmentation for Fastify
declare module 'fastify' {
  interface FastifyRequest {
    user?: {
      id: string;
      email: string;
      role: string;
      firstName?: string | null;
      lastName?: string | null;
      profileImageUrl?: string | null;
      [key: string]: any;
    };
  }
}
