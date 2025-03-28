import { randomUUID } from 'crypto';
import { redisClient } from '../../lib/redis-client';
import { logger } from '../../lib/logger';
import { AppError } from '../../lib/errors';

/**
 * Session information
 */
export interface Session {
  id: string;
  userId: string;
  device: DeviceInfo;
  createdAt: Date;
  expiresAt: Date;
  lastActiveAt: Date;
  isActive: boolean;
}

/**
 * Device information for session tracking
 */
export interface DeviceInfo {
  name: string;
  type?: string;
  os?: string;
  browser?: string;
  ip?: string;
  location?: string;
}

// Redis key prefix for sessions
const SESSION_PREFIX = 'session:';
// Session TTL in seconds (14 days)
const SESSION_TTL = 14 * 24 * 60 * 60;

/**
 * Service for enhanced session management
 */
export class SessionService {
  /**
   * Create a new session
   * 
   * @param userId User ID
   * @param device Device information
   * @returns New session
   */
  async createSession(userId: string, device: DeviceInfo): Promise<Session> {
    try {
      const now = new Date();
      const expiresAt = new Date(now.getTime() + SESSION_TTL * 1000);
      
      const session: Session = {
        id: randomUUID(),
        userId,
        device,
        createdAt: now,
        expiresAt,
        lastActiveAt: now,
        isActive: true
      };
      
      // Store session in Redis
      await redisClient.set(
        `${SESSION_PREFIX}${session.id}`,
        JSON.stringify(session),
        'EX',
        SESSION_TTL
      );
      
      // Add to user's sessions set
      await redisClient.sadd(`${SESSION_PREFIX}user:${userId}`, session.id);
      
      return session;
    } catch (error) {
      logger.error('Error creating session', { userId, error });
      throw new AppError('Failed to create session', 'SESSION_CREATE_FAILED', 500);
    }
  }
  
  /**
   * Get a session by ID
   * 
   * @param sessionId Session ID
   * @returns Session or null if not found
   */
  async getSession(sessionId: string): Promise<Session | null> {
    try {
      const sessionJson = await redisClient.get(`${SESSION_PREFIX}${sessionId}`);
      
      if (!sessionJson) {
        return null;
      }
      
      return JSON.parse(sessionJson);
    } catch (error) {
      logger.error('Error getting session', { sessionId, error });
      return null;
    }
  }
  
  /**
   * Check if a session is valid
   * 
   * @param sessionId Session ID
   * @returns Whether the session is valid
   */
  async isSessionValid(sessionId: string): Promise<boolean> {
    try {
      const session = await this.getSession(sessionId);
      
      if (!session) {
        return false;
      }
      
      return session.isActive && new Date() < new Date(session.expiresAt);
    } catch (error) {
      logger.error('Error checking session validity', { sessionId, error });
      return false;
    }
  }
  
  /**
   * Update session activity
   * 
   * @param sessionId Session ID
   */
  async updateSessionActivity(sessionId: string): Promise<void> {
    try {
      const session = await this.getSession(sessionId);
      
      if (!session) {
        return;
      }
      
      // Update last active time
      session.lastActiveAt = new Date();
      
      // Store updated session
      await redisClient.set(
        `${SESSION_PREFIX}${sessionId}`,
        JSON.stringify(session),
        'EX',
        SESSION_TTL
      );
    } catch (error) {
      logger.error('Error updating session activity', { sessionId, error });
      // Silent fail - don't throw for activity updates
    }
  }
  
  /**
   * Extend a session's expiration
   * 
   * @param sessionId Session ID
   * @returns Updated session or null if not found
   */
  async extendSession(sessionId: string): Promise<Session | null> {
    try {
      const session = await this.getSession(sessionId);
      
      if (!session || !session.isActive) {
        return null;
      }
      
      // Update expiration and last active time
      const now = new Date();
      session.lastActiveAt = now;
      session.expiresAt = new Date(now.getTime() + SESSION_TTL * 1000);
      
      // Store updated session
      await redisClient.set(
        `${SESSION_PREFIX}${sessionId}`,
        JSON.stringify(session),
        'EX',
        SESSION_TTL
      );
      
      return session;
    } catch (error) {
      logger.error('Error extending session', { sessionId, error });
      return null;
    }
  }
  
  /**
   * Revoke a session
   * 
   * @param sessionId Session ID
   * @returns Whether the session was successfully revoked
   */
  async revokeSession(sessionId: string): Promise<boolean> {
    try {
      const session = await this.getSession(sessionId);
      
      if (!session) {
        return false;
      }
      
      // Mark session as inactive
      session.isActive = false;
      
      // Remove from user's active sessions
      await redisClient.srem(`${SESSION_PREFIX}user:${session.userId}`, sessionId);
      
      // Update session data with short expiry for audit purposes
      await redisClient.set(
        `${SESSION_PREFIX}${sessionId}`,
        JSON.stringify(session),
        'EX',
        60 * 60 // 1 hour
      );
      
      return true;
    } catch (error) {
      logger.error('Error revoking session', { sessionId, error });
      return false;
    }
  }
  
  /**
   * Revoke all sessions for a user
   * 
   * @param userId User ID
   * @param excludeSessionId Optional session ID to exclude from revocation
   */
  async revokeAllUserSessions(userId: string, excludeSessionId?: string): Promise<void> {
    try {
      // Get all session IDs for the user
      const sessionIds = await redisClient.smembers(`${SESSION_PREFIX}user:${userId}`);
      
      // Revoke each session
      for (const sessionId of sessionIds) {
        if (excludeSessionId && sessionId === excludeSessionId) {
          continue;
        }
        
        await this.revokeSession(sessionId);
      }
      
      // Clear the set (except excluded session)
      if (excludeSessionId) {
        await redisClient.del(`${SESSION_PREFIX}user:${userId}`);
        await redisClient.sadd(`${SESSION_PREFIX}user:${userId}`, excludeSessionId);
      } else {
        await redisClient.del(`${SESSION_PREFIX}user:${userId}`);
      }
    } catch (error) {
      logger.error('Error revoking all user sessions', { userId, error });
      throw new AppError('Failed to revoke sessions', 'SESSION_REVOCATION_FAILED', 500);
    }
  }
  
  /**
   * Get all active sessions for a user
   * 
   * @param userId User ID
   * @returns Array of active sessions
   */
  async getUserSessions(userId: string): Promise<Session[]> {
    try {
      // Get all session IDs for the user
      const sessionIds = await redisClient.smembers(`${SESSION_PREFIX}user:${userId}`);
      
      // Get session data for each ID
      const sessions: Session[] = [];
      
      for (const sessionId of sessionIds) {
        const session = await this.getSession(sessionId);
        
        if (session && session.isActive) {
          sessions.push(session);
        } else if (session && !session.isActive) {
          // Clean up inactive sessions from the set
          await redisClient.srem(`${SESSION_PREFIX}user:${userId}`, sessionId);
        }
      }
      
      return sessions;
    } catch (error) {
      logger.error('Error getting user sessions', { userId, error });
      return [];
    }
  }
  
  /**
   * Parse device information from request headers
   * 
   * @param userAgent User agent string
   * @param ip IP address
   * @returns Device information
   */
  parseDeviceInfo(userAgent?: string, ip?: string): DeviceInfo {
    // This would normally use a more robust user agent parser
    // For now, just use the raw user agent
    return {
      name: userAgent || 'Unknown',
      ip
    };
  }
}

// Export singleton instance
export const sessionService = new SessionService();
