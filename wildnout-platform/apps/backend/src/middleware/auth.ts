import { FastifyRequest, FastifyReply } from 'fastify'
import { clerkClient } from '@clerk/fastify'
import { AuthError, ForbiddenError } from '../lib/errors'
import { logger } from '../lib/logger'
import { CircuitBreaker } from '../lib/circuit-breaker'

/**
 * Circuit breaker for authentication operations to handle Clerk service outages
 */
const authCircuitBreaker = new CircuitBreaker('clerk-auth', {
  failureThreshold: 5,      // 5 failures to trip the circuit
  resetTimeout: 30 * 1000,  // 30 seconds before trying again
  timeoutDuration: 5000,    // 5 second timeout for operations
  monitorIntervalMs: 10000, // Check circuit health every 10 seconds
})

/**
 * Cache for user permissions to reduce load on auth service
 * Uses Redis if available, otherwise falls back to in-memory cache
 */
class PermissionCache {
  private memoryCache: Map<string, { permissions: string[], timestamp: number }> = new Map()
  private cacheTtl: number = 5 * 60 * 1000 // 5 minutes in ms

  /**
   * Get permissions from cache
   */
  async get(userId: string): Promise<string[] | null> {
    const cached = this.memoryCache.get(userId)
    
    if (!cached) return null
    
    // Check if cache entry has expired
    if (cached.timestamp + this.cacheTtl < Date.now()) {
      this.memoryCache.delete(userId)
      return null
    }
    
    return cached.permissions
  }

  /**
   * Store permissions in cache
   */
  async set(userId: string, permissions: string[]): Promise<void> {
    this.memoryCache.set(userId, {
      permissions,
      timestamp: Date.now()
    })
  }

  /**
   * Clear permissions from cache
   */
  async invalidate(userId: string): Promise<void> {
    this.memoryCache.delete(userId)
  }
}

// Create singleton instance
const permissionCache = new PermissionCache()

/**
 * Extracts the auth token from request headers
 */
function extractToken(request: FastifyRequest): string | null {
  const authHeader = request.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }
  
  return authHeader.substring(7) // Remove 'Bearer ' prefix
}

/**
 * Verifies a Clerk JWT token and extracts user information
 */
async function verifyToken(token: string): Promise<{ userId: string, claims: Record<string, any> }> {
  try {
    // Verify the token using Clerk
    const { sub: userId, ...claims } = await clerkClient.verifyToken(token)
    
    if (!userId) {
      throw new AuthError('Invalid user ID in token')
    }
    
    return { userId, claims }
  } catch (error) {
    logger.error({ err: error }, 'Token verification failed')
    throw new AuthError('Invalid authentication token')
  }
}

/**
 * Authentication middleware for Fastify routes
 */
export async function authenticate(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const token = extractToken(request)
    
    if (!token) {
      throw new AuthError('Authentication required')
    }
    
    // Use circuit breaker pattern for token verification
    const { userId, claims } = await authCircuitBreaker.execute(() => verifyToken(token))
    
    // Add user information to request for downstream handlers
    request.userId = userId
    request.auth = { userId, claims }
    
    logger.debug({ userId }, 'User authenticated successfully')
    
  } catch (error) {
    if (error instanceof AuthError) {
      throw error
    }
    
    logger.error({ err: error, path: request.url }, 'Authentication error')
    throw new AuthError('Authentication failed')
  }
}

/**
 * Gets user permissions from cache or Clerk
 * @param userId - User ID to get permissions for
 * @returns Array of permission strings
 */
async function getUserPermissions(userId: string): Promise<string[]> {
  // Check cache first
  const cachedPermissions = await permissionCache.get(userId)
  if (cachedPermissions) {
    return cachedPermissions
  }
  
  try {
    // Get user from Clerk
    const user = await authCircuitBreaker.execute(() => 
      clerkClient.users.getUser(userId)
    )
    
    // Extract roles from public metadata
    const roles = user.publicMetadata?.roles || []
    
    // Get permissions for roles (simplified example - would be more complex in real implementation)
    // This would typically involve a database lookup or similar
    const permissions = await getPermissionsForRoles(roles as string[])
    
    // Cache permissions
    await permissionCache.set(userId, permissions)
    
    return permissions
  } catch (error) {
    logger.error({ err: error, userId }, 'Failed to get user permissions')
    throw new AuthError('Failed to verify user permissions')
  }
}

