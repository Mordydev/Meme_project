/**
 * Notification Template Repository
 * 
 * Handles data access for notification templates
 */
import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import { 
  NotificationTemplate, 
  CreateTemplateDto, 
  NotificationType
} from '../models/notification';
import { logger } from '../lib/logger';
import { BaseRepository } from './base-repository';

/**
 * Repository for notification template data access
 */
export class NotificationTemplateRepository extends BaseRepository {
  /**
   * Create notification template repository
   * @param db Database connection pool
   */
  constructor(db: Pool) {
    super(db);
  }

  /**
   * Create a new notification template
   * @param template Template creation parameters
   * @returns Created template
   */
  async createTemplate(template: CreateTemplateDto): Promise<NotificationTemplate> {
    try {
      const id = uuidv4();
      const now = new Date();
      const version = template.version || 1;

      // Check if template with same type and version exists
      const existingTemplate = await this.getTemplateByTypeAndVersion(template.type, version);
      if (existingTemplate) {
        throw new Error(`Template already exists for type ${template.type} and version ${version}`);
      }

      const query = `
        INSERT INTO notification_templates (
          id, type, title_template, body_template, 
          email_subject_template, email_body_template,
          push_title_template, push_body_template,
          data_schema, created_at, updated_at, version
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING *;
      `;

      const values = [
        id,
        template.type,
        template.titleTemplate,
        template.bodyTemplate,
        template.emailSubjectTemplate || null,
        template.emailBodyTemplate || null,
        template.pushTitleTemplate || null,
        template.pushBodyTemplate || null,
        template.dataSchema ? JSON.stringify(template.dataSchema) : null,
        now,
        now,
        version
      ];

      const result = await this.db.query(query, values);

      return this.mapTemplateFromDb(result.rows[0]);
    } catch (error) {
      logger.error('Error creating notification template', { error, template });
      throw error;
    }
  }

  /**
   * Get a template by type and version
   * @param type Template type
   * @param version Version number (optional, defaults to latest)
   * @returns Template or null if not found
   */
  async getTemplateByTypeAndVersion(
    type: NotificationType,
    version?: number
  ): Promise<NotificationTemplate | null> {
    try {
      let query: string;
      let params: any[];

      if (version) {
        // Get specific version
        query = `
          SELECT *
          FROM notification_templates
          WHERE type = $1 AND version = $2
        `;
        params = [type, version];
      } else {
        // Get latest version
        query = `
          SELECT *
          FROM notification_templates
          WHERE type = $1
          ORDER BY version DESC
          LIMIT 1
        `;
        params = [type];
      }

      const result = await this.db.query(query, params);

      if (result.rows.length === 0) {
        return null;
      }

      return this.mapTemplateFromDb(result.rows[0]);
    } catch (error) {
      logger.error('Error getting notification template', { error, type, version });
      throw error;
    }
  }

  /**
   * Get template by ID
   * @param id Template ID
   * @returns Template or null if not found
   */
  async getTemplateById(id: string): Promise<NotificationTemplate | null> {
    try {
      const query = `
        SELECT *
        FROM notification_templates
        WHERE id = $1
      `;

      const result = await this.db.query(query, [id]);

      if (result.rows.length === 0) {
        return null;
      }

      return this.mapTemplateFromDb(result.rows[0]);
    } catch (error) {
      logger.error('Error getting notification template by ID', { error, id });
      throw error;
    }
  }

  /**
   * Get all templates for a type
   * @param type Template type
   * @returns Array of templates
   */
  async getAllTemplatesForType(type: NotificationType): Promise<NotificationTemplate[]> {
    try {
      const query = `
        SELECT *
        FROM notification_templates
        WHERE type = $1
        ORDER BY version DESC
      `;

      const result = await this.db.query(query, [type]);
      return result.rows.map(row => this.mapTemplateFromDb(row));
    } catch (error) {
      logger.error('Error getting all templates for type', { error, type });
      throw error;
    }
  }

  /**
   * Get all template types
   * @returns Array of template types
   */
  async getAllTemplateTypes(): Promise<NotificationType[]> {
    try {
      const query = `
        SELECT DISTINCT type
        FROM notification_templates
        ORDER BY type
      `;

      const result = await this.db.query(query);
      return result.rows.map(row => row.type);
    } catch (error) {
      logger.error('Error getting all template types', { error });
      throw error;
    }
  }

  /**
   * Delete a template
   * @param id Template ID
   * @returns True if successful
   */
  async deleteTemplate(id: string): Promise<boolean> {
    try {
      const query = `
        DELETE FROM notification_templates
        WHERE id = $1
        RETURNING id
      `;

      const result = await this.db.query(query, [id]);
      return result.rowCount > 0;
    } catch (error) {
      logger.error('Error deleting notification template', { error, id });
      throw error;
    }
  }

  /**
   * Map a template row from the database to the model
   * @param row Database row
   * @returns NotificationTemplate model
   */
  private mapTemplateFromDb(row: any): NotificationTemplate {
    return {
      id: row.id,
      type: row.type as NotificationType,
      titleTemplate: row.title_template,
      bodyTemplate: row.body_template,
      emailSubjectTemplate: row.email_subject_template,
      emailBodyTemplate: row.email_body_template,
      pushTitleTemplate: row.push_title_template,
      pushBodyTemplate: row.push_body_template,
      dataSchema: row.data_schema,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      version: row.version
    };
  }
}
