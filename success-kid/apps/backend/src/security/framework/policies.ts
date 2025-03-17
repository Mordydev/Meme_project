/**
 * Security policies
 * 
 * This file defines the default security policies and provides utilities for working with policies.
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import { logger } from '../../lib/logger';
import { SecurityPolicy } from '../types';
import { 
  inputSanitizationMiddleware, 
  accessControlMiddleware 
} from '../middleware';
import { createCsrfMiddleware } from '../csrf/middleware';
import { createRateLimitMiddleware } from '../rate-limit/middleware';
import { securityHeadersMiddleware } from '../middleware/headers';

/**
 * Default security policies
 */
export const defaultSecurityPolicies: SecurityPolicy[] = [
  // Global security policy that applies to all routes
  {
    id: 'global-security',
    name: 'Global Security Policy',
    description: 'Applies basic security measures to all requests',
    middleware: [
      securityHeadersMiddleware,
      inputSanitizationMiddleware
    ],
    pathPatterns: ['*'],
    enabled: true,
    priority: 10
  },
  
  // API security policy for all API routes
  {
    id: 'api-security',
    name: 'API Security Policy',
    description: 'Enhanced security for API endpoints',
    middleware: [
      accessControlMiddleware,
      createRateLimitMiddleware({
        max: 200,
        timeWindow: '1 minute'
      })
    ],
    pathPatterns: ['/api/*'],
    enabled: true,
    priority: 20
  },
  
  // Authentication security policy for authentication endpoints
  {
    id: 'auth-security',
    name: 'Authentication Security Policy',
    description: 'Enhanced security for authentication endpoints',
    middleware: [
      createRateLimitMiddleware({
        max: 20,
        timeWindow: '1 minute'
      })
    ],
    pathPatterns: ['/api/*/auth/*'],
    enabled: true,
    priority: 30
  },
  
  // CSRF protection for mutation operations
  {
    id: 'csrf-protection',
    name: 'CSRF Protection Policy',
    description: 'Protects against Cross-Site Request Forgery',
    middleware: [
      createCsrfMiddleware()
    ],
    pathPatterns: ['/api/*'],
    excludePatterns: ['/api/*/health', '/api/*/auth/login', '/api/*/auth/register'],
    enabled: true,
    priority: 25
  },
  
  // Admin security policy for admin endpoints
  {
    id: 'admin-security',
    name: 'Admin Security Policy',
    description: 'Enhanced security for admin endpoints',
    middleware: [
      async (request: FastifyRequest, reply: FastifyReply) => {
        // Check for admin role
        if (!request.user || request.user.role !== 'admin') {
          return reply.code(403).send({
            error: 'Forbidden',
            message: 'Admin access required'
          });
        }
      },
      createRateLimitMiddleware({
        max: 50,
        timeWindow: '1 minute'
      })
    ],
    pathPatterns: ['/api/*/admin/*'],
    enabled: true,
    priority: 50
  }
];

/**
 * Create a custom security policy
 */
export function createSecurityPolicy(
  name: string,
  description: string,
  pathPatterns: string[],
  middleware: SecurityPolicy['middleware'],
  options: Partial<SecurityPolicy> = {}
): SecurityPolicy {
  return {
    id: options.id || `policy-${Date.now()}`,
    name,
    description,
    pathPatterns,
    middleware,
    excludePatterns: options.excludePatterns,
    enabled: options.enabled !== undefined ? options.enabled : true,
    priority: options.priority !== undefined ? options.priority : 0
  };
}
