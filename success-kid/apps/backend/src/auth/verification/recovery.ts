/**
 * Account Recovery Service
 * 
 * Handles account recovery flows
 */
import { createVerificationToken, validateVerificationToken, useVerificationToken, VerificationType } from './tokens';
import { db } from '../../lib/db';
import { logger } from '../../lib/logger';
import { sendEmail } from '../../lib/email';
import { env } from '../../config/environment';

/**
 * Email template for account recovery
 */
const ACCOUNT_RECOVERY_TEMPLATE = `
<h1>Account Recovery</h1>
<p>Hello,</p>
<p>We received a request to recover your account. Click the link below to continue:</p>
<p><a href="{{recoveryUrl}}">Recover Account</a></p>
<p>This link will expire in 30 minutes.</p>
<p>If you did not request account recovery, please ignore this email.</p>
<p>Thanks,<br>Success Kid Community Platform</p>
`;

/**
 * Base URL for account recovery
 */
const BASE_URL = env.PUBLIC_URL || 'http://localhost:3000';

/**
 * Recovery questions type
 */
export interface RecoveryQuestion {
  question: string;
  answer: string;
}

/**
 * Send account recovery email
 */
export async function sendAccountRecovery(email: string): Promise<boolean> {
  try {
    // Find user by email
    const result = await db.query(
      `SELECT id FROM users WHERE email = $1 AND status = 'active'`,
      [email]
    );
    
    if (result.rows.length === 0) {
      // No user found, but don't reveal this to potential attackers
      // Return true as if we sent the email
      logger.info('Account recovery requested for non-existent user', { email });
      return true;
    }
    
    const userId = result.rows[0].id;
    
    // Create verification token
    const token = await createVerificationToken(userId, VerificationType.ACCOUNT_RECOVERY);
    
    // Generate recovery URL
    const recoveryUrl = `${BASE_URL}/account-recovery?token=${token}`;
    
    // Send recovery email
    const emailContent = ACCOUNT_RECOVERY_TEMPLATE.replace(
      '{{recoveryUrl}}',
      recoveryUrl
    );
    
    await sendEmail({
      to: email,
      subject: 'Account Recovery - Success Kid Community Platform',
      html: emailContent
    });
    
    logger.info('Sent account recovery email', { userId, email });
    
    return true;
  } catch (error) {
    logger.error('Error sending account recovery', { error, email });
    return false;
  }
}

/**
 * Set recovery questions for a user
 */
export async function setRecoveryQuestions(
  userId: string,
  questions: RecoveryQuestion[]
): Promise<boolean> {
  try {
    // Encrypt and store recovery questions
    // In a real implementation, you'd want to hash the answers
    await db.query(
      `UPDATE users SET 
         recovery_questions = $1,
         recovery_questions_updated_at = NOW()
       WHERE id = $2`,
      [JSON.stringify(questions), userId]
    );
    
    logger.info('Set recovery questions', { userId });
    
    return true;
  } catch (error) {
    logger.error('Error setting recovery questions', { error, userId });
    return false;
  }
}

/**
 * Get recovery questions for a user
 */
export async function getRecoveryQuestions(userId: string): Promise<RecoveryQuestion[] | null> {
  try {
    const result = await db.query(
      `SELECT recovery_questions FROM users WHERE id = $1`,
      [userId]
    );
    
    if (result.rows.length === 0 || !result.rows[0].recovery_questions) {
      return null;
    }
    
    // Return questions without answers
    const questions = JSON.parse(result.rows[0].recovery_questions);
    return questions.map((q: RecoveryQuestion) => ({
      question: q.question,
      answer: '' // Don't send answers to client
    }));
  } catch (error) {
    logger.error('Error getting recovery questions', { error, userId });
    return null;
  }
}

/**
 * Validate recovery questions
 */
export async function validateRecoveryQuestions(
  userId: string,
  answers: RecoveryQuestion[]
): Promise<boolean> {
  try {
    const result = await db.query(
      `SELECT recovery_questions FROM users WHERE id = $1`,
      [userId]
    );
    
    if (result.rows.length === 0 || !result.rows[0].recovery_questions) {
      return false;
    }
    
    const storedQuestions = JSON.parse(result.rows[0].recovery_questions);
    
    // Match provided answers with stored answers
    // In a real implementation, you'd want to hash and compare the answers
    let correctAnswers = 0;
    for (const answer of answers) {
      const matchingQuestion = storedQuestions.find(
        (q: RecoveryQuestion) => q.question === answer.question
      );
      
      if (matchingQuestion && matchingQuestion.answer === answer.answer) {
        correctAnswers++;
      }
    }
    
    // Require at least 2 correct answers or all if less than 2
    const requiredCorrect = Math.min(2, storedQuestions.length);
    return correctAnswers >= requiredCorrect;
  } catch (error) {
    logger.error('Error validating recovery questions', { error, userId });
    return false;
  }
}

/**
 * Validate account recovery token
 */
export async function validateRecoveryToken(token: string): Promise<{
  valid: boolean;
  userId?: string;
}> {
  try {
    const validation = await validateVerificationToken(
      token,
      VerificationType.ACCOUNT_RECOVERY
    );
    
    return {
      valid: validation.valid,
      userId: validation.userId
    };
  } catch (error) {
    logger.error('Error validating recovery token', { error, token });
    return { valid: false };
  }
}

/**
 * Complete account recovery
 */
export async function completeAccountRecovery(
  token: string,
  newPassword: string
): Promise<boolean> {
  try {
    // Validate token
    const validation = await validateVerificationToken(
      token,
      VerificationType.ACCOUNT_RECOVERY
    );
    
    if (!validation.valid || !validation.userId) {
      return false;
    }
    
    // Mark token as used
    await useVerificationToken(token, VerificationType.ACCOUNT_RECOVERY);
    
    // Update password in user record
    // Note: In production, you'd use a proper password hashing function
    // Since we're using Clerk for auth, this is just a placeholder
    await db.query(
      `UPDATE users SET 
         password_updated_at = NOW(),
         last_recovery_at = NOW()
       WHERE id = $1`,
      [validation.userId]
    );
    
    logger.info('Completed account recovery', { userId: validation.userId });
    
    return true;
  } catch (error) {
    logger.error('Error completing account recovery', { error, token });
    return false;
  }
}
