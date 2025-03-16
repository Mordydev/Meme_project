/**
 * Verification Token Service
 * 
 * Manages tokens for email verification, password reset, etc.
 */
import { randomBytes } from 'crypto';
import { db } from '../../lib/db';
import { logger } from '../../lib/logger';
import { redis } from '../../lib/redis';

/**
 * Verification token types
 */
export enum VerificationType {
  EMAIL_VERIFICATION = 'email_verification',
  PASSWORD_RESET = 'password_reset',
  ACCOUNT_RECOVERY = 'account_recovery',
  EMAIL_CHANGE = 'email_change',
  MFA_BACKUP = 'mfa_backup',
}

/**
 * Verification token interface
 */
export interface VerificationToken {
  token: string;
  userId: string;
  type: VerificationType;
  expiresAt: Date;
  usedAt?: Date;
  data?: Record<string, any>;
}

/**
 * Token expiration times in minutes
 */
const TOKEN_EXPIRATION = {
  [VerificationType.EMAIL_VERIFICATION]: 60 * 24, // 24 hours
  [VerificationType.PASSWORD_RESET]: 15, // 15 minutes
  [VerificationType.ACCOUNT_RECOVERY]: 30, // 30 minutes
  [VerificationType.EMAIL_CHANGE]: 15, // 15 minutes
  [VerificationType.MFA_BACKUP]: 60 * 24 * 365, // 1 year
};

/**
 * Maximum allowed attempts for token validation
 */
const MAX_VALIDATION_ATTEMPTS = 5;

/**
 * Token validation attempt tracker key prefix
 */
const VALIDATION_ATTEMPT_PREFIX = 'token:attempts:';

/**
 * Cooldown period after max attempts (in seconds)
 */
const VALIDATION_COOLDOWN = 60 * 15; // 15 minutes

/**
 * Generate a secure random token
 */
function generateToken(length: number = 32): string {
  return randomBytes(length).toString('hex');
}

/**
 * Create a verification token
 */
export async function createVerificationToken(
  userId: string,
  type: VerificationType,
  data?: Record<string, any>
): Promise<string> {
  try {
    const token = generateToken();
    const expirationMinutes = TOKEN_EXPIRATION[type] || 60; // Default 1 hour
    const expiresAt = new Date(Date.now() + expirationMinutes * 60 * 1000);
    
    // For short-lived tokens, store in Redis for better performance
    if (expirationMinutes <= 60) {
      const tokenData: VerificationToken = {
        token,
        userId,
        type,
        expiresAt,
        data
      };
      
      await redis.setex(
        `token:${token}`,
        expirationMinutes * 60,
        JSON.stringify(tokenData)
      );
    } else {
      // For longer-lived tokens, store in database
      await db.query(
        `INSERT INTO verification_tokens
         (token, user_id, type, expires_at, data)
         VALUES ($1, $2, $3, $4, $5)`,
        [token, userId, type, expiresAt, JSON.stringify(data || {})]
      );
    }
    
    return token;
  } catch (error) {
    logger.error('Error creating verification token', { error, userId, type });
    throw error;
  }
}

/**
 * Get a verification token
 */
export async function getVerificationToken(token: string): Promise<VerificationToken | null> {
  try {
    // Check Redis first
    const redisToken = await redis.get(`token:${token}`);
    
    if (redisToken) {
      return JSON.parse(redisToken) as VerificationToken;
    }
    
    // If not in Redis, check database
    const result = await db.query<VerificationToken>(
      `SELECT * FROM verification_tokens WHERE token = $1 AND used_at IS NULL`,
      [token]
    );
    
    return result.rows[0] || null;
  } catch (error) {
    logger.error('Error getting verification token', { error, token });
    return null;
  }
}

/**
 * Validate a verification token
 */
