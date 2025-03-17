/**
 * Security Middleware
 * 
 * Collection of security middleware functions
 */
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import helmet from '@fastify/helmet';
import { logger } from '../../lib/logger';
import { SecurityContext } from '../framework/types';
import { RateLimitConfig } from '../../auth/rate-limiting/service';
import { rateLimitService } from '../../auth/rate-limiting/service';

// Export all middleware functions
export * from './headers';
export * from './sanitize';
export * from './validation';
export * from './access';
export * from './content-security';
export * from './xss-protection';
export * from './sql-injection';

/**
 * Register security middleware with Fastify
 * 
 * @param fastify Fastify instance
 */
export async function securityMiddleware(fastify: FastifyInstance): Promise<void> {
  // Get configuration
  const config = fastify.config.security;
  
  // Register helmet if security headers are enabled
  if (config.headers.enabled) {
    await fastify.register(helmet, {
      contentSecurityPolicy: config.headers.contentSecurityPolicy,
      xFrameOptions: { action: config.headers.xFrameOptions },
      hsts: config.headers.strictTransportSecurity,
      xXssProtection: { value: config.headers.xXssProtection },
      noSniff: { action: config.headers.xContentTypeOptions },
      referrerPolicy: { policy: config.headers.referrerPolicy },
      permissionsPolicy: { policy: config.headers.permissionsPolicy }
    });
  }
  
  // Add security pre-handler hook
  fastify.addHook('preHandler', async (request, reply) => {
    // Apply security policies from service
    if (fastify.securityService) {
      await fastify.securityService.applyPolicies(request, reply);
    }
  });
  
  fastify.log.info('Security middleware registered');
}

/**
 * Header security middleware
 */
export async function headerSecurity(
  request: FastifyRequest,
  reply: FastifyReply,
  context: SecurityContext
): Promise<boolean> {
  // Add security headers
  reply.header('X-Content-Type-Options', 'nosniff');
  reply.header('X-XSS-Protection', '1; mode=block');
  reply.header('X-Frame-Options', 'DENY');
  
  // For APIs, cache control
  reply.header('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  reply.header('Pragma', 'no-cache');
  reply.header('Expires', '0');
  
  return true;
}

/**
 * Basic input validation middleware
 */
export async function inputValidation(
  request: FastifyRequest,
  reply: FastifyReply,
  context: SecurityContext
): Promise<boolean> {
  // Input validation is handled by Fastify validation
  // This is a placeholder for additional validation logic
  return true;
}

/**
 * Authentication check middleware
 */
export async function authenticationCheck(
  request: FastifyRequest,
  reply: FastifyReply,
  context: SecurityContext
): Promise<boolean> {
  // Skip for development if DISABLE_AUTH is set
  if (process.env.NODE_ENV === 'development' && process.env.DISABLE_AUTH === 'true') {
    request.log.warn('Auth check bypassed in development mode');
    
    // Set mock user for testing
    if (!request.user) {
      request.user = {
        id: 'dev-user',
        role: 'user'
      };
    }
    
    return true;
  }
  
  // Check if user is authenticated
  if (!request.user) {
    reply.code(401).send({
      data: null,
      errors: [{
        code: 'UNAUTHORIZED',
        message: 'Authentication required'
      }],
      meta: {
        timestamp: new Date().toISOString()
      }
    });
    
    return false;
  }
  
  return true;
}

/**
 * Content security check middleware
 */
export async function contentSecurityCheck(
  request: FastifyRequest,
  reply: FastifyReply,
  context: SecurityContext
): Promise<boolean> {
  // Currently a placeholder, will be expanded with content security logic
  return true;
}

/**
 * Rate limiting middleware factory
 * 
 * @param config Rate limit configuration
 * @returns Rate limiting middleware function
 */
export function rateLimit(config: RateLimitConfig) {
  return async function rateLimitMiddleware(
    request: FastifyRequest,
    reply: FastifyReply,
    context: SecurityContext
  ): Promise<boolean> {
    try {
      // Get client identifier (IP or user ID)
      const clientId = request.user?.id || request.ip;
      
      // Check rate limit
      const result = await rateLimitService.consume(
        clientId,
        1, // Consume 1 point
        config
      );
      
      if (!result.success) {
        // Set rate limit headers
        reply.header('X-RateLimit-Limit', config.points.toString());
        reply.header('X-RateLimit-Remaining', result.remaining.toString());
        reply.header('X-RateLimit-Reset', Math.ceil(result.resetTime / 1000).toString());
        
        // If blocked, add retry-after header
        if (result.blocked && result.blockExpires) {
          const retryAfter = Math.ceil((result.blockExpires - Date.now()) / 1000);
          reply.header('Retry-After', retryAfter.toString());
        }
        
        // Send rate limit error
        reply.code(429).send({
          data: null,
          errors: [{
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many requests, please try again later',
            details: {
              retryAfter: Math.ceil(result.resetTime / 1000)
            }
          }],
          meta: {
            timestamp: new Date().toISOString()
          }
        });
        
        // Log rate limit hit
        logger.warn('Rate limit exceeded', {
          clientId,
          path: request.url,
          method: request.method,
          ip: request.ip,
          resetTime: result.resetTime
        });
        
        return false;
      }
      
      // Set rate limit headers for successful requests
      reply.header('X-RateLimit-Limit', config.points.toString());
      reply.header('X-RateLimit-Remaining', result.remaining.toString());
      reply.header('X-RateLimit-Reset', Math.ceil(result.resetTime / 1000).toString());
      
      return true;
    } catch (error) {
      // Log error but allow request (fail open)
      logger.error('Rate limiting error', { error, path: request.url });
      
      // In case of error, default to allowing the request
      return true;
    }
  };
}
