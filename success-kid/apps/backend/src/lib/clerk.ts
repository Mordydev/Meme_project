import { createRemoteJWKSet, jwtVerify } from 'jose';
import { logger } from './logger';

// Check for logger existence and create if needed
const CLERK_JWKS_URL = `https://api.clerk.dev/v1/jwks`;
const CLERK_ISSUER = process.env.CLERK_ISSUER || 'https://clerk.success-kid.com';
const CLERK_AUDIENCE = process.env.CLERK_AUDIENCE || 'success-kid-platform';

// Create a JWKS client for the Clerk public keys
const jwks = createRemoteJWKSet(new URL(CLERK_JWKS_URL));

/**
 * Verify a JWT issued by Clerk
 * @param token The JWT token to verify
 * @returns The decoded user information or null if invalid
 */
export async function verifyClerkJWT(token: string) {
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
      role: (payload.metadata as any)?.role || 'user',
      firstName: payload.given_name as string,
      lastName: payload.family_name as string,
      // Add other necessary user properties
    };
  } catch (error) {
    logger?.error?.('JWT verification error', { error }) || 
      console.error('JWT verification error', error);
    return null;
  }
}
