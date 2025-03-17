/**
 * CSRF Token Service
 * 
 * Generates and validates CSRF tokens
 */
import * as crypto from 'crypto';
import { logger } from '../../lib/logger';
import { CSRF_CONFIG } from './config';

/**
 * CSRF token interface
 */
export interface CsrfToken {
  value: string;
  expires: number; // Expiration timestamp
}

/**
 * CSRF Token Provider
 */
export class CsrfTokenProvider {
  private csrfSecret: string;
  
  constructor() {
    // Get CSRF secret from environment or generate one for development
    this.csrfSecret = process.env.CSRF_SECRET || crypto.randomBytes(32).toString('hex');
  }
  
  /**
   * Generate a new CSRF token
   * 
   * @param sessionId Session ID to bind token to
   * @param userId Optional user ID to bind token to
   * @returns CSRF token
   */
  generateToken(sessionId: string, userId?: string): CsrfToken {
    try {
      // Determine expiration time
      const expires = Math.floor(Date.now() / 1000) + (CSRF_CONFIG.tokenRotation ? CSRF_CONFIG.rotationInterval : 86400);
      
      // Create token payload
      const payload = {
        sid: sessionId,
        uid: userId,
        exp: expires
      };
      
      // Encode payload
      const payloadString = JSON.stringify(payload);
      const payloadBase64 = Buffer.from(payloadString).toString('base64');
      
      // Generate HMAC signature
      const hmac = crypto.createHmac('sha256', this.csrfSecret);
      hmac.update(payloadBase64);
      const signature = hmac.digest('base64');
      
      // Create token
      const tokenValue = `${payloadBase64}.${signature}`;
      
      return {
        value: tokenValue,
        expires
      };
    } catch (error) {
      logger.error('Error generating CSRF token', { error });
      throw new Error('Failed to generate CSRF token');
    }
  }
  
  /**
   * Validate CSRF token
   * 
   * @param token CSRF token to validate
   * @param sessionId Session ID to validate against
   * @param userId Optional user ID to validate against
   * @returns Whether token is valid
   */
  validateToken(token: string, sessionId: string, userId?: string): boolean {
    try {
      // Split token into parts
      const parts = token.split('.');
      if (parts.length !== 2) {
        logger.warn('Invalid CSRF token format', { token });
        return false;
      }
      
      const [payloadBase64, signature] = parts;
      
      // Verify signature
      const hmac = crypto.createHmac('sha256', this.csrfSecret);
      hmac.update(payloadBase64);
      const expectedSignature = hmac.digest('base64');
      
      if (signature !== expectedSignature) {
        logger.warn('Invalid CSRF token signature', { token });
        return false;
      }
      
      // Decode payload
      const payloadString = Buffer.from(payloadBase64, 'base64').toString();
      const payload = JSON.parse(payloadString);
      
      // Check expiration
      if (payload.exp < Math.floor(Date.now() / 1000)) {
        logger.warn('Expired CSRF token', { token, expires: payload.exp });
        return false;
      }
      
      // Check session ID
      if (payload.sid !== sessionId) {
        logger.warn('CSRF token session mismatch', { token, expectedSid: sessionId, tokenSid: payload.sid });
        return false;
      }
      
      // Check user ID if provided
      if (userId && payload.uid && payload.uid !== userId) {
        logger.warn('CSRF token user mismatch', { token, expectedUid: userId, tokenUid: payload.uid });
        return false;
      }
      
      return true;
    } catch (error) {
      logger.error('Error validating CSRF token', { error, token });
      return false;
    }
  }
  
  /**
   * Check if token needs rotation
   * 
   * @param token CSRF token to check
   * @returns Whether token needs rotation
   */
  needsRotation(token: string): boolean {
    try {
      // If token rotation is disabled, never rotate
      if (!CSRF_CONFIG.tokenRotation) {
        return false;
      }
      
      // Split token into parts
      const parts = token.split('.');
      if (parts.length !== 2) {
        // Invalid token, needs rotation
        return true;
      }
      
      const [payloadBase64] = parts;
      
      // Decode payload
      const payloadString = Buffer.from(payloadBase64, 'base64').toString();
      const payload = JSON.parse(payloadString);
      
      // Calculate threshold for rotation (halfway to expiration)
      const rotationThreshold = payload.exp - (CSRF_CONFIG.rotationInterval / 2);
      
      // Need rotation if current time is past threshold
      return Math.floor(Date.now() / 1000) > rotationThreshold;
    } catch (error) {
      // Error parsing token, needs rotation
      return true;
    }
  }
}

// Export singleton instance
export const tokenProvider = new CsrfTokenProvider();
