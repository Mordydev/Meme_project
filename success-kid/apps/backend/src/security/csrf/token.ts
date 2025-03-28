/**
 * CSRF Token Generation and Validation
 * 
 * This module provides functionality for generating and validating CSRF tokens.
 */

import { randomBytes, createHmac } from 'crypto';
import { logger } from '../../lib/logger';

// Constants
const TOKEN_LENGTH = 32; // bytes
const TOKEN_EXPIRY = 24 * 60 * 60; // 24 hours in seconds

/**
 * Generate a CSRF token
 */
export function generateCsrfToken(secret: string, userId?: string): string {
  try {
    // Generate random bytes
    const randomString = randomBytes(TOKEN_LENGTH).toString('hex');
    
    // Create payload
    const payload = {
      random: randomString,
      userId: userId || 'anonymous',
      expiry: Math.floor(Date.now() / 1000) + TOKEN_EXPIRY
    };
    
    // Convert payload to string
    const payloadString = JSON.stringify(payload);
    const encodedPayload = Buffer.from(payloadString).toString('base64');
    
    // Create signature using HMAC
    const hmac = createHmac('sha256', secret);
    hmac.update(encodedPayload);
    const signature = hmac.digest('hex');
    
    // Combine payload and signature
    return `${encodedPayload}.${signature}`;
  } catch (error) {
    logger.error('Error generating CSRF token', { error });
    throw new Error('Failed to generate CSRF token');
  }
}

/**
 * Parse a CSRF token
 */
export function parseCsrfToken(token: string): { payload: any; signature: string } | null {
  try {
    const [encodedPayload, signature] = token.split('.');
    
    if (!encodedPayload || !signature) {
      return null;
    }
    
    // Decode payload
    const payloadString = Buffer.from(encodedPayload, 'base64').toString();
    const payload = JSON.parse(payloadString);
    
    return { payload, signature };
  } catch (error) {
    logger.error('Error parsing CSRF token', { error });
    return null;
  }
}

/**
 * Validate a CSRF token
 */
export function validateCsrfToken(token: string, secret: string, userId?: string): boolean {
  try {
    const parsedToken = parseCsrfToken(token);
    
    if (!parsedToken) {
      return false;
    }
    
    const { payload, signature } = parsedToken;
    
    // Check expiry
    if (payload.expiry < Math.floor(Date.now() / 1000)) {
      return false;
    }
    
    // Check user ID if provided
    if (userId && payload.userId !== userId && payload.userId !== 'anonymous') {
      return false;
    }
    
    // Verify signature
    const hmac = createHmac('sha256', secret);
    const encodedPayload = token.split('.')[0];
    hmac.update(encodedPayload);
    const expectedSignature = hmac.digest('hex');
    
    return signature === expectedSignature;
  } catch (error) {
    logger.error('Error validating CSRF token', { error });
    return false;
  }
}

/**
 * Create a new token with the same user ID but new expiry
 */
export function rotateCsrfToken(token: string, secret: string): string {
  try {
    const parsedToken = parseCsrfToken(token);
    
    if (!parsedToken) {
      throw new Error('Invalid token');
    }
    
    return generateCsrfToken(secret, parsedToken.payload.userId);
  } catch (error) {
    logger.error('Error rotating CSRF token', { error });
    throw new Error('Failed to rotate CSRF token');
  }
}
