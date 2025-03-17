/**
 * Notification Template Service
 * 
 * Manages templates for notifications across different channels.
 */
import { Pool } from 'pg';
import { z } from 'zod';
import Handlebars from 'handlebars';
import { getDatabase } from '../../database';
import { logger } from '../../lib/logger';
import { NotificationChannel } from '../models';

/**
 * Template for a specific channel
 */
export interface ChannelTemplate {
  titleTemplate: string;
  bodyTemplate: string;
  htmlTemplate?: string;
  requiredVariables?: string[];
}

/**
 * Notification template schema
 */
export const templateSchema = z.object({
  id: z.string().uuid(),
  type: z.string(),
  channels: z.record(z.any()),
  version: z.number().default(1),
  createdAt: z.date(),
  updatedAt: z.date(),
});

/**
 * Notification template type
 */
export type NotificationTemplate = z.infer<typeof templateSchema>;

/**
 * Create template DTO schema
 */
export const createTemplateDtoSchema = z.object({
  type: z.string(),
  channels: z.record(z.any()),
});

/**
 * Create template DTO type
 */
export type CreateTemplateDto = z.infer<typeof createTemplateDtoSchema>;

/**
 * Update template DTO schema
 */
export const updateTemplateDtoSchema = z.object({
  channels: z.record(z.any()).optional(),
  version: z.number().optional(),
});

/**
 * Update template DTO type
 */
export type UpdateTemplateDto = z.infer<typeof updateTemplateDtoSchema>;

/**
 * Rendered template result
 */
export interface RenderedTemplate {
  title: string;
  body: string;
  html?: string;
  data?: any;
}

/**
 * Template service class
 */
export class TemplateService {
  private pool: Pool;
  private cache: Map<string, { template: NotificationTemplate; timestamp: number }> = new Map();
  private cacheTTL = 5 * 60 * 1000; // 5 minutes
  
  /**
   * Create a template service instance
   */
  constructor() {
    this.pool = getDatabase().pool;
    this.registerHelpers();
  }

  /**
   * Register Handlebars helpers
   */
  private registerHelpers(): void {
    // Format number with commas
    Handlebars.registerHelper('numberFormat', function(value) {
      return new Intl.NumberFormat().format(value);
    });
    
    // Format date
    Handlebars.registerHelper('dateFormat', function(date, format) {
      if (!date) return '';
      const d = new Date(date);
      
      switch (format) {
        case 'time':
          return d.toLocaleTimeString();
        case 'date':
          return d.toLocaleDateString();
        case 'relative':
          return this.getRelativeTime(d);
        default:
          return d.toLocaleString();
      }
    });
    
    // Conditional content
    Handlebars.registerHelper('if_gt', function(a, b, options) {
      return a > b ? options.fn(this) : options.inverse(this);
    });
    
    // Truncate text
    Handlebars.registerHelper('truncate', function(text, length) {
      if (!text) return '';
      if (text.length <= length) return text;
      return text.substring(0, length) + '...';
    });
  }

  /**
   * Get relative time description
   * 
   * @param date Date to compare
   * @returns Relative time string
   */
  private getRelativeTime(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (seconds < 60) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    
    return date.toLocaleDateString();
  }

