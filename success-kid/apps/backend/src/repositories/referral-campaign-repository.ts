/**
 * Referral Campaign Repository
 * 
 * Handles data access for referral campaigns
 */
import { Pool } from 'pg';
import { BaseRepository } from './base-repository';
import { 
  ReferralCampaign, 
  CreateCampaignDto, 
  UpdateCampaignDto, 
  CampaignStatus 
} from '../models/referral-campaign';
import { logger } from '../lib/logger';

export class ReferralCampaignRepository extends BaseRepository<ReferralCampaign> {
  constructor(db: Pool) {
    super(db, 'referral_campaigns', 'id');
  }
  
  /**
   * Create a new campaign
   */
  async createCampaign(dto: CreateCampaignDto): Promise<ReferralCampaign> {
    try {
      const query = `
        INSERT INTO referral_campaigns
        (id, name, description, start_date, end_date, reward_multiplier, eligibility_criteria,
         max_rewards, special_code, target_audience, status, created_at, created_by)
        VALUES (uuid_generate_v4(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), $11)
        RETURNING *
      `;
      
      const result = await this.db.query<ReferralCampaign>(query, [
        dto.name,
        dto.description,
        dto.start_date,
        dto.end_date,
        dto.reward_multiplier,
        dto.eligibility_criteria || null,
        dto.max_rewards || null,
        dto.special_code || null,
        dto.target_audience || null,
        dto.status || 'draft',
        dto.created_by
      ]);
      
      return result.rows[0];
    } catch (error) {
      logger.error('Error creating referral campaign', { error, dto });
      throw error;
    }
  }
  
