/**
 * Report Repository
 * 
 * Handles data access operations for content reports
 */
import { Pool } from 'pg';
import { BaseRepository } from './base-repository';
import { 
  Report, 
  CreateReportDto, 
  UpdateReportDto,
  ReportWithDetails,
  ReportStatus
} from '../models/entities/moderation/report.model';
import { logger } from '../lib/logger';

export class ReportRepository extends BaseRepository<Report> {
  /**
   * Create a new ReportRepository instance
   * 
   * @param db Database connection pool
   */
  constructor(db: Pool) {
    super(db, 'content_reports');
  }

  /**
   * Create a new report
   * 
   * @param data Report data
   * @returns Created report
   */
  async createReport(data: CreateReportDto): Promise<Report> {
    try {
      // Set timestamps
      const now = new Date();
      
      return await this.create({
        ...data,
        status: 'pending',
        created_at: now,
        updated_at: now
      });
    } catch (error) {
      logger.error('Error creating report', { error, data });
      throw error;
    }
  }

  /**
   * Update a report
   * 
   * @param id Report ID
   * @param data Report data to update
   * @returns Updated report or null if not found
   */
  async updateReport(id: string, data: UpdateReportDto): Promise<Report | null> {
    try {
      // Always update the updated_at timestamp
      const updateData = {
        ...data,
        updated_at: new Date()
      };
      
      // If resolving the report, set the resolved_at timestamp
      if (data.status === 'resolved' && !data.resolved_at) {
        updateData.resolved_at = new Date();
      }
      
      return await this.update(id, updateData);
    } catch (error) {
      logger.error('Error updating report', { error, id, data });
      throw error;
    }
  }

  /**
   * Get reports with details for moderation queue
   * 
   * @param options Query options
   * @returns Array of reports with details
   */
  async getReportsWithDetails(options: {
    status?: ReportStatus;
    entityType?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<ReportWithDetails[]> {
    try {
      const { status, entityType, limit = 20, offset = 0 } = options;
      
      let query = `
        SELECT 
          r.*,
          reporter.display_name as reporter_name,
          reporter_profile.avatar_url as reporter_avatar,
          moderator.display_name as moderator_name,
          moderator_profile.avatar_url as moderator_avatar
        FROM content_reports r
        JOIN users reporter ON r.reporter_id = reporter.id
        LEFT JOIN profiles reporter_profile ON reporter.id = reporter_profile.user_id
        LEFT JOIN users moderator ON r.moderator_id = moderator.id
        LEFT JOIN profiles moderator_profile ON moderator.id = moderator_profile.user_id
        WHERE 1=1
      `;
      
      const params: any[] = [];
      let paramIndex = 1;
      
      // Add status filter if specified
      if (status) {
        query += ` AND r.status = $${paramIndex++}`;
        params.push(status);
      }
      
      // Add entity type filter if specified
      if (entityType) {
        query += ` AND r.entity_type = $${paramIndex++}`;
        params.push(entityType);
      }
      
      // Add ordering and limit
      query += ` ORDER BY r.created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
      params.push(limit, offset);
      
      const result = await this.db.query(query, params);
      
      // Initialize return array
      const reports: ReportWithDetails[] = [];
      
      // For each report, fetch entity details
      for (const row of result.rows) {
        const report = this.mapToEntity(row);
        
        // Add reporter and moderator details
        const reportWithDetails: ReportWithDetails = {
          ...report,
          reporter: {
            id: report.reporter_id,
            display_name: row.reporter_name,
            avatar_url: row.reporter_avatar
          },
          entity_details: await this.getEntityDetails(report.entity_type, report.entity_id)
        };
        
        // Add moderator if available
        if (report.moderator_id) {
          reportWithDetails.moderator = {
            id: report.moderator_id,
            display_name: row.moderator_name,
            avatar_url: row.moderator_avatar
          };
        }
        
        reports.push(reportWithDetails);
      }
      
      return reports;
    } catch (error) {
      logger.error('Error getting reports with details', { error, options });
      throw error;
    }
  }

  /**
   * Get details about a reported entity
   * 
   * @param entityType Entity type (content, comment, user)
   * @param entityId Entity ID
   * @returns Entity details or null if not found
   */
  private async getEntityDetails(entityType: string, entityId: string): Promise<any> {
    try {
      // Different queries based on entity type
      let query = '';
      
      if (entityType === 'content') {
        query = `
          SELECT 
            c.*,
            u.display_name as author_name
          FROM content c
          JOIN users u ON c.user_id = u.id
          WHERE c.id = $1
        `;
      } else if (entityType === 'comment') {
        query = `
          SELECT 
            cm.*,
            u.display_name as author_name,
            c.content_text as content_preview
          FROM comments cm
          JOIN users u ON cm.user_id = u.id
          JOIN content c ON cm.content_id = c.id
          WHERE cm.id = $1
        `;
      } else if (entityType === 'user') {
        query = `
          SELECT 
            u.*,
            p.bio,
            p.avatar_url
          FROM users u
          LEFT JOIN profiles p ON u.id = p.user_id
          WHERE u.id = $1
        `;
      } else {
        return null;
      }
      
      const result = await this.db.query(query, [entityId]);
      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      logger.error('Error getting entity details', { error, entityType, entityId });
      // Return null instead of throwing to prevent failure of the whole query
      return null;
    }
  }

  /**
   * Count reports by status
   * 
   * @returns Counts by status
   */
  async countReportsByStatus(): Promise<Record<ReportStatus, number>> {
    try {
      const query = `
        SELECT status, COUNT(*) as count
        FROM content_reports
        GROUP BY status
      `;
      
      const result = await this.db.query(query);
      
      // Initialize with zeros
      const counts: Record<ReportStatus, number> = {
        pending: 0,
        reviewing: 0,
        resolved: 0,
        rejected: 0
      };
      
      // Update with actual counts
      result.rows.forEach(row => {
        counts[row.status as ReportStatus] = parseInt(row.count);
      });
      
      return counts;
    } catch (error) {
      logger.error('Error counting reports by status', { error });
      throw error;
    }
  }

  /**
   * Check if user has reported an entity
   * 
   * @param userId User ID
   * @param entityType Entity type
   * @param entityId Entity ID
   * @returns True if user has reported this entity
   */
  async hasUserReported(userId: string, entityType: string, entityId: string): Promise<boolean> {
    try {
      const query = `
        SELECT EXISTS(
          SELECT 1 FROM content_reports
          WHERE reporter_id = $1 AND entity_type = $2 AND entity_id = $3
        ) as has_reported
      `;
      
      const result = await this.db.query(query, [userId, entityType, entityId]);
      return result.rows[0].has_reported;
    } catch (error) {
      logger.error('Error checking if user has reported', { 
        error, userId, entityType, entityId 
      });
      throw error;
    }
  }

  /**
   * Map database row to Report entity
   * 
   * @param row Database row
   * @returns Report entity
   */
  protected mapToEntity(row: Record<string, any>): Report {
    return {
      id: row.id,
      reporter_id: row.reporter_id,
      entity_type: row.entity_type,
      entity_id: row.entity_id,
      reason: row.reason,
      description: row.description,
      status: row.status,
      created_at: row.created_at,
      updated_at: row.updated_at,
      moderator_id: row.moderator_id,
      resolution_action: row.resolution_action,
      resolution_notes: row.resolution_notes,
      resolved_at: row.resolved_at
    };
  }
}
