/**
 * Referral Code Repository
 * 
 * Repository for managing referral codes for users.
 */
import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import { BaseRepository } from '../base-repository';
import { logger } from '../../lib/logger';
import { DatabaseError, NotFoundError } from '../../errors';
import { 
  ReferralCode, 
  GenerateReferralCodeDto 
} from '../../models/entities/referral.model';

/**
 * Repository for managing referral codes
 */
export class ReferralCodeRepository extends BaseRepository<ReferralCode> {
  /**
   * Create a new ReferralCodeRepository instance
   * 
   * @param db Database connection pool
   */
  constructor(db: Pool) {
    super(db, 'referral_codes');
  }

  /**
   * Find referral code by code string
   * 
   * @param code Referral code string
   * @returns Referral code or null if not found
   */
  async findByCode(code: string): Promise<ReferralCode | null> {
    try {
      const query = `
        SELECT * FROM referral_codes 
        WHERE code = $1
      `;
      
      const result = await this.db.query<ReferralCode>(query, [code]);
      return result.rows.length > 0 ? this.mapToEntity(result.rows[0]) : null;
    } catch (error) {
      logger.error('Failed to find referral code', { 
        code, 
        error 
      });
      throw new DatabaseError('Failed to find referral code', error);
    }
  }

  /**
   * Find active referral code by user ID
   * 
   * @param userId User ID
   * @returns Active referral code or null if not found
   */
  async findActiveByUserId(userId: string): Promise<ReferralCode | null> {
    try {
      const query = `
        SELECT * FROM referral_codes 
        WHERE user_id = $1 AND is_active = true
        AND (expires_at IS NULL OR expires_at > NOW())
        AND (max_uses IS NULL OR uses < max_uses)
        ORDER BY created_at DESC 
        LIMIT 1
      `;
      
      const result = await this.db.query<ReferralCode>(query, [userId]);
      return result.rows.length > 0 ? this.mapToEntity(result.rows[0]) : null;
    } catch (error) {
      logger.error('Failed to find active referral code by user ID', { 
        userId, 
        error 
      });
      throw new DatabaseError('Failed to find active referral code by user ID', error);
    }
  }

  /**
   * Find all referral codes by user ID
   * 
   * @param userId User ID
   * @param includeInactive Whether to include inactive codes
   * @returns Array of referral codes
   */
  async findAllByUserId(userId: string, includeInactive: boolean = false): Promise<ReferralCode[]> {
    try {
      let query = `
        SELECT * FROM referral_codes 
        WHERE user_id = $1
      `;
      
      const queryParams: any[] = [userId];
      
      if (!includeInactive) {
        query += ' AND is_active = true';
      }
      
      query += ' ORDER BY created_at DESC';
      
      const result = await this.db.query<ReferralCode>(query, queryParams);
      return result.rows.map(row => this.mapToEntity(row));
    } catch (error) {
      logger.error('Failed to find all referral codes by user ID', { 
        userId, 
        includeInactive, 
        error 
      });
      throw new DatabaseError('Failed to find all referral codes by user ID', error);
    }
  }

  /**
   * Generate a new referral code for a user
   * 
   * @param data Referral code generation data
   * @returns Generated referral code
   */
  async generateCode(data: GenerateReferralCodeDto): Promise<ReferralCode> {
    try {
      // Create the referral code
      const result = await this.db.query<ReferralCode>(
        `INSERT INTO referral_codes(
          id, user_id, code, created_at, expires_at,
          uses, max_uses, is_active, campaign_id
        ) VALUES(
          $1, $2, $3, NOW(), $4, 0, $5, true, $6
        ) RETURNING *`,
        [
          uuidv4(),
          data.user_id,
          data.custom_code,
          data.expires_at || null,
          data.max_uses || null,
          data.campaign_id || null
        ]
      );
      
      return this.mapToEntity(result.rows[0]);
    } catch (error) {
      logger.error('Failed to generate referral code', { 
        data, 
        error 
      });
      throw new DatabaseError('Failed to generate referral code', error);
    }
  }

  /**
   * Check if a custom code is already in use
   * 
   * @param code Custom code to check
   * @returns Whether the code is in use
   */
  async isCodeInUse(code: string): Promise<boolean> {
    try {
      const query = `
        SELECT COUNT(*) as count 
        FROM referral_codes 
        WHERE code = $1
      `;
      
      const result = await this.db.query<{ count: string }>(query, [code]);
      return parseInt(result.rows[0].count, 10) > 0;
    } catch (error) {
      logger.error('Failed to check if code is in use', { 
        code, 
        error 
      });
      throw new DatabaseError('Failed to check if code is in use', error);
    }
  }

  /**
   * Increment the use count for a referral code
   * 
   * @param code Referral code to increment
   * @returns Updated referral code
   */
  async incrementUseCount(code: string): Promise<ReferralCode> {
    try {
      const query = `
        UPDATE referral_codes 
        SET uses = uses + 1 
        WHERE code = $1 
        RETURNING *
      `;
      
      const result = await this.db.query<ReferralCode>(query, [code]);
      
      if (result.rows.length === 0) {
        throw new NotFoundError('Referral code', code);
      }
      
      return this.mapToEntity(result.rows[0]);
    } catch (error) {
      logger.error('Failed to increment use count', { 
        code, 
        error 
      });
      
      if (error instanceof NotFoundError) {
        throw error;
      }
      
      throw new DatabaseError('Failed to increment use count', error);
    }
  }

  /**
   * Deactivate a referral code
   * 
   * @param codeId Referral code ID
   * @returns Updated referral code
   */
  async deactivateCode(codeId: string): Promise<ReferralCode> {
    try {
      const query = `
        UPDATE referral_codes 
        SET is_active = false 
        WHERE id = $1 
        RETURNING *
      `;
      
      const result = await this.db.query<ReferralCode>(query, [codeId]);
      
      if (result.rows.length === 0) {
        throw new NotFoundError('Referral code', codeId);
      }
      
      return this.mapToEntity(result.rows[0]);
    } catch (error) {
      logger.error('Failed to deactivate referral code', { 
        codeId, 
        error 
      });
      
      if (error instanceof NotFoundError) {
        throw error;
      }
      
      throw new DatabaseError('Failed to deactivate referral code', error);
    }
  }

  /**
   * Map database row to ReferralCode entity
   * 
   * @param row Database row
   * @returns ReferralCode entity
   */
  protected mapToEntity(row: Record<string, any>): ReferralCode {
    return {
      id: row.id,
      user_id: row.user_id,
      code: row.code,
      created_at: row.created_at,
      expires_at: row.expires_at,
      uses: row.uses,
      max_uses: row.max_uses,
      is_active: row.is_active,
      campaign_id: row.campaign_id
    };
  }
}
