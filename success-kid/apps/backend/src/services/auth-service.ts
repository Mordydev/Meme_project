// Import paths updated based on planned refactoring
import { verifyClerkJWT, ClerkUser } from '../lib/clerk/client'; // Assuming clerk client is moved to lib/clerk
import { sessionService, DeviceInfo, Session } from './session-service'; // Assuming session-service remains here
import { hasPermission } from '../lib/rbac/checks'; // Assuming rbac checks are moved to lib/rbac
import { redisClient } from '../lib/redis/client'; // Use the new Redis client path
import { logger } from '../lib/logger';
import { UnauthorizedError } from '../lib/errors'; // Assuming errors lib exists

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
      // Verify token using the function from lib/clerk
      const user = await verifyClerkJWT(token);

      // Create session using the imported sessionService
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
    // Use the function imported from lib/rbac
    return hasPermission(userId, permission);
  }

  /**
   * Get all active sessions for a user
   *
   * @param userId User ID
   * @returns List of active sessions
   */
  async getUserSessions(userId: string): Promise<Session[]> {
    // Use the imported sessionService
    return sessionService.getUserSessions(userId);
  }

  /**
   * Revoke a specific session
   *
   * @param sessionId Session ID
   * @param requesterId User ID making the request (for security validation)
   */
  async revokeSession(sessionId: string, requesterId: string): Promise<void> {
    // Get session to check ownership using the imported sessionService
    const session = await sessionService.getSession(sessionId);

    if (!session) {
      return;
    }

    // Security check: Only allow users to revoke their own sessions
    // unless they have admin permissions (checked in route handler)
    if (session.userId !== requesterId) {
      throw new UnauthorizedError('Cannot revoke another user\'s session');
    }

    // Use the imported sessionService
    await sessionService.revokeSession(sessionId);
  }

  /**
   * Revoke all sessions for a user except the current one
   *
   * @param userId User ID
   * @param currentSessionId Current session ID to preserve
   */
  async revokeAllOtherSessions(userId: string, currentSessionId: string): Promise<void> {
    // Use the imported sessionService
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
      const redis = redisClient.getClient(); // Get the ioredis instance

      if (success) {
        // Reset failed attempts on success
        await redis.del(identifierKey);
        await redis.del(ipKey);
        return;
      }

      // Increment failed attempts
      // Use INCR and EXPIRE for atomicity and setting TTL
      const failedAttempts = await redis.incr(identifierKey);
      if (failedAttempts === 1) { // Set expiry only on the first failure in the window
          await redis.expire(identifierKey, 30 * 60); // 30 min expiry
      }

      const ipFailedAttempts = await redis.incr(ipKey);
       if (ipFailedAttempts === 1) { // Set expiry only on the first failure in the window
          await redis.expire(ipKey, 60 * 60); // 1 hour expiry
      }

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
      const redis = redisClient.getClient(); // Get the ioredis instance

      // Get current counts
      const [failedAttemptsStr, ipFailedAttemptsStr] = await redis.mget(identifierKey, ipKey);
      const failedAttempts = parseInt(failedAttemptsStr || '0', 10);
      const ipFailedAttempts = parseInt(ipFailedAttemptsStr || '0', 10);

      // Rate limit after multiple failed attempts
      if (failedAttempts >= 5) {
        logger.info('Login rate limited by identifier', { identifier, failedAttempts });
        return true;
      }

      // Rate limit IPs with excessive failed attempts
      if (ipFailedAttempts >= 20) {
         logger.info('Login rate limited by IP', { ip, ipFailedAttempts });
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
