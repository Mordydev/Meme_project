/**
 * Referral Repository
 * 
 * Repository for managing referral relationships, codes, and campaigns.
 */
import { Pool, PoolClient } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import { BaseRepository } from '../base-repository';
import { logger } from '../../lib/logger';
import { DatabaseError, NotFoundError } from '../../errors';
import { 
  Referral, 
  ReferralCode, 
  ReferralCampaign,
  CreateReferralDto,
  UpdateReferralDto,
  GenerateReferralCodeDto,
  ReferralStatus
} from '../../models/entities/referral.model';

/**
 * Repository for managing referrals
 */
export class ReferralRepository extends BaseRepository<Referral> {
  /**
   * Create a new ReferralRepository instance
   * 
   * @param db Database connection pool
   */
  constructor(db: Pool) {
    super(db, 'referrals');
  }

  /**
   * Find referral by referrer and referred user IDs
   * 
   * @param referrerId Referrer user ID
   * @param referredId Referred user ID
   * @returns Referral or null if not found
   */
  async findByUsers(referrerId: string, referredId: string): Promise<Referral | null> {
    try {
      const query = `
        SELECT * FROM referrals 
        WHERE referrer_id = $1 AND referred_id = $2
      `;
      
      const result = await this.db.query<Referral>(query, [referrerId, referredId]);
      return result.rows.length > 0 ? this.mapToEntity(result.rows[0]) : null;
    } catch (error) {
      logger.error('Failed to find referral by users', { 
        referrerId, 
        referredId, 
        error 
      });
      throw new DatabaseError('Failed to find referral by users', error);
    }
  }

  /**
   * Find referral by referred user ID
   * 
   * @param referredId Referred user ID
   * @returns Referral or null if not found
   */
  async findByReferredId(referredId: string): Promise<Referral | null> {
    try {
      const query = `
        SELECT * FROM referrals 
        WHERE referred_id = $1
      `;
      
      const result = await this.db.query<Referral>(query, [referredId]);
      return result.rows.length > 0 ? this.mapToEntity(result.rows[0]) : null;
    } catch (error) {
      logger.error('Failed to find referral by referred ID', { 
        referredId, 
        error 
      });
      throw new DatabaseError('Failed to find referral by referred ID', error);
    }
  }

  /**
   * Get referrals by referrer ID
   * 
   * @param referrerId Referrer user ID
   * @param limit Maximum number of referrals to return
   * @param offset Number of referrals to skip
   * @returns Array of referrals
   */
  async findByReferrerId(
    referrerId: string, 
    limit: number = 20, 
    offset: number = 0
  ): Promise<Referral[]> {
    try {
      const query = `
        SELECT * FROM referrals 
        WHERE referrer_id = $1 
        ORDER BY created_at DESC 
        LIMIT $2 OFFSET $3
      `;
      
      const result = await this.db.query<Referral>(query, [referrerId, limit, offset]);
      return result.rows.map(row => this.mapToEntity(row));
    } catch (error) {
      logger.error('Failed to find referrals by referrer ID', { 
        referrerId, 
        limit, 
        offset, 
        error 
      });
      throw new DatabaseError('Failed to find referrals by referrer ID', error);
    }
  }

  /**
   * Get referrals by status
   * 
   * @param status Referral status
   * @param limit Maximum number of referrals to return
   * @param offset Number of referrals to skip
   * @returns Array of referrals
   */
  async findByStatus(
    status: ReferralStatus, 
    limit: number = 20, 
    offset: number = 0
  ): Promise<Referral[]> {
    try {
      const query = `
        SELECT * FROM referrals 
        WHERE status = $1 
        ORDER BY created_at DESC 
        LIMIT $2 OFFSET $3
      `;
      
      const result = await this.db.query<Referral>(query, [status, limit, offset]);
      return result.rows.map(row => this.mapToEntity(row));
    } catch (error) {
      logger.error('Failed to find referrals by status', { 
        status, 
        limit, 
        offset, 
        error 
      });
      throw new DatabaseError('Failed to find referrals by status', error);
    }
  }

  /**
   * Get referrals by campaign ID
   * 
   * @param campaignId Campaign ID
   * @param limit Maximum number of referrals to return
   * @param offset Number of referrals to skip
   * @returns Array of referrals
   */
  async findByCampaignId(
    campaignId: string, 
    limit: number = 20, 
    offset: number = 0
  ): Promise<Referral[]> {
    try {
      const query = `
        SELECT * FROM referrals 
        WHERE campaign_id = $1 
        ORDER BY created_at DESC 
        LIMIT $2 OFFSET $3
      `;
      
      const result = await this.db.query<Referral>(query, [campaignId, limit, offset]);
      return result.rows.map(row => this.mapToEntity(row));
    } catch (error) {
      logger.error('Failed to find referrals by campaign ID', { 
        campaignId, 
        limit, 
        offset, 
        error 
      });
      throw new DatabaseError('Failed to find referrals by campaign ID', error);
    }
  }