  /**
   * Update campaign status
   */
  async updateStatus(id: string, status: CampaignStatus): Promise<ReferralCampaign | null> {
    try {
      const query = `
        UPDATE referral_campaigns
        SET status = $1
        WHERE id = $2
        RETURNING *
      `;
      
      const result = await this.db.query<ReferralCampaign>(query, [status, id]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error updating campaign status', { error, id, status });
      throw error;
    }
  }
  
  /**
   * Find active campaigns (current date falls between start_date and end_date)
   */
  async findActiveCampaigns(date: Date = new Date()): Promise<ReferralCampaign[]> {
    try {
      const query = `
        SELECT * FROM referral_campaigns
        WHERE status = 'active'
        AND start_date <= $1
        AND end_date >= $1
        ORDER BY reward_multiplier DESC, start_date DESC
      `;
      
      const result = await this.db.query<ReferralCampaign>(query, [date]);
      return result.rows;
    } catch (error) {
      logger.error('Error finding active campaigns', { error, date });
      throw error;
    }
  }
  
  /**
   * Find campaigns by status
   */
  async findByStatus(
    status: CampaignStatus | CampaignStatus[],
    options: { limit?: number; offset?: number } = {}
  ): Promise<{
    data: ReferralCampaign[];
    total: number;
  }> {
    try {
      const limit = options.limit || 20;
      const offset = options.offset || 0;
      
      let query: string;
      let countQuery: string;
      let queryParams: any[];
      
      if (Array.isArray(status)) {
        // Multiple statuses
        const placeholders = status.map((_, idx) => `$${idx + 1}`).join(', ');
        query = `
          SELECT * FROM referral_campaigns
          WHERE status IN (${placeholders})
          ORDER BY created_at DESC
          LIMIT $${status.length + 1} OFFSET $${status.length + 2}
        `;
        
        countQuery = `
          SELECT COUNT(*) as count FROM referral_campaigns
          WHERE status IN (${placeholders})
        `;
        
        queryParams = [...status, limit, offset];
      } else {
        // Single status
        query = `
          SELECT * FROM referral_campaigns
          WHERE status = $1
          ORDER BY created_at DESC
          LIMIT $2 OFFSET $3
        `;
        
        countQuery = `
          SELECT COUNT(*) as count FROM referral_campaigns
          WHERE status = $1
        `;
        
        queryParams = [status, limit, offset];
      }
      
      const result = await this.db.query<ReferralCampaign>(query, queryParams);
      const countResult = await this.db.query<{ count: string }>(
        countQuery, 
        Array.isArray(status) ? status : [status]
      );
      
      return {
        data: result.rows,
        total: parseInt(countResult.rows[0]?.count || '0', 10)
      };
    } catch (error) {
      logger.error('Error finding campaigns by status', { error, status });
      throw error;
    }
  }
  
  /**
   * Get campaign performance metrics
   */
  async getCampaignPerformance(campaignId: string): Promise<{
    totalVisits: number;
    uniqueVisitors: number;
    signups: number;
    conversionRate: number;
    totalRewards: number;
    totalPointsAwarded: number;
  }> {
    try {
      // Get campaign details to find codes
      const campaign = await this.findById(campaignId);
      if (!campaign) {
        throw new Error(`Campaign not found: ${campaignId}`);
      }
      
      // Get codes associated with this campaign
      const codesQuery = `
        SELECT code FROM referral_codes
        WHERE campaign_id = $1 OR special_code = $2
      `;
      
      const codesResult = await this.db.query<{ code: string }>(
        codesQuery, 
        [campaignId, campaign.special_code]
      );
      
      const codes = codesResult.rows.map(row => row.code);
      
      if (codes.length === 0) {
        // No codes to track performance for
        return {
          totalVisits: 0,
          uniqueVisitors: 0,
          signups: 0,
          conversionRate: 0,
          totalRewards: 0,
          totalPointsAwarded: 0
        };
      }
      
      // Placeholder for codes in query
      const codePlaceholders = codes.map((_, idx) => `$${idx + 2}`).join(', ');
      
      // Get tracking stats
      const trackingQuery = `
        SELECT
          COUNT(*) as total_visits,
          COUNT(DISTINCT COALESCE(visitor_id, ip_hash)) as unique_visitors,
          COUNT(converted_user_id) as signups
        FROM referral_tracking
        WHERE referral_code IN (${codePlaceholders})
        AND created_at BETWEEN $1 AND COALESCE($${codes.length + 2}, NOW())
      `;
      
      const trackingResult = await this.db.query<{
        total_visits: string;
        unique_visitors: string;
        signups: string;
      }>(trackingQuery, [campaign.start_date, ...codes, campaign.end_date]);
      
      // Get rewards stats
      const rewardsQuery = `
        SELECT
          COUNT(*) as total_rewards,
          SUM(points_amount) as total_points
        FROM referral_rewards
        WHERE campaign_id = $1
      `;
      
      const rewardsResult = await this.db.query<{
        total_rewards: string;
        total_points: string;
      }>(rewardsQuery, [campaignId]);
      
      const tracking = trackingResult.rows[0];
      const rewards = rewardsResult.rows[0];
      
      const totalVisits = parseInt(tracking?.total_visits || '0', 10);
      const uniqueVisitors = parseInt(tracking?.unique_visitors || '0', 10);
      const signups = parseInt(tracking?.signups || '0', 10);
      const conversionRate = totalVisits > 0 ? (signups / totalVisits) * 100 : 0;
      
      return {
        totalVisits,
        uniqueVisitors,
        signups,
        conversionRate,
        totalRewards: parseInt(rewards?.total_rewards || '0', 10),
        totalPointsAwarded: parseInt(rewards?.total_points || '0', 10)
      };
    } catch (error) {
      logger.error('Error getting campaign performance', { error, campaignId });
      throw error;
    }
  }
  
  /**
   * Check for date overlap with existing campaigns
   */
  async checkDateOverlap(
    startDate: Date, 
    endDate: Date, 
    excludeCampaignId?: string
  ): Promise<boolean> {
    try {
      let query = `
        SELECT EXISTS (
          SELECT 1 FROM referral_campaigns
          WHERE status IN ('draft', 'active')
          AND start_date <= $2
          AND end_date >= $1
      `;
      
      const params = [startDate, endDate];
      
      if (excludeCampaignId) {
        query += ` AND id != $3`;
        params.push(excludeCampaignId);
      }
      
      query += `) as overlaps`;
      
      const result = await this.db.query<{ overlaps: boolean }>(query, params);
      return result.rows[0]?.overlaps || false;
    } catch (error) {
      logger.error('Error checking date overlap', { error, startDate, endDate });
      throw error;
    }
  }
}
