import crypto from 'crypto';
import { redisClient } from '../../lib/redis-client';
import { logger } from '../../lib/logger';

/**
 * Verification token types
 */
export enum VerificationType {
  EMAIL_VERIFICATION = 'email_verification',
  PASSWORD_RESET = 'password_reset',
  ACCOUNT_RECOVERY = 'account_recovery',
  EMAIL_CHANGE = 'email_change',
  MFA_SETUP = 'mfa_setup'
}

/**
 * Verification token data
 */
export interface VerificationToken {
  token: string;
  userId: string;
  type: VerificationType;
  data?: Record<string, any>;
  expiresAt: Date;
}

/**
 * Default expiration times (minutes) for different token types
 */
const DEFAULT_EXPIRATION: Record<VerificationType, number> = {
  [VerificationType.EMAIL_VERIFICATION]: 1440, // 24 hours
  [VerificationType.PASSWORD_RESET]: 30,       // 30 minutes
  [VerificationType.ACCOUNT_RECOVERY]: 30,     // 30 minutes
  [VerificationType.EMAIL_CHANGE]: 30,         // 30 minutes
  [VerificationType.MFA_SETUP]: 15,            // 15 minutes
};

/**
 * Generate a secure random token
 */
function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Create a verification token
 */
export async function createToken(
  userId: string,
  type: VerificationType,
  data?: Record<string, any>,
  expiresInMinutes?: number
): Promise<string> {
  try {
    // Generate unique token
    const token = generateToken();
    
    // Use default expiration time if not specified
    const expiration = expiresInMinutes || DEFAULT_EXPIRATION[type];
    const expiresAt = new Date(Date.now() + expiration * 60 * 1000);
    
    // Store token in Redis
    const tokenData: VerificationToken = {
      token,
      userId,
      type,
      data,
      expiresAt
    };
    
    await redisClient.set(
      `token:${token}`,
      JSON.stringify(tokenData),
      expiration * 60 // Convert minutes to seconds
    );
    
    // Store reference by user ID and type for invalidation
    await redisClient.set(
      `user:${userId}:token:${type}`,
      token,
      expiration * 60
    );
    
    return token;
  } catch (error) {
    logger.error('Error creating verification token', { userId, type, error });
    throw error;
  }
}

/**
 * Verify and consume a token
 * Returns token data if valid, null otherwise
 * Automatically deletes the token after verification
 */
export async function verifyToken(token: string): Promise<VerificationToken | null> {
  try {
    const tokenJson = await redisClient.get(`token:${token}`);
    
    if (!tokenJson) {
      return null;
    }
    
    const tokenData = JSON.parse(tokenJson) as VerificationToken;
    
    // Check if token has expired
    if (new Date(tokenData.expiresAt) < new Date()) {
      await invalidateToken(token);
      return null;
    }
    
    // Delete token to prevent reuse
    await invalidateToken(token);
    
    return tokenData;
  } catch (error) {
    logger.error('Error verifying token', { token, error });
    return null;
  }
}

/**
 * Invalidate a token
 */
export async function invalidateToken(token: string): Promise<void> {
  try {
    const tokenJson = await redisClient.get(`token:${token}`);
    
    if (tokenJson) {
      const tokenData = JSON.parse(tokenJson) as VerificationToken;
      
      // Delete token
      await redisClient.del(`token:${token}`);
      
      // Delete user reference
      await redisClient.del(`user:${tokenData.userId}:token:${tokenData.type}`);
    }
  } catch (error) {
    logger.error('Error invalidating token', { token, error });
  }
}

/**
 * Invalidate all tokens of a specific type for a user
 */
export async function invalidateUserTokensByType(userId: string, type: VerificationType): Promise<void> {
  try {
    const token = await redisClient.get(`user:${userId}:token:${type}`);
    
    if (token) {
      await redisClient.del(`token:${token}`);
      await redisClient.del(`user:${userId}:token:${type}`);
    }
  } catch (error) {
    logger.error('Error invalidating user tokens', { userId, type, error });
  }
}
