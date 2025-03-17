/**
 * CSRF Service
 * 
 * Service for managing CSRF tokens and protection
 */
import { FastifyRequest, FastifyReply } from 'fastify';
import { logger } from '../../lib/logger';
import { CSRF_CONFIG, getEnvironmentConfig } from './config';
import { tokenProvider, CsrfToken } from './token';

/**
 * CSRF Service Class
 */
export class CsrfService {
  private config = getEnvironmentConfig();
  
  /**
   * Generate a CSRF token for a request
   * 
   * @param request Fastify request
   * @returns CSRF token
   */
  generateToken(request: FastifyRequest): CsrfToken {
    try {
      // Get session ID (fallback to request ID if no session)
      const sessionId = request.session?.id || request.id;
      
      // Generate token with user ID if authenticated
      const userId = request.user?.id;
      
      return tokenProvider.generateToken(sessionId, userId);
    } catch (error) {
      logger.error('Error generating CSRF token', { error });
      throw new Error('Failed to generate CSRF token');
    }
  }
  
  /**
   * Set CSRF cookie in response
   * 
   * @param reply Fastify reply
   * @param token CSRF token
   */
  setCsrfCookie(reply: FastifyReply, token: CsrfToken): void {
    try {
      const { cookie } = this.config;
      
      // Convert expiration to cookie max-age (seconds)
      const maxAge = Math.max(0, token.expires - Math.floor(Date.now() / 1000));
      
      // Set cookie
      reply.setCookie(cookie.key, token.value, {
        path: cookie.path,
        secure: cookie.secure,
        httpOnly: cookie.httpOnly,
        sameSite: cookie.sameSite,
        maxAge
      });
    } catch (error) {
      logger.error('Error setting CSRF cookie', { error });
      throw new Error('Failed to set CSRF cookie');
    }
  }
  
  /**
   * Get CSRF token from request
   * 
   * @param request Fastify request
   * @returns CSRF token or null if not found
   */
  getTokenFromRequest(request: FastifyRequest): string | null {
    try {
      // Try to get token from header
      let token = request.headers[this.config.headerName.toLowerCase()] as string;
      
      // Try to get token from request body
      if (!token && request.body && typeof request.body === 'object') {
        token = (request.body as any)._csrf || (request.body as any).csrf;
      }
      
      // Try to get token from query parameter
      if (!token && request.query && typeof request.query === 'object') {
        token = (request.query as any)._csrf || (request.query as any).csrf;
      }
      
      return token || null;
    } catch (error) {
      logger.error('Error getting CSRF token from request', { error });
      return null;
    }
  }
  
  /**
   * Validate CSRF token
   * 
   * @param request Fastify request
   * @param token CSRF token to validate
   * @returns Whether token is valid
   */
  validateToken(request: FastifyRequest, token: string): boolean {
    try {
      // Get session ID (fallback to request ID if no session)
      const sessionId = request.session?.id || request.id;
      
      // Get user ID if authenticated
      const userId = request.user?.id;
      
      return tokenProvider.validateToken(token, sessionId, userId);
    } catch (error) {
      logger.error('Error validating CSRF token', { error });
      return false;
    }
  }
  
  /**
   * Rotate CSRF token if needed
   * 
   * @param request Fastify request
   * @param reply Fastify reply
   * @param token Current token
   */
  rotateTokenIfNeeded(request: FastifyRequest, reply: FastifyReply, token: string): void {
    try {
      // Check if token needs rotation
      if (tokenProvider.needsRotation(token)) {
        // Generate new token
        const newToken = this.generateToken(request);
        
        // Set cookie with new token
        this.setCsrfCookie(reply, newToken);
        
        // Add header with new token for SPA use
        reply.header(this.config.headerName, newToken.value);
      }
    } catch (error) {
      logger.error('Error rotating CSRF token', { error });
      // Continue without rotation
    }
  }
  
  /**
   * Check if a path is exempt from CSRF protection
   * 
   * @param path Request path
   * @returns Whether path is exempt
   */
  isPathExempt(path: string): boolean {
    return this.config.ignorePaths.some(pattern => {
      if (pattern.includes('*')) {
        // Handle wildcard patterns
        const regex = new RegExp(pattern.replace('*', '.*'));
        return regex.test(path);
      }
      return path.startsWith(pattern);
    });
  }
  
  /**
   * Check if a method is exempt from CSRF protection
   * 
   * @param method HTTP method
   * @returns Whether method is exempt
   */
  isMethodExempt(method: string): boolean {
    return this.config.ignoreMethods.includes(method.toUpperCase());
  }
}

// Export singleton instance
export const csrfService = new CsrfService();
