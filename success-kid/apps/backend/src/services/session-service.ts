/**
 * Session Service
 * 
 * Handles session management and token operations
 */
import { SignJWT, jwtVerify } from 'jose';
import { randomUUID } from 'crypto';
import { redis, redisHelpers } from '../lib/redis';
import { logger } from '../lib/logger';
import { isTokenRevoked } from '../lib/clerk';
import { 
  Session, 
  TokenPair, 
  CreateSessionInput,
  TokenPayload,
  TokenVerificationResult,
  DeviceInfo
} from '../models/session';
import { env } from '../config/environment';

// Constants for token settings
const ACCESS_TOKEN_TTL = 15 * 60; // 15 minutes in seconds
const REFRESH_TOKEN_TTL = 30 * 24 * 60 * 60; // 30 days in seconds
const SESSION_TTL = REFRESH_TOKEN_TTL; // Match refresh token lifetime

// JWT signing key - in production, use a secure key management service
const JWT_SECRET = new TextEncoder().encode(
  env.JWT_SECRET || 'do-not-use-this-key-in-production-environment'
);

/**
 * Extracts device information from user agent
 */
function extractDeviceInfo(userAgent?: string): DeviceInfo {
  // Basic implementation - in production use a more robust library
  const deviceInfo: DeviceInfo = {
    type: 'unknown',
    browser: 'unknown',
    os: 'unknown'
  };
  
  if (!userAgent) return deviceInfo;
  
  // Simple mobile detection
  if (/mobile|android|iphone|ipad|ipod/i.test(userAgent)) {
    deviceInfo.type = 'mobile';
  } else if (/tablet|ipad/i.test(userAgent)) {
    deviceInfo.type = 'tablet';
  } else {
    deviceInfo.type = 'desktop';
  }
  
  // Simple OS detection
  if (/windows/i.test(userAgent)) {
    deviceInfo.os = 'Windows';
  } else if (/macintosh|mac os/i.test(userAgent)) {
    deviceInfo.os = 'MacOS';
  } else if (/android/i.test(userAgent)) {
    deviceInfo.os = 'Android';
  } else if (/iphone|ipad|ipod/i.test(userAgent)) {
    deviceInfo.os = 'iOS';
  } else if (/linux/i.test(userAgent)) {
    deviceInfo.os = 'Linux';
  }
  
  // Simple browser detection
  if (/chrome/i.test(userAgent) && !/edg/i.test(userAgent)) {
    deviceInfo.browser = 'Chrome';
  } else if (/firefox/i.test(userAgent)) {
    deviceInfo.browser = 'Firefox';
  } else if (/safari/i.test(userAgent) && !/chrome/i.test(userAgent)) {
    deviceInfo.browser = 'Safari';
  } else if (/edg/i.test(userAgent)) {
    deviceInfo.browser = 'Edge';
  } else if (/msie|trident/i.test(userAgent)) {
    deviceInfo.browser = 'Internet Explorer';
  }
  
  return deviceInfo;
}

/**
 * Session Service class
 */
export class SessionService {
  /**
   * Create a new session
   */
  async createSession(input: CreateSessionInput): Promise<Session> {
    try {
      const sessionId = randomUUID();
      const now = new Date();
      const expiresAt = new Date(now.getTime() + SESSION_TTL * 1000);
      
      const deviceInfo = extractDeviceInfo(input.user_agent);
      
      const session: Session = {
        id: sessionId,
        user_id: input.user_id,
        created_at: now,
        expires_at: expiresAt,
        last_active_at: now,
        ip_address: input.ip_address,
        user_agent: input.user_agent,
        device_info: deviceInfo
      };
      
      // Store session in Redis
      await redisHelpers.setJson(
        `session:${sessionId}`,
        session,
        SESSION_TTL
      );
      
      // Add to user's sessions set
      await redis.sadd(`user:${input.user_id}:sessions`, sessionId);
      
      return session;
    } catch (error) {
      logger.error('Error creating session', { error, userId: input.user_id });
      throw error;
    }
  }
  
