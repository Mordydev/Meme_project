import { ContentCreateInput } from '../services/content-service';

/**
 * Validation result interface
 */
export interface ValidationResult {
  success: boolean;
  errors: {
    field: string;
    message: string;
  }[];
}

/**
 * Validator for content data
 */
export class ContentValidator {
  /**
   * Content type specific validation rules
   */
  private readonly typeValidationRules = {
    text: {
      minBodyLength: 5,
      maxBodyLength: 5000,
      mediaRequired: false
    },
    image: {
      minBodyLength: 0,
      maxBodyLength: 1000,
      mediaRequired: true
    },
    audio: {
      minBodyLength: 0,
      maxBodyLength: 1000,
      mediaRequired: true
    },
    video: {
      minBodyLength: 0,
      maxBodyLength: 1000,
      mediaRequired: true
    },
    mixed: {
      minBodyLength: 5,
      maxBodyLength: 5000,
      mediaRequired: false
    }
  };

  /**
   * Validate content creation data
   */
  validate(data: ContentCreateInput): ValidationResult {
    const errors = [];
    
    // Check title (required for all content types)
    if (!data.title || data.title.trim().length === 0) {
      errors.push({
        field: 'title',
        message: 'Title is required'
      });
    } else if (data.title.length > 100) {
      errors.push({
        field: 'title',
        message: 'Title cannot exceed 100 characters'
      });
    }
    
    // Check content type
    if (!data.type || !this.typeValidationRules[data.type]) {
      errors.push({
        field: 'type',
        message: 'Invalid content type'
      });
    } else {
      const rules = this.typeValidationRules[data.type];
      
      // Check body based on type rules
      if (data.body) {
        if (data.body.length < rules.minBodyLength) {
          errors.push({
            field: 'body',
            message: `Body must be at least ${rules.minBodyLength} characters for ${data.type} content`
          });
        } else if (data.body.length > rules.maxBodyLength) {
          errors.push({
            field: 'body',
            message: `Body cannot exceed ${rules.maxBodyLength} characters for ${data.type} content`
          });
        }
      } else if (rules.minBodyLength > 0) {
        errors.push({
          field: 'body',
          message: `Body is required for ${data.type} content`
        });
      }
      
      // Check media based on type rules
      if (rules.mediaRequired && !data.mediaUrl) {
        errors.push({
          field: 'mediaUrl',
          message: `Media is required for ${data.type} content`
        });
      }
    }
    
    // Check tags
    if (data.tags && data.tags.length > 10) {
      errors.push({
        field: 'tags',
        message: 'Maximum of 10 tags allowed'
      });
    }
    
    // Check for either body or media (at least one must be present)
    if (!data.body && !data.mediaUrl) {
      errors.push({
        field: 'content',
        message: 'Content must include either text or media'
      });
    }
    
    return {
      success: errors.length === 0,
      errors
    };
  }

  /**
   * Validate content update data
   */
  validateUpdates(updates: Partial<ContentCreateInput>): ValidationResult {
    const errors = [];
    
    // Check title if provided
    if (updates.title !== undefined) {
      if (updates.title.trim().length === 0) {
        errors.push({
          field: 'title',
          message: 'Title cannot be empty'
        });
      } else if (updates.title.length > 100) {
        errors.push({
          field: 'title',
          message: 'Title cannot exceed 100 characters'
        });
      }
    }
    
    // Check content type if provided
    if (updates.type && !this.typeValidationRules[updates.type]) {
      errors.push({
        field: 'type',
        message: 'Invalid content type'
      });
    }
    
    // Check body if provided
    if (updates.body !== undefined && updates.type) {
      const rules = this.typeValidationRules[updates.type];
      
      if (updates.body.length < rules.minBodyLength) {
        errors.push({
          field: 'body',
          message: `Body must be at least ${rules.minBodyLength} characters for ${updates.type} content`
        });
      } else if (updates.body.length > rules.maxBodyLength) {
        errors.push({
          field: 'body',
          message: `Body cannot exceed ${rules.maxBodyLength} characters for ${updates.type} content`
        });
      }
    }
    
    // Check tags if provided
    if (updates.tags && updates.tags.length > 10) {
      errors.push({
        field: 'tags',
        message: 'Maximum of 10 tags allowed'
      });
    }
    
    return {
      success: errors.length === 0,
      errors
    };
  }
}
