/**
 * Referral Campaign Repository
 * 
 * Repository for managing referral campaigns.
 */
import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import { BaseRepository } from '../base-repository';
import { logger } from '../../lib/logger';
import { DatabaseError, NotFoundError } from '../../errors';
import { ReferralCampaign } from '../../models/entities/referral.model';

/**
 * Interface for campaign creation data
 */
export interface CreateCampaignDto {
  name: string;
  description?: string;
  start_date: Date;
  end_date?: Date | null;
  reward_amount: number;
  referred_reward_amount?: number;
  max_referrals?: number;
  requirements?: Record<string, any>;
  metadata?: Record<string, any>;
}

/**
 * Interface for campaign update data
 */
export interface UpdateCampaignDto {
  name?: string;
  description?: string;
  end_date?: Date | null;
  reward_amount?: number;
  referred_reward_amount?: number;
  max_referrals?: number;
  is_active?: boolean;
  requirements?: Record<string, any>;
  metadata?: Record<string, any>;
}

/**
 * Repository for managing referral campaigns
 */
export class ReferralCampaignRepository extends BaseRepository<ReferralCampaign> {
  /**
   * Create a new ReferralCampaignRepository instance
   * 
   * @param db Database connection pool
   */
  constructor(db: Pool) {
    super(db, 'referral_campaigns');
  }

  /**
   * Find active campaigns
   * 
   * @param currentDate Current date (for filtering active campaigns)
   * @returns Array of active campaigns
   */
  async findActiveCampaigns(currentDate: Date = new Date()): Promise<ReferralCampaign[]> {
    try {
      const query = `
        SELECT * FROM referral_campaigns 
        WHERE is_active = true 
        AND start_date <= $1 
        AND (end_date IS NULL OR end_date >= $1)
        ORDER BY start_date DESC
      `;
      
      const result = await this.db.query<ReferralCampaign>(query, [currentDate]);
      return result.rows.map(row => this.mapToEntity(row));
    } catch (error) {
      logger.error('Failed to find active campaigns', { 
        currentDate, 
        error 
      });
      throw new DatabaseError('Failed to find active campaigns', error);
    }
  }

  /**
   * Create a new campaign
   * 
   * @param data Campaign data
   * @returns Created campaign
   */
  async createCampaign(data: CreateCampaignDto): Promise<ReferralCampaign> {
    try {
      const result = await this.db.query<ReferralCampaign>(
        `INSERT INTO referral_campaigns(
          id, name, description, start_date, end_date,
          reward_amount, referred_reward_amount, max_referrals,
          is_active, requirements, metadata, created_at, updated_at
        ) VALUES(
          $1, $2, $3, $4, $5, $6, $7, $8, true, $9, $10, NOW(), NOW()
        ) RETURNING *`,
        [
          uuidv4(),
          data.name,
          data.description || null,
          data.start_date,
          data.end_date || null,
          data.reward_amount,
          data.referred_reward_amount || 0,
          data.max_referrals || null,
          data.requirements || {},
          data.metadata || {}
        ]
      );
      
      return this.mapToEntity(result.rows[0]);
    } catch (error) {
      logger.error('Failed to create campaign', { 
        data, 
        error 
      });
      throw new DatabaseError('Failed to create campaign', error);
    }
  }

