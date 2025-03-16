/**
 * Audit Event Definitions
 * 
 * Defines audit event types and formats for security logging
 */

/**
 * Audit event types
 */
export enum AuditEventType {
  // Authentication events
  USER_REGISTERED = 'user.registered',
  USER_LOGIN = 'user.login',
  USER_LOGOUT = 'user.logout',
  USER_LOGIN_FAILED = 'user.login_failed',
  USER_ACCOUNT_LOCKED = 'user.account_locked',
  USER_PASSWORD_CHANGED = 'user.password_changed',
  USER_EMAIL_CHANGED = 'user.email_changed',
  USER_PROFILE_UPDATED = 'user.profile_updated',
  USER_DELETED = 'user.deleted',
  
  // Session events
  SESSION_CREATED = 'session.created',
  SESSION_REFRESHED = 'session.refreshed',
  SESSION_REVOKED = 'session.revoked',
  SESSION_EXPIRED = 'session.expired',
  
  // Wallet events
  WALLET_CONNECTED = 'wallet.connected',
  WALLET_DISCONNECTED = 'wallet.disconnected',
  
  // Email events
  EMAIL_VERIFICATION_SENT = 'email.verification_sent',
  EMAIL_VERIFIED = 'email.verified',
  PASSWORD_RESET_REQUESTED = 'password.reset_requested',
  PASSWORD_RESET_COMPLETED = 'password.reset_completed',
  
  // Role and permission events
  ROLE_ASSIGNED = 'role.assigned',
  ROLE_REMOVED = 'role.removed',
  PERMISSION_GRANTED = 'permission.granted',
  PERMISSION_REVOKED = 'permission.revoked',
  
  // Organization events
  ORGANIZATION_CREATED = 'organization.created',
  ORGANIZATION_UPDATED = 'organization.updated',
  ORGANIZATION_DELETED = 'organization.deleted',
  ORGANIZATION_MEMBER_ADDED = 'organization.member_added',
  ORGANIZATION_MEMBER_REMOVED = 'organization.member_removed',
  ORGANIZATION_ROLE_CHANGED = 'organization.role_changed',
  
  // Admin actions
  ADMIN_ACTION = 'admin.action',
  
  // Security-critical events
  SUSPICIOUS_ACTIVITY = 'security.suspicious_activity',
  RATE_LIMIT_EXCEEDED = 'security.rate_limit_exceeded',
  ACCESS_DENIED = 'security.access_denied',
  
  // System events
  SYSTEM_ERROR = 'system.error',
  SYSTEM_CONFIGURATION_CHANGED = 'system.configuration_changed'
}

/**
 * Severity levels for audit events
 */
export enum AuditSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical'
}

/**
 * Base audit event data
 */
export interface AuditEventBase {
  type: AuditEventType;
  userId?: string;
  sessionId?: string;
  organizationId?: string;
  ip?: string;
  userAgent?: string;
  severity?: AuditSeverity;
  metadata?: Record<string, any>;
}

/**
 * Authentication audit event
 */
export interface AuthenticationAuditEvent extends AuditEventBase {
  type: AuditEventType.USER_LOGIN | AuditEventType.USER_LOGOUT | AuditEventType.USER_LOGIN_FAILED;
  authProvider?: string;
  reason?: string;
  failureReason?: string;
}

/**
 * User modification audit event
 */
export interface UserModificationAuditEvent extends AuditEventBase {
  type: AuditEventType.USER_REGISTERED | AuditEventType.USER_PROFILE_UPDATED | AuditEventType.USER_DELETED | AuditEventType.USER_PASSWORD_CHANGED | AuditEventType.USER_EMAIL_CHANGED;
  targetUserId?: string; // If different from the actor (userId)
  changes?: Record<string, { before: any; after: any }>;
}

/**
 * Session audit event
 */
export interface SessionAuditEvent extends AuditEventBase {
  type: AuditEventType.SESSION_CREATED | AuditEventType.SESSION_REFRESHED | AuditEventType.SESSION_REVOKED | AuditEventType.SESSION_EXPIRED;
  deviceInfo?: Record<string, any>;
}

/**
 * Email verification audit event
 */
export interface EmailVerificationAuditEvent extends AuditEventBase {
  type: AuditEventType.EMAIL_VERIFICATION_SENT | AuditEventType.EMAIL_VERIFIED;
  email?: string;
  verified?: boolean;
}

/**
 * Password reset audit event
 */
export interface PasswordResetAuditEvent extends AuditEventBase {
  type: AuditEventType.PASSWORD_RESET_REQUESTED | AuditEventType.PASSWORD_RESET_COMPLETED;
  email?: string;
  requestId?: string;
}

/**
 * Role modification audit event
 */
export interface RoleModificationAuditEvent extends AuditEventBase {
  type: AuditEventType.ROLE_ASSIGNED | AuditEventType.ROLE_REMOVED;
  targetUserId: string;
  roleName: string;
  assignedBy?: string;
}

/**
 * Permission modification audit event
 */
export interface PermissionModificationAuditEvent extends AuditEventBase {
  type: AuditEventType.PERMISSION_GRANTED | AuditEventType.PERMISSION_REVOKED;
  targetUserId: string;
  resource: string;
  action: string;
  grantedBy?: string;
}

/**
 * Organization audit event
 */