  /**
   * Get referrals within a date range
   * 
   * @param startDate Start date
   * @param endDate End date
   * @param limit Maximum number of referrals to return
   * @param offset Number of referrals to skip
   * @returns Array of referrals
   */
  async findByDateRange(
    startDate: Date, 
    endDate: Date, 
    limit: number = 100, 
    offset: number = 0
  ): Promise<Referral[]> {
    try {
      const query = `
        SELECT * FROM referrals 
        WHERE created_at >= $1 AND created_at <= $2 
        ORDER BY created_at DESC 
        LIMIT $3 OFFSET $4
      `;
      
      const result = await this.db.query<Referral>(query, [startDate, endDate, limit, offset]);
      return result.rows.map(row => this.mapToEntity(row));
    } catch (error) {
      logger.error('Failed to find referrals by date range', { 
        startDate, 
        endDate, 
        limit, 
        offset, 
        error 
      });
      throw new DatabaseError('Failed to find referrals by date range', error);
    }
  }

  /**
   * Create a new referral
   * 
   * @param data Referral data
   * @returns Created referral
   */
  async createReferral(data: CreateReferralDto): Promise<Referral> {
    return this.withTransaction(async (client) => {
      try {
        // Check if referred user already has a referral
        const existingReferral = await client.query(
          'SELECT id FROM referrals WHERE referred_id = $1',
          [data.referred_id]
        );
        
        if (existingReferral.rows.length > 0) {
          throw new Error(`User ${data.referred_id} already has a referrer`);
        }
        
        // Create the referral
        const result = await client.query<Referral>(
          `INSERT INTO referrals(
            id, referrer_id, referred_id, created_at, status,
            campaign_id, referral_code, source, metadata
          ) VALUES(
            $1, $2, $3, NOW(), $4, $5, $6, $7, $8
          ) RETURNING *`,
          [
            uuidv4(),
            data.referrer_id,
            data.referred_id,
            'pending',
            data.campaign_id || null,
            data.referral_code || null,
            data.source || null,
            data.metadata || {}
          ]
        );
        
        return this.mapToEntity(result.rows[0]);
      } catch (error) {
        logger.error('Failed to create referral', { data, error });
        throw new DatabaseError('Failed to create referral', error);
      }
    });
  }

  /**
   * Update referral status
   * 
   * @param id Referral ID
   * @param status New status
   * @param additionalData Additional data to update
   * @returns Updated referral
   */
  async updateStatus(
    id: string, 
    status: ReferralStatus, 
    additionalData: Partial<UpdateReferralDto> = {}
  ): Promise<Referral> {
    try {
      // Determine which timestamp to update based on status
      let statusTimestamp = '';
      if (status === 'converted') {
        statusTimestamp = ', converted_at = NOW()';
      } else if (status === 'rewarded') {
        statusTimestamp = ', rewarded_at = NOW()';
      }
      
      // Prepare additional data updates if provided
      const updates: string[] = [];
      const values: any[] = [id, status];
      let paramIndex = 3;
      
      if (additionalData.reward_amount !== undefined) {
        updates.push(`reward_amount = $${paramIndex++}`);
        values.push(additionalData.reward_amount);
      }
      
      if (additionalData.metadata !== undefined) {
        updates.push(`metadata = metadata || $${paramIndex++}`);
        values.push(additionalData.metadata);
      }
      
      const additionalUpdates = updates.length > 0 ? `, ${updates.join(', ')}` : '';
      
      // Update the referral
      const query = `
        UPDATE referrals 
        SET status = $2${statusTimestamp}${additionalUpdates}
        WHERE id = $1 
        RETURNING *
      `;
      
      const result = await this.db.query<Referral>(query, values);
      
      if (result.rows.length === 0) {
        throw new NotFoundError('Referral', id);
      }
      
      return this.mapToEntity(result.rows[0]);
    } catch (error) {
      logger.error('Failed to update referral status', { 
        id, 
        status, 
        additionalData, 
        error 
      });
      
      if (error instanceof NotFoundError) {
        throw error;
      }
      
      throw new DatabaseError('Failed to update referral status', error);
    }
  }

  /**
   * Count referrals by referrer ID
   * 
   * @param referrerId Referrer user ID
   * @param status Optional status filter
   * @returns Number of referrals
   */
  async countByReferrerId(referrerId: string, status?: ReferralStatus): Promise<number> {
    try {
      let query = 'SELECT COUNT(*) as count FROM referrals WHERE referrer_id = $1';
      const queryParams: any[] = [referrerId];
      
      if (status) {
        query += ' AND status = $2';
        queryParams.push(status);
      }
      
      const result = await this.db.query<{ count: string }>(query, queryParams);
      return parseInt(result.rows[0].count, 10);
    } catch (error) {
      logger.error('Failed to count referrals by referrer ID', { 
        referrerId, 
        status, 
        error 
      });
      throw new DatabaseError('Failed to count referrals by referrer ID', error);
    }
  }

