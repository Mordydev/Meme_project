/**
 * Access Control Middleware
 * 
 * Middleware for enforcing access control policies
 */
import { FastifyRequest, FastifyReply } from 'fastify';
import { SecurityContext } from '../framework/types';
import { logger } from '../../lib/logger';

/**
 * Access control middleware with permission check
 * 
 * @param permission Permission to check
 * @returns Middleware function
 */
export function requirePermission(permission: string) {
  return async function(
    request: FastifyRequest,
    reply: FastifyReply,
    context: SecurityContext
  ): Promise<boolean> {
    try {
      // Skip for development if DISABLE_AUTH is set
      if (process.env.NODE_ENV === 'development' && process.env.DISABLE_AUTH === 'true') {
        request.log.warn('Permission check bypassed in development mode', { permission });
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
            timestamp: new Date().toISOString(),
            requestId: request.id
          }
        });
        
        return false;
      }
      
      // Get RBAC service from container
      const { rbac } = request.diContainer.resolve('auth');
      
      // Check if user has the required permission
      if (!rbac.can(request.user.role, permission)) {
        logger.warn('Permission denied', {
          userId: request.user.id,
          permission,
          role: request.user.role,
          path: request.url
        });
        
        reply.code(403).send({
          data: null,
          errors: [{
            code: 'FORBIDDEN',
            message: 'Insufficient permissions'
          }],
          meta: {
            timestamp: new Date().toISOString(),
            requestId: request.id
          }
        });
        
        return false;
      }
      
      // Update security context with permission information
      context.permission = permission;
      context.accessGranted = true;
      
      return true;
    } catch (error) {
      logger.error('Error checking permission', { error, permission });
      
      reply.code(500).send({
        data: null,
        errors: [{
          code: 'SERVER_ERROR',
          message: 'Failed to verify permissions'
        }],
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        }
      });
      
      return false;
    }
  };
}

/**
 * Resource ownership check middleware
 * 
 * @param paramName Parameter name containing the resource ID
 * @param resourceType Type of resource
 * @param allowAdmin Whether to allow admin access regardless of ownership
 * @returns Middleware function
 */
export function requireOwnership(
  paramName: string,
  resourceType: string,
  allowAdmin: boolean = true
) {
  return async function(
    request: FastifyRequest,
    reply: FastifyReply,
    context: SecurityContext
  ): Promise<boolean> {
    try {
      // Skip for development if DISABLE_AUTH is set
      if (process.env.NODE_ENV === 'development' && process.env.DISABLE_AUTH === 'true') {
        request.log.warn('Ownership check bypassed in development mode', { resourceType, paramName });
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
            timestamp: new Date().toISOString(),
            requestId: request.id
          }
        });
        
        return false;
      }
      
      // Get resource ID from parameters
      const resourceId = (request.params as any)[paramName];
      
      if (!resourceId) {
        logger.warn('Resource ID not found in parameters', {
          paramName,
          resourceType,
          params: request.params
        });
        
        reply.code(400).send({
          data: null,
          errors: [{
            code: 'INVALID_PARAMETER',
            message: `Resource ID not provided in '${paramName}'`
          }],
          meta: {
            timestamp: new Date().toISOString(),
            requestId: request.id
          }
        });
        
        return false;
      }
      
      // Get RBAC service from container
      const { rbac } = request.diContainer.resolve('auth');
      
      // Check if user is admin
      if (allowAdmin && rbac.can(request.user.role, 'admin')) {
        // Admins bypass ownership check
        context.adminAccess = true;
        return true;
      }
      
      // Get resource repository
      const resourceRepository = getResourceRepository(resourceType, request);
      
      if (!resourceRepository) {
        logger.error('Resource repository not found', { resourceType });
        
        reply.code(500).send({
          data: null,
          errors: [{
            code: 'SERVER_ERROR',
            message: 'Internal server error'
          }],
          meta: {
            timestamp: new Date().toISOString(),
            requestId: request.id
          }
        });
        
        return false;
      }
      
      // Check resource ownership
      const isOwner = await resourceRepository.isOwner(resourceId, request.user.id);
      
      if (!isOwner) {
        logger.warn('Ownership check failed', {
          userId: request.user.id,
          resourceType,
          resourceId
        });
        
        reply.code(403).send({
          data: null,
          errors: [{
            code: 'FORBIDDEN',
            message: 'Resource access denied'
          }],
          meta: {
            timestamp: new Date().toISOString(),
            requestId: request.id
          }
        });
        
        return false;
      }
      
      // Update security context with ownership information
      context.resourceOwner = true;
      context.resourceType = resourceType;
      context.resourceId = resourceId;
      
      return true;
    } catch (error) {
      logger.error('Error checking resource ownership', {
        error,
        resourceType,
        paramName
      });
      
      reply.code(500).send({
        data: null,
        errors: [{
          code: 'SERVER_ERROR',
          message: 'Failed to verify resource access'
        }],
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.id
        }
      });
      
      return false;
    }
  };
}

/**
 * Get resource repository by type
 * 
 * @param resourceType Resource type
 * @param request Fastify request (to get dependency container)
 * @returns Resource repository or undefined if not found
 */
function getResourceRepository(resourceType: string, request: FastifyRequest): any {
  // Get repository based on resource type
  switch (resourceType) {
    case 'user':
      return request.diContainer.resolve('userRepository');
      
    case 'content':
      return request.diContainer.resolve('contentRepository');
      
    case 'comment':
      return request.diContainer.resolve('commentRepository');
      
    case 'profile':
      return request.diContainer.resolve('profileRepository');
      
    default:
      logger.warn('Unknown resource type', { resourceType });
      return undefined;
  }
}
