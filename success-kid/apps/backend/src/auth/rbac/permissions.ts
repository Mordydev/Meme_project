/**
 * RBAC Permissions Definition
 * 
 * Defines system permissions
 */
import { Permission, Resource, Action } from '../../models/role';
import { generateId } from '../../lib/id';

// Generate all valid permissions for each resource
function generateResourcePermissions(resource: Resource): Permission[] {
  const now = new Date();
  const permissions: Permission[] = [];
  
  // General permissions for all resources
  const actions = [
    Action.CREATE,
    Action.READ,
    Action.UPDATE,
    Action.DELETE,
    Action.MANAGE
  ];
  
  // Add basic permissions
  for (const action of actions) {
    permissions.push({
      id: generateId(),
      name: `${resource}:${action}`,
      description: `Can ${action} ${resource}`,
      resource,
      action,
      created_at: now
    });
  }
  
  // Add resource-specific permissions
  switch (resource) {
    case Resource.CONTENT:
    case Resource.COMMENT:
      // Add moderation permissions
      permissions.push({
        id: generateId(),
        name: `${resource}:${Action.APPROVE}`,
        description: `Can approve ${resource}`,
        resource,
        action: Action.APPROVE,
        created_at: now
      });
      
      permissions.push({
        id: generateId(),
        name: `${resource}:${Action.REJECT}`,
        description: `Can reject ${resource}`,
        resource,
        action: Action.REJECT,
        created_at: now
      });
      break;
      
    case Resource.USER:
    case Resource.ORGANIZATION:
      // Add role assignment permission
      permissions.push({
        id: generateId(),
        name: `${resource}:${Action.ASSIGN}`,
        description: `Can assign roles for ${resource}`,
        resource,
        action: Action.ASSIGN,
        created_at: now
      });
      break;
  }
  
  return permissions;
}

// Generate all permissions for all resources
export const allPermissions: Permission[] = Object.values(Resource).flatMap(resource => 
  generateResourcePermissions(resource)
);

// Super admin permission (can do anything)
export const superAdminPermission: Permission = {
  id: generateId(),
  name: '*:*',
  description: 'Super admin permission - can do anything',
  resource: '*',
  action: '*',
  created_at: new Date()
};

// Add super admin permission to all permissions
allPermissions.push(superAdminPermission);
