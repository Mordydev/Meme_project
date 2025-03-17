/**
 * CSRF Middleware
 * 
 * Provides CSRF protection middleware for Fastify
 */
import { FastifyRequest, FastifyReply } from 'fastify';
import { logger } from '../../lib/logger';
import { csrfService } from './service';
import { CSRF_CONFIG, getEnvironmentConfig } from './config';

/**
 * CSRF protection middleware
 * 
 * @param request Fastify request
 * @param reply Fastify reply
 */
export async function csrfMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    // Skip if CSRF protection is disabled
    const config = getEnvironmentConfig();
    if (!config.enabled) {
      return;
    }
    
    // Skip for ignored methods
    if (csrfService.isMethodExempt(request.method)) {
      return;
    }
    
    // Skip for ignored paths
    if (csrfService.isPathExempt(request.url)) {
      return;
    }
    
    // Get CSRF token from cookie
    const cookieToken = request.cookies[config.cookie.key];
    
    // For state-changing requests, verify CSRF token
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method)) {
      // Get token from request
      const requestToken = csrfService.getTokenFromRequest(request);
      
      // Validate double-submit
      if (!cookieToken || !requestToken || cookieToken !== requestToken) {
        logger.warn('CSRF token validation failed', { 
          path: request.url, 
          method: request.method,
          ip: request.ip,
          hasRequestToken: !!requestToken,
          hasCookieToken: !!cookieToken,
          tokenMatch: cookieToken === requestToken
        });
        
        return reply.code(403).send({
          data: null,
          errors: [{
            code: 'CSRF_ERROR',
            message: 'Invalid or missing CSRF token'
          }],
          meta: {
            timestamp: new Date().toISOString(),
            requestId: request.id
          }
        });
      }
      
      // Validate token itself
      if (!csrfService.validateToken(request, cookieToken)) {
        logger.warn('CSRF token invalid or expired', { 
          path: request.url, 
          method: request.method,
          ip: request.ip
        });
        
        return reply.code(403).send({
          data: null,
          errors: [{
            code: 'CSRF_ERROR',
            message: 'Invalid or expired CSRF token'
          }],
          meta: {
            timestamp: new Date().toISOString(),
            requestId: request.id
          }
        });
      }
      
      // Rotate token if needed
      if (config.tokenRotation) {
        csrfService.rotateTokenIfNeeded(request, reply, cookieToken);
      }
    } else {
      // For safe methods, ensure CSRF token is present in cookie
      if (!cookieToken) {
        // Generate and set new token
        const newToken = csrfService.generateToken(request);
        csrfService.setCsrfCookie(reply, newToken);
      } else if (config.tokenRotation) {
        // Rotate token if needed
        csrfService.rotateTokenIfNeeded(request, reply, cookieToken);
      }
    }
  } catch (error) {
    logger.error('Error in CSRF middleware', { error, path: request.url });
    
    // In case of error, continue request (fail open)
    // This can be changed to fail closed by uncommenting below:
    /*
    return reply.code(500).send({
      data: null,
      errors: [{
        code: 'CSRF_ERROR',
        message: 'An error occurred verifying CSRF protection'
      }],
      meta: {
        timestamp: new Date().toISOString(),
        requestId: request.id
      }
    });
    */
  }
}

/**
 * Register CSRF middleware with Fastify
 * 
 * @param fastify Fastify instance
 */
export function registerCsrfMiddleware(fastify: any): void {
  // Add CSRF middleware hook
  fastify.addHook('preHandler', csrfMiddleware);
  
  // Register CSRF token endpoint
  fastify.get('/api/v1/csrf-token', async (request: FastifyRequest, reply: FastifyReply) => {
    // Generate token
    const token = csrfService.generateToken(request);
    
    // Set cookie
    csrfService.setCsrfCookie(reply, token);
    
    // Return token for SPA use
    return {
      data: {
        token: token.value,
        expires: token.expires
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: request.id
      }
    };
  });
  
  fastify.log.info('CSRF middleware registered');
}
