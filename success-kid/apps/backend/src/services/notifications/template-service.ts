/**
 * Notification Template Service
 * 
 * Handles template management and rendering for notifications
 */
import { 
  NotificationTemplate, 
  CreateTemplateDto, 
  NotificationType,
  RenderedNotification
} from '../../models/notification';
import { NotificationTemplateRepository } from '../../repositories/notification-template-repository';
import { logger } from '../../lib/logger';
import Handlebars from 'handlebars';

/**
 * Service for managing and rendering notification templates
 */
export class NotificationTemplateService {
  private templateCache: Map<string, Map<number, HandlebarsTemplateDelegate>> = new Map();
  
  constructor(private templateRepository: NotificationTemplateRepository) {
    // Register any custom Handlebars helpers
    this.registerHelpers();
  }
  
  /**
   * Create a new notification template
   * @param template Template creation parameters
   * @returns Created template
   */
  async createTemplate(template: CreateTemplateDto): Promise<NotificationTemplate> {
    try {
      // Validate template syntax
      this.validateTemplate(template.titleTemplate);
      this.validateTemplate(template.bodyTemplate);
      
      if (template.emailSubjectTemplate) {
        this.validateTemplate(template.emailSubjectTemplate);
      }
      
      if (template.emailBodyTemplate) {
        this.validateTemplate(template.emailBodyTemplate);
      }
      
      if (template.pushTitleTemplate) {
        this.validateTemplate(template.pushTitleTemplate);
      }
      
      if (template.pushBodyTemplate) {
        this.validateTemplate(template.pushBodyTemplate);
      }
      
      // Create template in database
      const createdTemplate = await this.templateRepository.createTemplate(template);
      
      // Clear cache for this template type
      this.clearCacheForType(template.type);
      
      return createdTemplate;
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
  async getTemplate(
    type: NotificationType,
    version?: number
  ): Promise<NotificationTemplate | null> {
    try {
      return await this.templateRepository.getTemplateByTypeAndVersion(type, version);
    } catch (error) {
      logger.error('Error getting notification template', { error, type, version });
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
      return await this.templateRepository.getAllTemplatesForType(type);
    } catch (error) {
      logger.error('Error getting all templates for type', { error, type });
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
      // Get template first to know its type
      const template = await this.templateRepository.getTemplateById(id);
      
      if (!template) {
        return false;
      }
      
      // Delete the template
      const result = await this.templateRepository.deleteTemplate(id);
      
      // Clear cache for this template type
      this.clearCacheForType(template.type);
      
      return result;
    } catch (error) {
      logger.error('Error deleting notification template', { error, id });
      throw error;
    }
  }
  
  /**
   * Render a notification using a template
   * @param type Notification type
   * @param data Data for template variables
   * @param version Template version (optional, defaults to latest)
   * @returns Rendered notification
   */
  async renderNotification(
    type: NotificationType,
    data: Record<string, any>,
    version?: number
  ): Promise<RenderedNotification> {
    try {
      // Get the template
      const template = await this.getTemplate(type, version);
      
      if (!template) {
        throw new Error(`No template found for type: ${type}, version: ${version || 'latest'}`);
      }
      
      // Render each template component
      const title = await this.renderTemplate(template.titleTemplate, data);
      const body = await this.renderTemplate(template.bodyTemplate, data);
      
      const result: RenderedNotification = {
        title,
        body,
        data: { ...data }
      };
      
      // Render email templates if available
      if (template.emailSubjectTemplate) {
        result.emailSubject = await this.renderTemplate(template.emailSubjectTemplate, data);
      }
      
      if (template.emailBodyTemplate) {
        result.emailBody = await this.renderTemplate(template.emailBodyTemplate, data);
      }
      
      // Render push templates if available
      if (template.pushTitleTemplate) {
        result.pushTitle = await this.renderTemplate(template.pushTitleTemplate, data);
      }
      
      if (template.pushBodyTemplate) {
        result.pushBody = await this.renderTemplate(template.pushBodyTemplate, data);
      }
      
      return result;
    } catch (error) {
      logger.error('Error rendering notification template', { error, type, data });
      throw error;
    }
  }
  
  /**
   * Render an individual template string
   * @param templateString Template string
   * @param data Data for template variables
   * @returns Rendered string
   */
  private async renderTemplate(
    templateString: string,
    data: Record<string, any>
  ): Promise<string> {
    try {
      // Create template function
      const template = Handlebars.compile(templateString);
      
      // Render with data
      return template(data);
    } catch (error) {
      logger.error('Error rendering template string', { error, templateString });
      throw error;
    }
  }
  
  /**
   * Validate a template string syntax
   * @param templateString Template string to validate
   * @throws Error if template is invalid
   */
  private validateTemplate(templateString: string): void {
    try {
      Handlebars.precompile(templateString);
    } catch (error) {
      throw new Error(`Invalid template syntax: ${error.message}`);
    }
  }
  
  /**
   * Clear template cache for a specific type
   * @param type Template type
   */
  private clearCacheForType(type: NotificationType): void {
    this.templateCache.delete(type);
  }
  
  /**
   * Register custom Handlebars helpers
   */
  private registerHelpers(): void {
    // Format number with commas
    Handlebars.registerHelper('formatNumber', (value) => {
      if (typeof value !== 'number') {
        return value;
      }
      return value.toLocaleString();
    });
    
    // Format currency
    Handlebars.registerHelper('formatCurrency', (value, currency = 'USD') => {
      if (typeof value !== 'number') {
        return value;
      }
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency
      }).format(value);
    });
    
    // Truncate text
    Handlebars.registerHelper('truncate', (text, length = 50) => {
      if (typeof text !== 'string') {
        return text;
      }
      if (text.length <= length) {
        return text;
      }
      return text.substring(0, length) + '…';
    });
    
    // Conditional display
    Handlebars.registerHelper('ifCond', function(v1, operator, v2, options) {
      switch (operator) {
        case '==':
          return (v1 == v2) ? options.fn(this) : options.inverse(this);
        case '===':
          return (v1 === v2) ? options.fn(this) : options.inverse(this);
        case '!=':
          return (v1 != v2) ? options.fn(this) : options.inverse(this);
        case '!==':
          return (v1 !== v2) ? options.fn(this) : options.inverse(this);
        case '<':
          return (v1 < v2) ? options.fn(this) : options.inverse(this);
        case '<=':
          return (v1 <= v2) ? options.fn(this) : options.inverse(this);
        case '>':
          return (v1 > v2) ? options.fn(this) : options.inverse(this);
        case '>=':
          return (v1 >= v2) ? options.fn(this) : options.inverse(this);
        default:
          return options.inverse(this);
      }
    });
  }
}
