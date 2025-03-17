/**
 * Authentication Middleware
 * 
 * Provides middleware functions for authentication and authorization
 */
import { FastifyRequest, FastifyReply } from 'fastify';
import { getRedisClient } from '../lib/db-client';
import { logger } from '../lib/logger';

/**
 * Check if a user has a specific permission
 */
export function checkPermission(permission: string) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // Skip for development if DISABLE_AUTH is set
      if (process.env.NODE_ENV === 'development' && process.env.DISABLE_AUTH === 'true') {
        request.log.warn('Auth check bypassed in development mode', { permission });
        return;
      }
      
      // Check if user is authenticated
      if (!request.user) {
        return reply.code(401).send({
          data: null,
          errors: [{
            code: 'UNAUTHORIZED',
            message: 'Authentication required'
          }],
          meta: {
            timestamp: new Date().toISOString()
          }
        });
      }
      
      // Check if user has the required permission
      const { rbac } = request.diContainer.resolve('auth');
      
      if (!rbac.can(request.user.role, permission)) {
        return reply.code(403).send({
          data: null,
          errors: [{
            code: 'FORBIDDEN',
            message: 'Insufficient permissions'
          }],
          meta: {
            timestamp: new Date().toISOString()
          }
        });
      }
    } catch (error) {
      request.log.error('Error checking permission', { error, permission });
      
      return reply.code(500).send({
        data: null,
        errors: [{
          code: 'SERVER_ERROR',
          message: 'Failed to verify permissions'
        }],
        meta: {
          timestamp: new Date().toISOString()
        }
      });
    }
  };
}

/**
 * Check for admin access
 */
export function checkAdminAccess(resource: string = 'admin') {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // Skip for development if DISABLE_AUTH is set
      if (process.env.NODE_ENV === 'development' && process.env.DISABLE_AUTH === 'true') {
        request.log.warn('Admin check bypassed in development mode', { resource });
        
        // Set admin role for testing
        if (!request.user) {
          request.user = {
            id: 'dev-admin',
            role: 'admin'
          };
        }
        
        return;
      }
      
      // Check if user is authenticated
      if (!request.user) {
        return reply.code(401).send({
          data: null,
          errors: [{
            code: 'UNAUTHORIZED',
            message: 'Authentication required'
          }],
          meta: {
            timestamp: new Date().toISOString()
          }
        });
      }
      
      // Check if user has admin role for the resource
      const { rbac } = request.diContainer.resolve('auth');
      
      if (!rbac.can(request.user.role, `${resource}`)) {
        return reply.code(403).send({
          data: null,
          errors: [{
            code: 'FORBIDDEN',
            message: 'Admin access required'
          }],
          meta: {
            timestamp: new Date().toISOString()
          }
        });
      }
    } catch (error) {
      request.log.error('Error checking admin access', { error, resource });
      
      return reply.code(500).send({
        data: null,
        errors: [{
          code: 'SERVER_ERROR',
          message: 'Failed to verify admin access'
        }],
        meta: {
          timestamp: new Date().toISOString()
        }
      });
    }
  };
}

/**
 * Verify user is authenticated
 */
export function requireAuth(request: FastifyRequest, reply: FastifyReply) {
  try {
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
      
      return;
    }
    
    // Check if user is authenticated
    if (!request.user) {
      return reply.code(401).send({
        data: null,
        errors: [{
          code: 'UNAUTHORIZED',
          message: 'Authentication required'
        }],
        meta: {
          timestamp: new Date().toISOString()
        }
      });
    }
  } catch (error) {
    request.log.error('Error checking authentication', { error });
    
    return reply.code(500).send({
      data: null,
      errors: [{
        code: 'SERVER_ERROR',
        message: 'Failed to verify authentication'
      }],
      meta: {
        timestamp: new Date().toISOString()
      }
    });
  }
}