  /**
   * Update a campaign
   * 
   * @param id Campaign ID
   * @param data Campaign update data
   * @returns Updated campaign
   */
  async updateCampaign(id: string, data: UpdateCampaignDto): Promise<ReferralCampaign> {
    try {
      // Prepare update values
      const updates: string[] = [];
      const values: any[] = [id];
      let paramIndex = 2;
      
      // Add each provided field to the updates
      if (data.name !== undefined) {
        updates.push(`name = $${paramIndex++}`);
        values.push(data.name);
      }
      
      if (data.description !== undefined) {
        updates.push(`description = $${paramIndex++}`);
        values.push(data.description);
      }
      
      if (data.end_date !== undefined) {
        updates.push(`end_date = $${paramIndex++}`);
        values.push(data.end_date);
      }
      
      if (data.reward_amount !== undefined) {
        updates.push(`reward_amount = $${paramIndex++}`);
        values.push(data.reward_amount);
      }
      
      if (data.referred_reward_amount !== undefined) {
        updates.push(`referred_reward_amount = $${paramIndex++}`);
        values.push(data.referred_reward_amount);
      }
      
      if (data.max_referrals !== undefined) {
        updates.push(`max_referrals = $${paramIndex++}`);
        values.push(data.max_referrals);
      }
      
      if (data.is_active !== undefined) {
        updates.push(`is_active = $${paramIndex++}`);
        values.push(data.is_active);
      }
      
      if (data.requirements !== undefined) {
        updates.push(`requirements = $${paramIndex++}`);
        values.push(data.requirements);
      }
      
      if (data.metadata !== undefined) {
        updates.push(`metadata = metadata || $${paramIndex++}`);
        values.push(data.metadata);
      }
      
      // Always update the updated_at timestamp
      updates.push(`updated_at = NOW()`);
      
      // If no updates, just return the existing campaign
      if (updates.length === 0) {
        return this.findById(id);
      }
      
      // Build and execute the query
      const query = `
        UPDATE referral_campaigns 
        SET ${updates.join(', ')} 
        WHERE id = $1 
        RETURNING *
      `;
      
      const result = await this.db.query<ReferralCampaign>(query, values);
      
      if (result.rows.length === 0) {
        throw new NotFoundError('Campaign', id);
      }
      
      return this.mapToEntity(result.rows[0]);
    } catch (error) {
      logger.error('Failed to update campaign', { 
        id, 
        data, 
        error 
      });
      
      if (error instanceof NotFoundError) {
        throw error;
      }
      
      throw new DatabaseError('Failed to update campaign', error);
    }
  }

  /**
   * Get campaign performance metrics
   * 
   * @param campaignId Campaign ID
   * @returns Campaign performance metrics
   */
  async getCampaignPerformance(campaignId: string): Promise<{
    totalReferrals: number;
    completedReferrals: number;
    conversionRate: number;
    totalRewards: number;
  }> {
    try {
      const query = `
        SELECT 
          COUNT(*) as total_referrals,
          COUNT(CASE WHEN status IN ('completed', 'converted', 'rewarded') THEN 1 END) as completed_referrals,
          SUM(CASE WHEN status = 'rewarded' THEN reward_amount ELSE 0 END) as total_rewards
        FROM referrals 
        WHERE campaign_id = $1
      `;
      
      const result = await this.db.query<{
        total_referrals: string;
        completed_referrals: string;
        total_rewards: string;
      }>(query, [campaignId]);
      
      const stats = result.rows[0];
      const totalReferrals = parseInt(stats.total_referrals, 10);
      const completedReferrals = parseInt(stats.completed_referrals, 10);
      
      return {
        totalReferrals,
        completedReferrals,
        conversionRate: totalReferrals > 0 ? (completedReferrals / totalReferrals) * 100 : 0,
        totalRewards: parseInt(stats.total_rewards, 10) || 0
      };
    } catch (error) {
      logger.error('Failed to get campaign performance', { 
        campaignId, 
        error 
      });
      throw new DatabaseError('Failed to get campaign performance', error);
    }
  }

  /**
   * Map database row to ReferralCampaign entity
   * 
   * @param row Database row
   * @returns ReferralCampaign entity
   */
  protected mapToEntity(row: Record<string, any>): ReferralCampaign {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      start_date: row.start_date,
      end_date: row.end_date,
      reward_amount: row.reward_amount,
      referred_reward_amount: row.referred_reward_amount,
      max_referrals: row.max_referrals,
      is_active: row.is_active,
      requirements: row.requirements,
      metadata: row.metadata
    };
  }
}