  /**
   * Get a template for a notification type
   * 
   * @param type Notification type
   * @returns Template or null if not found
   */
  async getTemplate(type: string): Promise<NotificationTemplate | null> {
    try {
      // Check cache first
      const cached = this.cache.get(type);
      if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
        return cached.template;
      }
      
      // Query database
      const query = `
        SELECT * FROM notification_templates
        WHERE type = $1
        ORDER BY version DESC
        LIMIT 1
      `;
      
      const result = await this.pool.query(query, [type]);
      
      if (result.rows.length === 0) {
        // Try to get fallback template
        return this.getFallbackTemplate(type);
      }
      
      // Parse template
      const template = this.mapRowToTemplate(result.rows[0]);
      
      // Cache template
      this.cache.set(type, {
        template,
        timestamp: Date.now()
      });
      
      return template;
    } catch (error) {
      logger.error('Failed to get notification template', { error, type });
      
      // Try to get fallback template
      return this.getFallbackTemplate(type);
    }
  }

  /**
   * Get a template for a specific notification type and channel
   * 
   * @param type Notification type
   * @param channel Channel
   * @returns Channel template or null if not found
   */
  async getTemplate(type: string, channel: NotificationChannel): Promise<ChannelTemplate | null> {
    try {
      const template = await this.getTemplate(type);
      
      if (!template) {
        return null;
      }
      
      // Get channel-specific template
      const channelTemplate = template.channels[channel];
      
      if (!channelTemplate) {
        return null;
      }
      
      return channelTemplate;
    } catch (error) {
      logger.error('Failed to get notification template', { error, type, channel });
      return null;
    }
  }

  /**
   * Render a template with data
   * 
   * @param template Template to render
   * @param data Data for the template
   * @param channel Channel for the template
   * @returns Rendered template
   */
  async renderTemplate(
    template: ChannelTemplate,
    data: any,
    channel: NotificationChannel
  ): Promise<RenderedTemplate> {
    try {
      // Compile and render title
      const titleTemplate = Handlebars.compile(template.titleTemplate);
      const title = titleTemplate(data);
      
      // Compile and render body
      const bodyTemplate = Handlebars.compile(template.bodyTemplate);
      const body = bodyTemplate(data);
      
      // Compile and render HTML if available
      let html: string | undefined;
      if (template.htmlTemplate && channel === NotificationChannel.EMAIL) {
        const htmlTemplate = Handlebars.compile(template.htmlTemplate);
        html = htmlTemplate(data);
      }
      
      return { title, body, html, data };
    } catch (error) {
      logger.error('Failed to render notification template', { error });
      
      // Fallback to raw data
      return {
        title: data.title || 'Notification',
        body: data.body || JSON.stringify(data),
        data
      };
    }
  }

  /**
   * Create a new template
   * 
   * @param template Template data
   * @returns Created template
   */
  async createTemplate(template: CreateTemplateDto): Promise<NotificationTemplate> {
    try {
      const query = `
        INSERT INTO notification_templates (type, channels, version)
        VALUES ($1, $2, $3)
        RETURNING *
      `;
      
      // Get current latest version
      const currentVersion = await this.getCurrentVersion(template.type);
      const newVersion = currentVersion + 1;
      
      const result = await this.pool.query(query, [
        template.type,
        JSON.stringify(template.channels),
        newVersion
      ]);
      
      // Clear cache for this type
      this.cache.delete(template.type);
      
      return this.mapRowToTemplate(result.rows[0]);
    } catch (error) {
      logger.error('Failed to create notification template', { error, type: template.type });
      throw new Error('Failed to create notification template');
    }
  }

  /**
   * Update an existing template
   * 
   * @param id Template ID
   * @param updates Update data
   * @returns Updated template
   */
  async updateTemplate(id: string, updates: UpdateTemplateDto): Promise<NotificationTemplate | null> {
    try {
      // Get current template
      const query = `
        SELECT * FROM notification_templates
        WHERE id = $1
      `;
      
      const result = await this.pool.query(query, [id]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      const current = this.mapRowToTemplate(result.rows[0]);
      
      // Create a new version rather than updating existing
      const createDto: CreateTemplateDto = {
        type: current.type,
        channels: updates.channels || current.channels
      };
      
      const updated = await this.createTemplate(createDto);
      
      // Clear cache
      this.cache.delete(current.type);
      
      return updated;
    } catch (error) {
      logger.error('Failed to update notification template', { error, id });
      throw new Error('Failed to update notification template');
    }
  }

  /**
   * Get current version for a template type
   * 
   * @param type Template type
   * @returns Current version number
   */
  private async getCurrentVersion(type: string): Promise<number> {
    const query = `
      SELECT MAX(version) as version
      FROM notification_templates
      WHERE type = $1
    `;
    
    const result = await this.pool.query(query, [type]);
    
    if (!result.rows[0] || result.rows[0].version === null) {
      return 0;
    }
    
    return parseInt(result.rows[0].version, 10);
  }

  /**
   * Get fallback template for a notification type
   * 
   * @param type Notification type
   * @returns Fallback template or null
   */
  private getFallbackTemplate(type: string): NotificationTemplate | null {
    // Predefined fallbacks for common notification types
    const fallbacks: Record<string, NotificationTemplate> = {
      'points.awarded': {
        id: `fallback-${type}`,
        type,
        channels: {
          [NotificationChannel.INAPP]: {
            titleTemplate: 'Points Awarded!',
            bodyTemplate: 'You earned {{amount}} points for {{source}}.',
            requiredVariables: ['amount', 'source']
          },
          [NotificationChannel.EMAIL]: {
            titleTemplate: 'Success Kid: You earned points!',
            bodyTemplate: 'You earned {{amount}} points for {{source}}.',
            htmlTemplate: '<h1>Success Kid</h1><p>You earned <strong>{{amount}}</strong> points for {{source}}.</p>'
          },
          [NotificationChannel.PUSH]: {
            titleTemplate: 'Points Awarded!',
            bodyTemplate: 'You earned {{amount}} points for {{source}}.'
          }
        },
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      
      'achievement.unlocked': {
        id: `fallback-${type}`,
        type,
        channels: {
          [NotificationChannel.INAPP]: {
            titleTemplate: 'Achievement Unlocked!',
            bodyTemplate: 'You unlocked the "{{name}}" achievement and earned {{pointsAwarded}} points!',
            requiredVariables: ['name', 'pointsAwarded']
          },
          [NotificationChannel.EMAIL]: {
            titleTemplate: 'Success Kid: Achievement Unlocked!',
            bodyTemplate: 'You unlocked the "{{name}}" achievement and earned {{pointsAwarded}} points!',
            htmlTemplate: '<h1>Achievement Unlocked!</h1><p>You unlocked the <strong>{{name}}</strong> achievement and earned {{pointsAwarded}} points!</p>'
          },
          [NotificationChannel.PUSH]: {
            titleTemplate: 'Achievement Unlocked!',
            bodyTemplate: 'You unlocked "{{name}}" and earned {{pointsAwarded}} points!'
          }
        },
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },
    };
    
    // Generic fallback for any type
    const genericFallback: NotificationTemplate = {
      id: `fallback-generic`,
      type,
      channels: {
        [NotificationChannel.INAPP]: {
          titleTemplate: '{{title}}',
          bodyTemplate: '{{body}}'
        },
        [NotificationChannel.EMAIL]: {
          titleTemplate: 'Success Kid: {{title}}',
          bodyTemplate: '{{body}}',
          htmlTemplate: '<h1>Success Kid</h1><p>{{body}}</p>'
        },
        [NotificationChannel.PUSH]: {
          titleTemplate: '{{title}}',
          bodyTemplate: '{{body}}'
        }
      },
      version: 1,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    return fallbacks[type] || genericFallback;
  }

  /**
   * Map database row to Template object
   * 
   * @param row Database row
   * @returns Template object
   */
  private mapRowToTemplate(row: any): NotificationTemplate {
    return {
      id: row.id,
      type: row.type,
      channels: typeof row.channels === 'string' ? JSON.parse(row.channels) : row.channels,
      version: row.version,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }
}

// Export singleton instance
export const templateService = new TemplateService();
