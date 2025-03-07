import { FastifyRequest, FastifyReply } from 'fastify'
import { clerkClient } from '@clerk/fastify'
import { AuthError } from '../lib/errors'
import { logger } from '../lib/logger'

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
async function verifyToken(token: string) {
  try {
    const { sub: userId, ...claims } = await clerkClient.verifyToken(token)
    return { userId, claims }
  } catch (error) {
    logger.error(error, 'Token verification failed')
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
    
    const { userId, claims } = await verifyToken(token)
    
    if (!userId) {
      throw new AuthError('Invalid user ID in token')
    }
    
    // Add user information to request for downstream handlers
    request.userId = userId
    request.auth = { userId, claims }
    
    // Optional: Fetch additional user data if needed
    // const user = await clerkClient.users.getUser(userId)
    // request.user = user
    
  } catch (error) {
    if (error instanceof AuthError) {
      throw error
    }
    
    logger.error(error, 'Authentication error')
    throw new AuthError('Authentication failed')
  }
}

/**
 * Role-based authorization middleware
 * @param roles - Array of allowed roles
 */
export function authorize(roles: string[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const userRoles = request.auth?.claims?.roles || []
    
    const hasRole = roles.some(role => userRoles.includes(role))
    
    if (!hasRole) {
      throw new AuthError('Insufficient permissions')
    }
  }
}

// Extend FastifyRequest with auth properties
declare module 'fastify' {
  interface FastifyRequest {
    userId?: string
    auth?: {
      userId: string
      claims: Record<string, any>
    }
    user?: any
  }
}
