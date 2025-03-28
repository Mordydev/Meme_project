import { FastifyRequest, FastifyReply } from 'fastify';
import { getRolePermissions } from './roles';
import { ForbiddenError } from '../../lib/errors';
import { redisClient } from '../../lib/redis-client';
import { logger } from '../../lib/logger';

/**
 * Cache TTL for permission checks (5 minutes)
 */
const PERMISSION_CACHE_TTL = 5 * 60; // seconds

/**
 * Check if a user has a specific permission
 */
export async function hasPermission(userId: string, permission: string): Promise<boolean> {
  try {
    // Try to get from cache first
    const cacheKey = `perm:${userId}:${permission}`;
    const cached = await redisClient.get(cacheKey);
    
    if (cached !== null) {
      return cached === 'true';
    }
    
    // Get user's roles from database or service
    // This is a placeholder - in production, implement proper role retrieval
    const userRoles = await getUserRoles(userId);
    
    // Check if any role grants the permission
    for (const roleId of userRoles) {
      const rolePermissions = getRolePermissions(roleId);
      
      if (rolePermissions.includes(permission)) {
        // Cache positive result
        await redisClient.set(cacheKey, 'true', PERMISSION_CACHE_TTL);
        return true;
      }
    }
    
    // Cache negative result
    await redisClient.set(cacheKey, 'false', PERMISSION_CACHE_TTL);
    return false;
  } catch (error) {
    logger.error('Permission check error', { userId, permission, error });
    return false;
  }
}

/**
 * Get a user's roles
 * This is a placeholder - in production, implement proper role retrieval from database
 */
async function getUserRoles(userId: string): Promise<string[]> {
  try {
    // In production, fetch from database
    // For now, everyone gets the 'user' role
    return ['user'];
  } catch (error) {
    logger.error('Error fetching user roles', { userId, error });
    return [];
  }
}

/**
 * Middleware to check if a user has a specific permission
 */
export function requirePermission(permission: string | string[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.user) {
      throw new ForbiddenError('Authentication required');
    }
    
    const permissions = Array.isArray(permission) ? permission : [permission];
    
    // Check if user has any of the required permissions
    for (const perm of permissions) {
      const hasAccess = await hasPermission(request.user.id, perm);
      
      if (hasAccess) {
        return;
      }
    }
    
    // If we get here, the user doesn't have any of the required permissions
    throw new ForbiddenError(
      `Missing required permission: ${Array.isArray(permission) ? permission.join(', ') : permission}`
    );
  };
}

/**
 * Check if user is owner of a resource
 */
export function isResourceOwner(resourceUserId: string, currentUserId: string): boolean {
  return resourceUserId === currentUserId;
}

/**
 * Middleware to ensure user is owner of a resource or has specified permission
 */
export function requireOwnershipOrPermission(
  getUserIdFromRequest: (request: FastifyRequest) => string | Promise<string>,
  permission: string
) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.user) {
      throw new ForbiddenError('Authentication required');
    }
    
    try {
      // Get the resource owner's ID
      const resourceUserId = await getUserIdFromRequest(request);
      
      // Check if user is the owner
      if (isResourceOwner(resourceUserId, request.user.id)) {
        return;
      }
      
      // If not the owner, check for permission
      const hasAccess = await hasPermission(request.user.id, permission);
      
      if (!hasAccess) {
        throw new ForbiddenError('Insufficient permissions');
      }
    } catch (error) {
      if (error instanceof ForbiddenError) {
        throw error;
      }
      
      logger.error('Error in ownership check', { error });
      throw new ForbiddenError('Permission check failed');
    }
  };
}
