/**
 * Email Verification Service
 * 
 * Handles email verification workflow
 */
import { createVerificationToken, validateVerificationToken, useVerificationToken, VerificationType } from './tokens';
import { db } from '../../lib/db';
import { logger } from '../../lib/logger';
import { sendEmail } from '../../lib/email';
import { env } from '../../config/environment';

/**
 * Email template for verification emails
 */
const EMAIL_VERIFICATION_TEMPLATE = `
<h1>Verify Your Email</h1>
<p>Hello,</p>
<p>Please click the link below to verify your email address:</p>
<p><a href="{{verificationUrl}}">Verify Email</a></p>
<p>This link will expire in 24 hours.</p>
<p>If you did not create an account, please ignore this email.</p>
<p>Thanks,<br>Success Kid Community Platform</p>
`;

/**
 * Email template for password reset emails
 */
const PASSWORD_RESET_TEMPLATE = `
<h1>Reset Your Password</h1>
<p>Hello,</p>
<p>We received a request to reset your password. Click the link below to reset it:</p>
<p><a href="{{resetUrl}}">Reset Password</a></p>
<p>This link will expire in 15 minutes.</p>
<p>If you did not request a password reset, please ignore this email.</p>
<p>Thanks,<br>Success Kid Community Platform</p>
`;

/**
 * Base URL for email verification
 */
const BASE_URL = env.PUBLIC_URL || 'http://localhost:3000';

/**
 * Send email verification
 */
export async function sendEmailVerification(userId: string, email: string): Promise<boolean> {
  try {
    // Create verification token
    const token = await createVerificationToken(userId, VerificationType.EMAIL_VERIFICATION);
    
    // Generate verification URL
    const verificationUrl = `${BASE_URL}/verify-email?token=${token}`;
    
    // Send verification email
    const emailContent = EMAIL_VERIFICATION_TEMPLATE.replace(
      '{{verificationUrl}}',
      verificationUrl
    );
    
    await sendEmail({
      to: email,
      subject: 'Verify Your Email - Success Kid Community Platform',
      html: emailContent
    });
    
    logger.info('Sent email verification', { userId, email });
    
    return true;
  } catch (error) {
    logger.error('Error sending email verification', { error, userId, email });
    return false;
  }
}

/**
 * Verify email with token
 */
export async function verifyEmail(token: string): Promise<boolean> {
  try {
    // Validate token
    const validation = await validateVerificationToken(
      token,
      VerificationType.EMAIL_VERIFICATION
    );
    
    if (!validation.valid || !validation.userId) {
      return false;
    }
    
    // Mark token as used
    await useVerificationToken(token, VerificationType.EMAIL_VERIFICATION);
    
    // Mark email as verified in user record
    await db.query(
      `UPDATE users SET email_verified = TRUE WHERE id = $1`,
      [validation.userId]
    );
    
    logger.info('Verified email', { userId: validation.userId });
    
    return true;
  } catch (error) {
    logger.error('Error verifying email', { error, token });
    return false;
  }
}

/**
 * Send password reset email
 */
export async function sendPasswordReset(email: string): Promise<boolean> {
  try {
    // Find user by email
    const result = await db.query(
      `SELECT id FROM users WHERE email = $1 AND status = 'active'`,
      [email]
    );
    
    if (result.rows.length === 0) {
      // No user found, but don't reveal this to potential attackers
      // Return true as if we sent the email
      logger.info('Password reset requested for non-existent user', { email });
      return true;
    }
    
    const userId = result.rows[0].id;
    
    // Create verification token
    const token = await createVerificationToken(userId, VerificationType.PASSWORD_RESET);
    
    // Generate reset URL
    const resetUrl = `${BASE_URL}/reset-password?token=${token}`;
    
    // Send reset email
    const emailContent = PASSWORD_RESET_TEMPLATE.replace(
      '{{resetUrl}}',
      resetUrl
    );
    
    await sendEmail({
      to: email,
      subject: 'Reset Your Password - Success Kid Community Platform',
      html: emailContent
    });
    
    logger.info('Sent password reset email', { userId, email });
    
    return true;
  } catch (error) {
    logger.error('Error sending password reset', { error, email });
    return false;
  }
}

/**
 * Reset password with token
 */
export async function resetPassword(token: string, newPassword: string): Promise<boolean> {
  try {
    // Validate token
    const validation = await validateVerificationToken(
      token,
      VerificationType.PASSWORD_RESET
    );
    
    if (!validation.valid || !validation.userId) {
      return false;
    }
    
    // Mark token as used
    await useVerificationToken(token, VerificationType.PASSWORD_RESET);
    
    // Update password in user record
    // Note: In production, you'd use a proper password hashing function
    // Since we're using Clerk for auth, this is just a placeholder
    await db.query(
      `UPDATE users SET password_updated_at = NOW() WHERE id = $1`,
      [validation.userId]
    );
    
    logger.info('Reset password', { userId: validation.userId });
    
    return true;
  } catch (error) {
    logger.error('Error resetting password', { error, token });
    return false;
  }
}

/**
 * Send email change verification
 */
export async function sendEmailChangeVerification(
  userId: string,
  currentEmail: string,
  newEmail: string
): Promise<boolean> {
  try {
    // Create verification token with new email in data
    const token = await createVerificationToken(
      userId,
      VerificationType.EMAIL_CHANGE,
      { newEmail }
    );
    
    // Generate verification URL
    const verificationUrl = `${BASE_URL}/change-email?token=${token}`;
    
    // Send verification email to new address
    const emailContent = `
      <h1>Verify Your New Email</h1>
      <p>Hello,</p>
      <p>Please click the link below to verify your new email address:</p>
      <p><a href="${verificationUrl}">Verify New Email</a></p>
      <p>This link will expire in 15 minutes.</p>
      <p>If you did not request this change, please ignore this email.</p>
      <p>Thanks,<br>Success Kid Community Platform</p>
    `;
    
    await sendEmail({
      to: newEmail,
      subject: 'Verify Your New Email - Success Kid Community Platform',
      html: emailContent
    });
    
    // Send notification to current email
    const notificationContent = `
      <h1>Email Change Requested</h1>
      <p>Hello,</p>
      <p>We received a request to change your email address to: ${newEmail}</p>
      <p>If you did not request this change, please contact support immediately.</p>
      <p>Thanks,<br>Success Kid Community Platform</p>
    `;
    
    await sendEmail({
      to: currentEmail,
      subject: 'Email Change Requested - Success Kid Community Platform',
      html: notificationContent
    });
    
    logger.info('Sent email change verification', { userId, currentEmail, newEmail });
    
    return true;
  } catch (error) {
    logger.error('Error sending email change verification', { 
      error, userId, currentEmail, newEmail 
    });
    return false;
  }
}

/**
 * Verify email change with token
 */
export async function verifyEmailChange(token: string): Promise<boolean> {
  try {
    // Validate token
    const validation = await validateVerificationToken(
      token,
      VerificationType.EMAIL_CHANGE
    );
    
    if (!validation.valid || !validation.userId || !validation.data?.newEmail) {
      return false;
    }
    
    // Mark token as used
    await useVerificationToken(token, VerificationType.EMAIL_CHANGE);
    
    // Update email in user record
    await db.query(
      `UPDATE users SET email = $1, email_verified = TRUE WHERE id = $2`,
      [validation.data.newEmail, validation.userId]
    );
    
    logger.info('Verified email change', { 
      userId: validation.userId, 
      newEmail: validation.data.newEmail 
    });
    
    return true;
  } catch (error) {
    logger.error('Error verifying email change', { error, token });
    return false;
  }
}
