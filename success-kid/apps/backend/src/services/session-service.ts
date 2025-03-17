/**
 * Session Service
 * 
 * Manages user sessions and authentication state
 */
import { randomUUID } from 'crypto';
import { SessionRepository } from '../repositories/session-repository';
import { Session, TokenPair, CreateSessionInput } from '../models/session';
import { generateTokenPair, revokeToken } from '../auth/jwt';
import { auditLogger } from '../auth/audit';
import { logger } from '../lib/logger';
import { redis } from '../lib/redis';
import { env } from '../config/environment';

// TTL values in seconds
const ACCESS_TOKEN_TTL = parseInt(env.ACCESS_TOKEN_TTL || '900', 10); // 15 minutes
const REFRESH_TOKEN_TTL = parseInt(env.REFRESH_TOKEN_TTL || '2592000', 10); // 30 days

export class SessionService {
  constructor(private sessionRepository: SessionRepository) {}
  
  /**
   * Create a new session for a user
   */
  async createSession(input: CreateSessionInput): Promise<{
    session: Session;
    tokens: TokenPair;
  }> {
    try {
      // Generate session ID
      const sessionId = randomUUID();
      
      // Calculate expiration date
      const expiresAt = new Date();
      expiresAt.setSeconds(expiresAt.getSeconds() + REFRESH_TOKEN_TTL);
      
      // Create session in database
      const session = await this.sessionRepository.create({
        id: sessionId,
        user_id: input.user_id,
        created_at: new Date(),
        expires_at: expiresAt,
        last_active_at: new Date(),
        ip_address: input.ip_address,
        user_agent: input.user_agent,
        device_info: this.parseUserAgent(input.user_agent)
      });
      
      // Generate tokens for session
      const tokens = await generateTokenPair(
        input.user_id, 
        sessionId,
        [],  // Roles - this would come from user data
        [],  // Permissions - this would come from user data
        ACCESS_TOKEN_TTL,
        REFRESH_TOKEN_TTL
      );
      
      // Log session creation
      auditLogger.logAuditEvent('session.created', input.user_id, {
        sessionId,
        ipAddress: input.ip_address,
        userAgent: input.user_agent,
        timestamp: new Date().toISOString()
      });
      
      return { session, tokens };
    } catch (error) {
      logger.error('Error creating session', { error, userId: input.user_id });
      throw error;
    }
  }
  
  /**
   * Get session by ID
   */
  async getSession(sessionId: string): Promise<Session | null> {
    try {
      return await this.sessionRepository.findById(sessionId);
    } catch (error) {
      logger.error('Error getting session', { error, sessionId });
      throw error;
    }
  }
  
  /**
   * Update session last active time
   */
  async updateSessionActivity(sessionId: string): Promise<Session | null> {
    try {
      return await this.sessionRepository.update(sessionId, {
        last_active_at: new Date()
      });
    } catch (error) {
      logger.error('Error updating session activity', { error, sessionId });
      throw error;
    }
  }
  
  /**
   * Revoke (invalidate) a session
   */
  async revokeSession(sessionId: string, userId: string): Promise<boolean> {
    try {
      // Get session
      const session = await this.sessionRepository.findById(sessionId);
      if (!session) {
        return false;
      }
      
      // Revoke tokens associated with session
      await revokeToken(sessionId, REFRESH_TOKEN_TTL);
      
      // Publish event for WebSockets to disconnect
      await redis.publish('session:revoked', JSON.stringify({
        type: 'session_revoked',
        session_id: sessionId,
        user_id: userId,
        reason: 'logout',
        timestamp: new Date().toISOString()
      }));
      
      // Delete session from database
      await this.sessionRepository.delete(sessionId);
      
      // Log session revocation
      auditLogger.logUserLogout(userId, sessionId);
      
      return true;
    } catch (error) {
      logger.error('Error revoking session', { error, sessionId });
      throw error;
    }
  }
  