/**
 * Map roles to permissions (simplified example)
 * In a real application, this would likely involve a database lookup
 */
async function getPermissionsForRoles(roles: string[]): Promise<string[]> {
  // Role to permission mapping (simplified example)
  const rolePermissions: Record<string, string[]> = {
    'admin': [
      'battle:create', 'battle:update', 'battle:delete', 'battle:read',
      'content:create', 'content:update', 'content:delete', 'content:read',
      'user:update', 'user:read',
      'token:admin'
    ],
    'moderator': [
      'battle:read',
      'content:read', 'content:update', 'content:delete',
      'user:read'
    ],
    'creator': [
      'battle:create', 'battle:read',
      'content:create', 'content:update', 'content:read',
      'user:read'
    ],
    'user': [
      'battle:read',
      'content:create', 'content:read',
      'user:read'
    ]
  }
  
  // Collect all permissions from all roles
  let permissions: string[] = []
  for (const role of roles) {
    if (rolePermissions[role]) {
      permissions = [...permissions, ...rolePermissions[role]]
    }
  }
  
  // Deduplicate permissions
  return [...new Set(permissions)]
}

/**
 * Authorization middleware for permission-based access control
 * @param requiredPermission - Permission required to access the route
 */
export function requirePermission(requiredPermission: string) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const { userId } = request
    
    if (!userId) {
      throw new AuthError('Authentication required')
    }
    
    // Get user permissions
    const permissions = await getUserPermissions(userId)
    
    // Check if user has the required permission
    if (!permissions.includes(requiredPermission)) {
      logger.warn({ userId, requiredPermission, userPermissions: permissions }, 'Permission denied')
      throw new ForbiddenError('Insufficient permissions')
    }
    
    logger.debug({ userId, permission: requiredPermission }, 'Permission granted')
  }
}

/**
 * Role-based authorization middleware
 * @param roles - Array of allowed roles
 */
export function requireRole(roles: string[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const { userId } = request
    
    if (!userId) {
      throw new AuthError('Authentication required')
    }
    
    try {
      // Get user from Clerk
      const user = await authCircuitBreaker.execute(() => 
        clerkClient.users.getUser(userId)
      )
      
      // Extract roles from public metadata
      const userRoles = user.publicMetadata?.roles || []
      
      // Check if user has any of the required roles
      const hasRole = roles.some(role => (userRoles as string[]).includes(role))
      
      if (!hasRole) {
        logger.warn({ userId, requiredRoles: roles, userRoles }, 'Role access denied')
        throw new ForbiddenError('Insufficient role permissions')
      }
      
      logger.debug({ userId, roles }, 'Role access granted')
      
    } catch (error) {
      if (error instanceof ForbiddenError) {
        throw error
      }
      
      logger.error({ err: error, userId }, 'Failed to verify user roles')
      throw new AuthError('Failed to verify user roles')
    }
  }
}

/**
 * Resource ownership middleware
 * Verifies that the authenticated user owns the requested resource
 * @param getOwnerId - Function to extract owner ID from request
 */
export function requireOwnership(getOwnerId: (request: FastifyRequest) => Promise<string | null>) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const { userId } = request
    
    if (!userId) {
      throw new AuthError('Authentication required')
    }
    
    try {
      // Get owner ID for the requested resource
      const ownerId = await getOwnerId(request)
      
      // If resource has no owner or owner matches the authenticated user
      if (ownerId && ownerId !== userId) {
        logger.warn({ userId, ownerId, path: request.url }, 'Ownership verification failed')
        throw new ForbiddenError('You do not have permission to access this resource')
      }
      
      logger.debug({ userId, path: request.url }, 'Ownership verified')
      
    } catch (error) {
      if (error instanceof ForbiddenError) {
        throw error
      }
      
      logger.error({ err: error, userId, path: request.url }, 'Failed to verify resource ownership')
      throw new ForbiddenError('Failed to verify resource ownership')
    }
  }
}

// Extend FastifyRequest with auth properties
declare module 'fastify' {
  interface FastifyRequest {
    userId: string
    auth?: {
      userId: string
      claims: Record<string, any>
    }
    user?: any
  }
}
