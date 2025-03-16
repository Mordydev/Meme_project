/**
 * Role Repository
 * 
 * Handles data access for roles and permissions
 */
import { Pool } from 'pg';
import { BaseRepository } from './base-repository';
import { 
  Role, 
  Permission, 
  UserRole,
  NewRoleInput,
  NewPermissionInput
} from '../models/role';
import { logger } from '../lib/logger';

export class RoleRepository extends BaseRepository<Role> {
  constructor(db: Pool) {
    super(db, 'roles', 'id');
  }

  /**
   * Find a role by name
   */
  async findByName(name: string): Promise<Role | null> {
    try {
      const query = 'SELECT * FROM roles WHERE name = $1';
      const result = await this.db.query<Role>(query, [name]);
      
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error finding role by name', { error, name });
      throw error;
    }
  }

  /**
   * Create a new role
   */
  async createRole(input: NewRoleInput): Promise<Role> {
    try {
      const now = new Date();
      
      return await this.create({
        ...input,
        permissions: input.permissions || [],
        parent_roles: input.parent_roles || [],
        created_at: now,
        updated_at: now
      });
    } catch (error) {
      logger.error('Error creating role', { error, input });
      throw error;
    }
  }

  /**
   * Update a role's permissions
   */
  async updateRolePermissions(roleId: string, permissions: string[]): Promise<Role | null> {
    try {
      const query = `
        UPDATE roles
        SET permissions = $2, updated_at = NOW()
        WHERE id = $1
        RETURNING *
      `;
      
      const result = await this.db.query<Role>(query, [roleId, permissions]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error updating role permissions', { error, roleId });
      throw error;
    }
  }

  /**
   * Assign a role to a user
   */
  async assignRoleToUser(userId: string, roleId: string, organizationId?: string): Promise<UserRole> {
    try {
      const query = `
        INSERT INTO user_roles
          (user_id, role_id, organization_id, assigned_at)
        VALUES
          ($1, $2, $3, $4)
        RETURNING *
      `;
      
      const result = await this.db.query<UserRole>(
        query, 
        [userId, roleId, organizationId || null, new Date()]
      );
      
      return result.rows[0];
    } catch (error) {
      logger.error('Error assigning role to user', { error, userId, roleId });
      throw error;
    }
  }

  /**
   * Remove a role from a user
   */
  async removeRoleFromUser(userId: string, roleId: string, organizationId?: string): Promise<boolean> {
    try {
      let query = `
        DELETE FROM user_roles
        WHERE user_id = $1 AND role_id = $2
      `;
      
      const params = [userId, roleId];
      
      if (organizationId) {
        query += ' AND organization_id = $3';
        params.push(organizationId);
      } else {
        query += ' AND organization_id IS NULL';
      }
      
      const result = await this.db.query(query, params);
      return result.rowCount > 0;
    } catch (error) {
      logger.error('Error removing role from user', { error, userId, roleId });
      throw error;
    }
  }

  /**
   * Get all roles assigned to a user
   */
  async getUserRoles(userId: string, organizationId?: string): Promise<Role[]> {
    try {
      let query = `
        SELECT r.* FROM roles r
        JOIN user_roles ur ON r.id = ur.role_id
        WHERE ur.user_id = $1
      `;
      
      const params = [userId];
      
      if (organizationId) {
        query += ' AND (ur.organization_id = $2 OR ur.organization_id IS NULL)';
        params.push(organizationId);
      }
      
      query += ' ORDER BY r.name';
      
      const result = await this.db.query<Role>(query, params);
      return result.rows;
    } catch (error) {
      logger.error('Error getting user roles', { error, userId });
      throw error;
    }
  }

  /**
   * Get all users with a specific role
   */
  async getUsersWithRole(roleId: string, organizationId?: string): Promise<string[]> {
    try {
      let query = `
        SELECT user_id FROM user_roles
        WHERE role_id = $1
      `;
      
      const params = [roleId];
      
      if (organizationId) {
        query += ' AND organization_id = $2';
        params.push(organizationId);
      } else {
        query += ' AND organization_id IS NULL';
      }
      
      const result = await this.db.query<{ user_id: string }>(query, params);
      return result.rows.map(row => row.user_id);
    } catch (error) {
      logger.error('Error getting users with role', { error, roleId });
      throw error;
    }
  }

  /**
   * Check if a user has a specific role
   */
  async userHasRole(userId: string, roleName: string, organizationId?: string): Promise<boolean> {
    try {
      let query = `
        SELECT EXISTS (
          SELECT 1 FROM user_roles ur
          JOIN roles r ON ur.role_id = r.id
          WHERE ur.user_id = $1 AND r.name = $2
      `;
      
      const params = [userId, roleName];
      
      if (organizationId) {
        query += ' AND (ur.organization_id = $3 OR ur.organization_id IS NULL)';
        params.push(organizationId);
      } else {
        query += ' AND ur.organization_id IS NULL';
      }
      
      query += ') AS has_role';
      
      const result = await this.db.query<{ has_role: boolean }>(query, params);
      return result.rows[0]?.has_role || false;
    } catch (error) {
      logger.error('Error checking if user has role', { error, userId, roleName });
      throw error;
    }
  }
}

export class PermissionRepository extends BaseRepository<Permission> {
  constructor(db: Pool) {
    super(db, 'permissions', 'id');
  }

