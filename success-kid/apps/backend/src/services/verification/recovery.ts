import crypto from 'crypto';
import { redisClient } from '../../lib/redis-client';
import { verifyToken, VerificationType } from './tokens';
import { logger } from '../../lib/logger';

/**
 * Generate backup recovery codes for account access
 * 
 * @param userId User ID
 * @param count Number of codes to generate (default: 10)
 * @returns Array of recovery codes
 */
export async function generateRecoveryCodes(userId: string, count: number = 10): Promise<string[]> {
  try {
    // Generate recovery codes (format: XXXX-XXXX-XXXX)
    const codes: string[] = [];
    
    for (let i = 0; i < count; i++) {
      const segments = [
        crypto.randomBytes(2).toString('hex').toUpperCase(),
        crypto.randomBytes(2).toString('hex').toUpperCase(),
        crypto.randomBytes(2).toString('hex').toUpperCase()
      ];
      
      codes.push(segments.join('-'));
    }
    
    // Hash codes for storage
    const hashedCodes = codes.map(code => hashRecoveryCode(code));
    
    // Store hashed codes in Redis
    await redisClient.del(`user:${userId}:recovery_codes`);
    
    if (hashedCodes.length > 0) {
      await redisClient.sadd(`user:${userId}:recovery_codes`, ...hashedCodes);
    }
    
    return codes;
  } catch (error) {
    logger.error('Error generating recovery codes', { userId, error });
    throw error;
  }
}

/**
 * Verify a recovery code for a user
 * 
 * @param userId User ID
 * @param code Recovery code to verify
 * @returns Whether the code is valid
 */
export async function verifyRecoveryCode(userId: string, code: string): Promise<boolean> {
  try {
    // Normalize code format
    const normalizedCode = code.toUpperCase().replace(/\s/g, '');
    
    // Hash code
    const hashedCode = hashRecoveryCode(normalizedCode);
    
    // Check if code exists in user's recovery codes
    const isMember = await redisClient.client.sismember(
      `user:${userId}:recovery_codes`,
      hashedCode
    );
    
    if (isMember) {
      // Remove used code
      await redisClient.srem(`user:${userId}:recovery_codes`, hashedCode);
      return true;
    }
    
    return false;
  } catch (error) {
    logger.error('Error verifying recovery code', { userId, error });
    return false;
  }
}

/**
 * Hash a recovery code for secure storage
 * 
 * @param code Recovery code
 * @returns Hashed code
 */
function hashRecoveryCode(code: string): string {
  return crypto
    .createHash('sha256')
    .update(code)
    .digest('hex');
}

/**
 * Process account recovery using a verification token
 * 
 * @param token Recovery token
 * @returns User ID if valid, null otherwise
 */
export async function processAccountRecovery(token: string): Promise<string | null> {
  try {
    const tokenData = await verifyToken(token);
    
    if (!tokenData || tokenData.type !== VerificationType.ACCOUNT_RECOVERY) {
      return null;
    }
    
    // In a real app, implement recovery logic here
    // For now, just return the user ID
    
    return tokenData.userId;
  } catch (error) {
    logger.error('Error processing account recovery', { token, error });
    return null;
  }
}

/**
 * Process password reset using a verification token
 * 
 * @param token Reset token
 * @param newPassword New password
 * @returns User ID if successful, null otherwise
 */
export async function processPasswordReset(token: string, newPassword: string): Promise<string | null> {
  try {
    const tokenData = await verifyToken(token);
    
    if (!tokenData || tokenData.type !== VerificationType.PASSWORD_RESET) {
      return null;
    }
    
    // In a real app, update the user's password in the database
    // For now, just return the user ID
    
    return tokenData.userId;
  } catch (error) {
    logger.error('Error processing password reset', { token, error });
    return null;
  }
}
