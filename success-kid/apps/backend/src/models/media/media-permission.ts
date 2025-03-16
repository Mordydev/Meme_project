/**
 * Media Permission Model
 * 
 * Defines the permissions structure for media files in the system
 */

/**
 * Permission entity type
 */
export enum PermissionEntityType {
  USER = 'user',
  ROLE = 'role',
  PUBLIC = 'public',
}

/**
 * Permission type
 */
export enum PermissionType {
  READ = 'read',
  WRITE = 'write',
  DELETE = 'delete',
}

/**
 * MediaPermission entity
 */
export interface MediaPermission {
  id: string;
  mediaId: string;
  entityType: PermissionEntityType;
  entityId?: string; // Null for PUBLIC entity type
  permission: PermissionType;
  expiresAt?: Date; // Optional expiration
  createdAt: Date;
  createdBy: string;
}

/**
 * CreateMediaPermissionDto for creating new permissions
 */
export interface CreateMediaPermissionDto {
  mediaId: string;
  entityType: PermissionEntityType;
  entityId?: string;
  permission: PermissionType;
  expiresAt?: Date;
  createdBy: string;
}

/**
 * TemporaryAccessOptions for creating temporary access
 */
export interface TemporaryAccessOptions {
  duration: number; // Duration in seconds
  permissions: PermissionType[];
  metadata?: Record<string, any>;
}
