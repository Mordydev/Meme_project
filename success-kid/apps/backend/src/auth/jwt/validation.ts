/**
 * JWT Validation
 * 
 * Functions for validating and verifying JWT tokens
 */
import { jwtVerify, SignJWT } from 'jose';
import { env } from '../../config/environment';
import { logger } from '../../lib/logger';
import { TokenPayload, TokenVerificationResult } from '../../models/session';
import { redis } from '../../lib/redis';

// JWT signing key - in production, use a secure key management service
const JWT_SECRET = new TextEncoder().encode(
  env.JWT_SECRET || 'replace-this-with-a-secure-key-in-production'
);

/**
 * Verify a JWT token
 * 
 * @param token JWT token to verify
 * @returns Token verification result
 */
export async function verifyToken(token: string): Promise<TokenVerificationResult> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    
    // Extract necessary fields
    const tokenPayload = payload as unknown as TokenPayload;
    
    // Check if token has been revoked
    if (await isTokenRevoked(tokenPayload.jti)) {
      return { valid: false, error: 'Token has been revoked' };
    }
    
    return { valid: true, payload: tokenPayload };
  } catch (error) {
    logger.debug('Token verification failed', { error });
    return { valid: false, error: 'Invalid or expired token' };
  }
}

/**
 * Check if a token has been revoked
 * 
 * @param jti Token ID (usually session ID)
 * @returns Whether the token is revoked
 */
export async function isTokenRevoked(jti: string): Promise<boolean> {
  try {
    // Check if token is in revocation list
    const isRevoked = await redis.exists(`revoked:${jti}`);
    return isRevoked === 1;
  } catch (error) {
    logger.error('Error checking token revocation', { error, jti });
    // Default to not revoked on error, to prevent accidental lockouts
    return false;
  }
}

/**
 * Revoke a token
 * 
 * @param jti Token ID (usually session ID)
 * @param expiresIn Seconds until the revocation expires (should match token TTL)
 * @returns Whether the token was revoked successfully
 */
export async function revokeToken(jti: string, expiresIn: number): Promise<boolean> {
  try {
    // Add token to revocation list with expiry
    await redis.setex(`revoked:${jti}`, expiresIn, '1');
    return true;
  } catch (error) {
    logger.error('Error revoking token', { error, jti });
    return false;
  }
}

/**
 * Generate a JWT token
 * 
 * @param payload Token payload
 * @param expiresIn Expiration time in seconds
 * @returns Signed JWT token
 */
export async function generateToken(
  payload: Record<string, any>,
  expiresIn: number
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime(now + expiresIn)
    .setIssuedAt(now)
    .setNotBefore(now)
    .sign(JWT_SECRET);
}

/**
 * Generate a token pair (access and refresh tokens)
 * 
 * @param userId User ID
 * @param sessionId Session ID
 * @param roles User roles
 * @param permissions User permissions
 * @param accessTokenTTL Access token TTL in seconds
 * @param refreshTokenTTL Refresh token TTL in seconds
 * @returns Token pair object
 */
export async function generateTokenPair(
  userId: string,
  sessionId: string,
  roles: string[] = [],
  permissions: string[] = [],
  accessTokenTTL: number = 15 * 60, // 15 minutes
  refreshTokenTTL: number = 30 * 24 * 60 * 60 // 30 days
) {
  const now = Math.floor(Date.now() / 1000);
  
  // Create payload for access token
  const accessPayload: TokenPayload = {
    sub: userId,
    jti: sessionId,
    roles,
    perms: permissions,
    iat: now,
    exp: now + accessTokenTTL
  };
  
  // Generate access token
  const accessToken = await generateToken(accessPayload, accessTokenTTL);
  
  // Generate refresh token with minimal payload
  const refreshToken = await generateToken(
    {
      sub: userId,
      jti: sessionId,
      iat: now
    },
    refreshTokenTTL
  );
  
  return {
    access_token: accessToken,
    refresh_token: refreshToken,
    expires_in: accessTokenTTL
  };
}
