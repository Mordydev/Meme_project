/**
 * Verification Token Service
 * 
 * Handles token generation and verification for email verification,
 * password reset, and account recovery flows
 */
import crypto from 'crypto';
import { redis, redisHelpers } from '../../lib/redis';
import { logger } from '../../lib/logger';
import { env } from '../../config/environment';

// Token types
export type VerificationType = 'email' | 'password-reset' | 'account-recovery' | 'email-change';

// Token expiration times in seconds
const TOKEN_EXPIRY = {
  'email': 24 * 60 * 60, // 24 hours
  'password-reset': 1 * 60 * 60, // 1 hour
  'account-recovery': 30 * 60, // 30 minutes
  'email-change': 24 * 60 * 60, // 24 hours
};

// Verification token model
export interface VerificationToken {
  token: string;
  userId: string;
  type: VerificationType;
  createdAt: Date;
  expiresAt: Date;
  usedAt?: Date;
  metadata?: Record<string, any>;
}

/**
 * Verification token service for managing tokens
 */
export class VerificationTokenService {
  /**
   * Create a new verification token
   */
  async createToken(
    userId: string,
    type: VerificationType,
    metadata?: Record<string, any>
  ): Promise<string> {
    try {
      // Generate secure random token
      const randomToken = crypto.randomBytes(32).toString('hex');
      
      // Hash the token for storage (we'll verify against the hash)
      const tokenHash = this.hashToken(randomToken);
      
      // Get token expiration time
      const expirationSeconds = TOKEN_EXPIRY[type] || TOKEN_EXPIRY['email'];
      const now = new Date();
      const expiresAt = new Date(now.getTime() + expirationSeconds * 1000);
      
      // Create token record
      const tokenRecord: VerificationToken = {
        token: tokenHash,
        userId,
        type,
        createdAt: now,
        expiresAt,
        metadata
      };
      
      // Store token in Redis with expiration
      const key = `verification:${tokenHash}`;
      await redisHelpers.setJson(key, tokenRecord, expirationSeconds);
      
      // Invalidate any previous tokens of the same type for this user
      await this.invalidatePreviousTokens(userId, type);
      
      // Return the original token (not the hash) to be sent to the user
      return randomToken;
    } catch (error) {
      logger.error('Error creating verification token', { error, userId, type });
      throw error;
    }
  }
  
  /**
   * Verify a token
   */
  async verifyToken(token: string): Promise<VerificationToken | null> {
    try {
      // Hash the token to find it in storage
      const tokenHash = this.hashToken(token);
      const key = `verification:${tokenHash}`;
      
      // Get token from Redis
      const tokenRecord = await redisHelpers.getJson<VerificationToken>(key);
      
      if (!tokenRecord) {
        return null;
      }
      
      // Check if token is expired
      if (new Date() > new Date(tokenRecord.expiresAt)) {
        // Automatically clean up expired token
        await redis.del(key);
        return null;
      }
      
      // Check if token has been used
      if (tokenRecord.usedAt) {
        return null;
      }
      
      return tokenRecord;
    } catch (error) {
      logger.error('Error verifying token', { error });
      return null;
    }
  }
  
  /**
   * Mark a token as used
   */
  async markTokenAsUsed(token: string): Promise<boolean> {
    try {
      // Hash the token to find it in storage
      const tokenHash = this.hashToken(token);
      const key = `verification:${tokenHash}`;
      
      // Get token from Redis
      const tokenRecord = await redisHelpers.getJson<VerificationToken>(key);
      
      if (!tokenRecord) {
        return false;
      }
      
      // Check if token is expired
      if (new Date() > new Date(tokenRecord.expiresAt)) {
        await redis.del(key);
        return false;
      }
      
      // Check if token has already been used
      if (tokenRecord.usedAt) {
        return false;
      }
      
      // Mark token as used
      tokenRecord.usedAt = new Date();
      
      // Update token in Redis
      const expiresIn = Math.floor(
        (new Date(tokenRecord.expiresAt).getTime() - Date.now()) / 1000
      );
      
      if (expiresIn > 0) {
        await redisHelpers.setJson(key, tokenRecord, expiresIn);
      } else {
        await redis.del(key);
      }
      
      return true;
    } catch (error) {
      logger.error('Error marking token as used', { error });
      return false;
    }
  }
  
  /**
   * Get all active tokens for a user by type
   */
  async getUserTokensByType(userId: string, type: VerificationType): Promise<VerificationToken[]> {
    try {
      // Get all verification tokens
      const keys = await redis.keys(`verification:*`);
      const tokens: VerificationToken[] = [];
      
      // Check each token
      for (const key of keys) {
        const token = await redisHelpers.getJson<VerificationToken>(key);
        
        if (token && token.userId === userId && token.type === type && !token.usedAt) {
          tokens.push(token);
        }
      }
      
      return tokens;
    } catch (error) {
      logger.error('Error getting user tokens', { error, userId, type });
      return [];
    }
  }
  
  /**
   * Invalidate all previous tokens of the same type for a user
   */
  private async invalidatePreviousTokens(userId: string, type: VerificationType): Promise<void> {
    try {
      const tokens = await this.getUserTokensByType(userId, type);
      
      // Mark all tokens as used
      for (const token of tokens) {
        const key = `verification:${token.token}`;
        token.usedAt = new Date();
        
        // Update or remove token
        const expiresIn = Math.floor(
          (new Date(token.expiresAt).getTime() - Date.now()) / 1000
        );
        
        if (expiresIn > 0) {
          await redisHelpers.setJson(key, token, expiresIn);
        } else {
          await redis.del(key);
        }
      }
    } catch (error) {
      logger.error('Error invalidating previous tokens', { error, userId, type });
      // Non-critical error, don't throw
    }
  }
  
  /**
   * Hash a token for secure storage
   */
  private hashToken(token: string): string {
    return crypto
      .createHmac('sha256', env.TOKEN_SECRET || 'token-secret')
      .update(token)
      .digest('hex');
  }
}

// Export singleton instance
export const verificationTokenService = new VerificationTokenService();
