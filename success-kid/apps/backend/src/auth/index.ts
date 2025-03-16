/**
 * Authentication and Authorization Module
 * 
 * Main export for auth functionality
 */

// Export all auth modules
export * from './clerk';
export * from './jwt';
export * from './rbac';
export * from './verification';
export * from './rate-limiting';
export * from './audit';
export * from './onboarding';

// Re-export middleware for convenience
import { authMiddleware as clerkAuth } from './clerk/middleware';
import { jwtAuthMiddleware as jwtAuth } from './jwt/middleware';

/**
 * Unified auth middleware that supports both Clerk and JWT
 * Uses Clerk by default, falls back to JWT if Clerk is not available
 */
export function authMiddleware(options: any = { required: true }) {
  return async (request: any, reply: any) => {
    const authHeader = request.headers.authorization;
    
    if (!authHeader) {
      // No auth header, use the Clerk middleware with the specified options
      return clerkAuth(options)(request, reply);
    }
    
    if (authHeader.startsWith('Bearer ')) {
      // Try to determine if this is a Clerk token or a JWT
      // This is a simplified approach - in production, you might want more
      // sophisticated detection
      const token = authHeader.split(' ')[1];
      
      try {
        // Clerk tokens are JWTs too, but we can check the payload structure
        // to determine if it's a Clerk token or our own JWT
        const decoded = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
        
        // Clerk tokens typically have these fields
        if (decoded.azp || decoded.sid) {
          return clerkAuth(options)(request, reply);
        } else {
          // Assume it's our JWT
          return jwtAuth(options)(request, reply);
        }
      } catch (error) {
        // If we can't decode the token, default to Clerk
        return clerkAuth(options)(request, reply);
      }
    }
    
    // Unknown auth type, default to Clerk
    return clerkAuth(options)(request, reply);
  };
}
