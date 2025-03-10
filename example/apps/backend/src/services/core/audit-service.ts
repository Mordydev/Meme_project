import { FastifyInstance, FastifyRequest } from 'fastify';
import { Logger } from 'pino';

/**
 * Types of security events that can be audited
 */
export enum SecurityEventType {
  // Authentication events
  LOGIN_SUCCESS = 'login_success',
  LOGIN_FAILURE = 'login_failure',
  LOGIN_THROTTLED = 'login_throttled',
  PASSWORD_CHANGE = 'password_change',
  PASSWORD_RESET_REQUEST = 'password_reset_request',
  PASSWORD_RESET_COMPLETE = 'password_reset_complete',
  LOGOUT = 'logout',
  SESSION_EXPIRED = 'session_expired',
  MFA_ENABLED = 'mfa_enabled',
  MFA_DISABLED = 'mfa_disabled',
  MFA_CHALLENGE_SUCCESS = 'mfa_challenge_success',
  MFA_CHALLENGE_FAILURE = 'mfa_challenge_failure',
  
  // Account events
  USER_CREATED = 'user_created',
  USER_UPDATED = 'user_updated',
  USER_DELETED = 'user_deleted',
  EMAIL_CHANGED = 'email_changed',
  PERMISSIONS_CHANGED = 'permissions_changed',
  ACCOUNT_LOCKED = 'account_locked',
  ACCOUNT_UNLOCKED = 'account_unlocked',
  
  // Wallet events
  WALLET_CONNECTED = 'wallet_connected',
  WALLET_DISCONNECTED = 'wallet_disconnected',
  SIGNATURE_REQUESTED = 'signature_requested',
  SIGNATURE_VERIFIED = 'signature_verified',
  SIGNATURE_REJECTED = 'signature_rejected',
  TRANSACTION_INITIATED = 'transaction_initiated',
  TRANSACTION_COMPLETED = 'transaction_completed',
  TRANSACTION_FAILED = 'transaction_failed',
  
  // Platform security events
  RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded',
  SUSPICIOUS_ACTIVITY = 'suspicious_activity',
  BLOCKED_REQUEST = 'blocked_request',
  DATA_EXPORT_REQUESTED = 'data_export_requested',
  DATA_EXPORT_COMPLETED = 'data_export_completed',
  ADMIN_ACTION = 'admin_action',
  API_KEY_CREATED = 'api_key_created',
  API_KEY_DELETED = 'api_key_deleted',
  CONFIG_CHANGED = 'config_changed',
  
  // Content moderation events
  CONTENT_REPORTED = 'content_reported',
  CONTENT_FLAGGED = 'content_flagged',
  CONTENT_REMOVED = 'content_removed',
  USER_WARNED = 'user_warned',
  USER_SUSPENDED = 'user_suspended',
  USER_REINSTATED = 'user_reinstated'
}

/**
 * Audit record interface
 */
export interface AuditLog {
  id: string;
  event: SecurityEventType;
  userId: string | null;
  context: {
    ip: string;
    userAgent: string;
    sessionId?: string;
    requestId?: string;
    endpoint?: string;
    timestamp: Date;
  };
  data: any;
  severity: 'low' | 'medium' | 'high';
  timestamp: Date;
  metadata?: any;
}

/**
 * Service for comprehensive security audit logging
 */
export class AuditService {
  private alertHandlers: Map<string, (log: AuditLog) => Promise<void>>;

  constructor(
    private fastify: FastifyInstance,
    private logger: Logger
  ) {
    this.alertHandlers = new Map();
    
    // Register default alert handlers
    this.registerDefaultAlertHandlers();
  }

