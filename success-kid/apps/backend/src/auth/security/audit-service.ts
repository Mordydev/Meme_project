import { FastifyRequest } from 'fastify';
import { logger } from '../../lib/logger';
import { redisClient } from '../../lib/redis-client';

// Event types for audit logging
export enum AuthEvent {
  LOGIN_SUCCESS = 'auth:login:success',
  LOGIN_FAILURE = 'auth:login:failure',
  LOGOUT = 'auth:logout',
  TOKEN_REFRESH = 'auth:token:refresh',
  TOKEN_VALIDATION = 'auth:token:validation',
  TOKEN_REVOCATION = 'auth:token:revocation',
  PASSWORD_RESET_REQUEST = 'auth:password:reset:request',
  PASSWORD_RESET_COMPLETE = 'auth:password:reset:complete',
  EMAIL_VERIFICATION_REQUEST = 'auth:email:verification:request',
  EMAIL_VERIFICATION_COMPLETE = 'auth:email:verification:complete',
  ACCOUNT_RECOVERY_REQUEST = 'auth:account:recovery:request',
  ACCOUNT_CREATION = 'auth:account:creation',
  ACCOUNT_UPDATE = 'auth:account:update',
  ACCOUNT_DELETION = 'auth:account:deletion',
  PERMISSION_CHANGE = 'auth:permission:change',
  ROLE_CHANGE = 'auth:role:change',
  SUSPICIOUS_ACTIVITY = 'auth:suspicious:activity',
  WALLET_CHALLENGE = 'auth:wallet:challenge',
  WALLET_VERIFICATION = 'auth:wallet:verification',
  WALLET_LINK = 'auth:wallet:link',
  WALLET_UNLINK = 'auth:wallet:unlink'
}

// Sensitive fields that should be redacted from logs
const SENSITIVE_FIELDS = [
  'password',
  'token',
  'refreshToken',
  'accessToken',
  'secret',
  'credential',
  'pin',
  'signature'
];

/**
 * Service for security audit logging
 */
export class SecurityAuditService {
  /**
   * Log an authentication event
   * 
   * @param event Event type
   * @param data Event data
   * @param request Fastify request (optional)
   */
  async logAuthEvent(
    event: AuthEvent,
    data: Record<string, any>,
    request?: FastifyRequest
  ): Promise<void> {
    try {
      // Redact sensitive information
      const redactedData = this.redactSensitiveData(data);
      
      // Build audit log entry
      const entry = {
        event,
        timestamp: new Date().toISOString(),
        userId: data.userId || (request?.user?.id || null),
        ip: request?.ip || data.ip || null,
        userAgent: request?.headers['user-agent'] || data.userAgent || null,
        requestId: request?.id || data.requestId || null,
        data: redactedData
      };
      
      // Log to centralized logger
      logger.info(`Auth event: ${event}`, entry);
      
      // Store in Redis for short-term analysis (7 days)
      // We use a sorted set with timestamp as score for efficient range queries
      const timestamp = Date.now();
      await redisClient.zadd(
        'audit:events', 
        timestamp, 
        JSON.stringify(entry)
      );
      
      // Add to user-specific audit trail if we have userId
      if (entry.userId) {
        await redisClient.zadd(
          `audit:user:${entry.userId}`, 
          timestamp, 
          JSON.stringify(entry)
        );
      }
      
      // If this is a suspicious activity event, add to special monitoring set
      if (event === AuthEvent.SUSPICIOUS_ACTIVITY) {
        await redisClient.zadd(
          'audit:suspicious', 
          timestamp, 
          JSON.stringify(entry)
        );
        
        // Also alert via high-priority logging
        logger.warn('Suspicious authentication activity detected', entry);
      }
      
      // If this is a failed login, track for rate limiting
      if (event === AuthEvent.LOGIN_FAILURE && entry.userId) {
        const failureKey = `auth:failures:${entry.userId}`;
        await redisClient.incr(failureKey);
        // Expire after 30 minutes
        await redisClient.expire(failureKey, 30 * 60);
      }
    } catch (error) {
      // Avoid throwing exceptions from audit logging
      logger.error('Failed to log auth event', { event, error });
    }
  }
  
