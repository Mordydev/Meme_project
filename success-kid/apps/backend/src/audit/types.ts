/**
 * Audit log entry
 */
export interface AuditLogEntry {
  id: string;
  timestamp: Date;
  userId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  ip: string;
  userAgent: string;
  status: 'success' | 'failure';
  metadata?: Record<string, any>;
}

/**
 * Audit event data for creating a log entry
 */
export interface AuditEventData {
  userId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  ip: string;
  userAgent?: string;
  status: 'success' | 'failure';
  metadata?: Record<string, any>;
}

/**
 * Audit log query parameters
 */
export interface AuditQuery {
  userId?: string;
  action?: string;
  resource?: string;
  resourceId?: string;
  startDate?: Date;
  endDate?: Date;
  status?: 'success' | 'failure';
  limit?: number;
  offset?: number;
}

/**
 * Audit action types
 */
export enum AuditAction {
  // User actions
  USER_CREATED = 'user.created',
  USER_UPDATED = 'user.updated',
  USER_DELETED = 'user.deleted',
  
  // Authentication actions
  LOGIN = 'auth.login',
  LOGOUT = 'auth.logout',
  TOKEN_REFRESH = 'auth.token_refresh',
  PASSWORD_RESET_REQUEST = 'auth.password_reset_request',
  PASSWORD_RESET = 'auth.password_reset',
  EMAIL_VERIFICATION = 'auth.email_verification',
  MFA_SETUP = 'auth.mfa_setup',
  MFA_CHALLENGE = 'auth.mfa_challenge',
  
  // Session actions
  SESSION_CREATED = 'session.created',
  SESSION_REVOKED = 'session.revoked',
  
  // Profile actions
  PROFILE_CREATED = 'profile.created',
  PROFILE_UPDATED = 'profile.updated',
  
  // Wallet actions
  WALLET_CONNECTED = 'wallet.connected',
  WALLET_DISCONNECTED = 'wallet.disconnected',
  
  // Content actions
  CONTENT_CREATED = 'content.created',
  CONTENT_UPDATED = 'content.updated',
  CONTENT_DELETED = 'content.deleted',
  
  // Points actions
  POINTS_AWARDED = 'points.awarded',
  POINTS_REDEEMED = 'points.redeemed',
  
  // Admin actions
  ADMIN_ACTION = 'admin.action',
  FEATURE_FLAG_UPDATED = 'admin.feature_flag_updated'
}

/**
 * Audit resource types
 */
export enum AuditResource {
  USER = 'user',
  PROFILE = 'profile',
  SESSION = 'session',
  AUTHENTICATION = 'authentication',
  CONTENT = 'content',
  COMMENT = 'comment',
  POINTS = 'points',
  WALLET = 'wallet',
  FEATURE_FLAG = 'feature_flag',
  SYSTEM = 'system'
}
