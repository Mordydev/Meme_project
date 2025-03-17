/**
 * Audit Logging Module
 * 
 * Provides security audit logging functionality
 */
import { AuditEventType, getEventSeverity } from './events';
import { logger } from '../../lib/logger';
import { AuthProvider } from '../types';

export interface AuditEvent {
  type: AuditEventType;
  userId?: string;
  sessionId?: string;
  ip?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
  timestamp?: string;
}

export class AuditLogger {
  /**
   * Log an audit event
   */
  async logEvent(event: AuditEvent): Promise<void> {
    try {
      const severity = getEventSeverity(event.type);
      const timestamp = event.timestamp || new Date().toISOString();
      
      // Log event using appropriate severity level
      switch (severity) {
        case 'debug':
          logger.debug(event.type, {
            userId: event.userId,
            sessionId: event.sessionId,
            ip: event.ip,
            userAgent: event.userAgent,
            metadata: event.metadata,
            timestamp
          });
          break;
        case 'info':
          logger.info(event.type, {
            userId: event.userId,
            sessionId: event.sessionId,
            ip: event.ip,
            userAgent: event.userAgent,
            metadata: event.metadata,
            timestamp
          });
          break;
        case 'warn':
          logger.warn(event.type, {
            userId: event.userId,
            sessionId: event.sessionId,
            ip: event.ip,
            userAgent: event.userAgent,
            metadata: event.metadata,
            timestamp
          });
          break;
        case 'error':
          logger.error(event.type, {
            userId: event.userId,
            sessionId: event.sessionId,
            ip: event.ip,
            userAgent: event.userAgent,
            metadata: event.metadata,
            timestamp
          });
          break;
        case 'critical':
          logger.error(`CRITICAL: ${event.type}`, {
            userId: event.userId,
            sessionId: event.sessionId,
            ip: event.ip,
            userAgent: event.userAgent,
            metadata: event.metadata,
            timestamp
          });
          
          // For critical events, might want to trigger additional alerts
          // Example: send notification to security team, etc.
          break;
      }
      
      // In a production environment, you would also:
      // 1. Persist events to a database
      // 2. Implement real-time security monitoring
      // 3. Handle retention policies
      // 4. Implement aggregation for analysis
      
    } catch (error) {
      // If audit logging fails, log to regular logger as a fallback
      logger.error('Failed to log audit event', { error, eventType: event.type });
    }
  }
  
  // Convenience methods for common audit events
  
  /**
   * Log user creation
   */
  async logUserCreation(
    userId: string,
    externalId: string,
    provider: AuthProvider | string
  ): Promise<void> {
    await this.logEvent({
      type: AuditEventType.USER_CREATED,
      userId,
      metadata: {
        externalId,
        provider
      }
    });
  }
  
  /**
   * Log user login
   */
  async logUserLogin(
    userId: string,
    externalId: string,
    provider: AuthProvider | string,
    ip?: string,
    userAgent?: string
  ): Promise<void> {
    await this.logEvent({
      type: AuditEventType.USER_LOGIN,
      userId,
      ip,
      userAgent,
      metadata: {
        externalId,
        provider
      }
    });
  }
  
  /**
   * Log user logout
   */
  async logUserLogout(
    userId: string,
    sessionId?: string,
    ip?: string,
    userAgent?: string
  ): Promise<void> {
    await this.logEvent({
      type: AuditEventType.USER_LOGOUT,
      userId,
      sessionId,
      ip,
      userAgent
    });
  }
  
  /**
   * Log role assignment
   */
  async logRoleAssignment(
    userId: string,
    role: string,
    assignedBy: string
  ): Promise<void> {
    await this.logEvent({
      type: AuditEventType.ROLE_ASSIGNED,
      userId,
      metadata: {
        role,
        assignedBy
      }
    });
  }
  
  /**
   * Log wallet connection
   */
  async logWalletConnection(
    userId: string,
    walletAddress: string,
    chainType: string
  ): Promise<void> {
    await this.logEvent({
      type: AuditEventType.WALLET_CONNECTED,
      userId,
      metadata: {
        walletAddress: walletAddress.slice(0, 8) + '...' + walletAddress.slice(-4),
        chainType
      }
    });
  }
  
  /**
   * Log wallet disconnection
   */
  async logWalletDisconnection(
    userId: string,
    walletAddress: string
  ): Promise<void> {
    await this.logEvent({
      type: AuditEventType.WALLET_DISCONNECTED,
      userId,
      metadata: {
        walletAddress: walletAddress.slice(0, 8) + '...' + walletAddress.slice(-4)
      }
    });
  }
  
  /**
   * Log suspicious activity
   */
  async logSuspiciousActivity(
    type: string,
    userId?: string,
    ip?: string,
    details?: Record<string, any>
  ): Promise<void> {
    await this.logEvent({
      type: AuditEventType.SUSPICIOUS_ACTIVITY_DETECTED,
      userId,
      ip,
      metadata: {
        activityType: type,
        ...details
      }
    });
  }
}

// Create singleton instance
export const auditLogger = new AuditLogger();

// Export audit service for use in other modules
export const auditService = auditLogger;
