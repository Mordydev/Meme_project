/**
 * Rate Limiting Middleware
 * 
 * This module provides middleware for rate limiting requests.
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import { logger } from '../../lib/logger';
import { RateLimitExceededError } from '../../errors';
import { AuditAction, AuditResource } from '../../audit/types';
import { auditService } from '../../audit/service';
import { rateLimitService } from './service';

/**
 * Rate limit options
 */
export interface RateLimitOptions {
  max: number;
  timeWindow: string | number;
  keyGenerator?: (request: FastifyRequest) => string;
  errorMessage?: string;
  strategy?: 'fixed-window' | 'sliding-window' | 'token-bucket';
  skipOnError?: boolean;
  skip?: (request: FastifyRequest) => boolean;
}

/**
 * Default rate limit options
 */
const defaultOptions: RateLimitOptions = {
  max: 100,
  timeWindow: '1 minute',
  strategy: 'sliding-window',
  skipOnError: true,
  skip: (request) => false,
};

/**
 * Create rate limiting middleware
 */
export function createRateLimitMiddleware(options: Partial<RateLimitOptions> = {}) {
  const config = { ...defaultOptions, ...options };
  
  return async function rateLimitMiddleware(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      // Check if this request should skip rate limiting
      if (config.skip && config.skip(request)) {
        return;
      }
      
      const key = config.keyGenerator 
        ? config.keyGenerator(request)
        : request.user?.id || request.ip;
      
      // Check rate limit
      const result = await rateLimitService.consume(
        key,
        1, // consume 1 point
        {
          max: config.max,
          timeWindow: config.timeWindow,
          strategy: config.strategy || 'sliding-window'
        }
      );
      
      // Set rate limit headers
      reply.header('X-RateLimit-Limit', config.max);
      reply.header('X-RateLimit-Remaining', result.remaining);
      reply.header('X-RateLimit-Reset', result.resetTime);
      
      // If limit exceeded, throw error
      if (!result.allowed) {
        // Audit rate limit exceeded
        await auditService.logEvent({
          userId: request.user?.id || 'anonymous',
          action: AuditAction.ADMIN_ACTION,
          resource: AuditResource.SYSTEM,
          ip: request.ip,
          userAgent: request.headers['user-agent'],
          status: 'failure',
          metadata: {
            type: 'rate_limit_exceeded',
            url: request.url,
            method: request.method,
            current: result.current,
            limit: result.limit
          }
        });
        
        throw new RateLimitExceededError(
          config.errorMessage || 'Rate limit exceeded'
        );
      }
    } catch (error) {
      if (error instanceof RateLimitExceededError) {
        throw error;
      }
      
      logger.error('Error in rate limit middleware', { error });
      
      if (!config.skipOnError) {
        throw new RateLimitExceededError('Rate limit error');
      }
    }
  };
}

/**
 * Create middleware for advanced rate limiting
 * Allows different limits for different paths and methods
 */
export function createAdvancedRateLimitMiddleware(limits: Array<{
  path: string;
  method?: string | string[];
  limit: number;
  timeWindow: string | number;
}>) {
  return async function advancedRateLimitMiddleware(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      // Find matching limit configuration
      const matchingLimit = limits.find(limit => {
        // Check path match
        const pathMatch = request.url.startsWith(limit.path);
        
        // Check method match if specified
        const methodMatch = !limit.method || 
          (Array.isArray(limit.method) 
            ? limit.method.includes(request.method)
            : limit.method === request.method);
            
        return pathMatch && methodMatch;
      });
      
      // Use default if no matching config
      const config = matchingLimit || { limit: 100, timeWindow: '1 minute' };
      
      // Apply rate limiting
      const middleware = createRateLimitMiddleware({
        max: config.limit,
        timeWindow: config.timeWindow
      });
      
      await middleware(request, reply);
    } catch (error) {
      throw error;
    }
  };
}