  /**
   * Log a security event with structured data and context
   * 
   * @param event The type of security event from SecurityEventType enum
   * @param userId The associated user ID (null for unauthenticated events)
   * @param data Additional event-specific data (will be sanitized)
   * @param severity The severity level of the event
   * @returns The created audit log entry
   */
  async logSecurityEvent(
    event: SecurityEventType,
    userId: string | null,
    data: any = {},
    severity: 'low' | 'medium' | 'high' = 'low'
  ): Promise<AuditLog | null> {
    try {
      // Construct complete context
      const context = {
        ip: data.ip || this.getRequestIp() || 'unknown',
        userAgent: data.userAgent || this.getUserAgent() || 'unknown',
        sessionId: data.sessionId,
        requestId: data.requestId || (this.fastify.requestContext?.get('request')?.id),
        endpoint: data.endpoint || this.getRequestEndpoint(),
        timestamp: new Date()
      };
      
      // Filter sensitive data
      const sanitizedData = this.sanitizeAuditData(data);
      
      // Create structured audit record
      const auditRecord = {
        event,
        userId,
        context,
        data: sanitizedData,
        severity,
        timestamp: context.timestamp,
        metadata: {
          appVersion: process.env.npm_package_version,
          environment: process.env.NODE_ENV
        }
      };
      
      // Insert into database using repository
      const log = await this.fastify.repositories.auditRepository.create({
        eventType: event,
        userId,
        context: auditRecord.context,
        details: sanitizedData,
        severity,
        ipAddress: context.ip,
        userAgent: context.userAgent,
        timestamp: context.timestamp
      });
      
      // Log to application logs with appropriate level based on severity
      switch (severity) {
        case 'high':
          this.logger.warn({ ...log, event: event.toString() }, 'High severity security event recorded');
          break;
        case 'medium':
          this.logger.info({ ...log, event: event.toString() }, 'Medium severity security event recorded');
          break;
        default:
          this.logger.debug({ ...log, event: event.toString() }, 'Security event recorded');
      }
      
      // Trigger alerts for high-severity events
      if (severity === 'high') {
        await this.triggerSecurityAlert(event, log);
      }
      
      return log;
    } catch (error) {
      // Don't throw errors from audit service to avoid affecting main flow
      this.logger.error({ error, event, userId }, 'Error in audit service');
      return null;
    }
  }
  
  /**
   * Query audit logs with filtering
   * 
   * @param filters Filter criteria for audit logs
   * @param options Pagination and sorting options
   * @returns Filtered audit logs
   */
  async queryAuditLogs(
    filters: {
      event?: SecurityEventType;
      userId?: string;
      severity?: 'low' | 'medium' | 'high';
      startDate?: Date;
      endDate?: Date;
      ip?: string;
    },
    options: {
      limit?: number;
      offset?: number;
      sortBy?: string;
      sortDir?: 'asc' | 'desc';
    } = {}
  ): Promise<{ logs: AuditLog[]; total: number }> {
    try {
      // Use the repository for querying
      return await this.fastify.repositories.auditRepository.query(filters, options);
    } catch (error) {
      this.logger.error({ error }, 'Failed to query audit logs');
      throw new Error('Failed to query audit logs');
    }
  }
  