export async function validateVerificationToken(
  token: string,
  type: VerificationType
): Promise<{ valid: boolean; userId?: string; data?: Record<string, any> }> {
  try {
    // Check if token is in cooldown period
    const cooldownKey = `${VALIDATION_ATTEMPT_PREFIX}cooldown:${token}`;
    const inCooldown = await redis.exists(cooldownKey);
    
    if (inCooldown) {
      return { valid: false };
    }
    
    // Track validation attempt
    const attemptsKey = `${VALIDATION_ATTEMPT_PREFIX}${token}`;
    const attempts = await redis.incr(attemptsKey);
    
    // Set expiration for attempts tracking if first attempt
    if (attempts === 1) {
      await redis.expire(attemptsKey, 60 * 60); // 1 hour
    }
    
    // Check if max attempts exceeded
    if (attempts > MAX_VALIDATION_ATTEMPTS) {
      // Set cooldown period
      await redis.setex(cooldownKey, VALIDATION_COOLDOWN, '1');
      return { valid: false };
    }
    
    // Get token
    const tokenData = await getVerificationToken(token);
    
    if (!tokenData) {
      return { valid: false };
    }
    
    // Check token type
    if (tokenData.type !== type) {
      return { valid: false };
    }
    
    // Check if token is expired
    if (new Date() > new Date(tokenData.expiresAt)) {
      return { valid: false };
    }
    
    // Token is valid
    return { 
      valid: true, 
      userId: tokenData.userId,
      data: tokenData.data
    };
  } catch (error) {
    logger.error('Error validating verification token', { error, token, type });
    return { valid: false };
  }
}

/**
 * Mark a verification token as used
 */
export async function useVerificationToken(
  token: string,
  type: VerificationType
): Promise<boolean> {
  try {
    // Validate token first
    const validation = await validateVerificationToken(token, type);
    
    if (!validation.valid) {
      return false;
    }
    
    // Check if token is in Redis
    const redisToken = await redis.get(`token:${token}`);
    
    if (redisToken) {
      // For Redis-stored tokens, just delete them
      await redis.del(`token:${token}`);
      return true;
    }
    
    // For database tokens, mark as used
    const result = await db.query(
      `UPDATE verification_tokens 
       SET used_at = NOW() 
       WHERE token = $1 AND type = $2 AND used_at IS NULL
       RETURNING *`,
      [token, type]
    );
    
    return result.rowCount > 0;
  } catch (error) {
    logger.error('Error using verification token', { error, token, type });
    return false;
  }
}

/**
 * Generate backup codes for MFA
 */
export async function generateMfaBackupCodes(userId: string): Promise<string[]> {
  try {
    // Generate 10 backup codes
    const codes: string[] = [];
    for (let i = 0; i < 10; i++) {
      // Generate 8-character code
      codes.push(generateToken(4).substring(0, 8).toUpperCase());
    }
    
    // Store codes as verification tokens
    for (const code of codes) {
      await createVerificationToken(userId, VerificationType.MFA_BACKUP, { code });
    }
    
    return codes;
  } catch (error) {
    logger.error('Error generating MFA backup codes', { error, userId });
    throw error;
  }
}

/**
 * Validate MFA backup code
 */
export async function validateMfaBackupCode(
  userId: string,
  code: string
): Promise<boolean> {
  try {
    // Get all backup codes for user
    const result = await db.query<VerificationToken>(
      `SELECT * FROM verification_tokens 
       WHERE user_id = $1 AND type = $2 AND used_at IS NULL`,
      [userId, VerificationType.MFA_BACKUP]
    );
    
    // Find matching code
    const matchingToken = result.rows.find(
      token => token.data?.code === code.toUpperCase()
    );
    
    if (!matchingToken) {
      return false;
    }
    
    // Mark code as used
    await useVerificationToken(matchingToken.token, VerificationType.MFA_BACKUP);
    
    return true;
  } catch (error) {
    logger.error('Error validating MFA backup code', { error, userId });
    return false;
  }
}
