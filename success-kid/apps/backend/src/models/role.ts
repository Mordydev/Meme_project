/**
 * Role and Permission Models
 * Represents roles and permissions in the RBAC system
 */

/**
 * Resource types in the system that can have permissions applied
 */
export enum Resource {
  USER = 'user',
  PROFILE = 'profile',
  CONTENT = 'content',
  COMMENT = 'comment',
  ORGANIZATION = 'organization',
  POINTS = 'points',
  REDEMPTION = 'redemption',
  ACHIEVEMENT = 'achievement',
  WALLET = 'wallet',
  SETTINGS = 'settings',
  LEADERBOARD = 'leaderboard',
  REFERRAL = 'referral',
}

/**
 * Action types that can be performed on resources
 */
export enum Action {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
  MANAGE = 'manage', // Includes all actions
  ASSIGN = 'assign', // For roles/permissions
  APPROVE = 'approve', // For moderation actions
  REJECT = 'reject', // For moderation actions
}

/**
 * Permission model
 */
export interface Permission {
  id: string;
  name: string;
  description?: string;
  resource: Resource | string;
  action: Action | string;
  conditions?: Record<string, any>; // Optional conditions for when permission applies
  created_at: Date;
}

/**
 * Role model
 */
export interface Role {
  id: string;
  name: string;
  description?: string;
  permissions: string[]; // Array of permission IDs
  parent_roles?: string[]; // Array of parent role IDs for inheritance
  scope?: 'system' | 'organization'; // Whether the role is system-wide or organization-specific
  created_at: Date;
  updated_at: Date;
}

/**
 * User Role Assignment
 */
export interface UserRole {
  user_id: string;
  role_id: string;
  organization_id?: string; // Optional if the role is organization-specific
  assigned_by?: string; // User ID of who assigned the role
  assigned_at: Date;
  expires_at?: Date; // Optional expiration date
}

/**
 * Permission Payload for JWT
 * Compact representation for tokens
 */
export interface PermissionPayload {
  r: string; // Resource
  a: string; // Action
  c?: Record<string, any>; // Optional conditions
}

/**
 * System-defined roles - these are created during system initialization
 */
export enum SystemRole {
  ADMIN = 'admin',
  MODERATOR = 'moderator',
  USER = 'user',
}

/**
 * Organization-defined roles - these are default roles for organizations
 */
export enum OrganizationRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  MEMBER = 'member',
}

/**
 * New Permission Input
 */
export interface NewPermissionInput {
  name: string;
  description?: string;
  resource: Resource | string;
  action: Action | string;
  conditions?: Record<string, any>;
}

/**
 * New Role Input
 */
export interface NewRoleInput {
  name: string;
  description?: string;
  permissions: string[];
  parent_roles?: string[];
  scope?: 'system' | 'organization';
}
