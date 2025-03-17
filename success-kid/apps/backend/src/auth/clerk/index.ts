/**
 * Clerk Authentication Services
 * 
 * This module provides integration with Clerk for user authentication and session management.
 */
import { FastifyRequest, FastifyReply } from 'fastify';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import { UserProfile } from '@success-kid/api-types';
import { logger } from '../../lib/logger';
import { env } from '../../config';
import { UnauthorizedError } from '../../errors/auth-errors';

// Configure Clerk JWKS URL and issuer based on environment
const CLERK_JWKS_URL = env.CLERK_JWKS_URL || 'https://api.clerk.dev/v1/jwks';
const CLERK_ISSUER = env.CLERK_ISSUER || 'https://clerk.success-kid.com';
const CLERK_AUDIENCE = env.CLERK_AUDIENCE || 'success-kid-platform';

// Create a JWKS client for the Clerk public keys
const jwksClient = createRemoteJWKSet(new URL(CLERK_JWKS_URL));

/**
 * User data from verified token
 */
export interface ClerkUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
  metadata?: Record<string, any>;
}

/**
 * Verify a JWT issued by Clerk
 * 
 * @param token The JWT token to verify
 * @returns The decoded user information or null if invalid
 */
export async function verifyClerkJWT(token: string): Promise<ClerkUser | null> {
  try {
    // Verify the token using JWKS
    const { payload } = await jwtVerify(token, jwksClient, {
      issuer: CLERK_ISSUER,
      audience: CLERK_AUDIENCE,
    });
    
    // Ensure required fields are present
    if (!payload.sub) {
      logger.warn('Missing subject in token', { payload });
      return null;
    }
    
    // Extract user data from payload
    return {
      id: payload.sub as string,
      email: payload.email as string || '',
      firstName: payload.given_name as string || undefined,
      lastName: payload.family_name as string || undefined,
      role: (payload.metadata as any)?.role || 'user',
      metadata: payload.metadata as Record<string, any> || {}
    };
  } catch (error) {
    logger.error('JWT verification error', { error });
    return null;
  }
}

/**
 * Extract and verify auth token from request
 * 
 * @param request Fastify request
 * @returns Verified user or null
 */
export async function extractAndVerifyToken(request: FastifyRequest): Promise<ClerkUser | null> {
  // Extract token from Authorization header
  const authHeader = request.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  const token = authHeader.split(' ')[1];
  
  // Verify token
  return verifyClerkJWT(token);
}

/**
 * Middleware for authenticating requests with Clerk
 * 
 * @param request Fastify request
 * @param reply Fastify reply
 * @throws UnauthorizedError if authentication fails
 */
export async function clerkAuthMiddleware(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  try {
    // Extract and verify token
    const user = await extractAndVerifyToken(request);
    
    if (!user) {
      throw new UnauthorizedError('Authentication required');
    }
    
    // Attach user to request for downstream handlers
    request.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      metadata: user.metadata
    };
  } catch (error) {
    throw new UnauthorizedError('Authentication failed');
  }
}

/**
 * Convert Clerk user to UserProfile
 * 
 * @param user Clerk user
 * @returns UserProfile
 */
export function clerkUserToProfile(user: ClerkUser): UserProfile {
  return {
    id: user.id,
    email: user.email,
    displayName: [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    avatarUrl: user.metadata?.avatarUrl,
    role: user.role,
    createdAt: user.metadata?.createdAt || new Date().toISOString()
  };
}

/**
 * Register ClerkAuth plugin with Fastify
 * 
 * @param fastify Fastify instance
 */
export async function registerClerkAuth(fastify: any): Promise<void> {
  // Register auth routes
  fastify.decorate('clerkAuth', {
    verifyToken: verifyClerkJWT,
    extractAndVerifyToken,
    userToProfile: clerkUserToProfile
  });
  
  // Add hook for session retrieval (optional)
  fastify.addHook('preHandler', async (request: FastifyRequest, reply: FastifyReply) => {
    // For endpoints that don't require authentication, do nothing
    if (request.routeOptions?.config?.auth === false) {
      return;
    }
    
    // Otherwise try to extract user (but don't throw if not found)
    try {
      const user = await extractAndVerifyToken(request);
      if (user) {
        request.user = {
          id: user.id,
          email: user.email,
          role: user.role,
          firstName: user.firstName,
          lastName: user.lastName,
          metadata: user.metadata
        };
      }
    } catch (error) {
      // Just log, don't throw - let individual routes enforce auth if needed
      logger.debug('Auth extraction error', { error, url: request.url });
    }
  });
  
  logger.info('Clerk authentication plugin registered');
}
