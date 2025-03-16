/**
 * Content Report Repository
 * 
 * Handles data access for content reports
 */
import { Pool } from 'pg';
import { BaseRepository } from './base-repository';
import { 
  ContentReport, 
  CreateContentReportDto, 
  ReviewReportDto, 
  ReportTargetType
} from '../models/content-report';
import { logger } from '../lib/logger';

export interface ReportQueueOptions {
  status?: string;
  target_type?: ReportTargetType;
  limit?: number;
  offset?: number;
}

export class ContentReportRepository extends BaseRepository<ContentReport> {
  constructor(db: Pool) {
    super(db, 'content_reports', 'id');
  }
  
  /**
   * Create a new content report
   */
  async createReport(input: CreateContentReportDto): Promise<ContentReport> {
    try {
      const { reporter_id, target_id, target_type, reason, description } = input;
      
      const query = `
        INSERT INTO content_reports
        (id, reporter_id, target_id, target_type, reason, description, status, reviewer_id, reviewed_at, resolution_notes, created_at)
        VALUES (uuid_generate_v4(), $1, $2, $3, $4, $5, 'pending', NULL, NULL, NULL, NOW())
        RETURNING *
      `;
      
      const result = await this.db.query<ContentReport>(query, [
        reporter_id,
        target_id,
        target_type,
        reason,
        description || null
      ]);
      
      return result.rows[0];
    } catch (error) {
      logger.error('Error creating content report', { error, input });
      throw error;
    }
  }
  
  /**
   * Review a report
   */
  async reviewReport(
    reportId: string, 
    reviewerId: string, 
    review: ReviewReportDto
  ): Promise<ContentReport | null> {
    try {
      const { status, resolution_notes } = review;
      
      const query = `
        UPDATE content_reports
        SET status = $1, 
            reviewer_id = $2, 
            reviewed_at = NOW(), 
            resolution_notes = $3
        WHERE id = $4
        RETURNING *
      `;
      
      const result = await this.db.query<ContentReport>(query, [
        status,
        reviewerId,
        resolution_notes || null,
        reportId
      ]);
      
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error reviewing report', { error, reportId, reviewerId, review });
      throw error;
    }
  }
  
  /**
   * Get reports for moderation queue
   */
  async getReportQueue(options: ReportQueueOptions = {}): Promise<ContentReport[]> {
    try {
      const { status = 'pending', target_type, limit = 20, offset = 0 } = options;
      
      let query = `
        SELECT cr.*, 
               u_reporter.display_name as reporter_name,
               u_reviewer.display_name as reviewer_name,
               CASE 
                 WHEN cr.target_type = 'content' THEN c.content_text
                 WHEN cr.target_type = 'comment' THEN cm.comment_text
                 ELSE NULL
               END as target_content
        FROM content_reports cr
        LEFT JOIN users u_reporter ON cr.reporter_id = u_reporter.id
        LEFT JOIN users u_reviewer ON cr.reviewer_id = u_reviewer.id
        LEFT JOIN content c ON cr.target_type = 'content' AND cr.target_id = c.id
        LEFT JOIN comments cm ON cr.target_type = 'comment' AND cr.target_id = cm.id
        WHERE cr.status = $1
      `;
      
      const queryParams: any[] = [status];
      let paramIndex = 2;
      
      if (target_type) {
        query += ` AND cr.target_type = $${paramIndex++}`;
        queryParams.push(target_type);
      }
      
      query += `
        ORDER BY cr.created_at ASC
        LIMIT $${paramIndex++} OFFSET $${paramIndex++}
      `;
      
      queryParams.push(limit, offset);
      
      const result = await this.db.query(query, queryParams);
      return result.rows;
    } catch (error) {
      logger.error('Error getting report queue', { error, options });
      throw error;
    }
  }
  
  /**
   * Get reports for a specific target
   */
  async getReportsForTarget(
    targetId: string, 
    targetType: ReportTargetType
  ): Promise<ContentReport[]> {
    try {
      const query = `
        SELECT * FROM content_reports
        WHERE target_id = $1 AND target_type = $2
        ORDER BY created_at DESC
      `;
      
      const result = await this.db.query<ContentReport>(query, [targetId, targetType]);
      return result.rows;
    } catch (error) {
      logger.error('Error getting reports for target', { error, targetId, targetType });
      throw error;
    }
  }
  
  /**
   * Check if user has already reported a target
   */
  async hasUserReported(
    userId: string, 
    targetId: string, 
    targetType: ReportTargetType
  ): Promise<boolean> {
    try {
      const query = `
        SELECT COUNT(*) as count
        FROM content_reports
        WHERE reporter_id = $1 AND target_id = $2 AND target_type = $3
      `;
      
      const result = await this.db.query<{ count: string }>(query, [userId, targetId, targetType]);
      return parseInt(result.rows[0].count, 10) > 0;
    } catch (error) {
      logger.error('Error checking if user has reported', { error, userId, targetId, targetType });
      throw error;
    }
  }
  
  /**
   * Count pending reports
   */
  async countPendingReports(): Promise<number> {
    try {
      const query = `
        SELECT COUNT(*) as count
        FROM content_reports
        WHERE status = 'pending'
      `;
      
      const result = await this.db.query<{ count: string }>(query);
      return parseInt(result.rows[0].count, 10);
    } catch (error) {
      logger.error('Error counting pending reports', { error });
      throw error;
    }
  }
}
