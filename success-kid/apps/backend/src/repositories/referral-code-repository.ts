/**
 * Referral Code Repository
 * 
 * Handles data access for referral codes
 */
import { Pool } from 'pg';
import { BaseRepository } from './base-repository';
import { 
  ReferralCode, 
  CreateReferralCodeDto, 
  UpdateReferralCodeDto, 
  ReferralCodeStatus,
  ReferralCodeType
} from '../models/referral-code';
import { logger } from '../lib/logger';

export class ReferralCodeRepository extends BaseRepository<ReferralCode> {
  constructor(db: Pool) {
    super(db, 'referral_codes', 'id');
  }
  
  /**
   * Find referral code by the actual code value
   */
  async findByCode(code: string): Promise<ReferralCode | null> {
    try {
      const query = 'SELECT * FROM referral_codes WHERE code = $1';
      const result = await this.db.query<ReferralCode>(query, [code]);
      
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error finding referral code', { error, code });
      throw error;
    }
  }
  
  /**
   * Find active referral code for a user
   */
  async findByUserId(userId: string): Promise<ReferralCode | null> {
    try {
      const query = 'SELECT * FROM referral_codes WHERE user_id = $1 AND status = $2 ORDER BY created_at DESC LIMIT 1';
      const result = await this.db.query<ReferralCode>(query, [userId, 'active']);
      
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error finding referral code by user', { error, userId });
      throw error;
    }
  }
  
  /**
   * Create a new referral code
   */
  async createReferralCode(dto: CreateReferralCodeDto): Promise<ReferralCode> {
    try {
      const query = `
        INSERT INTO referral_codes
        (id, user_id, code, type, status, created_at, updated_at, expires_at, campaign_id)
        VALUES (uuid_generate_v4(), $1, $2, $3, $4, NOW(), NOW(), $5, $6)
        RETURNING *
      `;
      
      const result = await this.db.query<ReferralCode>(query, [
        dto.user_id,
        dto.code,
        dto.type || 'standard',
        dto.status || 'active',
        dto.expires_at || null,
        dto.campaign_id || null
      ]);
      
      return result.rows[0];
    } catch (error) {
      logger.error('Error creating referral code', { error, dto });
      throw error;
    }
  }
  
  /**
   * Update referral code status
   */
  async updateStatus(id: string, status: ReferralCodeStatus): Promise<ReferralCode | null> {
    try {
      const query = `
        UPDATE referral_codes
        SET status = $1, updated_at = NOW()
        WHERE id = $2
        RETURNING *
      `;
      
      const result = await this.db.query<ReferralCode>(query, [status, id]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error updating referral code status', { error, id, status });
      throw error;
    }
  }
  
  /**
   * Find all referral codes for a user (including inactive ones)
   */
  async findAllByUserId(userId: string): Promise<ReferralCode[]> {
    try {
      const query = 'SELECT * FROM referral_codes WHERE user_id = $1 ORDER BY created_at DESC';
      const result = await this.db.query<ReferralCode>(query, [userId]);
      
      return result.rows;
    } catch (error) {
      logger.error('Error finding all referral codes by user', { error, userId });
      throw error;
    }
  }
  
  /**
   * Find referral codes by campaign
   */
  async findByCampaign(campaignId: string): Promise<ReferralCode[]> {
    try {
      const query = 'SELECT * FROM referral_codes WHERE campaign_id = $1';
      const result = await this.db.query<ReferralCode>(query, [campaignId]);
      
      return result.rows;
    } catch (error) {
      logger.error('Error finding referral codes by campaign', { error, campaignId });
      throw error;
    }
  }
  
  /**
   * Deactivate all active referral codes for a user
   */
  async deactivateAllForUser(userId: string): Promise<number> {
    try {
      const query = `
        UPDATE referral_codes
        SET status = 'inactive', updated_at = NOW()
        WHERE user_id = $1 AND status = 'active'
      `;
      
      const result = await this.db.query(query, [userId]);
      return result.rowCount;
    } catch (error) {
      logger.error('Error deactivating referral codes for user', { error, userId });
      throw error;
    }
  }
  
  /**
   * Check if a code is unique
   */
  async isCodeUnique(code: string): Promise<boolean> {
    try {
      const query = 'SELECT EXISTS(SELECT 1 FROM referral_codes WHERE code = $1) as exists';
      const result = await this.db.query<{ exists: boolean }>(query, [code]);
      
      return !result.rows[0].exists;
    } catch (error) {
      logger.error('Error checking if code is unique', { error, code });
      throw error;
    }
  }
}
