import { FastifyRequest, FastifyReply } from 'fastify';
import { verifyClerkJWT } from '../lib/clerk';
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
    
    const user = await verifyClerkJWT(token);
    
    if (!user) {
      return reply.code(401).send({ 
        error: 'Unauthorized', 
        message: 'Invalid or expired token'
      });
    }
    
    // Add user to request for downstream handlers
    request.user = user;
  } catch (error) {
    logger.error('Authentication failed', { error });
    return reply.code(401).send({ 
      error: 'Unauthorized', 
      message: 'Authentication failed'
    });
  }
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
      [key: string]: any;
    };
  }
}
