/**
 * Email Verification Service
 * 
 * Handles email verification flows for user accounts
 */
import { verificationTokenService } from './token-service';
import { logger } from '../../lib/logger';
import { UserRepository } from '../../repositories/user-repository';
import { ValidationError, NotFoundError } from '../../errors';
import { env } from '../../config/environment';
import { emailService } from '../../lib/email';

/**
 * Email verification service
 */
export class EmailVerificationService {
  constructor(private userRepository: UserRepository) {}
  
  /**
   * Send email verification link to user
   */
  async sendVerificationEmail(userId: string, email: string): Promise<boolean> {
    try {
      // Get user
      const user = await this.userRepository.findById(userId);
      
      if (!user) {
        throw new NotFoundError('User', userId);
      }
      
      // Create verification token
      const token = await verificationTokenService.createToken(userId, 'email', { email });
      
      // Create verification link
      const verificationLink = `${env.FRONTEND_URL}/auth/verify-email?token=${token}`;
      
      // Send email
      await emailService.sendEmail({
        to: email,
        subject: 'Verify your email address',
        template: 'email-verification',
        variables: {
          display_name: user.display_name,
          verification_link: verificationLink,
          expires_in_hours: 24, // Match token expiry in token service
        }
      });
      
      logger.info('Verification email sent', { userId, email });
      return true;
    } catch (error) {
      logger.error('Error sending verification email', { error, userId, email });
      return false;
    }
  }
  
  /**
   * Verify email with token
   */
  async verifyEmail(token: string): Promise<boolean> {
    try {
      // Verify token
      const tokenRecord = await verificationTokenService.verifyToken(token);
      
      if (!tokenRecord) {
        throw new ValidationError('Invalid or expired verification token');
      }
      
      const userId = tokenRecord.userId;
      const email = tokenRecord.metadata?.email;
      
      if (!email) {
        throw new ValidationError('Invalid verification token - missing email');
      }
      
      // Get user
      const user = await this.userRepository.findById(userId);
      
      if (!user) {
        throw new NotFoundError('User', userId);
      }
      
      // Verify the email
      if (user.email !== email) {
        throw new ValidationError('Email mismatch');
      }
      
      // Mark email as verified
      await this.userRepository.updateUser(userId, { 
        email_verified: true 
      });
      
      // Mark token as used
      await verificationTokenService.markTokenAsUsed(token);
      
      // Log success
      logger.info('Email verified successfully', { userId, email });
      
      return true;
    } catch (error) {
      logger.error('Error verifying email', { error });
      throw error;
    }
  }
  
  /**
   * Request email change
   */
  async requestEmailChange(userId: string, newEmail: string): Promise<boolean> {
    try {
      // Get user
      const user = await this.userRepository.findById(userId);
      
      if (!user) {
        throw new NotFoundError('User', userId);
      }
      
      // Check if email is already in use
      const existingUser = await this.userRepository.findByEmail(newEmail);
      
      if (existingUser && existingUser.id !== userId) {
        throw new ValidationError('Email already in use by another account');
      }
      
      // Create verification token
      const token = await verificationTokenService.createToken(userId, 'email-change', { 
        new_email: newEmail,
        old_email: user.email
      });
      
      // Create verification link
      const verificationLink = `${env.FRONTEND_URL}/auth/verify-email-change?token=${token}`;
      
      // Send email to new address
      await emailService.sendEmail({
        to: newEmail,
        subject: 'Verify your new email address',
        template: 'email-change-verification',
        variables: {
          display_name: user.display_name,
          verification_link: verificationLink,
          expires_in_hours: 24, // Match token expiry in token service
        }
      });
      
      // Send notification to old address
      await emailService.sendEmail({
        to: user.email,
        subject: 'Your email address is being changed',
        template: 'email-change-notification',
        variables: {
          display_name: user.display_name,
          new_email: newEmail,
          support_email: env.SUPPORT_EMAIL || 'support@example.com',
        }
      });
      
      logger.info('Email change verification sent', { userId, newEmail });
      return true;
    } catch (error) {
      logger.error('Error requesting email change', { error, userId, newEmail });
      return false;
    }
  }
  
  /**
   * Verify email change with token
   */
  async verifyEmailChange(token: string): Promise<boolean> {
    try {
      // Verify token
      const tokenRecord = await verificationTokenService.verifyToken(token);
      
      if (!tokenRecord) {
        throw new ValidationError('Invalid or expired verification token');
      }
      
      const userId = tokenRecord.userId;
      const newEmail = tokenRecord.metadata?.new_email;
      
      if (!newEmail) {
        throw new ValidationError('Invalid verification token - missing new email');
      }
      
      // Get user
      const user = await this.userRepository.findById(userId);
      
      if (!user) {
        throw new NotFoundError('User', userId);
      }
      
      // Check if email is already in use
      const existingUser = await this.userRepository.findByEmail(newEmail);
      
      if (existingUser && existingUser.id !== userId) {
        throw new ValidationError('Email already in use by another account');
      }
      
      // Update email
      await this.userRepository.updateUser(userId, { 
        email: newEmail,
        email_verified: true 
      });
      
      // Mark token as used
      await verificationTokenService.markTokenAsUsed(token);
      
      // Log success
      logger.info('Email changed successfully', { userId, newEmail });
      
      return true;
    } catch (error) {
      logger.error('Error verifying email change', { error });
      throw error;
    }
  }
}

// Export singleton instance - will be initialized with dependencies later
export const emailVerificationService = {} as EmailVerificationService;