  /**
   * Generate security report for specified time period
   * 
   * @param startDate Start date for report period
   * @param endDate End date for report period
   * @returns Security report with statistics
   */
  async generateSecurityReport(
    startDate: Date,
    endDate: Date
  ): Promise<{
    period: { start: Date; end: Date };
    eventCounts: Record<string, number>;
    severityCounts: Record<string, number>;
    topIPs: Array<{ ip: string; count: number }>;
    topUsers: Array<{ userId: string; count: number }>;
    highSeverityEvents: AuditLog[];
  }> {
    try {
      // Get all logs in time period using repository
      const { logs } = await this.fastify.repositories.auditRepository.query(
        {
          startDate,
          endDate
        },
        { limit: 10000 } // Large limit to get comprehensive data
      );
      
      // Compute event type counts
      const eventCounts: Record<string, number> = {};
      // Compute severity counts
      const severityCounts: Record<string, number> = {
        low: 0,
        medium: 0,
        high: 0
      };
      
      // Track IPs and users for frequency analysis
      const ipCounts: Record<string, number> = {};
      const userCounts: Record<string, number> = {};
      
      // Process logs to extract statistics
      logs.forEach(log => {
        // Count by event type
        eventCounts[log.event] = (eventCounts[log.event] || 0) + 1;
        
        // Count by severity
        severityCounts[log.severity] += 1;
        
        // Count by IP
        const ip = log.context.ip;
        if (ip) {
          ipCounts[ip] = (ipCounts[ip] || 0) + 1;
        }
        
        // Count by user
        if (log.userId) {
          userCounts[log.userId] = (userCounts[log.userId] || 0) + 1;
        }
      });
      
      // Get top IPs
      const topIPs = Object.entries(ipCounts)
        .map(([ip, count]) => ({ ip, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);
      
      // Get top users
      const topUsers = Object.entries(userCounts)
        .map(([userId, count]) => ({ userId, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);
      
      // Get high severity events
      const highSeverityEvents = logs.filter(log => log.severity === 'high');
      
      return {
        period: { start: startDate, end: endDate },
        eventCounts,
        severityCounts,
        topIPs,
        topUsers,
        highSeverityEvents
      };
    } catch (error) {
      this.logger.error({ error, startDate, endDate }, 'Failed to generate security report');
      throw new Error('Failed to generate security report');
    }
  }
  
  /**
   * Register an alert handler for specific event types
   * 
   * @param eventType The event type to handle, or "all" for all events
   * @param handler The handler function to call
   */
  registerAlertHandler(
    eventType: SecurityEventType | 'all',
    handler: (log: AuditLog) => Promise<void>
  ): void {
    this.alertHandlers.set(eventType, handler);
  }
  
  /**
   * Get current request IP
   */
  private getRequestIp(): string | null {
    try {
      // Attempt to get from current request
      if (this.fastify.requestContext && this.fastify.requestContext.get('request')) {
        const request = this.fastify.requestContext.get('request');
        return request.headers['x-forwarded-for'] as string || request.ip || null;
      }
      return null;
    } catch (error) {
      return null;
    }
  }
  
  /**
   * Get current user agent
   */
  private getUserAgent(): string | null {
    try {
      // Attempt to get from current request
      if (this.fastify.requestContext && this.fastify.requestContext.get('request')) {
        const request = this.fastify.requestContext.get('request');
        return request.headers['user-agent'] as string || null;
      }
      return null;
    } catch (error) {
      return null;
    }
  }
  
  /**
   * Get current request endpoint
   */
  private getRequestEndpoint(): string | null {
    try {
      if (this.fastify.requestContext && this.fastify.requestContext.get('request')) {
        const request = this.fastify.requestContext.get('request') as FastifyRequest;
        return `${request.method} ${request.url}`;
      }
      return null;
    } catch (error) {
      return null;
    }
  }
  
  /**
   * Sanitize audit data to remove sensitive information
   */
  private sanitizeAuditData(data: any): any {
    if (!data || typeof data !== 'object') {
      return data;
    }
    
    // Create a copy to avoid modifying original
    const sanitized = Array.isArray(data) ? [...data] : { ...data };
    
    // Remove sensitive fields
    const sensitiveFields = [
      'password', 'token', 'secret', 'apiKey', 'privateKey',
      'sessionToken', 'refreshToken', 'authToken', 'credential',
      'signature', 'otp', 'pin'
    ];
    
    // Function to recursively sanitize objects
    const sanitizeObj = (obj: any) => {
      if (!obj || typeof obj !== 'object') return obj;
      
      Object.keys(obj).forEach(key => {
        // Check if this is a sensitive field
        if (sensitiveFields.some(field => key.toLowerCase().includes(field.toLowerCase()))) {
          obj[key] = '[REDACTED]';
        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
          // Recursively sanitize nested objects
          obj[key] = sanitizeObj(Array.isArray(obj[key]) ? [...obj[key]] : { ...obj[key] });
        }
      });
      
      return obj;
    };
    
    return sanitizeObj(sanitized);
  }
  
  /**
   * Trigger security alerts for high-severity events
   */
  private async triggerSecurityAlert(event: SecurityEventType, log: AuditLog): Promise<void> {
    try {
      // Execute event-specific handler if exists
      const specificHandler = this.alertHandlers.get(event);
      if (specificHandler) {
        await specificHandler(log);
      }
      
      // Execute global handler if exists
      const globalHandler = this.alertHandlers.get('all');
      if (globalHandler) {
        await globalHandler(log);
      }
      
      // Log alert trigger
      this.logger.info(
        { eventType: event, severity: log.severity, logId: log.id },
        'Security alert triggered'
      );
    } catch (error) {
      this.logger.error(
        { error, eventType: event, logId: log.id },
        'Failed to trigger security alert'
      );
    }
  }
  
  /**
   * Register default alert handlers
   */
  private registerDefaultAlertHandlers(): void {
    // Default handler for high-severity events
    this.registerAlertHandler('all', async (log: AuditLog) => {
      if (log.severity !== 'high') return;
      
      // In a real implementation, this might send an email or Slack notification
      // For now, we'll just log it
      this.logger.warn(
        {
          event: log.event,
          userId: log.userId,
          context: log.context,
          timestamp: log.timestamp
        },
        '🚨 HIGH SEVERITY SECURITY EVENT DETECTED 🚨'
      );
    });
    
    // Specific handler for suspicious activity
    this.registerAlertHandler(SecurityEventType.SUSPICIOUS_ACTIVITY, async (log: AuditLog) => {
      // Additional logic for suspicious activity
      // This could include IP blocking, additional verification, etc.
      this.logger.warn(
        {
          ip: log.context.ip,
          userAgent: log.context.userAgent,
          userId: log.userId
        },
        'Suspicious activity detected - additional monitoring enabled'
      );
    });
  }
}
