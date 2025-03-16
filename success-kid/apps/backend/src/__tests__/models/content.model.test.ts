/**
 * Content Model Tests
 * 
 * Tests for the content model with Zod validation
 */
import { 
  contentSchema, 
  createContentSchema, 
  updateContentSchema,
  ContentTypeEnum,
  ContentStatusEnum
} from '../../models/content';

describe('Content Model', () => {
  describe('contentSchema', () => {
    it('should validate a valid content object', () => {
      const validContent = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        user_id: 'user123',
        type: 'text',
        content_text: 'This is a test post',
        media_urls: ['https://example.com/image.jpg'],
        created_at: new Date(),
        updated_at: new Date(),
        status: 'active'
      };
      
      const result = contentSchema.safeParse(validContent);
      expect(result.success).toBe(true);
    });
    
    it('should reject invalid content type', () => {
      const invalidContent = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        user_id: 'user123',
        type: 'invalid-type', // Invalid type
        content_text: 'This is a test post',
        created_at: new Date(),
        updated_at: new Date(),
        status: 'active'
      };
      
      const result = contentSchema.safeParse(invalidContent);
      expect(result.success).toBe(false);
      
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('type');
      }
    });
    
    it('should reject invalid status', () => {
      const invalidContent = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        user_id: 'user123',
        type: 'text',
        content_text: 'This is a test post',
        created_at: new Date(),
        updated_at: new Date(),
        status: 'invalid-status' // Invalid status
      };
      
      const result = contentSchema.safeParse(invalidContent);
      expect(result.success).toBe(false);
      
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('status');
      }
    });
    
    it('should validate all supported content types', () => {
      // Test each content type from the enum
      ContentTypeEnum.options.forEach(type => {
        const content = {
          id: '123e4567-e89b-12d3-a456-426614174000',
          user_id: 'user123',
          type,
          content_text: 'This is a test post',
          created_at: new Date(),
          updated_at: new Date(),
          status: 'active'
        };
        
        const result = contentSchema.safeParse(content);
        expect(result.success).toBe(true);
      });
    });
  });
  
  describe('createContentSchema', () => {
    it('should validate a valid content creation input', () => {
      const validInput = {
        user_id: 'user123',
        type: 'text',
        content_text: 'This is a test post',
        media_urls: ['https://example.com/image.jpg']
      };
      
      const result = createContentSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });
    
    it('should reject content text exceeding maximum length', () => {
      // Create a string that exceeds the 5000 character limit
      const longText = 'a'.repeat(5001);
      
      const invalidInput = {
        user_id: 'user123',
        type: 'text',
        content_text: longText
      };
      
      const result = createContentSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
      
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('content_text');
        expect(result.error.issues[0].code).toBe('too_big');
      }
    });
    
    it('should validate with optional fields omitted', () => {
      const minimalInput = {
        user_id: 'user123',
        type: 'text',
        content_text: null
      };
      
      const result = createContentSchema.safeParse(minimalInput);
      expect(result.success).toBe(true);
    });
  });
  
  describe('updateContentSchema', () => {
    it('should validate a valid content update', () => {
      const validUpdate = {
        content_text: 'Updated content text',
        status: 'flagged'
      };
      
      const result = updateContentSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
    });
    
    it('should validate with partial fields', () => {
      // Test just updating status
      const statusUpdate = {
        status: 'deleted'
      };
      
      const result1 = updateContentSchema.safeParse(statusUpdate);
      expect(result1.success).toBe(true);
      
      // Test just updating content text
      const contentUpdate = {
        content_text: 'Only updating the text'
      };
      
      const result2 = updateContentSchema.safeParse(contentUpdate);
      expect(result2.success).toBe(true);
    });
    
    it('should reject invalid status in update', () => {
      const invalidUpdate = {
        status: 'invalid-status'
      };
      
      const result = updateContentSchema.safeParse(invalidUpdate);
      expect(result.success).toBe(false);
      
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('status');
      }
    });
  });
});
