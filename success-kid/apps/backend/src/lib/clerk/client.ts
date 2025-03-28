import { createRemoteJWKSet, jwtVerify, JWTVerifyOptions, JWTPayload } from 'jose';
import { logger } from '../../lib/logger';
import { AppError } from '../../lib/errors';

// Clerk configuration
const CLERK_JWKS_URL = process.env.CLERK_JWKS_URL || 'https://api.clerk.dev/v1/jwks';
const CLERK_ISSUER = process.env.CLERK_ISSUER || 'https://clerk.success-kid.com';
const CLERK_AUDIENCE = process.env.CLERK_AUDIENCE || 'success-kid-platform';

// Cache JWKS client
let jwksClient: ReturnType<typeof createRemoteJWKSet>;

/**
 * Create JWKS client for Clerk (lazy loaded)
 */
function getJwksClient() {
  if (!jwksClient) {
    jwksClient = createRemoteJWKSet(new URL(CLERK_JWKS_URL));
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
 * User information extracted from Clerk JWT
 */
export interface ClerkUser {
  id: string;
  email?: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
  role: string;
  metadata?: Record<string, any>;
}

/**
 * Verify and decode a JWT token issued by Clerk
 * 
 * @param token JWT token to verify
 * @param options Additional verification options
 * @returns User information extracted from the token
 * @throws Error if token is invalid
 */
export async function verifyClerkJWT(token: string, options?: Partial<JWTVerifyOptions>): Promise<ClerkUser> {
  try {
    // Verify the token signature and claims
    const { payload } = await jwtVerify(token, getJwksClient(), {
      issuer: CLERK_ISSUER,
      audience: CLERK_AUDIENCE,
      ...options
    });
    
    const clerkPayload = payload as ClerkJwtPayload;
    
    if (!clerkPayload.sub) {
      throw new Error('Missing subject in token');
    }
    
    // Extract user information from token
    return {
      id: clerkPayload.sub,
      email: clerkPayload.email,
      username: clerkPayload.username,
      firstName: clerkPayload.given_name,
      lastName: clerkPayload.family_name,
      profileImageUrl: clerkPayload.picture,
      role: clerkPayload.metadata?.role || 'user',
      metadata: clerkPayload.metadata
    };
  } catch (error) {
    logger.error('JWT verification failed', { error });
    throw new AppError('Invalid authentication token', 'UNAUTHORIZED', 401);
  }
}

/**
 * Extract token from HTTP Authorization header
 * 
 * @param authorization Authorization header value
 * @returns JWT token or null if invalid
 */
export function extractToken(authorization?: string): string | null {
  if (!authorization) {
    return null;
  }
  
  const parts = authorization.split(' ');
  
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }
  
  return parts[1];
}