  /**
   * Revoke all sessions for a user
   */
  async revokeAllUserSessions(userId: string): Promise<number> {
    try {
      // Get all user sessions
      const sessions = await this.sessionRepository.findByUserId(userId);
      
      // Revoke each session
      for (const session of sessions) {
        await revokeToken(session.id, REFRESH_TOKEN_TTL);
        
        // Publish event for WebSockets to disconnect
        await redis.publish('session:revoked', JSON.stringify({
          type: 'session_revoked',
          session_id: session.id,
          user_id: userId,
          reason: 'logout_all',
          timestamp: new Date().toISOString()
        }));
      }
      
      // Delete all sessions from database
      const count = await this.sessionRepository.deleteByUserId(userId);
      
      // Log session revocation
      auditLogger.logAuditEvent('user.logout.all', userId, {
        sessionCount: sessions.length,
        timestamp: new Date().toISOString()
      });
      
      return count;
    } catch (error) {
      logger.error('Error revoking all user sessions', { error, userId });
      throw error;
    }
  }
  
  /**
   * Refresh tokens using a refresh token
   */
  async refreshTokens(userId: string, sessionId: string): Promise<TokenPair | null> {
    try {
      // Check if session exists and is valid
      const session = await this.sessionRepository.findById(sessionId);
      if (!session || session.user_id !== userId) {
        return null;
      }
      
      // Check if session is expired
      if (session.expires_at < new Date()) {
        await this.sessionRepository.delete(sessionId);
        return null;
      }
      
      // Update session activity
      await this.updateSessionActivity(sessionId);
      
      // Generate new token pair
      const tokens = await generateTokenPair(
        userId, 
        sessionId,
        [],  // Roles - this would come from user data
        [],  // Permissions - this would come from user data
        ACCESS_TOKEN_TTL,
        REFRESH_TOKEN_TTL
      );
      
      return tokens;
    } catch (error) {
      logger.error('Error refreshing tokens', { error, userId, sessionId });
      throw error;
    }
  }
  
  /**
   * Clean up expired sessions
   */
  async cleanupExpiredSessions(): Promise<number> {
    try {
      const now = new Date();
      return await this.sessionRepository.deleteExpired(now);
    } catch (error) {
      logger.error('Error cleaning up expired sessions', { error });
      throw error;
    }
  }
  
  /**
   * Parse user agent to extract device info
   */
  private parseUserAgent(userAgent?: string): { type: string; browser?: string; os?: string } {
    if (!userAgent) {
      return { type: 'unknown' };
    }
    
    // This is a simplified implementation
    // In production, consider using a proper user-agent parsing library
    
    const lowerUserAgent = userAgent.toLowerCase();
    let type = 'desktop';
    let browser;
    let os;
    
    // Detect device type
    if (lowerUserAgent.includes('mobile') || lowerUserAgent.includes('android') || lowerUserAgent.includes('iphone')) {
      type = 'mobile';
    } else if (lowerUserAgent.includes('ipad') || lowerUserAgent.includes('tablet')) {
      type = 'tablet';
    }
    
    // Detect browser
    if (lowerUserAgent.includes('chrome')) {
      browser = 'Chrome';
    } else if (lowerUserAgent.includes('firefox')) {
      browser = 'Firefox';
    } else if (lowerUserAgent.includes('safari')) {
      browser = 'Safari';
    } else if (lowerUserAgent.includes('edge')) {
      browser = 'Edge';
    } else if (lowerUserAgent.includes('opera')) {
      browser = 'Opera';
    }
    
    // Detect OS
    if (lowerUserAgent.includes('windows')) {
      os = 'Windows';
    } else if (lowerUserAgent.includes('mac')) {
      os = 'macOS';
    } else if (lowerUserAgent.includes('linux')) {
      os = 'Linux';
    } else if (lowerUserAgent.includes('android')) {
      os = 'Android';
    } else if (lowerUserAgent.includes('iphone') || lowerUserAgent.includes('ipad')) {
      os = 'iOS';
    }
    
    return { type, browser, os };
  }
}

// Create instance with singleton pattern
let instance: SessionService | null = null;

export function getSessionService(): SessionService {
  if (!instance) {
    const sessionRepository = new SessionRepository();
    instance = new SessionService(sessionRepository);
  }
  return instance;
}

// Export singleton instance
export const sessionService = getSessionService();
