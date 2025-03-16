/**
 * Media Permission Repository
 * 
 * Handles database operations for media file permissions
 */
import { Pool } from 'pg';
import { BaseRepository } from '../base-repository';
import {
  MediaPermission,
  CreateMediaPermissionDto,
  PermissionType,
  PermissionEntityType
} from '../../models/media/media-permission';
import { logger } from '../../lib/logger';

export class MediaPermissionRepository extends BaseRepository<MediaPermission> {
  constructor(db: Pool) {
    super(db, 'media_permissions', 'id');
  }

  /**
   * Create a new permission record
   */
  async createPermission(input: CreateMediaPermissionDto): Promise<MediaPermission> {
    try {
      const {
        mediaId,
        entityType,
        entityId,
        permission,
        expiresAt,
        createdBy
      } = input;
      
      const query = `
        INSERT INTO media_permissions (
          id,
          media_id,
          entity_type,
          entity_id,
          permission,
          expires_at,
          created_at,
          created_by
        )
        VALUES (
          uuid_generate_v4(),
          $1, $2, $3, $4, $5, NOW(), $6
        )
        RETURNING *
      `;
      
      const result = await this.db.query<any>(query, [
        mediaId,
        entityType,
        entityId,
        permission,
        expiresAt,
        createdBy
      ]);
      
      // Transform from snake_case to camelCase
      return this.mapToCamelCase(result.rows[0]);
    } catch (error) {
      logger.error('Error creating media permission', { error, input });
      throw error;
    }
  }
  
  /**
   * Get permissions for a media file
   */
  async getMediaPermissions(mediaId: string): Promise<MediaPermission[]> {
    try {
      const query = `
        SELECT *
        FROM media_permissions
        WHERE media_id = $1
          AND (expires_at IS NULL OR expires_at > NOW())
      `;
      
      const result = await this.db.query<any>(query, [mediaId]);
      
      // Transform to camelCase
      return result.rows.map(row => this.mapToCamelCase(row));
    } catch (error) {
      logger.error('Error getting media permissions', { error, mediaId });
      throw error;
    }
  }
  
  /**
   * Check if user has permission for a media file
   */
  async hasPermission(
    mediaId: string,
    userId: string,
    permission: PermissionType
  ): Promise<boolean> {
    try {
      const query = `
        SELECT EXISTS (
          SELECT 1
          FROM media_permissions
          WHERE media_id = $1
            AND (
              -- Direct user permission
              (entity_type = $2 AND entity_id = $3 AND permission = $4)
              OR
              -- Role-based permission (subquery to check user roles)
              (entity_type = $5 AND entity_id IN (
                SELECT role_id FROM user_roles WHERE user_id = $3
              ) AND permission = $4)
              OR
              -- Public permission
              (entity_type = $6 AND permission = $4)
            )
            AND (expires_at IS NULL OR expires_at > NOW())
        ) as has_permission
      `;
      
      const result = await this.db.query<{ has_permission: boolean }>(query, [
        mediaId,
        PermissionEntityType.USER,
        userId,
        permission,
        PermissionEntityType.ROLE,
        PermissionEntityType.PUBLIC
      ]);
      
      return result.rows[0].has_permission;
    } catch (error) {
      logger.error('Error checking media permission', { error, mediaId, userId, permission });
      throw error;
    }
  }
  
  /**
   * Get all media accessible by a user with specific permission
   */
  async getUserAccessibleMedia(
    userId: string,
    permission: PermissionType,
    limit: number = 50,
    offset: number = 0
  ): Promise<string[]> {
    try {
      const query = `
        SELECT DISTINCT m.id
        FROM media m
        LEFT JOIN media_permissions p ON m.id = p.media_id
        WHERE 
          -- Owner has all permissions
          m.user_id = $1
          OR
          -- Direct user permission
          (p.entity_type = $2 AND p.entity_id = $1 AND p.permission = $3)
          OR
          -- Role-based permission
          (p.entity_type = $4 AND p.entity_id IN (
            SELECT role_id FROM user_roles WHERE user_id = $1
          ) AND p.permission = $3)
          OR
          -- Public permission
          (p.entity_type = $5 AND p.permission = $3)
        AND (p.expires_at IS NULL OR p.expires_at > NOW())
        LIMIT $6 OFFSET $7
      `;
      
      const result = await this.db.query<{ id: string }>(query, [
        userId,
        PermissionEntityType.USER,
        permission,
        PermissionEntityType.ROLE,
        PermissionEntityType.PUBLIC,
        limit,
        offset
      ]);
      
      return result.rows.map(row => row.id);
    } catch (error) {
      logger.error('Error getting user accessible media', { error, userId, permission });
      throw error;
    }
  }
  
  /**
   * Delete permissions for a media file
   */
  async deleteMediaPermissions(mediaId: string): Promise<number> {
    try {
      const query = `DELETE FROM media_permissions WHERE media_id = $1`;
      const result = await this.db.query(query, [mediaId]);
      
      return result.rowCount;
    } catch (error) {
      logger.error('Error deleting media permissions', { error, mediaId });
      throw error;
    }
  }
  
  /**
   * Helper function to transform snake_case to camelCase for MediaPermission objects
   */
  private mapToCamelCase(row: any): MediaPermission {
    return {
      id: row.id,
      mediaId: row.media_id,
      entityType: row.entity_type,
      entityId: row.entity_id,
      permission: row.permission,
      expiresAt: row.expires_at,
      createdAt: row.created_at,
      createdBy: row.created_by
    };
  }
}
