import { 
  createRemoteJWKSet, 
  jwtVerify, 
  JWTVerifyOptions, 
  JWTPayload, 
  SignJWT, 
  generateSecret,
  jwtDecrypt
} from 'jose';
import { randomUUID } from 'crypto';
import { redisClient } from '../../lib/redis-client';
import { logger } from '../../lib/logger';
import { AppError, UnauthorizedError } from '../../lib/errors';

// Token configuration
const ACCESS_TOKEN_TTL = '15m'; // 15 minutes
const REFRESH_TOKEN_TTL = '7d'; // 7 days
const TOKEN_ISSUER = 'success-kid-platform';
const TOKEN_AUDIENCE = 'api.success-kid.com';

// Token types
export enum TokenType {
  ACCESS = 'access',
  REFRESH = 'refresh'
}

// Cache keys
const REVOKED_TOKENS_PREFIX = 'token:revoked:';
const TOKEN_FAMILY_PREFIX = 'token:family:';

// JWT Secret (in production this would be in secure storage)
let JWT_SECRET: Uint8Array | null = null;

/**
 * Get or generate JWT secret
 */
async function getJwtSecret(): Promise<Uint8Array> {
  if (!JWT_SECRET) {
    // In production, this would load from secure storage
    // For now, we generate a new one each time the server starts
    JWT_SECRET = await generateSecret('HS256');
  }
  
  return JWT_SECRET;
}

/**
 * Enhanced token service with secure handling and refresh mechanisms
 */
export class TokenService {
  /**
   * Generate an access token from user information
   * 
   * @param userId User ID
   * @param metadata Additional metadata to include in token
   * @returns Access token string
   */
  async generateAccessToken(userId: string, metadata: Record<string, any> = {}): Promise<string> {
    try {
      const secret = await getJwtSecret();
      const jti = randomUUID();
      
      const token = await new SignJWT({ 
        metadata,
        type: TokenType.ACCESS
      })
        .setProtectedHeader({ alg: 'HS256' })
        .setSubject(userId)
        .setIssuedAt()
        .setIssuer(TOKEN_ISSUER)
        .setAudience(TOKEN_AUDIENCE)
        .setExpirationTime(ACCESS_TOKEN_TTL)
        .setJti(jti)
        .sign(secret);
      
      return token;
    } catch (error) {
      logger.error('Error generating access token', { userId, error });
      throw new AppError('Failed to generate access token', 'TOKEN_GENERATION_FAILED', 500);
    }
  }
  
  /**
   * Generate a refresh token with family tracking for security
   * 
   * @param userId User ID
   * @param familyId Optional token family ID for chained refresh tokens
   * @returns Refresh token string and family ID
   */
  async generateRefreshToken(userId: string, familyId?: string): Promise<{ token: string; familyId: string }> {
    try {
      const secret = await getJwtSecret();
      const jti = randomUUID();
      const newFamilyId = familyId || randomUUID();
      
      const token = await new SignJWT({ 
        type: TokenType.REFRESH,
        familyId: newFamilyId
      })
        .setProtectedHeader({ alg: 'HS256' })
        .setSubject(userId)
        .setIssuedAt()
        .setIssuer(TOKEN_ISSUER)
        .setAudience(TOKEN_AUDIENCE)
        .setExpirationTime(REFRESH_TOKEN_TTL)
        .setJti(jti)
        .sign(secret);
      
      // Store token family info in Redis
      await redisClient.sadd(
        `${TOKEN_FAMILY_PREFIX}${newFamilyId}`, 
        jti
      );
      
      // Set expiration on family set
      await redisClient.expire(
        `${TOKEN_FAMILY_PREFIX}${newFamilyId}`,
        7 * 24 * 60 * 60 // 7 days in seconds
      );
      
      return { token, familyId: newFamilyId };
    } catch (error) {
      logger.error('Error generating refresh token', { userId, error });
      throw new AppError('Failed to generate refresh token', 'TOKEN_GENERATION_FAILED', 500);
    }
  }
  
  /**
   * Verify and decode a JWT token
   * 
   * @param token JWT token to verify
   * @param expectedType Expected token type
   * @param options Additional verification options
   * @returns Decoded token payload
   */
  async verifyToken(
    token: string, 
    expectedType: TokenType,
    options?: Partial<JWTVerifyOptions>
  ): Promise<JWTPayload & { jti: string }> {
    try {
      const secret = await getJwtSecret();
      
      // Check if token is revoked
      const isRevoked = await this.isTokenRevoked(token);
      
      if (isRevoked) {
        throw new UnauthorizedError('Token has been revoked');
      }
      
      // Verify the token
      const { payload } = await jwtVerify(token, secret, {
        issuer: TOKEN_ISSUER,
        audience: TOKEN_AUDIENCE,
        ...options
      });
      
      // Check that token has required fields
      if (!payload.sub) {
        throw new Error('Missing subject in token');
      }
      
      if (!payload.jti) {
        throw new Error('Missing token ID');
      }
      
      // Verify token type
      if (payload.type !== expectedType) {
        throw new Error(`Invalid token type: expected ${expectedType}, got ${payload.type}`);
      }
      
      return payload as JWTPayload & { jti: string };
    } catch (error) {
      logger.error('Token verification failed', { error });
      
      if (error instanceof UnauthorizedError) {
        throw error;
      }
      
      throw new UnauthorizedError('Invalid token');
    }
  }
  
