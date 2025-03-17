/**
 * Auth Audit Logger
 * 
 * Records authentication-related events for security auditing and compliance
 */
import { logger } from '../../lib/logger';
import { env } from '../../config/environment';
import { AuthProvider } from '../clerk/types';

// Hide sensitive information from logs
const maskSensitiveInfo = (data: Record<string, any>) => {
  // Create a deep copy to avoid modifying original
  const maskedData = JSON.parse(JSON.stringify(data));
  
  // Fields to mask
  const sensitiveFields = ['password', 'token', 'secret', 'email', 'ip_address'];
  
  // Mask fields recursively
  const maskFields = (obj: Record<string, any>) => {
    for (const key in obj) {
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        maskFields(obj[key]);
      } else if (sensitiveFields.includes(key)) {
        // If it's an email, only show domain
        if (key === 'email' && typeof obj[key] === 'string') {
          const parts = obj[key].split('@');
          if (parts.length === 2) {
            obj[key] = '****@' + parts[1];
          } else {
            obj[key] = '****';
          }
        } else {
          // Otherwise, completely mask the field
          obj[key] = '****';
        }
      }
    }
  };
  
  maskFields(maskedData);
  return maskedData;
};

class AuditLogger {
  private shouldLogToDb: boolean;
  
  constructor() {
    // Log to database in production, development, but not testing
    this.shouldLogToDb = env.NODE_ENV !== 'test';
  }
  
  /**
   * Log a security audit event
   */
  private async logAuditEvent(
    eventType: string,
    userId: string,
    data: Record<string, any>,
    severity: 'info' | 'warn' | 'error' = 'info'
  ) {
    try {
      // Mask sensitive information
      const maskedData = maskSensitiveInfo(data);
      
      // Log to application logger
      switch (severity) {
        case 'error':
          logger.error(`Auth event: ${eventType}`, { userId, ...maskedData });
          break;
        case 'warn':
          logger.warn(`Auth event: ${eventType}`, { userId, ...maskedData });
          break;
        default:
          logger.info(`Auth event: ${eventType}`, { userId, ...maskedData });
      }
      
      // Store in database for auditing if needed
      if (this.shouldLogToDb) {
        // Store in database - implement this
        // For now, we're just using application logs
        // This would be implemented with a database table for audit logs
        
        // Example: await auditRepository.create({
        //   event_type: eventType,
        //   user_id: userId,
        //   data: maskedData,
        //   created_at: new Date()
        // });
      }
    } catch (error) {
      // If audit logging fails, log it but don't interrupt the flow
      logger.error('Failed to log audit event', { error, eventType, userId });
    }
  }
  
  /**
   * Log successful user login
   */
  async logUserLogin(userId: string, externalId: string, provider: AuthProvider | string) {
    await this.logAuditEvent('user.login', userId, {
      externalId,
      provider,
      timestamp: new Date().toISOString()
    });
  }
  
  /**
   * Log failed login attempt
   */
  async logLoginFailure(
    identifier: string,
    provider: AuthProvider | string,
    reason: string,
    ipAddress?: string
  ) {
    await this.logAuditEvent('user.login.failed', 'anonymous', {
      identifier, // This might be email or username
      provider,
      reason,
      ipAddress,
      timestamp: new Date().toISOString()
    }, 'warn');
  }
  
  /**
   * Log user logout
   */
  async logUserLogout(userId: string, sessionId: string) {
    await this.logAuditEvent('user.logout', userId, {
      sessionId,
      timestamp: new Date().toISOString()
    });
  }
  
  /**
   * Log user creation
   */
  async logUserCreation(userId: string, externalId: string, provider: AuthProvider | string) {
    await this.logAuditEvent('user.created', userId, {
      externalId,
      provider,
      timestamp: new Date().toISOString()
    });
  }
  
  /**
   * Log user update
   */
  async logUserUpdate(userId: string, externalId: string, provider: AuthProvider | string) {
    await this.logAuditEvent('user.updated', userId, {
      externalId,
      provider,
      timestamp: new Date().toISOString()
    });
  }
  
  /**
   * Log user deletion
   */
  async logUserDeletion(userId: string, externalId: string, provider: AuthProvider | string) {
    await this.logAuditEvent('user.deleted', userId, {
      externalId,
      provider,
      timestamp: new Date().toISOString()
    });
  }
  
  /**
   * Log password reset request
   */
  async logPasswordResetRequest(userId: string, requestId: string, ipAddress?: string) {
    await this.logAuditEvent('password.reset.requested', userId, {
      requestId,
      ipAddress,
      timestamp: new Date().toISOString()
    });
  }
  
  /**
   * Log password reset completion
   */
  async logPasswordResetComplete(userId: string, requestId: string, ipAddress?: string) {
    await this.logAuditEvent('password.reset.completed', userId, {
      requestId,
      ipAddress,
      timestamp: new Date().toISOString()
    });
  }
  
  /**
   * Log email verification request
   */
  async logEmailVerificationRequest(userId: string, email: string) {
    await this.logAuditEvent('email.verification.requested', userId, {
      email,
      timestamp: new Date().toISOString()
    });
  }
  
  /**
   * Log email verification completion
   */
  async logEmailVerificationComplete(userId: string, email: string) {
    await this.logAuditEvent('email.verification.completed', userId, {
      email,
      timestamp: new Date().toISOString()
    });
  }
  
  /**
   * Log wallet connection
   */
  async logWalletConnection(userId: string, walletAddress: string, isVerified: boolean) {
    await this.logAuditEvent('wallet.connected', userId, {
      walletAddress,
      isVerified,
      timestamp: new Date().toISOString()
    });
  }
  
  /**
   * Log wallet disconnection
   */
  async logWalletDisconnection(userId: string, walletAddress: string) {
    await this.logAuditEvent('wallet.disconnected', userId, {
      walletAddress,
      timestamp: new Date().toISOString()
    });
  }
  
  /**
   * Log permission check
   */
  async logPermissionCheck(
    userId: string,
    resource: string,
    action: string,
    granted: boolean,
    reason?: string
  ) {
    await this.logAuditEvent(
      granted ? 'permission.granted' : 'permission.denied',
      userId,
      {
        resource,
        action,
        reason,
        timestamp: new Date().toISOString()
      },
      granted ? 'info' : 'warn'
    );
  }
  
  /**
   * Log role assignment
   */
  async logRoleAssignment(
    userId: string,
    role: string,
    assignedBy: string,
    organizationId?: string
  ) {
    await this.logAuditEvent('role.assigned', userId, {
      role,
      assignedBy,
      organizationId,
      timestamp: new Date().toISOString()
    });
  }
  
  /**
   * Log role removal
   */
  async logRoleRemoval(
    userId: string,
    role: string,
    removedBy: string,
    organizationId?: string
  ) {
    await this.logAuditEvent('role.removed', userId, {
      role,
      removedBy,
      organizationId,
      timestamp: new Date().toISOString()
    });
  }
  
  /**
   * Log suspicious activity
   */
  async logSuspiciousActivity(
    userId: string,
    activityType: string,
    details: Record<string, any>,
    ipAddress?: string
  ) {
    await this.logAuditEvent('security.suspicious', userId, {
      activityType,
      details,
      ipAddress,
      timestamp: new Date().toISOString()
    }, 'warn');
  }
}

// Export singleton instance
export const auditLogger = new AuditLogger();
