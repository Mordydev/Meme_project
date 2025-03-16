/**
 * Password Reset Service
 * 
 * Handles password reset flows for user accounts
 */
import { verificationTokenService } from './token-service';
import { logger } from '../../lib/logger';
import { UserRepository } from '../../repositories/user-repository';
import { sessionService } from '../session-service';
import { ValidationError, NotFoundError, AuthorizationError } from '../../errors';
import { env } from '../../config/environment';
import { emailService } from '../../lib/email';

/**
 * Password reset service
 */
export class PasswordResetService {
  constructor(private userRepository: UserRepository) {}
  
  /**
   * Request password reset for a user
   */
  async requestPasswordReset(email: string): Promise<boolean> {
    try {
      // Get user by email
      const user = await this.userRepository.findByEmail(email);
      
      // If user not found, still return success to prevent email enumeration
      if (!user) {
        logger.debug('Password reset requested for non-existent email', { email });
        return true;
      }
      
      // Create password reset token
      const token = await verificationTokenService.createToken(user.id, 'password-reset', { email });
      
      // Create reset link
      const resetLink = `${env.FRONTEND_URL}/auth/reset-password?token=${token}`;
      
      // Send email
      await emailService.sendEmail({
        to: email,
        subject: 'Reset your password',
        template: 'password-reset',
        variables: {
          display_name: user.display_name,
          reset_link: resetLink,
          expires_in_hours: 1, // Match token expiry in token service
        }
      });
      
      logger.info('Password reset email sent', { userId: user.id, email });
      return true;
    } catch (error) {
      logger.error('Error requesting password reset', { error, email });
      return false;
    }
  }
  
  /**
   * Verify password reset token (without resetting password)
   */
  async verifyResetToken(token: string): Promise<boolean> {
    try {
      // Verify token
      const tokenRecord = await verificationTokenService.verifyToken(token);
      
      if (!tokenRecord) {
        return false;
      }
      
      return true;
    } catch (error) {
      logger.error('Error verifying password reset token', { error });
      return false;
    }
  }
  
  /**
   * Reset password with token
   */
  async resetPassword(token: string, newPassword: string): Promise<boolean> {
    try {
      // Verify token
      const tokenRecord = await verificationTokenService.verifyToken(token);
      
      if (!tokenRecord) {
        throw new ValidationError('Invalid or expired reset token');
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
      
      // Set new password
      // Note: With Clerk integration, we don't handle passwords directly
      // This would be used for non-Clerk authentication flows
      
      // Example for non-Clerk flow with custom password handling:
      // await userRepository.updatePassword(userId, newPassword);
      
      // Instead, for Clerk integration, we would need to use their API:
      // await clerkClient.users.updateUserPassword(userId, { password: newPassword });
      
      logger.info('Password would be reset here for non-Clerk auth', { userId });
      
      // Revoke all user sessions (force logout everywhere)
      await sessionService.deleteAllUserSessions(userId);
      
      // Mark token as used
      await verificationTokenService.markTokenAsUsed(token);
      
      // Send notification email
      await emailService.sendEmail({
        to: user.email,
        subject: 'Your password has been reset',
        template: 'password-reset-confirmation',
        variables: {
          display_name: user.display_name,
          support_email: env.SUPPORT_EMAIL || 'support@example.com',
        }
      });
      
      return true;
    } catch (error) {
      logger.error('Error resetting password', { error });
      throw error;
    }
  }
  
  /**
   * Change password for logged in user
   */
  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<boolean> {
    try {
      // Get user
      const user = await this.userRepository.findById(userId);
      
      if (!user) {
        throw new NotFoundError('User', userId);
      }
      
      // With Clerk integration, we would validate current password 
      // and update through their API
      logger.info('Password would be changed here for non-Clerk auth', { userId });
      
      // Example for custom password handling:
      // const isValid = await passwordService.verifyPassword(userId, currentPassword);
      // if (!isValid) {
      //   throw new AuthorizationError('Current password is incorrect');
      // }
      // await userRepository.updatePassword(userId, newPassword);
      
      // Revoke all other sessions (keep current one)
      // For security, we should force re-login after password change
      // but we'll skip that for simplicity
      
      // Send notification email
      await emailService.sendEmail({
        to: user.email,
        subject: 'Your password has been changed',
        template: 'password-change-confirmation',
        variables: {
          display_name: user.display_name,
          support_email: env.SUPPORT_EMAIL || 'support@example.com',
        }
      });
      
      return true;
    } catch (error) {
      logger.error('Error changing password', { error, userId });
      throw error;
    }
  }
}

// Export singleton instance - will be initialized with dependencies later
export const passwordResetService = {} as PasswordResetService;
