/**
 * Media Repository
 * 
 * Handles database operations for media files
 */
import { Pool } from 'pg';
import { BaseRepository } from '../base-repository';
import { 
  Media, 
  CreateMediaDto, 
  UpdateMediaDto, 
  MediaStatus, 
  MediaType,
  MediaVariant
} from '../../models/media/media';
import { logger } from '../../lib/logger';

export interface MediaQueryOptions {
  userId?: string;
  type?: MediaType;
  status?: MediaStatus;
  limit?: number;
  offset?: number;
  lastId?: string;
  search?: string;
  sortBy?: 'newest' | 'oldest' | 'size' | 'name';
}

export class MediaRepository extends BaseRepository<Media> {
  constructor(db: Pool) {
    super(db, 'media', 'id');
  }

  /**
   * Create a new media record
   */
  async createMedia(input: CreateMediaDto): Promise<Media> {
    try {
      const {
        userId,
        originalName,
        mimeType,
        size,
        type,
        path,
        publicUrl,
        status = 'uploading',
        metadata
      } = input;
      
      // Convert metadata to JSON string if provided
      const metadataJson = metadata ? JSON.stringify(metadata) : null;
      
      const query = `
        INSERT INTO media (
          id,
          user_id,
          original_name,
          mime_type,
          size,
          type,
          path,
          public_url,
          status,
          metadata,
          created_at,
          updated_at
        )
        VALUES (
          uuid_generate_v4(),
          $1, $2, $3, $4, $5, $6, $7, $8, $9,
          NOW(), NOW()
        )
        RETURNING *
      `;
      
      const result = await this.db.query<any>(query, [
        userId,
        originalName,
        mimeType,
        size,
        type,
        path,
        publicUrl,
        status,
        metadataJson
      ]);

      // Transform from snake_case to camelCase
      return this.mapToCamelCase(result.rows[0]);
    } catch (error) {
      logger.error('Error creating media', { error, input });
      throw error;
    }
  }
  
  /**
   * Update media record
   */
  async updateMedia(id: string, input: UpdateMediaDto): Promise<Media | null> {
    try {
      const updates = [];
      const values = [];
      let paramIndex = 1;
      
      // Build dynamic SET clause
      if (input.status !== undefined) {
        updates.push(`status = $${paramIndex++}`);
        values.push(input.status);
      }
      
      if (input.metadata !== undefined) {
        updates.push(`metadata = $${paramIndex++}`);
        values.push(JSON.stringify(input.metadata));
      }
      
      if (input.variants !== undefined) {
        updates.push(`variants = $${paramIndex++}`);
        values.push(JSON.stringify(input.variants));
      }
      
      if (input.processingCompletedAt !== undefined) {
        updates.push(`processing_completed_at = $${paramIndex++}`);
        values.push(input.processingCompletedAt);
      }
      
      if (input.publicUrl !== undefined) {
        updates.push(`public_url = $${paramIndex++}`);
        values.push(input.publicUrl);
      }
      
      // Always update the updated_at timestamp
      updates.push(`updated_at = NOW()`);
      
      if (updates.length === 0) {
        // No updates to perform
        return this.findById(id);
      }
      
      const query = `
        UPDATE media
        SET ${updates.join(', ')}
        WHERE id = $${paramIndex++}
        RETURNING *
      `;
      
      values.push(id);
      
      const result = await this.db.query<any>(query, values);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      // Transform from snake_case to camelCase
      return this.mapToCamelCase(result.rows[0]);
    } catch (error) {
      logger.error('Error updating media', { error, mediaId: id, input });
      throw error;
    }
  }
  