  /**
   * Generate token pair (access and refresh tokens)
   */
  async generateTokens(
    userId: string, 
    sessionId: string, 
    roles: string[] = [],
    permissions: string[] = []
  ): Promise<TokenPair> {
    try {
      const now = Math.floor(Date.now() / 1000);
      
      // Create payload for access token
      const payload: TokenPayload = {
        sub: userId,
        jti: sessionId,
        roles,
        perms: permissions,
        iat: now,
        exp: now + ACCESS_TOKEN_TTL
      };
      
      // Create access token
      const accessToken = await new SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setExpirationTime(now + ACCESS_TOKEN_TTL)
        .setIssuedAt(now)
        .setJti(sessionId)
        .sign(JWT_SECRET);
      
      // Create refresh token
      const refreshToken = await new SignJWT({
        sub: userId,
        jti: sessionId,
        iat: now,
        exp: now + REFRESH_TOKEN_TTL
      })
        .setProtectedHeader({ alg: 'HS256' })
        .setExpirationTime(now + REFRESH_TOKEN_TTL)
        .setIssuedAt(now)
        .sign(JWT_SECRET);
      
      return {
        access_token: accessToken,
        refresh_token: refreshToken,
        expires_in: ACCESS_TOKEN_TTL
      };
    } catch (error) {
      logger.error('Error generating tokens', { error, userId });
      throw error;
    }
  }
  