export interface OrganizationAuditEvent extends AuditEventBase {
  type: AuditEventType.ORGANIZATION_CREATED | AuditEventType.ORGANIZATION_UPDATED | AuditEventType.ORGANIZATION_DELETED | AuditEventType.ORGANIZATION_MEMBER_ADDED | AuditEventType.ORGANIZATION_MEMBER_REMOVED | AuditEventType.ORGANIZATION_ROLE_CHANGED;
  targetUserId?: string;
  roleName?: string;
  changes?: Record<string, { before: any; after: any }>;
}

/**
 * Security audit event
 */
export interface SecurityAuditEvent extends AuditEventBase {
  type: AuditEventType.SUSPICIOUS_ACTIVITY | AuditEventType.RATE_LIMIT_EXCEEDED | AuditEventType.ACCESS_DENIED;
  resource?: string;
  action?: string;
  reason?: string;
  attempts?: number;
}

/**
 * System audit event
 */
export interface SystemAuditEvent extends AuditEventBase {
  type: AuditEventType.SYSTEM_ERROR | AuditEventType.SYSTEM_CONFIGURATION_CHANGED;
  component?: string;
  error?: string;
  changes?: Record<string, { before: any; after: any }>;
}

/**
 * Wallet audit event
 */
export interface WalletAuditEvent extends AuditEventBase {
  type: AuditEventType.WALLET_CONNECTED | AuditEventType.WALLET_DISCONNECTED;
  walletAddress?: string;
  walletProvider?: string;
}

/**
 * Admin action audit event
 */
export interface AdminAuditEvent extends AuditEventBase {
  type: AuditEventType.ADMIN_ACTION;
  action: string;
  targetUserId?: string;
  targetResource?: string;
  changes?: Record<string, { before: any; after: any }>;
}

/**
 * Union type for all audit events
 */
export type AuditEvent =
  | AuthenticationAuditEvent
  | UserModificationAuditEvent
  | SessionAuditEvent
  | EmailVerificationAuditEvent
  | PasswordResetAuditEvent
  | RoleModificationAuditEvent
  | PermissionModificationAuditEvent
  | OrganizationAuditEvent
  | SecurityAuditEvent
  | SystemAuditEvent
  | WalletAuditEvent
  | AdminAuditEvent;

/**
 * Default severity levels for event types
 */
export const DEFAULT_SEVERITY_MAP: Record<AuditEventType, AuditSeverity> = {
  [AuditEventType.USER_REGISTERED]: AuditSeverity.INFO,
  [AuditEventType.USER_LOGIN]: AuditSeverity.INFO,
  [AuditEventType.USER_LOGOUT]: AuditSeverity.INFO,
  [AuditEventType.USER_LOGIN_FAILED]: AuditSeverity.WARNING,
  [AuditEventType.USER_ACCOUNT_LOCKED]: AuditSeverity.WARNING,
  [AuditEventType.USER_PASSWORD_CHANGED]: AuditSeverity.INFO,
  [AuditEventType.USER_EMAIL_CHANGED]: AuditSeverity.INFO,
  [AuditEventType.USER_PROFILE_UPDATED]: AuditSeverity.INFO,
  [AuditEventType.USER_DELETED]: AuditSeverity.WARNING,
  
  [AuditEventType.SESSION_CREATED]: AuditSeverity.INFO,
  [AuditEventType.SESSION_REFRESHED]: AuditSeverity.INFO,
  [AuditEventType.SESSION_REVOKED]: AuditSeverity.INFO,
  [AuditEventType.SESSION_EXPIRED]: AuditSeverity.INFO,
  
  [AuditEventType.WALLET_CONNECTED]: AuditSeverity.INFO,
  [AuditEventType.WALLET_DISCONNECTED]: AuditSeverity.INFO,
  
  [AuditEventType.EMAIL_VERIFICATION_SENT]: AuditSeverity.INFO,
  [AuditEventType.EMAIL_VERIFIED]: AuditSeverity.INFO,
  [AuditEventType.PASSWORD_RESET_REQUESTED]: AuditSeverity.WARNING,
  [AuditEventType.PASSWORD_RESET_COMPLETED]: AuditSeverity.WARNING,
  
  [AuditEventType.ROLE_ASSIGNED]: AuditSeverity.INFO,
  [AuditEventType.ROLE_REMOVED]: AuditSeverity.INFO,
  [AuditEventType.PERMISSION_GRANTED]: AuditSeverity.INFO,
  [AuditEventType.PERMISSION_REVOKED]: AuditSeverity.INFO,
  
  [AuditEventType.ORGANIZATION_CREATED]: AuditSeverity.INFO,
  [AuditEventType.ORGANIZATION_UPDATED]: AuditSeverity.INFO,
  [AuditEventType.ORGANIZATION_DELETED]: AuditSeverity.WARNING,
  [AuditEventType.ORGANIZATION_MEMBER_ADDED]: AuditSeverity.INFO,
  [AuditEventType.ORGANIZATION_MEMBER_REMOVED]: AuditSeverity.INFO,
  [AuditEventType.ORGANIZATION_ROLE_CHANGED]: AuditSeverity.INFO,
  
  [AuditEventType.ADMIN_ACTION]: AuditSeverity.WARNING,
  
  [AuditEventType.SUSPICIOUS_ACTIVITY]: AuditSeverity.WARNING,
  [AuditEventType.RATE_LIMIT_EXCEEDED]: AuditSeverity.WARNING,
  [AuditEventType.ACCESS_DENIED]: AuditSeverity.WARNING,
  
  [AuditEventType.SYSTEM_ERROR]: AuditSeverity.ERROR,
  [AuditEventType.SYSTEM_CONFIGURATION_CHANGED]: AuditSeverity.WARNING
};
