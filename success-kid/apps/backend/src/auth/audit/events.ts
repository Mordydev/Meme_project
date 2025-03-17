/**
 * Audit Event Types
 * 
 * Defines the types of events that are logged for security auditing
 */

/**
 * Audit event types
 */
export enum AuditEventType {
  // User events
  USER_CREATED = 'user.created',
  USER_UPDATED = 'user.updated',
  USER_DELETED = 'user.deleted',
  
  // Authentication events
  USER_LOGIN_ATTEMPT = 'user.login.attempt',
  USER_LOGIN = 'user.login',
  USER_LOGIN_FAILED = 'user.login.failed',
  USER_LOGOUT = 'user.logout',
  SESSION_CREATED = 'session.created',
  SESSION_REFRESHED = 'session.refreshed',
  SESSION_REVOKED = 'session.revoked',
  
  // Email verification events
  EMAIL_VERIFICATION_SENT = 'email.verification.sent',
  EMAIL_VERIFIED = 'email.verified',
  
  // Password events
  PASSWORD_RESET_REQUESTED = 'password.reset.requested',
  PASSWORD_RESET_COMPLETED = 'password.reset.completed',
  PASSWORD_CHANGED = 'password.changed',
  
  // Role events
  ROLE_ASSIGNED = 'role.assigned',
  ROLE_REVOKED = 'role.revoked',
  
  // Permission events
  PERMISSION_GRANTED = 'permission.granted',
  PERMISSION_REVOKED = 'permission.revoked',
  
  // Content events
  CONTENT_CREATED = 'content.created',
  CONTENT_UPDATED = 'content.updated',
  CONTENT_DELETED = 'content.deleted',
  CONTENT_FLAGGED = 'content.flagged',
  CONTENT_MODERATED = 'content.moderated',
  
  // Points events
  POINTS_AWARDED = 'points.awarded',
  POINTS_DEDUCTED = 'points.deducted',
  POINTS_REDEEMED = 'points.redeemed',
  
  // Wallet events
  WALLET_CONNECTED = 'wallet.connected',
  WALLET_DISCONNECTED = 'wallet.disconnected',
  WALLET_SIGNING_REQUEST = 'wallet.signing.request',
  WALLET_SIGNATURE_VERIFIED = 'wallet.signature.verified',
  WALLET_SIGNATURE_FAILED = 'wallet.signature.failed',
  
  // Admin events
  ADMIN_ACTION = 'admin.action',
  SYSTEM_CONFIGURATION_CHANGED = 'system.configuration.changed',
  
  // Security events
  SUSPICIOUS_ACTIVITY_DETECTED = 'security.suspicious_activity',
  RATE_LIMIT_EXCEEDED = 'security.rate_limit_exceeded',
  ACCESS_DENIED = 'security.access_denied',
  
  // System events
  API_ERROR = 'system.api.error',
  JOB_STARTED = 'system.job.started',
  JOB_COMPLETED = 'system.job.completed',
  JOB_FAILED = 'system.job.failed'
}

/**
 * Audit event severity levels
 */
export enum AuditEventSeverity {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  CRITICAL = 'critical'
}

/**
 * Get audit event severity based on event type
 */
export function getEventSeverity(eventType: AuditEventType): AuditEventSeverity {
  switch (eventType) {
    // Critical security events
    case AuditEventType.SUSPICIOUS_ACTIVITY_DETECTED:
    case AuditEventType.USER_DELETED:
      return AuditEventSeverity.CRITICAL;
    
    // Error-level events
    case AuditEventType.USER_LOGIN_FAILED:
    case AuditEventType.API_ERROR:
    case AuditEventType.JOB_FAILED:
    case AuditEventType.ACCESS_DENIED:
    case AuditEventType.RATE_LIMIT_EXCEEDED:
    case AuditEventType.WALLET_SIGNATURE_FAILED:
      return AuditEventSeverity.ERROR;
    
    // Warning-level events
    case AuditEventType.CONTENT_FLAGGED:
    case AuditEventType.CONTENT_MODERATED:
    case AuditEventType.POINTS_DEDUCTED:
    case AuditEventType.PASSWORD_RESET_REQUESTED:
      return AuditEventSeverity.WARN;
    
    // Info-level events (default for most events)
    case AuditEventType.USER_CREATED:
    case AuditEventType.USER_UPDATED:
    case AuditEventType.USER_LOGIN:
    case AuditEventType.USER_LOGOUT:
    case AuditEventType.SESSION_CREATED:
    case AuditEventType.SESSION_REFRESHED:
    case AuditEventType.SESSION_REVOKED:
    case AuditEventType.EMAIL_VERIFICATION_SENT:
    case AuditEventType.EMAIL_VERIFIED:
    case AuditEventType.PASSWORD_RESET_COMPLETED:
    case AuditEventType.PASSWORD_CHANGED:
    case AuditEventType.ROLE_ASSIGNED:
    case AuditEventType.ROLE_REVOKED:
    case AuditEventType.PERMISSION_GRANTED:
    case AuditEventType.PERMISSION_REVOKED:
    case AuditEventType.CONTENT_CREATED:
    case AuditEventType.CONTENT_UPDATED:
    case AuditEventType.CONTENT_DELETED:
    case AuditEventType.POINTS_AWARDED:
    case AuditEventType.POINTS_REDEEMED:
    case AuditEventType.WALLET_CONNECTED:
    case AuditEventType.WALLET_DISCONNECTED:
    case AuditEventType.WALLET_SIGNING_REQUEST:
    case AuditEventType.WALLET_SIGNATURE_VERIFIED:
    case AuditEventType.ADMIN_ACTION:
    case AuditEventType.SYSTEM_CONFIGURATION_CHANGED:
    case AuditEventType.JOB_STARTED:
    case AuditEventType.JOB_COMPLETED:
      return AuditEventSeverity.INFO;
    
    // Debug-level events
    case AuditEventType.USER_LOGIN_ATTEMPT:
      return AuditEventSeverity.DEBUG;
    
    // Default to info level for unspecified events
    default:
      return AuditEventSeverity.INFO;
  }
}
