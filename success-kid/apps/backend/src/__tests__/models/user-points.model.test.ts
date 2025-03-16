/**
 * User Points Model Tests
 * 
 * Tests for the user points model with Zod validation
 */
import { 
  userPointsSchema, 
  createUserPointsSchema,
  PointsSourceEnum
} from '../../models/user-points';

describe('User Points Model', () => {
  describe('userPointsSchema', () => {
    it('should validate a valid user points object', () => {
      const validUserPoints = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        user_id: 'user123',
        amount: 50,
        source: 'content_creation',
        reference_id: 'content123',
        created_at: new Date(),
        description: 'Created a new post'
      };
      
      const result = userPointsSchema.safeParse(validUserPoints);
      expect(result.success).toBe(true);
    });
    
    it('should reject invalid source', () => {
      const invalidUserPoints = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        user_id: 'user123',
        amount: 50,
        source: 'invalid-source', // Invalid source
        reference_id: 'content123',
        created_at: new Date(),
        description: 'Created a new post'
      };
      
      const result = userPointsSchema.safeParse(invalidUserPoints);
      expect(result.success).toBe(false);
      
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('source');
      }
    });
    
    it('should validate with optional fields as null', () => {
      const validUserPoints = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        user_id: 'user123',
        amount: 50,
        source: 'daily_login',
        reference_id: null,
        created_at: new Date(),
        description: null
      };
      
      const result = userPointsSchema.safeParse(validUserPoints);
      expect(result.success).toBe(true);
    });
    
    it('should validate all supported sources', () => {
      // Test each source type from the enum
      PointsSourceEnum.options.forEach(source => {
        const userPoints = {
          id: '123e4567-e89b-12d3-a456-426614174000',
          user_id: 'user123',
          amount: 50,
          source,
          reference_id: null,
          created_at: new Date(),
          description: null
        };
        
        const result = userPointsSchema.safeParse(userPoints);
        expect(result.success).toBe(true);
      });
    });
  });
  
  describe('createUserPointsSchema', () => {
    it('should validate a valid creation input', () => {
      const validInput = {
        user_id: 'user123',
        amount: 50,
        source: 'comment',
        reference_id: 'comment123',
        description: 'Posted a comment'
      };
      
      const result = createUserPointsSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });
    
    it('should reject zero amount', () => {
      const invalidInput = {
        user_id: 'user123',
        amount: 0, // Cannot be zero
        source: 'comment',
        reference_id: 'comment123'
      };
      
      const result = createUserPointsSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
      
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('amount');
      }
    });
    
    it('should validate negative amounts for deductions', () => {
      // Negative amounts should be valid for deductions like redemptions
      const validInput = {
        user_id: 'user123',
        amount: -100,
        source: 'redemption',
        reference_id: 'transaction123'
      };
      
      const result = createUserPointsSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });
    
    it('should validate with minimal required fields', () => {
      const minimalInput = {
        user_id: 'user123',
        amount: 50,
        source: 'daily_login'
      };
      
      const result = createUserPointsSchema.safeParse(minimalInput);
      expect(result.success).toBe(true);
    });
  });
});
