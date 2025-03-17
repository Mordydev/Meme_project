/**
 * Referral Reward Repository
 * 
 * Handles data access for referral rewards
 */
import { Pool } from 'pg';
import { BaseRepository } from './base-repository';
import { 
  ReferralReward, 
  CreateReferralRewardDto, 
  UpdateReferralRewardDto,
  RewardType,
  RewardStatus
} from '../models/referral-reward';
import { logger } from '../lib/logger';

export class ReferralRewardRepository extends BaseRepository<ReferralReward> {
  constructor(db: Pool) {
    super(db, 'referral_rewards', 'id');
  }
  
  /**
   * Create a referral reward
   */
  async createReward(dto: CreateReferralRewardDto): Promise<ReferralReward> {
    try {
      const query = `
        INSERT INTO referral_rewards
        (id, referral_id, referrer_id, referee_id, type, points_amount, status, created_at, 
         processed_at, transaction_id, campaign_id)
        VALUES (uuid_generate_v4(), $1, $2, $3, $4, $5, $6, NOW(), $7, $8, $9)
        RETURNING *
      `;
      
      const result = await this.db.query<ReferralReward>(query, [
        dto.referral_id,
        dto.referrer_id,
        dto.referee_id,
        dto.type,
        dto.points_amount,
        dto.status || 'pending',
        dto.processed_at || null,
        dto.transaction_id || null,
        dto.campaign_id || null
      ]);
      
      return result.rows[0];
    } catch (error) {
      logger.error('Error creating referral reward', { error, dto });
      throw error;
    }
  }
  
  /**
   * Find reward by referral ID and type
   */
  async findByReferralAndType(referralId: string, type: RewardType): Promise<ReferralReward | null> {
    try {
      const query = 'SELECT * FROM referral_rewards WHERE referral_id = $1 AND type = $2';
      const result = await this.db.query<ReferralReward>(query, [referralId, type]);
      
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error finding reward by referral and type', { error, referralId, type });
      throw error;
    }
  }
  
  /**
   * Update reward status
   */
  async updateStatus(
    id: string, 
    status: RewardStatus,
    transactionId?: string
  ): Promise<ReferralReward | null> {
    try {
      let query = `
        UPDATE referral_rewards
        SET status = $1
      `;
      
      const params = [status];
      
      // Add processed_at timestamp if status is 'processed'
      if (status === 'processed') {
        query += ', processed_at = NOW()';
      }
      
      // Add transaction ID if provided
      if (transactionId) {
        query += `, transaction_id = $${params.length + 1}`;
        params.push(transactionId);
      }
      
      query += ` WHERE id = $${params.length + 1} RETURNING *`;
      params.push(id);
      
      const result = await this.db.query<ReferralReward>(query, params);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error updating reward status', { error, id, status });
      throw error;
    }
  }
  
  /**
   * Get rewards for a referrer
   */
  async getRewardsForReferrer(
    referrerId: string,
    options: { 
      status?: RewardStatus | RewardStatus[]; 
      limit?: number; 
      offset?: number;
    } = {}
  ): Promise<{ 
    data: ReferralReward[]; 
    total: number; 
  }> {
    try {
      const limit = options.limit || 20;
      const offset = options.offset || 0;
      
      let query = 'SELECT * FROM referral_rewards WHERE referrer_id = $1';
      let countQuery = 'SELECT COUNT(*) as count FROM referral_rewards WHERE referrer_id = $1';
      
      const queryParams = [referrerId];
      const countParams = [referrerId];
      
      // Add status filter if provided
      if (options.status) {
        if (Array.isArray(options.status)) {
          // Multiple statuses
          const statusPlaceholders = options.status.map((_, idx) => `$${queryParams.length + idx + 1}`);
          query += ` AND status IN (${statusPlaceholders.join(', ')})`;
          countQuery += ` AND status IN (${statusPlaceholders.join(', ')})`;
          
          options.status.forEach(status => {
            queryParams.push(status);
            countParams.push(status);
          });
        } else {
          // Single status
          query += ` AND status = $2`;
          countQuery += ` AND status = $2`;
          queryParams.push(options.status);
          countParams.push(options.status);
        }
      }
      
      // Add ordering and pagination
      query += ' ORDER BY created_at DESC LIMIT $' + (queryParams.length + 1) + 
               ' OFFSET $' + (queryParams.length + 2);
      queryParams.push(limit, offset);
      
      // Execute queries
      const result = await this.db.query<ReferralReward>(query, queryParams);
      const countResult = await this.db.query<{ count: string }>(countQuery, countParams);
      
      return {
        data: result.rows,
        total: parseInt(countResult.rows[0]?.count || '0', 10)
      };
    } catch (error) {
      logger.error('Error getting rewards for referrer', { error, referrerId, options });
      throw error;
    }
  }
  
  /**
   * Get total rewards for a referrer
   */
  async getTotalRewardsForReferrer(referrerId: string): Promise<{
    totalRewards: number;
    totalPoints: number;
    pendingPoints: number;
    processedPoints: number;
  }> {
    try {
      const query = `
        SELECT 
          COUNT(*) as total_rewards,
          SUM(points_amount) as total_points,
          SUM(CASE WHEN status = 'pending' THEN points_amount ELSE 0 END) as pending_points,
          SUM(CASE WHEN status = 'processed' THEN points_amount ELSE 0 END) as processed_points
        FROM referral_rewards
        WHERE referrer_id = $1
      `;
      
      const result = await this.db.query<{
        total_rewards: string;
        total_points: string;
        pending_points: string;
        processed_points: string;
      }>(query, [referrerId]);
      
      const row = result.rows[0];
      
      return {
        totalRewards: parseInt(row?.total_rewards || '0', 10),
        totalPoints: parseInt(row?.total_points || '0', 10),
        pendingPoints: parseInt(row?.pending_points || '0', 10),
        processedPoints: parseInt(row?.processed_points || '0', 10)
      };
    } catch (error) {
      logger.error('Error getting total rewards for referrer', { error, referrerId });
      throw error;
    }
  }
  
  /**
   * Get rewards by referral ID
   */
  async getRewardsByReferralId(referralId: string): Promise<ReferralReward[]> {
    try {
      const query = 'SELECT * FROM referral_rewards WHERE referral_id = $1 ORDER BY created_at DESC';
      const result = await this.db.query<ReferralReward>(query, [referralId]);
      
      return result.rows;
    } catch (error) {
      logger.error('Error getting rewards by referral ID', { error, referralId });
      throw error;
    }
  }
  
  /**
   * Get pending rewards
   */
  async getPendingRewards(
    options: { limit?: number; offset?: number } = {}
  ): Promise<{
    data: ReferralReward[];
    total: number;
  }> {
    try {
      const limit = options.limit || 20;
      const offset = options.offset || 0;
      
      const query = `
        SELECT * FROM referral_rewards 
        WHERE status = 'pending' 
        ORDER BY created_at ASC
        LIMIT $1 OFFSET $2
      `;
      
      const countQuery = `
        SELECT COUNT(*) as count 
        FROM referral_rewards 
        WHERE status = 'pending'
      `;
      
      const result = await this.db.query<ReferralReward>(query, [limit, offset]);
      const countResult = await this.db.query<{ count: string }>(countQuery);
      
      return {
        data: result.rows,
        total: parseInt(countResult.rows[0]?.count || '0', 10)
      };
    } catch (error) {
      logger.error('Error getting pending rewards', { error, options });
      throw error;
    }
  }
}
