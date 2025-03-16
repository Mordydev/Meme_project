/**
 * Account Recovery Service
 * 
 * Handles account recovery flows beyond password reset
 */
import { randomBytes } from 'crypto';
import { verificationTokenService } from './token-service';
import { logger } from '../../lib/logger';
import { UserRepository } from '../../repositories/user-repository';
import { sessionService } from '../session-service';
import { ValidationError, NotFoundError } from '../../errors';
import { env } from '../../config/environment';
import { emailService } from '../../lib/email';
import { redis, redisHelpers } from '../../lib/redis';

/**
 * Backup code for account recovery
 */
interface BackupCode {
  code: string;
  userId: string;
  created_at: Date;
  used_at?: Date;
}

/**
 * Account recovery service
 */
export class AccountRecoveryService {
  constructor(private userRepository: UserRepository) {}
  
  /**
   * Generate backup codes for a user
   */
  async generateBackupCodes(userId: string, count: number = 10): Promise<string[]> {
    try {
      // Get user
      const user = await this.userRepository.findById(userId);
      
      if (!user) {
        throw new NotFoundError('User', userId);
      }
      
      // Generate codes
      const codes: string[] = [];
      
      for (let i = 0; i < count; i++) {
        // Generate a readable backup code (e.g., XXXX-XXXX-XXXX)
        const code = this.generateBackupCode();
        codes.push(code);
        
        // Store code in Redis
        await this.storeBackupCode(userId, code);
      }
      
      // Send email with backup codes
      await emailService.sendEmail({
        to: user.email,
        subject: 'Your account recovery backup codes',
        template: 'backup-codes',
        variables: {
          display_name: user.display_name,
          backup_codes: codes,
          support_email: env.SUPPORT_EMAIL || 'support@example.com',
        }
      });
      
      return codes;
    } catch (error) {
      logger.error('Error generating backup codes', { error, userId });
      throw error;
    }
  }
  
  /**
   * Validate a backup code
   */
  async validateBackupCode(userId: string, code: string): Promise<boolean> {
    try {
      // Normalize code format
      const normalizedCode = code.replace(/[^A-Z0-9]/g, '').toUpperCase();
      
      // Get code from Redis
      const codeKey = `backup:${normalizedCode}`;
      const backupCode = await redisHelpers.getJson<BackupCode>(codeKey);
      
      if (!backupCode || backupCode.userId !== userId || backupCode.used_at) {
        return false;
      }
      
      // Mark code as used
      backupCode.used_at = new Date();
      await redisHelpers.setJson(codeKey, backupCode);
      
      return true;
    } catch (error) {
      logger.error('Error validating backup code', { error, userId });
      return false;
    }
  }
  
  /**
   * Start account recovery via email
   */
  async initiateRecovery(email: string): Promise<boolean> {
    try {
      // Find user by email
      const user = await this.userRepository.findByEmail(email);
      
      // If user not found, still return success to prevent email enumeration
      if (!user) {
        logger.debug('Recovery requested for non-existent email', { email });
        return true;
      }
      
      // Create recovery token
      const token = await verificationTokenService.createToken(user.id, 'account-recovery', { email });
      
      // Create recovery link
      const recoveryLink = `${env.FRONTEND_URL}/auth/recover-account?token=${token}`;
      
      // Send email
      await emailService.sendEmail({
        to: email,
        subject: 'Recover your account',
        template: 'account-recovery',
        variables: {
          display_name: user.display_name,
          recovery_link: recoveryLink,
          expires_in_minutes: 30, // Match token expiry in token service
          support_email: env.SUPPORT_EMAIL || 'support@example.com',
        }
      });
      
      logger.info('Account recovery email sent', { userId: user.id, email });
      return true;
    } catch (error) {
      logger.error('Error initiating account recovery', { error, email });
      return false;
    }
  }
  
  /**
   * Complete account recovery process
   */
  async completeRecovery(token: string): Promise<{ userId: string; tempAuthToken: string } | null> {
    try {
      // Verify token
      const tokenRecord = await verificationTokenService.verifyToken(token);
      
      if (!tokenRecord) {
        throw new ValidationError('Invalid or expired recovery token');
      }
      
      const userId = tokenRecord.userId;
      const email = tokenRecord.metadata?.email;
      
      // Get user
      const user = await this.userRepository.findById(userId);
      
      if (!user) {
        throw new NotFoundError('User', userId);
      }
      
      // Verify email matches
      if (user.email !== email) {
        throw new ValidationError('Email mismatch');
      }
      
      // Mark token as used
      await verificationTokenService.markTokenAsUsed(token);
      
      // Revoke all existing sessions
      await sessionService.deleteAllUserSessions(userId);
      
      // Create a temporary authentication token
      // This allows the user to set up a new authentication method
      const tempToken = randomBytes(32).toString('hex');
      
      // Store temporary token with short expiration
      await redis.set(`temp:auth:${tempToken}`, userId, 'EX', 15 * 60); // 15 minutes
      
      // Log recovery
      logger.info('Account recovery completed', { userId, email });
      
      // Return user ID and temporary auth token
      return {
        userId,
        tempAuthToken: tempToken
      };
    } catch (error) {
      logger.error('Error completing account recovery', { error });
      return null;
    }
  }
  
  /**
   * Validate temporary auth token from recovery
   */
  async validateTempAuthToken(token: string): Promise<string | null> {
    try {
      // Get user ID from Redis
      const userId = await redis.get(`temp:auth:${token}`);
      
      if (!userId) {
        return null;
      }
      
      // Delete token after use (one-time use)
      await redis.del(`temp:auth:${token}`);
      
      return userId;
    } catch (error) {
      logger.error('Error validating temporary auth token', { error });
      return null;
    }
  }
  
  /**
   * Generate a human-readable backup code
   */
  private generateBackupCode(): string {
    // Format: XXXX-XXXX-XXXX (where X is alphanumeric)
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excluding similar looking characters
    let code = '';
    
    // Generate 12 characters
    for (let i = 0; i < 12; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
      
      // Add hyphens after every 4 characters
      if ((i + 1) % 4 === 0 && i < 11) {
        code += '-';
      }
    }
    
    return code;
  }
  
  /**
   * Store a backup code in Redis
   */
  private async storeBackupCode(userId: string, code: string): Promise<void> {
    // Normalize code format
    const normalizedCode = code.replace(/[^A-Z0-9]/g, '').toUpperCase();
    
    // Create backup code record
    const backupCode: BackupCode = {
      code: normalizedCode,
      userId,
      created_at: new Date()
    };
    
    // Store in Redis (no expiration - backup codes don't expire)
    await redisHelpers.setJson(`backup:${normalizedCode}`, backupCode);
    
    // Add to user's backup codes set
    await redis.sadd(`user:${userId}:backup-codes`, normalizedCode);
  }
}

// Export singleton instance - will be initialized with dependencies later
export const accountRecoveryService = {} as AccountRecoveryService;