  /**
   * Get recent authentication events for a user
   * 
   * @param userId User ID
   * @param limit Maximum number of events to return
   * @returns Array of audit events
   */
  async getUserAuthEvents(userId: string, limit: number = 20): Promise<any[]> {
    try {
      // Get recent events from Redis sorted set
      const events = await redisClient.zrevrange(
        `audit:user:${userId}`, 
        0, 
        limit - 1
      );
      
      // Parse JSON strings to objects
      return events.map(event => JSON.parse(event));
    } catch (error) {
      logger.error('Failed to get user auth events', { userId, error });
      return [];
    }
  }
  
  /**
   * Get suspicious activity events
   * 
   * @param limit Maximum number of events to return
   * @returns Array of suspicious events
   */
  async getSuspiciousEvents(limit: number = 50): Promise<any[]> {
    try {
      // Get recent suspicious events from Redis sorted set
      const events = await redisClient.zrevrange(
        'audit:suspicious', 
        0, 
        limit - 1
      );
      
      // Parse JSON strings to objects
      return events.map(event => JSON.parse(event));
    } catch (error) {
      logger.error('Failed to get suspicious events', { error });
      return [];
    }
  }
  
  /**
   * Detect suspicious patterns in authentication behavior
   * 
   * @param userId User ID
   * @param ip IP address
   * @param userAgent User agent string
   * @returns Whether suspicious activity was detected
   */
  async detectSuspiciousActivity(
    userId: string,
    ip: string,
    userAgent?: string
  ): Promise<{ suspicious: boolean; reason?: string }> {
    try {
      // 1. Check for rapid failed login attempts
      const failureKey = `auth:failures:${userId}`;
      const failedAttempts = parseInt(await redisClient.get(failureKey) || '0', 10);
      
      if (failedAttempts >= 5) {
        return { 
          suspicious: true, 
          reason: 'Multiple failed login attempts' 
        };
      }
      
      // 2. Check for unusual location (simplified - in production use GeoIP)
      const userIpKey = `auth:ips:${userId}`;
      const knownIps = await redisClient.smembers(userIpKey);
      
      const isNewIp = !knownIps.includes(ip);
      
      // 3. Check for unusual device (simplified)
      const userAgentKey = `auth:agents:${userId}`;
      const knownAgents = await redisClient.smembers(userAgentKey);
      
      const isNewAgent = userAgent && !knownAgents.includes(userAgent);
      
      // If both IP and user agent are new, flag as suspicious
      if (knownIps.length > 0 && knownAgents.length > 0 && isNewIp && isNewAgent) {
        return { 
          suspicious: true, 
          reason: 'New location and device' 
        };
      }
      
      // If not suspicious, update known IPs and user agents
      if (isNewIp) {
        await redisClient.sadd(userIpKey, ip);
      }
      
      if (userAgent && isNewAgent) {
        await redisClient.sadd(userAgentKey, userAgent);
      }
      
      return { suspicious: false };
    } catch (error) {
      logger.error('Failed to detect suspicious activity', { userId, ip, error });
      return { suspicious: false }; // Fail open to avoid blocking legitimate users
    }
  }
  
  /**
   * Redact sensitive information from audit logs
   * 
   * @param data Data to redact
   * @returns Redacted data
   */
  private redactSensitiveData(data: Record<string, any>): Record<string, any> {
    const redacted = { ...data };
    
    // Recursively check for sensitive fields
    const redactFields = (obj: Record<string, any>) => {
      if (obj === null || typeof obj !== 'object') return;
      
      for (const key of Object.keys(obj)) {
        if (SENSITIVE_FIELDS.includes(key.toLowerCase())) {
          obj[key] = '[REDACTED]';
        } else if (typeof obj[key] === 'object') {
          redactFields(obj[key]);
        }
      }
    };
    
    redactFields(redacted);
    return redacted;
  }
}

// Export singleton instance
export const securityAuditService = new SecurityAuditService();
