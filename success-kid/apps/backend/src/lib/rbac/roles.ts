import { Permissions } from './permissions';

/**
 * Role definition
 */
export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  parentRoles?: string[];
}

/**
 * Role registry for the application
 * Centralized definition of all roles
 */
export const Roles: Record<string, Role> = {
  // Super admin with all permissions
  ADMIN: {
    id: 'admin',
    name: 'Administrator',
    description: 'Full system access',
    permissions: [
      // System permissions
      Permissions.SYSTEM_SETTINGS.id,
      Permissions.FEATURE_FLAGS.id,
      Permissions.AUDIT_LOGS.id,
      
      // User management
      Permissions.USER_MANAGE.id,
      
      // Content management
      Permissions.CONTENT_MANAGE.id,
      
      // Points management
      Permissions.POINTS_MANAGE.id,
      
      // Organization management
      Permissions.ORG_MANAGE.id
    ]
  },
  
  // Moderator role for content management
  MODERATOR: {
    id: 'moderator',
    name: 'Moderator',
    description: 'Content and user moderation',
    permissions: [
      // Content management
      Permissions.CONTENT_READ.id,
      Permissions.CONTENT_UPDATE.id,
      Permissions.CONTENT_DELETE.id,
      
      // Limited user management
      Permissions.USER_READ.id,
      
      // Audit logs
      Permissions.AUDIT_LOGS.id
    ]
  },
  
  // Content manager role
  CONTENT_MANAGER: {
    id: 'content_manager',
    name: 'Content Manager',
    description: 'Manages content and posts',
    permissions: [
      Permissions.CONTENT_READ.id,
      Permissions.CONTENT_CREATE.id,
      Permissions.CONTENT_UPDATE.id,
      Permissions.CONTENT_DELETE.id
    ],
    parentRoles: []
  },
  
  // Regular user
  USER: {
    id: 'user',
    name: 'User',
    description: 'Standard user access',
    permissions: [
      // Content permissions
      Permissions.CONTENT_READ.id,
      Permissions.CONTENT_CREATE.id,
      Permissions.CONTENT_UPDATE.id, // Own content only, enforced in services
      Permissions.CONTENT_DELETE.id, // Own content only, enforced in services
      
      // Points permissions
      Permissions.POINTS_READ.id,
      
      // User permissions
      Permissions.USER_READ.id, // Public profiles only, enforced in services
      Permissions.USER_UPDATE.id, // Own profile only, enforced in services
      
      // Organization permissions
      Permissions.ORG_READ.id
    ]
  },
  
  // Organization admin
  ORG_ADMIN: {
    id: 'org_admin',
    name: 'Organization Administrator',
    description: 'Manages an organization',
    permissions: [
      // Organization permissions
      Permissions.ORG_READ.id,
      Permissions.ORG_UPDATE.id,
      
      // User permissions within org
      Permissions.USER_READ.id,
      
      // Content permissions within org
      Permissions.CONTENT_READ.id,
      Permissions.CONTENT_CREATE.id,
      Permissions.CONTENT_UPDATE.id,
      Permissions.CONTENT_DELETE.id
    ]
  }
};

/**
 * Get all registered roles
 */
export function getAllRoles(): Role[] {
  return Object.values(Roles);
}

/**
 * Get role by ID
 */
export function getRoleById(id: string): Role | undefined {
  return getAllRoles().find(role => role.id === id);
}

/**
 * Get all permissions for a role, including from parent roles
 */
export function getRolePermissions(roleId: string): string[] {
  const role = getRoleById(roleId);
  
  if (!role) {
    return [];
  }
  
  // Start with direct permissions
  const permissions = [...role.permissions];
  
  // Add permissions from parent roles if any
  if (role.parentRoles && role.parentRoles.length > 0) {
    for (const parentRoleId of role.parentRoles) {
      const parentPermissions = getRolePermissions(parentRoleId);
      permissions.push(...parentPermissions);
    }
  }
  
  // Remove duplicates
  return [...new Set(permissions)];
}
