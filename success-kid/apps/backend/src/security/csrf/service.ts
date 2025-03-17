/**
 * CSRF Protection Service
 * 
 * This module provides a service for managing CSRF protection.
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import { logger } from '../../lib/logger';
import { generateCsrfToken, validateCsrfToken, rotateCsrfToken } from './token';
import { env } from '../../config';

/**
 * CSRF cookie options
 */
export interface CsrfCookieOptions {
  key: string;
  path: string;
  secure: boolean;
  httpOnly: boolean;
  sameSite: 'strict' | 'lax' | 'none';
  maxAge?: number;
}

/**
 * Default CSRF cookie options
 */
const defaultCookieOptions: CsrfCookieOptions = {
  key: 'csrf-token',
  path: '/',
  secure: env.NODE_ENV === 'production',
  httpOnly: true,
  sameSite: 'strict',
  maxAge: 24 * 60 * 60 * 1000, // 24 hours
};

/**
 * CSRF Service for token management
 */
export class CsrfService {
  private secret: string;
  private cookieOptions: CsrfCookieOptions;
  
  /**
   * Create a new CSRF service
   */
  constructor(secret: string, cookieOptions: Partial<CsrfCookieOptions> = {}) {
    this.secret = secret;
    this.cookieOptions = { ...defaultCookieOptions, ...cookieOptions };
    
    logger.info('CSRF service initialized');
  }
  
  /**
   * Generate a new CSRF token for a request
   */
  generateToken(request: FastifyRequest): string {
    const userId = request.user?.id;
    return generateCsrfToken(this.secret, userId);
  }
  
  /**
   * Set CSRF token cookie in response
   */
  setCookie(reply: FastifyReply, token: string): void {
    reply.setCookie(this.cookieOptions.key, token, {
      path: this.cookieOptions.path,
      secure: this.cookieOptions.secure,
      httpOnly: this.cookieOptions.httpOnly,
      sameSite: this.cookieOptions.sameSite,
      maxAge: this.cookieOptions.maxAge,
    });
  }
  
  /**
   * Get CSRF token from request (either from cookie or header)
   */
  getTokenFromRequest(request: FastifyRequest): string | null {
    // Try to get from header first
    const headerToken = request.headers['x-csrf-token'] || request.headers['x-xsrf-token'];
    
    if (headerToken && typeof headerToken === 'string') {
      return headerToken;
    }
    
    // Try to get from cookie
    const cookieToken = request.cookies[this.cookieOptions.key];
    
    if (cookieToken && typeof cookieToken === 'string') {
      return cookieToken;
    }
    
    return null;
  }
  
  /**
   * Validate CSRF token from request
   */
  validateToken(request: FastifyRequest, token: string): boolean {
    const userId = request.user?.id;
    return validateCsrfToken(token, this.secret, userId);
  }
  
  /**
   * Rotate CSRF token
   */
  rotateToken(token: string): string {
    return rotateCsrfToken(token, this.secret);
  }
  
  /**
   * Setup CSRF protection for a request
   * - Generates token if none exists
   * - Validates token for non-safe methods
   * - Rotates token if configured
   */
  async protect(request: FastifyRequest, reply: FastifyReply): Promise<boolean> {
    try {
      // Get existing token
      let token = this.getTokenFromRequest(request);
      
      // Check if this is a safe method that doesn't need validation
      const safeMethod = ['GET', 'HEAD', 'OPTIONS'].includes(request.method);
      
      if (safeMethod) {
        // For safe methods, ensure a token exists but don't validate
        if (!token) {
          token = this.generateToken(request);
          this.setCookie(reply, token);
        }
        
        return true;
      }
      
      // For non-safe methods, validate the token
      if (!token) {
        logger.warn('CSRF token missing', {
          method: request.method,
          url: request.url,
          ip: request.ip
        });
        
        return false;
      }
      
      const isValid = this.validateToken(request, token);
      
      if (!isValid) {
        logger.warn('CSRF token invalid', {
          method: request.method,
          url: request.url,
          ip: request.ip
        });
        
        return false;
      }
      
      // Rotate token after successful validation (if needed)
      const newToken = this.rotateToken(token);
      this.setCookie(reply, newToken);
      
      return true;
    } catch (error) {
      logger.error('CSRF protection error', { error });
      return false;
    }
  }
}

// Create singleton instance using secret from environment
const csrfSecret = env.CSRF_SECRET || 'this-should-be-a-secret-in-production';
export const csrfService = new CsrfService(csrfSecret);
