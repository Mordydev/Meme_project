/**
 * Session Models
 * Represents user sessions in the system
 */

/**
 * User session information
 */
export interface Session {
  id: string;
  user_id: string;
  created_at: Date;
  expires_at: Date;
  last_active_at: Date;
  ip_address?: string;
  user_agent?: string;
  device_info?: DeviceInfo;
}

/**
 * Device information
 */
export interface DeviceInfo {
  type?: 'mobile' | 'tablet' | 'desktop' | 'unknown';
  browser?: string;
  os?: string;
  device_name?: string;
}

/**
 * JWT token payload
 */
export interface TokenPayload {
  sub: string; // User ID
  jti: string; // Token ID (Session ID)
  roles: string[]; // User roles
  org?: string; // Current organization context (if applicable)
  perms?: string[]; // Compact permissions (resource:action)
  exp: number; // Expiration timestamp
  iat: number; // Issued at timestamp
}

/**
 * Session token pair (access and refresh tokens)
 */
export interface TokenPair {
  access_token: string;
  refresh_token: string;
  expires_in: number; // Access token expiration in seconds
}

/**
 * Session creation input
 */
export interface CreateSessionInput {
  user_id: string;
  ip_address?: string;
  user_agent?: string;
}

/**
 * Token verification result
 */
export interface TokenVerificationResult {
  valid: boolean;
  payload?: TokenPayload;
  error?: string;
}

/**
 * Session revocation events for handling in WebSockets
 */
export interface SessionRevocationEvent {
  type: 'session_revoked';
  session_id: string;
  user_id: string;
  reason: 'logout' | 'security' | 'expired' | 'admin';
  timestamp: string;
}
