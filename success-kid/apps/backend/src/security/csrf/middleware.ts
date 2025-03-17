/**
 * CSRF Protection Middleware
 * 
 * This module provides middleware for CSRF protection.
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import { logger } from '../../lib/logger';
import { csrfService } from './service';
import { AuditAction, AuditResource } from '../../audit/types';
import { auditService } from '../../audit/service';

/**
 * CSRF middleware options
 */
export interface CsrfMiddlewareOptions {
  ignoreMethods?: string[];
  ignorePaths?: string[];
}

/**
 * Default CSRF middleware options
 */
const defaultOptions: CsrfMiddlewareOptions = {
  ignoreMethods: ['GET', 'HEAD', 'OPTIONS'],
  ignorePaths: ['/api/v1/auth/login', '/api/v1/auth/register', '/health']
};

/**
 * Create CSRF protection middleware
 */
export function createCsrfMiddleware(options: CsrfMiddlewareOptions = {}) {
  const config = { ...defaultOptions, ...options };
  
  return async function csrfMiddleware(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      // Skip CSRF check for certain methods
      if (config.ignoreMethods?.includes(request.method)) {
        return;
      }
      
      // Skip CSRF check for certain paths
      if (config.ignorePaths?.some(path => request.url.startsWith(path))) {
        return;
      }
      
      // Protect the request
      const isValid = await csrfService.protect(request, reply);
      
      if (!isValid) {
        // Audit the CSRF failure
        await auditService.logEvent({
          userId: request.user?.id || 'anonymous',
          action: AuditAction.ADMIN_ACTION,
          resource: AuditResource.SYSTEM,
          ip: request.ip,
          userAgent: request.headers['user-agent'],
          status: 'failure',
          metadata: {
            type: 'csrf_violation',
            url: request.url,
            method: request.method
          }
        });
        
        return reply.code(403).send({
          error: 'Forbidden',
          message: 'CSRF token validation failed'
        });
      }
    } catch (error) {
      logger.error('Error in CSRF middleware', { error });
      
      return reply.code(403).send({
        error: 'Forbidden',
        message: 'CSRF protection error'
      });
    }
  };
}

/**
 * Express-like middleware for providing CSRF token to templates
 */
export async function csrfTokenMiddleware(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  // Generate token if none exists
  const token = csrfService.getTokenFromRequest(request) || csrfService.generateToken(request);
  
  // Set cookie
  csrfService.setCookie(reply, token);
  
  // Add token to request for access in templates
  (request as any).csrfToken = token;
  
  // Add helper method to get token
  (request as any).getCsrfToken = () => token;
}
