/**
 * RBAC Roles Definition
 * 
 * Defines system roles and their permissions
 */
import { Role, SystemRole, OrganizationRole, Resource, Action } from '../../models/role';
import { generateId } from '../../lib/id';

// System-defined roles with their permissions

/**
 * Admin role - has all permissions
 */
export const adminRole: Omit<Role, 'created_at' | 'updated_at'> = {
  id: generateId(),
  name: SystemRole.ADMIN,
  description: 'Super admin with full system access',
  permissions: [], // Will be populated with all permissions
  scope: 'system'
};

/**
 * Moderator role - can moderate content
 */
export const moderatorRole: Omit<Role, 'created_at' | 'updated_at'> = {
  id: generateId(),
  name: SystemRole.MODERATOR,
  description: 'Content moderator with access to moderation features',
  permissions: [
    // Content moderation permissions
    `${Resource.CONTENT}:${Action.READ}`,
    `${Resource.CONTENT}:${Action.UPDATE}`,
    `${Resource.CONTENT}:${Action.DELETE}`,
    `${Resource.CONTENT}:${Action.APPROVE}`,
    `${Resource.CONTENT}:${Action.REJECT}`,
    
    // Comment moderation permissions
    `${Resource.COMMENT}:${Action.READ}`,
    `${Resource.COMMENT}:${Action.UPDATE}`,
    `${Resource.COMMENT}:${Action.DELETE}`,
    `${Resource.COMMENT}:${Action.APPROVE}`,
    `${Resource.COMMENT}:${Action.REJECT}`,
    
    // User view permissions
    `${Resource.USER}:${Action.READ}`,
    
    // Limited profile management
    `${Resource.PROFILE}:${Action.READ}`,
  ],
  scope: 'system'
};

/**
 * Regular user role - basic permissions
 */
export const userRole: Omit<Role, 'created_at' | 'updated_at'> = {
  id: generateId(),
  name: SystemRole.USER,
  description: 'Standard user with basic permissions',
  permissions: [
    // Content permissions
    `${Resource.CONTENT}:${Action.CREATE}`,
    `${Resource.CONTENT}:${Action.READ}`,
    `${Resource.CONTENT}:${Action.UPDATE}`, // Own content only, enforced by conditions
    `${Resource.CONTENT}:${Action.DELETE}`, // Own content only, enforced by conditions
    
    // Comment permissions
    `${Resource.COMMENT}:${Action.CREATE}`,
    `${Resource.COMMENT}:${Action.READ}`,
    `${Resource.COMMENT}:${Action.UPDATE}`, // Own comments only, enforced by conditions
    `${Resource.COMMENT}:${Action.DELETE}`, // Own comments only, enforced by conditions
    
    // Profile permissions
    `${Resource.PROFILE}:${Action.READ}`,
    `${Resource.PROFILE}:${Action.UPDATE}`, // Own profile only, enforced by conditions
    
    // Points permissions
    `${Resource.POINTS}:${Action.READ}`,
    
    // Redemption permissions
    `${Resource.REDEMPTION}:${Action.CREATE}`,
    `${Resource.REDEMPTION}:${Action.READ}`,
    
    // Wallet permissions
    `${Resource.WALLET}:${Action.READ}`,
    `${Resource.WALLET}:${Action.UPDATE}`, // Own wallet only, enforced by conditions
    
    // Leaderboard permissions
    `${Resource.LEADERBOARD}:${Action.READ}`,
    
    // Referral permissions
    `${Resource.REFERRAL}:${Action.CREATE}`,
    `${Resource.REFERRAL}:${Action.READ}`,
  ],
  scope: 'system'
};

// Organization-defined roles with their permissions

/**
 * Organization Owner role
 */
export const organizationOwnerRole: Omit<Role, 'created_at' | 'updated_at'> = {
  id: generateId(),
  name: OrganizationRole.OWNER,
  description: 'Organization owner with full control over the organization',
  permissions: [
    // Organization management
    `${Resource.ORGANIZATION}:${Action.MANAGE}`,
    
    // Can manage all users in the organization
    `${Resource.USER}:${Action.MANAGE}`,
  ],
  scope: 'organization'
};

/**
 * Organization Admin role
 */
export const organizationAdminRole: Omit<Role, 'created_at' | 'updated_at'> = {
  id: generateId(),
  name: OrganizationRole.ADMIN,
  description: 'Organization administrator with management capabilities',
  permissions: [
    // Organization management
    `${Resource.ORGANIZATION}:${Action.READ}`,
    `${Resource.ORGANIZATION}:${Action.UPDATE}`,
    
    // User management within organization
    `${Resource.USER}:${Action.READ}`,
    `${Resource.USER}:${Action.CREATE}`,
    `${Resource.USER}:${Action.UPDATE}`,
    
    // Content management within organization
    `${Resource.CONTENT}:${Action.MANAGE}`,
    `${Resource.COMMENT}:${Action.MANAGE}`,
  ],
  scope: 'organization'
};

/**
 * Organization Member role
 */
export const organizationMemberRole: Omit<Role, 'created_at' | 'updated_at'> = {
  id: generateId(),
  name: OrganizationRole.MEMBER,
  description: 'Regular organization member',
  permissions: [
    // Organization access
    `${Resource.ORGANIZATION}:${Action.READ}`,
    
    // Content management within organization
    `${Resource.CONTENT}:${Action.CREATE}`,
    `${Resource.CONTENT}:${Action.READ}`,
    `${Resource.CONTENT}:${Action.UPDATE}`, // Own content only, enforced by conditions
    `${Resource.CONTENT}:${Action.DELETE}`, // Own content only, enforced by conditions
    
    // Comment management within organization
    `${Resource.COMMENT}:${Action.CREATE}`,
    `${Resource.COMMENT}:${Action.READ}`,
    `${Resource.COMMENT}:${Action.UPDATE}`, // Own comments only, enforced by conditions
    `${Resource.COMMENT}:${Action.DELETE}`, // Own comments only, enforced by conditions
  ],
  scope: 'organization'
};

/**
 * All system roles
 */
export const systemRoles = [
  adminRole,
  moderatorRole,
  userRole
];

/**
 * All organization roles
 */
export const organizationRoles = [
  organizationOwnerRole,
  organizationAdminRole,
  organizationMemberRole
];

/**
 * All roles (system and organization)
 */
export const allRoles = [
  ...systemRoles,
  ...organizationRoles
];
