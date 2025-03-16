/**
 * Clerk Type Definitions
 */

/**
 * Clerk User information extracted from JWT or API
 */
export interface ClerkUser {
  id: string;
  email: string;
  emailVerified?: boolean;
  firstName?: string;
  lastName?: string;
  username?: string;
  imageUrl?: string;
  metadata?: Record<string, any>;
  publicMetadata?: Record<string, any>;
  privateMetadata?: Record<string, any>;
  organizationId?: string;
}

/**
 * Options for authentication middleware
 */
export interface AuthOptions {
  required?: boolean;
  roles?: string[];
  permissions?: string[];
  resource?: string;
  action?: string;
  organizationId?: string;
}

/**
 * Clerk webhook event types
 */
export enum ClerkWebhookType {
  USER_CREATED = 'user.created',
  USER_UPDATED = 'user.updated',
  USER_DELETED = 'user.deleted',
  SESSION_CREATED = 'session.created',
  SESSION_REVOKED = 'session.revoked',
  SESSION_REMOVED = 'session.removed',
  EMAIL_CREATED = 'email.created',
  EMAIL_VERIFIED = 'email.verified',
  ORGANIZATION_CREATED = 'organization.created',
  ORGANIZATION_UPDATED = 'organization.updated',
  ORGANIZATION_DELETED = 'organization.deleted',
}

/**
 * Webhook verification header from Clerk
 */
export interface ClerkWebhookHeaders {
  'svix-id': string;
  'svix-timestamp': string;
  'svix-signature': string;
}

/**
 * Authentication result
 */
export interface AuthResult {
  authenticated: boolean;
  userId?: string;
  sessionId?: string;
  organizationId?: string;
}
