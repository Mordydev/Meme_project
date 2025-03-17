/**
 * Email Notification Channel
 * 
 * Handles sending notifications via email.
 */
import * as nodemailer from 'nodemailer';
import { logger } from '../../lib/logger';
import { Notification, DeliveryResult } from '../models';
import { env } from '../../config';

/**
 * Configuration for email sending
 */
export interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
  from: string;
}

/**
 * Email notification channel class
 */
export class EmailChannel {
  private transporter: nodemailer.Transporter;
  private config: EmailConfig;
  private enabled: boolean;

  /**
   * Create a new email channel instance
   */
  constructor() {
    // Configure from environment variables
    this.config = {
      host: env.EMAIL_HOST || '',
      port: parseInt(env.EMAIL_PORT || '587', 10),
      secure: env.EMAIL_SECURE === 'true',
      auth: {
        user: env.EMAIL_USER || '',
        pass: env.EMAIL_PASSWORD || '',
      },
      from: env.EMAIL_FROM || 'notifications@successkid.com',
    };
    
    // Check if email is configured
    this.enabled = !!(
      this.config.host &&
      this.config.port &&
      this.config.auth.user &&
      this.config.auth.pass
    );
    
    // Initialize email transporter if enabled
    if (this.enabled) {
      this.transporter = nodemailer.createTransport(this.config);
      logger.info('Email notification channel initialized');
    } else {
      logger.warn('Email notification channel disabled due to missing configuration');
    }
  }

  /**
   * Send an email notification to a user
   * 
   * @param userId User ID to send notification to
   * @param content Rendered notification content
   * @param notification Original notification object
   * @returns Delivery result
   */
  async send(
    userId: string,
    content: { title: string; body: string; html?: string; text?: string; data?: any },
    notification: Notification
  ): Promise<DeliveryResult> {
    // Skip if email channel is not configured
    if (!this.enabled) {
      return {
        channel: 'email',
        success: false,
        timestamp: new Date(),
        error: 'Email channel not configured',
        retryCount: 0
      };
    }
    
    try {
      // Get user's email (this would come from your user service)
      const userEmail = await this.getUserEmail(userId);
      
      if (!userEmail) {
        return {
          channel: 'email',
          success: false,
          timestamp: new Date(),
          error: 'User email not found',
          retryCount: 0
        };
      }
      
      // Prepare email data
      const emailData = {
        from: this.config.from,
        to: userEmail,
        subject: content.title,
        text: content.text || content.body, // Plain text alternative
        html: content.html || `<p>${content.body}</p>` // HTML body
      };
      
      // Send email
      const result = await this.transporter.sendMail(emailData);
      
      logger.debug('Email notification sent', { 
        userId, 
        notificationId: notification.id,
        messageId: result.messageId
      });
      
      return {
        channel: 'email',
        success: true,
        messageId: result.messageId,
        timestamp: new Date(),
        retryCount: 0
      };
    } catch (error) {
      logger.error('Failed to send email notification', { 
        error, 
        userId, 
        notificationId: notification.id 
      });
      
      return {
        channel: 'email',
        success: false,
        timestamp: new Date(),
        error: error.message || 'Failed to send email notification',
        retryCount: 0
      };
    }
  }

  /**
   * Get user's email address (placeholder)
   * 
   * @param userId User ID
   * @returns Email address or null if not found
   */
  private async getUserEmail(userId: string): Promise<string | null> {
    // In a real implementation, this would query your user service
    // For now, we'll use a placeholder implementation
    try {
      // Example query to user database
      // const user = await db.query('SELECT email FROM users WHERE id = $1', [userId]);
      // return user?.rows[0]?.email || null;
      
      // Placeholder for development
      return `user-${userId}@example.com`;
    } catch (error) {
      logger.error('Failed to get user email', { error, userId });
      return null;
    }
  }
}

// Export singleton instance
export const emailChannel = new EmailChannel();
