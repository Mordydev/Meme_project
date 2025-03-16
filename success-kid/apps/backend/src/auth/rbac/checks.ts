/**
 * RBAC Permission Checking Utilities
 * 
 * Functions for checking permissions and roles
 */
import { logger } from '../../lib/logger';
import { Permission } from '../../models/role';
import { redis } from '../../lib/redis';

/**
 * Cache key prefix for permission checks
 */
const PERMISSION_CACHE_PREFIX = 'permission:check:';

/**
 * Cache TTL for permission checks (5 minutes)
 */
const PERMISSION_CACHE_TTL = 300;

/**
 * Check if a user has a specific permission
 */
export async function checkPermission(
  userId: string,
  resource: string,
  action: string,
  organizationId?: string,
  permissions?: Permission[]
): Promise<boolean> {
  try {
    // Generate cache key
    const cacheKey = `${PERMISSION_CACHE_PREFIX}${userId}:${resource}:${action}:${organizationId || 'global'}`;
    
    // Check cache first
    const cachedResult = await redis.get(cacheKey);
    
    if (cachedResult !== null) {
      return cachedResult === '1';
    }
    
    // If permissions are provided, use them directly
    // Otherwise, they should be fetched from the database by the auth service
    if (!permissions || permissions.length === 0) {
      // No permissions to check - defer to auth service
      return false;
    }
    
    // Check for exact permission
    const hasExactPermission = permissions.some(
      p => p.resource === resource && p.action === action
    );
    
    if (hasExactPermission) {
      // Cache the result
      await redis.setex(cacheKey, PERMISSION_CACHE_TTL, '1');
      return true;
    }
    
    // Check for wildcard "manage" permission for the resource
    const hasManagePermission = permissions.some(
      p => p.resource === resource && p.action === 'manage'
    );
    
    if (hasManagePermission) {
      // Cache the result
      await redis.setex(cacheKey, PERMISSION_CACHE_TTL, '1');
      return true;
    }
    
    // Check for resource wildcard permission
    const hasResourceWildcard = permissions.some(
      p => p.resource === '*' && (p.action === action || p.action === '*')
    );
    
    if (hasResourceWildcard) {
      // Cache the result
      await redis.setex(cacheKey, PERMISSION_CACHE_TTL, '1');
      return true;
    }
    
    // Check for global admin permission
    const hasGlobalAdmin = permissions.some(
      p => p.resource === '*' && p.action === '*'
    );
    
    if (hasGlobalAdmin) {
      // Cache the result
      await redis.setex(cacheKey, PERMISSION_CACHE_TTL, '1');
      return true;
    }
    
    // No matching permission found
    // Cache the negative result
    await redis.setex(cacheKey, PERMISSION_CACHE_TTL, '0');
    return false;
  } catch (error) {
    logger.error('Error checking permission', { error, userId, resource, action });
    return false;
  }
}

/**
 * Invalidate permission cache for a user
 */
export async function invalidatePermissionCache(userId: string): Promise<void> {
  try {
    // Find all keys matching the user's permission cache
    const keys = await redis.keys(`${PERMISSION_CACHE_PREFIX}${userId}:*`);
    
    if (keys.length > 0) {
      // Delete all keys
      await redis.del(...keys);
    }
  } catch (error) {
    logger.error('Error invalidating permission cache', { error, userId });
  }
}

/**
 * Check condition for permission
 * This is for permissions that have conditions, like "own" resources
 */
export function checkPermissionCondition(
  permission: Permission,
  resourceOwnerId: string,
  userId: string
): boolean {
  // If no conditions, permission applies
  if (!permission.conditions) return true;
  
  // Check "own" condition
  if (permission.conditions.own === true) {
    return resourceOwnerId === userId;
  }
  
  // Add more condition checks as needed
  
  // Default to true if no conditions matched
  return true;
}