  /**
   * Find permission by resource and action
   */
  async findByResourceAction(resource: string, action: string): Promise<Permission | null> {
    try {
      const query = 'SELECT * FROM permissions WHERE resource = $1 AND action = $2';
      const result = await this.db.query<Permission>(query, [resource, action]);
      
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error finding permission by resource and action', { error, resource, action });
      throw error;
    }
  }

  /**
   * Create a new permission
   */
  async createPermission(input: NewPermissionInput): Promise<Permission> {
    try {
      return await this.create({
        ...input,
        created_at: new Date()
      });
    } catch (error) {
      logger.error('Error creating permission', { error, input });
      throw error;
    }
  }

  /**
   * Get permissions by resource
   */
  async getPermissionsByResource(resource: string): Promise<Permission[]> {
    try {
      const query = 'SELECT * FROM permissions WHERE resource = $1';
      const result = await this.db.query<Permission>(query, [resource]);
      
      return result.rows;
    } catch (error) {
      logger.error('Error getting permissions by resource', { error, resource });
      throw error;
    }
  }

  /**
   * Get permissions by list of IDs
   */
  async getPermissionsByIds(ids: string[]): Promise<Permission[]> {
    try {
      if (ids.length === 0) return [];
      
      const query = `
        SELECT * FROM permissions
        WHERE id = ANY($1::uuid[])
        ORDER BY resource, action
      `;
      
      const result = await this.db.query<Permission>(query, [ids]);
      return result.rows;
    } catch (error) {
      logger.error('Error getting permissions by IDs', { error, ids });
      throw error;
    }
  }

  /**
   * Get all user permissions including from roles
   */
  async getUserPermissions(userId: string, organizationId?: string): Promise<Permission[]> {
    try {
      let query = `
        SELECT DISTINCT p.* FROM permissions p
        JOIN roles r ON p.id = ANY(r.permissions)
        JOIN user_roles ur ON r.id = ur.role_id
        WHERE ur.user_id = $1
      `;
      
      const params = [userId];
      
      if (organizationId) {
        query += ' AND (ur.organization_id = $2 OR ur.organization_id IS NULL)';
        params.push(organizationId);
      }
      
      query += ' ORDER BY p.resource, p.action';
      
      const result = await this.db.query<Permission>(query, params);
      return result.rows;
    } catch (error) {
      logger.error('Error getting user permissions', { error, userId });
      throw error;
    }
  }
}