  /**
   * Count referrals by status
   * 
   * @param status Referral status
   * @returns Number of referrals
   */
  async countByStatus(status: ReferralStatus): Promise<number> {
    try {
      const query = 'SELECT COUNT(*) as count FROM referrals WHERE status = $1';
      const result = await this.db.query<{ count: string }>(query, [status]);
      return parseInt(result.rows[0].count, 10);
    } catch (error) {
      logger.error('Failed to count referrals by status', { 
        status, 
        error 
      });
      throw new DatabaseError('Failed to count referrals by status', error);
    }
  }

  /**
   * Get referral statistics for a user
   * 
   * @param userId User ID to get statistics for
   * @returns Referral statistics
   */
  async getReferralStats(userId: string): Promise<{
    total: number;
    pending: number;
    completed: number;
    converted: number;
    rewarded: number;
    expired: number;
    invalid: number;
  }> {
    try {
      const query = `
        SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
          COUNT(CASE WHEN status = 'converted' THEN 1 END) as converted,
          COUNT(CASE WHEN status = 'rewarded' THEN 1 END) as rewarded,
          COUNT(CASE WHEN status = 'expired' THEN 1 END) as expired,
          COUNT(CASE WHEN status = 'invalid' THEN 1 END) as invalid
        FROM referrals 
        WHERE referrer_id = $1
      `;
      
      const result = await this.db.query<{
        total: string;
        pending: string;
        completed: string;
        converted: string;
        rewarded: string;
        expired: string;
        invalid: string;
      }>(query, [userId]);
      
      const stats = result.rows[0];
      
      return {
        total: parseInt(stats.total, 10),
        pending: parseInt(stats.pending, 10),
        completed: parseInt(stats.completed, 10),
        converted: parseInt(stats.converted, 10),
        rewarded: parseInt(stats.rewarded, 10),
        expired: parseInt(stats.expired, 10),
        invalid: parseInt(stats.invalid, 10)
      };
    } catch (error) {
      logger.error('Failed to get referral statistics', { 
        userId, 
        error 
      });
      throw new DatabaseError('Failed to get referral statistics', error);
    }
  }

  /**
   * Get referral chain for a user (all users in their referral network)
   * 
   * @param userId User ID to get referral chain for
   * @param maxDepth Maximum depth of the referral chain
   * @returns Array of referrals in the chain
   */
  async getReferralChain(userId: string, maxDepth: number = 3): Promise<Referral[][]> {
    try {
      // This is a recursive query that gets the referral chain
      // It's a bit more complex, so we're using a WITH RECURSIVE clause
      const query = `
        WITH RECURSIVE referral_chain AS (
          -- Base case: direct referrals of the user
          SELECT 
            r.*,
            0 as depth
          FROM 
            referrals r
          WHERE 
            r.referrer_id = $1
          
          UNION ALL
          
          -- Recursive case: referrals of each referred user
          SELECT 
            r.*,
            rc.depth + 1 as depth
          FROM 
            referrals r
          INNER JOIN 
            referral_chain rc ON r.referrer_id = rc.referred_id
          WHERE 
            rc.depth < $2
        )
        SELECT * FROM referral_chain
        ORDER BY depth, created_at DESC
      `;
      
      const result = await this.db.query<Referral & { depth: number }>(query, [userId, maxDepth]);
      
      // Group by depth
      const chain: Referral[][] = [];
      
      for (let i = 0; i <= maxDepth; i++) {
        chain[i] = result.rows
          .filter(row => row.depth === i)
          .map(row => this.mapToEntity(row));
      }
      
      return chain;
    } catch (error) {
      logger.error('Failed to get referral chain', { 
        userId, 
        maxDepth, 
        error 
      });
      throw new DatabaseError('Failed to get referral chain', error);
    }
  }

  /**
   * Map database row to Referral entity
   * 
   * @param row Database row
   * @returns Referral entity
   */
  protected mapToEntity(row: Record<string, any>): Referral {
    return {
      id: row.id,
      referrer_id: row.referrer_id,
      referred_id: row.referred_id,
      created_at: row.created_at,
      status: row.status,
      converted_at: row.converted_at,
      rewarded_at: row.rewarded_at,
      reward_amount: row.reward_amount,
      campaign_id: row.campaign_id,
      referral_code: row.referral_code,
      source: row.source,
      metadata: row.metadata
    };
  }
}