  /**
   * Get media with filtering options
   */
  async getMedia(options: MediaQueryOptions = {}): Promise<Media[]> {
    try {
      const {
        userId,
        type,
        status,
        limit = 20,
        offset = 0,
        lastId,
        search,
        sortBy = 'newest'
      } = options;
      
      let query = `
        SELECT m.*, u.display_name as user_name
        FROM media m
        JOIN users u ON m.user_id = u.id
        WHERE 1=1
      `;
      
      const queryParams: any[] = [];
      let paramIndex = 1;
      
      // Apply filters
      if (userId) {
        query += ` AND m.user_id = $${paramIndex++}`;
        queryParams.push(userId);
      }
      
      if (type) {
        query += ` AND m.type = $${paramIndex++}`;
        queryParams.push(type);
      }
      
      if (status) {
        query += ` AND m.status = $${paramIndex++}`;
        queryParams.push(status);
      }
      
      if (search) {
        query += ` AND (
          m.original_name ILIKE $${paramIndex++} OR
          m.metadata::text ILIKE $${paramIndex++}
        )`;
        const searchPattern = `%${search}%`;
        queryParams.push(searchPattern, searchPattern);
      }
      
      // Apply keyset pagination if lastId provided
      if (lastId) {
        if (sortBy === 'newest') {
          query += ` AND m.created_at < (SELECT created_at FROM media WHERE id = $${paramIndex++})`;
        } else if (sortBy === 'oldest') {
          query += ` AND m.created_at > (SELECT created_at FROM media WHERE id = $${paramIndex++})`;
        } else if (sortBy === 'size') {
          query += ` AND m.size < (SELECT size FROM media WHERE id = $${paramIndex++})`;
        } else if (sortBy === 'name') {
          query += ` AND m.original_name > (SELECT original_name FROM media WHERE id = $${paramIndex++})`;
        }
        queryParams.push(lastId);
      }
      
      // Add sorting
      switch (sortBy) {
        case 'oldest':
          query += ` ORDER BY m.created_at ASC`;
          break;
        case 'size':
          query += ` ORDER BY m.size DESC`;
          break;
        case 'name':
          query += ` ORDER BY m.original_name ASC`;
          break;
        case 'newest':
        default:
          query += ` ORDER BY m.created_at DESC`;
          break;
      }
      
      // Add limit and offset if not using keyset pagination
      if (!lastId) {
        query += ` LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
        queryParams.push(limit, offset);
      } else {
        query += ` LIMIT $${paramIndex++}`;
        queryParams.push(limit);
      }
      
      const result = await this.db.query<any>(query, queryParams);
      
      // Transform all results to camelCase
      return result.rows.map(row => this.mapToCamelCase(row));
    } catch (error) {
      logger.error('Error getting media', { error, options });
      throw error;
    }
  }
  
  /**
   * Get media by ID with full details
   */
  async getMediaWithDetails(id: string): Promise<Media | null> {
    try {
      const query = `
        SELECT m.*, u.display_name as user_name
        FROM media m
        JOIN users u ON m.user_id = u.id
        WHERE m.id = $1
      `;
      
      const result = await this.db.query<any>(query, [id]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      // Transform to camelCase
      return this.mapToCamelCase(result.rows[0]);
    } catch (error) {
      logger.error('Error getting media with details', { error, mediaId: id });
      throw error;
    }
  }
  
  /**
   * Find media by path
   */
  async findByPath(path: string): Promise<Media | null> {
    try {
      const query = `SELECT * FROM media WHERE path = $1`;
      const result = await this.db.query<any>(query, [path]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return this.mapToCamelCase(result.rows[0]);
    } catch (error) {
      logger.error('Error finding media by path', { error, path });
      throw error;
    }
  }
  
  /**
   * Add variant to media
   */
  async addVariant(mediaId: string, variantName: string, variant: MediaVariant): Promise<Media | null> {
    try {
      // First get current variants
      const media = await this.findById(mediaId);
      
      if (!media) {
        return null;
      }
      
      // Create or update variants object
      const variants = media.variants || {};
      variants[variantName] = variant;
      
      // Update media with new variants
      return this.updateMedia(mediaId, { variants });
    } catch (error) {
      logger.error('Error adding variant to media', { error, mediaId, variantName });
      throw error;
    }
  }
  
  /**
   * Find orphaned media (not associated with any content)
   */
  async findOrphaned(olderThanDays: number = 7): Promise<Media[]> {
    try {
      const query = `
        SELECT m.*
        FROM media m
        LEFT JOIN content c ON c.media_urls::jsonb @> jsonb_build_array(m.path)
        WHERE c.id IS NULL
          AND m.created_at < NOW() - INTERVAL '${olderThanDays} days'
          AND m.status != $1
      `;
      
      const result = await this.db.query<any>(query, [MediaStatus.DELETED]);
      
      // Transform to camelCase
      return result.rows.map(row => this.mapToCamelCase(row));
    } catch (error) {
      logger.error('Error finding orphaned media', { error, olderThanDays });
      throw error;
    }
  }
  
  /**
   * Get total size of media stored
   */
  async getTotalSize(userId?: string): Promise<number> {
    try {
      let query = `SELECT SUM(size) as total FROM media WHERE status != $1`;
      const params = [MediaStatus.DELETED];
      
      if (userId) {
        query += ` AND user_id = $2`;
        params.push(userId);
      }
      
      const result = await this.db.query<{ total: string }>(query, params);
      
      return parseInt(result.rows[0].total || '0', 10);
    } catch (error) {
      logger.error('Error getting total media size', { error, userId });
      throw error;
    }
  }
  
  /**
   * Get usage statistics by user
   */
  async getUserStatistics(userId: string): Promise<any> {
    try {
      const query = `
        SELECT
          COUNT(*) as file_count,
          SUM(size) as total_size,
          COUNT(*) FILTER (WHERE type = $1) as image_count,
          COUNT(*) FILTER (WHERE type = $2) as video_count,
          COUNT(*) FILTER (WHERE type = $3) as document_count,
          COUNT(*) FILTER (WHERE status = $4) as processing_count
        FROM media
        WHERE user_id = $5 AND status != $6
      `;
      
      const result = await this.db.query(query, [
        MediaType.IMAGE,
        MediaType.VIDEO,
        MediaType.DOCUMENT,
        MediaStatus.PROCESSING,
        userId,
        MediaStatus.DELETED
      ]);
      
      return {
        fileCount: parseInt(result.rows[0].file_count || '0', 10),
        totalSize: parseInt(result.rows[0].total_size || '0', 10),
        imageCount: parseInt(result.rows[0].image_count || '0', 10),
        videoCount: parseInt(result.rows[0].video_count || '0', 10),
        documentCount: parseInt(result.rows[0].document_count || '0', 10),
        processingCount: parseInt(result.rows[0].processing_count || '0', 10)
      };
    } catch (error) {
      logger.error('Error getting user media statistics', { error, userId });
      throw error;
    }
  }
  
  /**
   * Helper function to transform snake_case to camelCase for Media objects
   */
  private mapToCamelCase(row: any): Media {
    // Parse JSON fields
    const metadata = row.metadata ? JSON.parse(row.metadata) : undefined;
    const variants = row.variants ? JSON.parse(row.variants) : undefined;
    
    return {
      id: row.id,
      userId: row.user_id,
      originalName: row.original_name,
      mimeType: row.mime_type,
      size: row.size,
      type: row.type,
      path: row.path,
      publicUrl: row.public_url,
      status: row.status,
      metadata,
      variants,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      processingCompletedAt: row.processing_completed_at,
      userName: row.user_name,
    } as Media;
  }
}
