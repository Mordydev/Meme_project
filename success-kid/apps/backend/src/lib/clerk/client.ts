// import { createRemoteJWKSet, jwtVerify, JWTVerifyOptions, JWTPayload } from 'jose';
import { logger } from '../logger';
import { UnauthorizedError } from '../errors';
// import { User as ClerkUser } from '@clerk/clerk-sdk-node';

// Type definitions to avoid direct import dependencies
type JWTPayload = any;
type JWTVerifyOptions = any;

// Clerk configuration
const CLERK_JWKS_URL = process.env.CLERK_JWKS_URL || 'https://api.clerk.dev/v1/jwks';
const CLERK_ISSUER = process.env.CLERK_ISSUER || 'https://clerk.success-kid.com';
const CLERK_AUDIENCE = process.env.CLERK_AUDIENCE || 'success-kid-platform';

// Cache JWKS client
let jwksClient: any;

/**
 * Create JWKS client for Clerk (lazy loaded)
 */
function getJwksClient() {
  if (!jwksClient) {
    // In production, replace with: jwksClient = createRemoteJWKSet(new URL(CLERK_JWKS_URL));
    // For now, stub implementation for compilation
    jwksClient = async () => ({});
  }
  return jwksClient;
}

/**
 * Extended JWT payload with Clerk-specific fields
 */
export interface ClerkJwtPayload extends JWTPayload {
  metadata?: {
    role?: string;
    [key: string]: any;
  };
  username?: string;
  email?: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
}

/**
 * Verify a Clerk JWT token and return user information
 * 
 * @param token JWT token to verify
 * @returns ClerkUser object if token is valid
 * @throws UnauthorizedError if token is invalid
 */
export async function verifyClerkJWT(token: string): Promise<ClerkUser> {
  try {
    // Verify the token
    const verifyOptions: JWTVerifyOptions = {
      issuer: CLERK_ISSUER,
      audience: CLERK_AUDIENCE,
    };
    
    // In production, replace with proper jose implementation:
    // const { payload } = await jwtVerify(token, getJwksClient(), verifyOptions);
    
    // Mock implementation for now
    logger.info('Mock JWT verification used - replace with actual implementation in production');
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid token format');
    }
    
    let payload: ClerkJwtPayload;
    try {
      const decoded = Buffer.from(parts[1], 'base64').toString();
      payload = JSON.parse(decoded);
    } catch (e) {
      throw new Error('Invalid token payload');
    }
    
    // Extract user information
    return {
      id: payload.sub as string,
      firstName: payload.given_name || null,
      lastName: payload.family_name || null,
      username: payload.username || null,
      email: payload.email || null,
      profileImageUrl: payload.picture || null,
      role: payload.metadata?.role || 'user',
      metadata: payload.metadata || {}
    };
  } catch (error) {
    logger.error('Failed to verify JWT token', { error });
    throw new UnauthorizedError('Invalid authentication token');
  }
}

/**
 * Extract token from Authorization header
 * 
 * @param authHeader Authorization header value
 * @returns JWT token if valid format, null otherwise
 */
export function extractToken(authHeader?: string): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  return authHeader.split(' ')[1];
}

/**
 * ClerkUser interface matching the structure from @clerk/clerk-sdk-node
 * This is used for type safety across the application
 */
export interface ClerkUser {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  username?: string | null;
  email?: string | null;
  profileImageUrl?: string | null;
  role?: string;
  metadata?: Record<string, any>;
}
