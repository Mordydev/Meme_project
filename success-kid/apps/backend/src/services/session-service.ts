import { v4 as uuidv4 } from 'uuid';
import { redisClient } from '../lib/redis/client'; // Updated import path
import { logger } from '../lib/logger';

/**
 * Device information for session tracking
 */
export interface DeviceInfo {
  name: string;    // Device name/browser
  ip: string;      // IP address
  userAgent?: string; // User agent string
}

/**
 * Session object
 */
export interface Session {
  id: string;           // Session ID
  userId: string;       // User ID
  device: string;       // Device information
  ip: string;           // IP address
  createdAt: Date;      // Session creation time
  expiresAt: Date;      // Session expiration time
  lastActiveAt: Date;   // Last activity time
}

/**
 * Session options
 */
export interface SessionOptions {
  ttl?: number;  // Session time-to-live in seconds (default: 14 days)
}

/**
 * Session service for managing user sessions
 */
export class SessionService {
  // Default session TTL: 14 days
  private static DEFAULT_TTL = 14 * 24 * 60 * 60; // 14 days in seconds
  
  /**
   * Create a new session
   */
  async createSession(userId: string, deviceInfo: DeviceInfo, options?: SessionOptions): Promise<Session> {
    try {
      const ttl = options?.ttl || SessionService.DEFAULT_TTL;
      
      const session: Session = {
        id: uuidv4(),
        userId,
        device: deviceInfo.name,
        ip: deviceInfo.ip,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + ttl * 1000),
        lastActiveAt: new Date()
      };

      // Store session in Redis using the client instance
      await redisClient.getClient().set(
        `session:${session.id}`,
        JSON.stringify(session),
        'EX', // Specify expiry mode
        ttl
      );

      // Add session ID to user's sessions set using the client instance
      await redisClient.getClient().sadd(`user:${userId}:sessions`, session.id);
      
      return session;
    } catch (error) {
      logger.error('Error creating session', { userId, error });
      throw error;
    }
  }
  
  /**
   * Get a session by ID
   */
  async getSession(sessionId: string): Promise<Session | null> {
    try {
      const sessionJson = await redisClient.getClient().get(`session:${sessionId}`);
      
      if (!sessionJson) {
        return null;
      }
      
      const session = JSON.parse(sessionJson) as Session;
      
      // Check if session has expired
      if (new Date(session.expiresAt) < new Date()) {
        await this.revokeSession(sessionId);
        return null;
      }
      
      return session;
    } catch (error) {
      logger.error('Error getting session', { sessionId, error });
      return null;
    }
  }
  
  /**
   * Validate if a session is valid
   */
  async validateSession(sessionId: string): Promise<Session | null> {
    return this.getSession(sessionId);
  }
  
  /**
   * Update session activity timestamp
   */
  async updateSessionActivity(sessionId: string): Promise<void> {
    try {
      const session = await this.getSession(sessionId);
      
      if (!session) {
        return;
      }
      
      // Update last active timestamp
      session.lastActiveAt = new Date();
      
      // Calculate remaining TTL
      const expiryMs = new Date(session.expiresAt).getTime() - Date.now();
      const ttl = Math.max(Math.floor(expiryMs / 1000), 0);
      // Update session in Redis using the client instance
      await redisClient.getClient().set(
        `session:${sessionId}`,
        JSON.stringify(session),
        'EX', // Specify expiry mode
        ttl
      );
    } catch (error) {
      logger.error('Error updating session activity', { sessionId, error });
    }
  }
  
  /**
   * Extend session expiration
   */
  async extendSession(sessionId: string, extensionSeconds?: number): Promise<Session | null> {
    try {
      const session = await this.getSession(sessionId);
      
      if (!session) {
        return null;
      }
      
      // Default extension: 14 days
      const ttl = extensionSeconds || SessionService.DEFAULT_TTL;
      
      // Update expiration date
      session.expiresAt = new Date(Date.now() + ttl * 1000);
      // Update session in Redis using the client instance
      await redisClient.getClient().set(
        `session:${sessionId}`,
        JSON.stringify(session),
        'EX', // Specify expiry mode
        ttl
      );
      
      return session;
    } catch (error) {
      logger.error('Error extending session', { sessionId, error });
      return null;
    }
  }
  
  /**
   * Revoke a session
   */
  async revokeSession(sessionId: string): Promise<void> {
    try {
      const session = await this.getSession(sessionId);
      if (session) {
        // Remove session from Redis using the client instance
        await redisClient.getClient().del(`session:${sessionId}`);

        // Remove session ID from user's sessions set using the client instance
        await redisClient.getClient().srem(`user:${session.userId}:sessions`, sessionId);

        // Publish session revocation event using the client instance
        await redisClient.getClient().publish('session:revoked', sessionId);
        
        logger.info('Session revoked', { sessionId, userId: session.userId });
      }
    } catch (error) {
      logger.error('Error revoking session', { sessionId, error });
    }
  }
  
  /**
   * Get all sessions for a user
   */
  async getUserSessions(userId: string): Promise<Session[]> {
    try {
      const sessionIds = await redisClient.getClient().smembers(`user:${userId}:sessions`);
      const sessions: Session[] = [];
      
      for (const sessionId of sessionIds) {
        const session = await this.getSession(sessionId);
        
        if (session) {
          sessions.push(session);
        }
      }
      
      return sessions;
    } catch (error) {
      logger.error('Error getting user sessions', { userId, error });
      return [];
    }
  }
  
  /**
   * Revoke all sessions for a user (except current)
   */
  async revokeAllUserSessions(userId: string, exceptSessionId?: string): Promise<void> {
    try {
      const sessionIds = await redisClient.getClient().smembers(`user:${userId}:sessions`);
      
      for (const sessionId of sessionIds) {
        if (exceptSessionId && sessionId === exceptSessionId) {
          continue;
        }
        
        await this.revokeSession(sessionId);
      }
      
      logger.info('All user sessions revoked', { 
        userId, 
        count: sessionIds.length - (exceptSessionId ? 1 : 0)
      });
    } catch (error) {
      logger.error('Error revoking all user sessions', { userId, error });
    }
  }
}

// Export singleton instance
export const sessionService = new SessionService();