  /**
   * Refresh an access token using a refresh token
   * 
   * @param refreshToken Refresh token
   * @returns New access token and refresh token
   */
  async refreshTokens(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      // Verify refresh token
      const payload = await this.verifyToken(refreshToken, TokenType.REFRESH);
      
      const userId = payload.sub!;
      const familyId = payload.familyId as string;
      const jti = payload.jti;
      
      if (!familyId) {
        throw new Error('Missing token family ID');
      }
      
      // Revoke the used refresh token for security
      await this.revokeToken(refreshToken);
      
      // Generate new tokens
      const accessToken = await this.generateAccessToken(userId);
      const { token: newRefreshToken } = await this.generateRefreshToken(userId, familyId);
      
      // Remove old token from family
      await redisClient.srem(`${TOKEN_FAMILY_PREFIX}${familyId}`, jti);
      
      return {
        accessToken,
        refreshToken: newRefreshToken
      };
    } catch (error) {
      logger.error('Token refresh failed', { error });
      
      if (error instanceof UnauthorizedError) {
        throw error;
      }
      
      throw new UnauthorizedError('Invalid refresh token');
    }
  }
  
  /**
   * Revoke a token (add it to the revocation list)
   * 
   * @param token Token to revoke
   */
  async revokeToken(token: string): Promise<void> {
    try {
      const secret = await getJwtSecret();
      
      // Decode token without verifying (we still need the jti)
      const { payload } = await jwtVerify(token, secret, { 
        issuer: TOKEN_ISSUER 
      });
      
      if (!payload.jti) {
        throw new Error('Token does not have a JTI');
      }
      
      // Get expiration time for the token
      const expTimeMs = payload.exp ? payload.exp * 1000 : Date.now() + 3600000;
      const expiresInSeconds = Math.max(0, Math.floor((expTimeMs - Date.now()) / 1000));
      
      // Add token to revoked set with expiration matching the token
      await redisClient.set(
        `${REVOKED_TOKENS_PREFIX}${payload.jti}`, 
        '1', 
        'EX', 
        expiresInSeconds
      );
      
      // If it's a refresh token, potentially revoke the entire family
      if (payload.type === TokenType.REFRESH && payload.familyId) {
        // For higher security (e.g., on password change), you can revoke the entire family
        // await this.revokeTokenFamily(payload.familyId as string);
      }
    } catch (error) {
      logger.error('Error revoking token', { error });
      // Silent failure - don't throw errors on revocation attempts
    }
  }
  
  /**
   * Revoke all tokens in a family
   * 
   * @param familyId Token family ID
   */
  async revokeTokenFamily(familyId: string): Promise<void> {
    try {
      // Get all tokens in the family
      const tokenIds = await redisClient.smembers(`${TOKEN_FAMILY_PREFIX}${familyId}`);
      
      // Add each token to the revoked list
      for (const jti of tokenIds) {
        await redisClient.set(`${REVOKED_TOKENS_PREFIX}${jti}`, '1', 'EX', 7 * 24 * 60 * 60);
      }
      
      // Remove the family set
      await redisClient.del(`${TOKEN_FAMILY_PREFIX}${familyId}`);
    } catch (error) {
      logger.error('Error revoking token family', { familyId, error });
      // Silent failure - don't throw errors on revocation attempts
    }
  }
  
  /**
   * Check if a token has been revoked
   * 
   * @param token JWT token to check
   * @returns True if token is revoked
   */
  async isTokenRevoked(token: string): Promise<boolean> {
    try {
      const secret = await getJwtSecret();
      
      // Decode token without verifying (we still need the jti)
      const { payload } = await jwtVerify(token, secret, { 
        issuer: TOKEN_ISSUER 
      });
      
      if (!payload.jti) {
        return true; // No JTI means we can't verify if it's revoked, so fail safe
      }
      
      // Check if token is in revocation list
      const revoked = await redisClient.exists(`${REVOKED_TOKENS_PREFIX}${payload.jti}`);
      
      return revoked === 1;
    } catch (error) {
      logger.error('Error checking if token is revoked', { error });
      return true; // If we can't verify, assume it's revoked (fail safe)
    }
  }
  
  /**
   * Extract token from HTTP Authorization header
   * 
   * @param authorization Authorization header value
   * @returns JWT token or null if invalid
   */
  extractToken(authorization?: string): string | null {
    if (!authorization) {
      return null;
    }
    
    const parts = authorization.split(' ');
    
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return null;
    }
    
    return parts[1];
  }
}

// Export singleton instance
export const tokenService = new TokenService();