  /**
   * Verify a JWT token
   */
  async verifyToken(token: string): Promise<TokenVerificationResult> {
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      
      // Extract necessary fields
      const tokenPayload = payload as unknown as TokenPayload;
      
      // Check if token has been revoked
      if (await isTokenRevoked(tokenPayload.jti)) {
        return { valid: false, error: 'Token has been revoked' };
      }
      
      return { valid: true, payload: tokenPayload };
    } catch (error) {
      logger.debug('Token verification failed', { error });
      return { valid: false, error: 'Invalid or expired token' };
    }
  }
  
  /**
   * Get session by ID
   */
  async getSession(sessionId: string): Promise<Session | null> {
    try {
      return await redisHelpers.getJson<Session>(`session:${sessionId}`);
    } catch (error) {
      logger.error('Error getting session', { error, sessionId });
      throw error;
    }
  }
  
  /**
   * Check if a session is valid
   */
  async validateSession(sessionId: string): Promise<boolean> {
    try {
      const session = await this.getSession(sessionId);
      
      if (!session) return false;
      
      // Check if session is expired
      if (new Date() > new Date(session.expires_at)) {
        await this.deleteSession(sessionId);
        return false;
      }
      
      return true;
    } catch (error) {
      logger.error('Error validating session', { error, sessionId });
      return false;
    }
  }
  
  /**
   * Update session activity
   */
  async updateSessionActivity(sessionId: string): Promise<void> {
    try {
      const session = await this.getSession(sessionId);
      
      if (!session) return;
      
      // Update last active time
      session.last_active_at = new Date();
      
      // Store updated session
      await redisHelpers.setJson(
        `session:${sessionId}`,
        session,
        SESSION_TTL
      );
    } catch (error) {
      logger.error('Error updating session activity', { error, sessionId });
      throw error;
    }
  }
  
  /**
   * Delete a session (logout)
   */
  async deleteSession(sessionId: string): Promise<void> {
    try {
      const session = await this.getSession(sessionId);
      
      if (!session) return;
      
      // Remove from user sessions
      await redis.srem(`user:${session.user_id}:sessions`, sessionId);
      
      // Delete session
      await redis.del(`session:${sessionId}`);
      
      // Add to revoked tokens (short TTL to cover token validity period)
      await redis.setex(`revoked:${sessionId}`, ACCESS_TOKEN_TTL, '1');
      
      // Publish revocation event for connected clients
      await redis.publish('auth:events', JSON.stringify({
        type: 'session_revoked',
        session_id: sessionId,
        user_id: session.user_id,
        reason: 'logout',
        timestamp: new Date().toISOString()
      }));
    } catch (error) {
      logger.error('Error deleting session', { error, sessionId });
      throw error;
    }
  }
  
  /**
   * Delete all sessions for a user (logout everywhere)
   */
  async deleteAllUserSessions(userId: string, currentSessionId?: string): Promise<void> {
    try {
      // Get all user sessions
      const sessionIds = await redis.smembers(`user:${userId}:sessions`);
      
      // Delete each session
      for (const sessionId of sessionIds) {
        // Skip current session if specified
        if (currentSessionId && sessionId === currentSessionId) continue;
        
        await this.deleteSession(sessionId);
      }
      
      // Clear user sessions set if no current session to keep
      if (!currentSessionId) {
        await redis.del(`user:${userId}:sessions`);
      }
    } catch (error) {
      logger.error('Error deleting all user sessions', { error, userId });
      throw error;
    }
  }
  
  /**
   * Get all sessions for a user
   */
  async getUserSessions(userId: string): Promise<Session[]> {
    try {
      // Get all user session IDs
      const sessionIds = await redis.smembers(`user:${userId}:sessions`);
      
      // Get each session
      const sessions: Session[] = [];
      
      for (const sessionId of sessionIds) {
        const session = await this.getSession(sessionId);
        if (session) {
          sessions.push(session);
        } else {
          // Clean up stale session reference
          await redis.srem(`user:${userId}:sessions`, sessionId);
        }
      }
      
      return sessions;
    } catch (error) {
      logger.error('Error getting user sessions', { error, userId });
      throw error;
    }
  }
  
  /**
   * Refresh a token pair using a refresh token
   */
  async refreshTokens(refreshToken: string): Promise<TokenPair | null> {
    try {
      // Verify refresh token
      const result = await this.verifyToken(refreshToken);
      
      if (!result.valid || !result.payload) {
        return null;
      }
      
      const { sub: userId, jti: sessionId } = result.payload;
      
      // Validate session
      const isValid = await this.validateSession(sessionId);
      
      if (!isValid) {
        return null;
      }
      
      // Update session activity
      await this.updateSessionActivity(sessionId);
      
      // TODO: Get updated roles and permissions from role service
      const roles: string[] = ['user'];
      const permissions: string[] = [];
      
      // Generate new tokens
      return await this.generateTokens(userId, sessionId, roles, permissions);
    } catch (error) {
      logger.error('Error refreshing tokens', { error });
      return null;
    }
  }
  
  /**
   * Create authentication cookies for response
   */
  createAuthCookies(tokens: TokenPair): Record<string, string> {
    const secureFlag = env.NODE_ENV === 'production' ? '; Secure' : '';
    
    return {
      'Set-Cookie': [
        `access_token=${tokens.access_token}; HttpOnly${secureFlag}; Path=/; Max-Age=${ACCESS_TOKEN_TTL}; SameSite=Lax`,
        `refresh_token=${tokens.refresh_token}; HttpOnly${secureFlag}; Path=/auth/refresh; Max-Age=${REFRESH_TOKEN_TTL}; SameSite=Lax`
      ].join(', ')
    };
  }
  
  /**
   * Create logout cookies (empty tokens)
   */
  createLogoutCookies(): Record<string, string> {
    const secureFlag = env.NODE_ENV === 'production' ? '; Secure' : '';
    
    return {
      'Set-Cookie': [
        `access_token=; HttpOnly${secureFlag}; Path=/; Max-Age=0; SameSite=Lax`,
        `refresh_token=; HttpOnly${secureFlag}; Path=/auth/refresh; Max-Age=0; SameSite=Lax`
      ].join(', ')
    };
  }
}

// Export a singleton instance
export const sessionService = new SessionService();
