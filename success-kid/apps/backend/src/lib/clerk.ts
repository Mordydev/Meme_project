/**
 * Clerk integration for authentication
 */
import { createRemoteJWKSet, jwtVerify, JWTVerifyResult } from 'jose';
import { logger } from './logger';
import { TokenPayload } from '../models/session';
import { env } from '../config/environment';

// Clerk configuration
const CLERK_JWKS_URL = `https://api.clerk.dev/v1/jwks`;
const CLERK_ISSUER = env.CLERK_ISSUER || 'https://clerk.success-kid.com';
const CLERK_AUDIENCE = env.CLERK_AUDIENCE || 'success-kid-platform';

// Create a JWKS client for the Clerk public keys
const jwks = createRemoteJWKSet(new URL(CLERK_JWKS_URL));

/**
 * Extract user information from Clerk JWT payload
 */
export interface ClerkUser {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  username?: string;
  image_url?: string;
  metadata?: any;
}

/**
 * Verify a JWT issued by Clerk
 * @param token The JWT token to verify
 * @returns The decoded user information or null if invalid
 */
export async function verifyClerkJWT(token: string): Promise<ClerkUser | null> {
  try {
    const { payload } = await jwtVerify(token, jwks, {
      issuer: CLERK_ISSUER,
      audience: CLERK_AUDIENCE,
    });
    
    if (!payload.sub) {
      throw new Error('Missing subject in token');
    }
    
    return {
      id: payload.sub as string,
      email: payload.email as string,
      first_name: payload.given_name as string,
      last_name: payload.family_name as string,
      username: payload.username as string,
      image_url: payload.picture as string,
      metadata: payload.metadata || {},
    };
  } catch (error) {
    logger.error('JWT verification error', { error });
    return null;
  }
}

/**
 * Convert user data from Clerk to our system format
 * This is used to map Clerk's user representation to our internal user model
 * 
 * @param clerkUser The user data from Clerk
 * @returns Our system's user data format
 */
export function mapClerkUserToSystemUser(clerkUser: ClerkUser) {
  return {
    id: clerkUser.id,
    email: clerkUser.email,
    display_name: clerkUser.username || 
      `${clerkUser.first_name || ''} ${clerkUser.last_name || ''}`.trim() || 
      clerkUser.email.split('@')[0],
    auth_provider: 'clerk',
    avatar_url: clerkUser.image_url,
    // Map additional fields as needed
  };
}

/**
 * Check if a token is revoked or blacklisted
 * This would typically check against a Redis store of revoked tokens
 * 
 * @param token The token to check
 * @returns Whether the token is revoked
 */
export async function isTokenRevoked(jti: string): Promise<boolean> {
  // In a real implementation, this would check against a Redis blacklist
  // For now, we'll return false (not revoked) always
  return false;
}

/**
 * Extract authorization token from request header
 * 
 * @param authHeader The Authorization header value
 * @returns The extracted token or null if invalid
 */
export function extractTokenFromHeader(authHeader?: string): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  return authHeader.split(' ')[1];
}
