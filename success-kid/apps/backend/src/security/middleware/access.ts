/**
 * Access control middleware
 * 
 * This middleware implements access control for protected resources.
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import { logger } from '../../lib/logger';
import { UnauthorizedError, ForbiddenError } from '../../errors';
import { AuditAction, AuditResource } from '../../audit/types';
import { auditService } from '../../audit/service';

/**
 * Resource access rules
 */
interface ResourceAccessRule {
  resource: string;
  actions: string[];
  roles: string[];
  condition?: (request: FastifyRequest) => boolean | Promise<boolean>;
}

/**
 * Default access rules
 */
const defaultAccessRules: ResourceAccessRule[] = [
  // Admin resources
  {
    resource: 'admin',
    actions: ['read', 'write', 'delete'],
    roles: ['admin']
  },
  
  // User profiles
  {
    resource: 'profile',
    actions: ['read'],
    roles: ['user', 'admin', 'moderator']
  },
  {
    resource: 'profile',
    actions: ['write', 'delete'],
    roles: ['user', 'admin'],
    condition: (request) => {
      // Users can only modify their own profiles
      if (request.user?.role === 'user') {
        const userId = request.params.id || request.body?.userId;
        return userId === request.user.id;
      }
      // Admins can modify any profile
      return true;
    }
  },
  
  // Content
  {
    resource: 'content',
    actions: ['read'],
    roles: ['user', 'admin', 'moderator', 'anonymous']
  },
  {
    resource: 'content',
    actions: ['write'],
    roles: ['user', 'admin', 'moderator']
  },
  {
    resource: 'content',
    actions: ['delete'],
    roles: ['user', 'admin', 'moderator'],
    condition: (request) => {
      // Users can only delete their own content
      if (request.user?.role === 'user') {
        const contentId = request.params.id;
        // TODO: Implement content ownership check
        return true;
      }
      // Admins and moderators can delete any content
      return true;
    }
  }
];

/**
 * Check if a user has permission for a resource action
 */
export async function checkPermission(
  request: FastifyRequest,
  resource: string,
  action: string
): Promise<boolean> {
  try {
    // Anonymous users have limited access
    if (!request.user) {
      const anonymousRule = defaultAccessRules.find(rule => 
        rule.resource === resource && 
        rule.actions.includes(action) && 
        rule.roles.includes('anonymous')
      );
      
      return !!anonymousRule;
    }
    
    // Find applicable rules
    const matchingRules = defaultAccessRules.filter(rule => 
      rule.resource === resource && 
      rule.actions.includes(action) && 
      rule.roles.includes(request.user.role)
    );
    
    // If no matching rules, access denied
    if (matchingRules.length === 0) {
      return false;
    }
    
    // Check additional conditions if any
    for (const rule of matchingRules) {
      if (!rule.condition) {
        return true;
      }
      
      const conditionResult = await Promise.resolve(rule.condition(request));
      
      if (conditionResult) {
        return true;
      }
    }
    
    return false;
  } catch (error) {
    logger.error('Error checking permission', { error, resource, action });
    return false;
  }
}

/**
 * Create middleware to check permission for a resource action
 */
export function requirePermission(resource: string, action: string) {
  return async function permissionMiddleware(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      // Check for authentication if not anonymous access
      const anonymousAllowed = defaultAccessRules.some(rule => 
        rule.resource === resource && 
        rule.actions.includes(action) && 
        rule.roles.includes('anonymous')
      );
      
      if (!anonymousAllowed && !request.user) {
        throw new UnauthorizedError('Authentication required');
      }
      
      // Check permission
      const hasPermission = await checkPermission(request, resource, action);
      
      if (!hasPermission) {
        // Audit the access denied event
        await auditService.logEvent({
          userId: request.user?.id || 'anonymous',
          action: AuditAction.ADMIN_ACTION,
          resource: AuditResource.AUTHENTICATION,
          ip: request.ip,
          userAgent: request.headers['user-agent'],
          status: 'failure',
          metadata: {
            type: 'access_denied',
            resource,
            action,
            url: request.url
          }
        });
        
        throw new ForbiddenError(`Access denied for ${action} on ${resource}`);
      }
    } catch (error) {
      if (error instanceof UnauthorizedError || error instanceof ForbiddenError) {
        throw error;
      }
      
      logger.error('Error in permission middleware', { error, resource, action });
      throw new ForbiddenError('Access control error');
    }
  };
}

/**
 * Access control middleware for decoding user roles from claims
 */
export async function accessControlMiddleware(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  // Skip for public endpoints
  if (request.url.startsWith('/health') || 
      request.url.startsWith('/api/v1/health') ||
      request.url.startsWith('/api/v1/auth/login') ||
      request.url.startsWith('/api/v1/auth/register')) {
    return;
  }
  
  // Request with no user
  if (!request.user) {
    // Public endpoints that don't require authentication should bypass this middleware
    if (request.method === 'GET' && (
      request.url.startsWith('/api/v1/content') ||
      request.url.startsWith('/api/v1/market')
    )) {
      return;
    }
    
    throw new UnauthorizedError('Authentication required');
  }
  
  // Check for suspended users
  if (request.user.status === 'suspended') {
    throw new ForbiddenError('Account suspended');
  }
}
