import { verifyClerkJWT, ClerkUser } from './clerk/client';
import { sessionService, DeviceInfo, Session } from '../services/session-service';
import { hasPermission } from './rbac/checks';
import { redisClient } from '../lib/redis-client';
import { logger } from '../lib/logger';
import { UnauthorizedError } from '../lib/errors';

/**
 * Auth service for centralized authentication and authorization
 */
export class AuthService {
  // Rate limiting counter key prefix
  private static readonly RATE_LIMIT_PREFIX = 'rate:auth:';
  
  /**
   * Verify a JWT token and create a session
   * 
   * @param token JWT token to verify
   * @param deviceInfo Device information for session tracking
   * @returns User information and session
   */
  async authenticateToken(token: string, deviceInfo: DeviceInfo): Promise<{ user: ClerkUser; session: Session }> {
    try {
      // Verify token
      const user = await verifyClerkJWT(token);
      
      // Create session
      const session = await sessionService.createSession(user.id, deviceInfo);
      
      return { user, session };
    } catch (error) {
      logger.error('Token authentication failed', { error });
      throw new UnauthorizedError('Invalid authentication token');
    }
  }
  
  /**
   * Check if a user has a specific permission
   * 
   * @param userId User ID
   * @param permission Permission ID
   * @returns Whether the user has the permission
   */
  async hasPermission(userId: string, permission: string): Promise<boolean> {
    return hasPermission(userId, permission);
  }
  
  /**
   * Get all active sessions for a user
   * 
   * @param userId User ID
   * @returns List of active sessions
   */
  async getUserSessions(userId: string): Promise<Session[]> {
    return sessionService.getUserSessions(userId);
  }
  
  /**
   * Revoke a specific session
   * 
   * @param sessionId Session ID
   * @param requesterId User ID making the request (for security validation)
   */
  async revokeSession(sessionId: string, requesterId: string): Promise<void> {
    // Get session to check ownership
    const session = await sessionService.getSession(sessionId);
    
    if (!session) {
      return;
    }
    
    // Security check: Only allow users to revoke their own sessions
    // unless they have admin permissions (checked in route handler)
    if (session.userId !== requesterId) {
      throw new UnauthorizedError('Cannot revoke another user\'s session');
    }
    
    await sessionService.revokeSession(sessionId);
  }
  
  /**
   * Revoke all sessions for a user except the current one
   * 
   * @param userId User ID
   * @param currentSessionId Current session ID to preserve
   */
  async revokeAllOtherSessions(userId: string, currentSessionId: string): Promise<void> {
    await sessionService.revokeAllUserSessions(userId, currentSessionId);
  }
  
  /**
   * Handle login attempt (for rate limiting and security)
   * 
   * @param identifier User identifier (email, username)
   * @param success Whether the login was successful
   * @param ip IP address of the request
   */
  async handleLoginAttempt(identifier: string, success: boolean, ip: string): Promise<void> {
    try {
      const identifierKey = `${AuthService.RATE_LIMIT_PREFIX}${identifier}`;
      const ipKey = `${AuthService.RATE_LIMIT_PREFIX}${ip}`;
      
      if (success) {
        // Reset failed attempts on success
        await redisClient.del(identifierKey);
        await redisClient.del(ipKey);
        return;
      }
      
      // Increment failed attempts
      let failedAttempts = parseInt(await redisClient.get(identifierKey) || '0', 10) + 1;
      await redisClient.set(identifierKey, failedAttempts.toString(), 30 * 60); // 30 min expiry
      
      let ipFailedAttempts = parseInt(await redisClient.get(ipKey) || '0', 10) + 1;
      await redisClient.set(ipKey, ipFailedAttempts.toString(), 60 * 60); // 1 hour expiry
      
      // Log suspicious activity after threshold
      if (failedAttempts >= 5 || ipFailedAttempts >= 10) {
        logger.warn('Suspicious login activity detected', {
          identifier,
          ip,
          failedAttempts,
          ipFailedAttempts
        });
      }
    } catch (error) {
      logger.error('Error handling login attempt', { identifier, ip, error });
    }
  }
  
  /**
   * Check if login attempts are rate limited
   * 
   * @param identifier User identifier (email, username)
   * @param ip IP address of the request
   * @returns Whether login is allowed
   */
  async isLoginRateLimited(identifier: string, ip: string): Promise<boolean> {
    try {
      const identifierKey = `${AuthService.RATE_LIMIT_PREFIX}${identifier}`;
      const ipKey = `${AuthService.RATE_LIMIT_PREFIX}${ip}`;
      
      const failedAttempts = parseInt(await redisClient.get(identifierKey) || '0', 10);
      const ipFailedAttempts = parseInt(await redisClient.get(ipKey) || '0', 10);
      
      // Rate limit after multiple failed attempts
      if (failedAttempts >= 5) {
        return true;
      }
      
      // Rate limit IPs with excessive failed attempts
      if (ipFailedAttempts >= 20) {
        return true;
      }
      
      return false;
    } catch (error) {
      logger.error('Error checking rate limit', { identifier, ip, error });
      return false; // Don't rate limit on internal errors
    }
  }
}

// Export singleton instance
export const authService = new AuthService();
