/**
 * Permission definition
 */
export interface Permission {
  id: string;
  name: string;
  description: string;
  resource: string;
  action: 'create' | 'read' | 'update' | 'delete' | 'manage';
}

/**
 * Permission registry for the application
 * Centralized definition of all permissions
 */
export const Permissions: Record<string, Permission> = {
  // User permissions
  USER_READ: {
    id: 'user:read',
    name: 'Read User',
    description: 'View user information',
    resource: 'user',
    action: 'read'
  },
  USER_CREATE: {
    id: 'user:create',
    name: 'Create User',
    description: 'Create new users',
    resource: 'user',
    action: 'create'
  },
  USER_UPDATE: {
    id: 'user:update',
    name: 'Update User',
    description: 'Update user information',
    resource: 'user',
    action: 'update'
  },
  USER_DELETE: {
    id: 'user:delete',
    name: 'Delete User',
    description: 'Delete users',
    resource: 'user',
    action: 'delete'
  },
  USER_MANAGE: {
    id: 'user:manage',
    name: 'Manage Users',
    description: 'Full control over users',
    resource: 'user',
    action: 'manage'
  },
  
  // Content permissions
  CONTENT_READ: {
    id: 'content:read',
    name: 'Read Content',
    description: 'View content',
    resource: 'content',
    action: 'read'
  },
  CONTENT_CREATE: {
    id: 'content:create',
    name: 'Create Content',
    description: 'Create new content',
    resource: 'content',
    action: 'create'
  },
  CONTENT_UPDATE: {
    id: 'content:update',
    name: 'Update Content',
    description: 'Update content',
    resource: 'content',
    action: 'update'
  },
  CONTENT_DELETE: {
    id: 'content:delete',
    name: 'Delete Content',
    description: 'Delete content',
    resource: 'content',
    action: 'delete'
  },
  CONTENT_MANAGE: {
    id: 'content:manage',
    name: 'Manage Content',
    description: 'Full control over content',
    resource: 'content',
    action: 'manage'
  },
  
  // Points permissions
  POINTS_READ: {
    id: 'points:read',
    name: 'Read Points',
    description: 'View points',
    resource: 'points',
    action: 'read'
  },
  POINTS_CREATE: {
    id: 'points:create',
    name: 'Award Points',
    description: 'Award points to users',
    resource: 'points',
    action: 'create'
  },
  POINTS_UPDATE: {
    id: 'points:update',
    name: 'Update Points',
    description: 'Update point transactions',
    resource: 'points',
    action: 'update'
  },
  POINTS_DELETE: {
    id: 'points:delete',
    name: 'Revoke Points',
    description: 'Revoke points from users',
    resource: 'points',
    action: 'delete'
  },
  POINTS_MANAGE: {
    id: 'points:manage',
    name: 'Manage Points',
    description: 'Full control over points system',
    resource: 'points',
    action: 'manage'
  },
  
  // Organization permissions
  ORG_READ: {
    id: 'organization:read',
    name: 'Read Organization',
    description: 'View organization information',
    resource: 'organization',
    action: 'read'
  },
  ORG_CREATE: {
    id: 'organization:create',
    name: 'Create Organization',
    description: 'Create new organizations',
    resource: 'organization',
    action: 'create'
  },
  ORG_UPDATE: {
    id: 'organization:update',
    name: 'Update Organization',
    description: 'Update organization information',
    resource: 'organization',
    action: 'update'
  },
  ORG_DELETE: {
    id: 'organization:delete',
    name: 'Delete Organization',
    description: 'Delete organizations',
    resource: 'organization',
    action: 'delete'
  },
  ORG_MANAGE: {
    id: 'organization:manage',
    name: 'Manage Organizations',
    description: 'Full control over organizations',
    resource: 'organization',
    action: 'manage'
  },
  
  // System permissions
  SYSTEM_SETTINGS: {
    id: 'system:settings',
    name: 'System Settings',
    description: 'Manage system settings',
    resource: 'system',
    action: 'manage'
  },
  FEATURE_FLAGS: {
    id: 'system:feature_flags',
    name: 'Feature Flags',
    description: 'Manage feature flags',
    resource: 'system',
    action: 'manage'
  },
  AUDIT_LOGS: {
    id: 'system:audit_logs',
    name: 'Audit Logs',
    description: 'View audit logs',
    resource: 'system',
    action: 'read'
  }
};

/**
 * Get all registered permissions
 */
export function getAllPermissions(): Permission[] {
  return Object.values(Permissions);
}

/**
 * Get permission by ID
 */
export function getPermissionById(id: string): Permission | undefined {
  return getAllPermissions().find(permission => permission.id === id);
}
