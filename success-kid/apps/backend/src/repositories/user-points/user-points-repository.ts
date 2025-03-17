/**
 * User Points Repository
 * 
 * Handles data access for user points transactions
 */
import { Pool, PoolClient } from 'pg';
import { BaseRepository } from '../base-repository';
import { UserPoints, CreateUserPointsDto, PointsSource } from '../../models/user-points';
import { logger } from '../../lib/logger';

export class UserPointsRepository extends BaseRepository<UserPoints> {
  constructor(db: Pool) {
    super(db, 'user_points', 'id');
  }

  /**
   * Award points to a user
   */
  async awardPoints(input: CreateUserPointsDto): Promise<UserPoints> {
    try {
      const { user_id, amount, source, reference_id, description } = input;
      
      // Validate amount is non-zero
      if (amount === 0) {
        throw new Error('Points amount cannot be zero');
      }
      
      const query = `
        INSERT INTO user_points
        (id, user_id, amount, source, reference_id, created_at, description)
        VALUES (uuid_generate_v4(), $1, $2, $3, $4, NOW(), $5)
        RETURNING *
      `;
      
      const result = await this.db.query<UserPoints>(query, [
        user_id,
        amount,
        source,
        reference_id || null,
        description || null
      ]);
      
      return result.rows[0];
    } catch (error) {
      logger.error('Error awarding points', { error, input });
      throw error;
    }
  }

  /**
   * Award points within a transaction
   */
  async awardPointsWithTransaction(
    client: PoolClient, 
    input: CreateUserPointsDto
  ): Promise<UserPoints> {
    try {
      const { user_id, amount, source, reference_id, description } = input;
      
      // Validate amount is non-zero
      if (amount === 0) {
        throw new Error('Points amount cannot be zero');
      }
      
      const query = `
        INSERT INTO user_points
        (id, user_id, amount, source, reference_id, created_at, description)
        VALUES (uuid_generate_v4(), $1, $2, $3, $4, NOW(), $5)
        RETURNING *
      `;
      
      const result = await client.query<UserPoints>(query, [
        user_id,
        amount,
        source,
        reference_id || null,
        description || null
      ]);
      
      return result.rows[0];
    } catch (error) {
      logger.error('Error awarding points in transaction', { error, input });
      throw error;
    }
  }

  /**
   * Get user points by source
   */
  async getPointsBySource(
    userId: string, 
    source: PointsSource, 
    options: { startDate?: Date; endDate?: Date } = {}
  ): Promise<UserPoints[]> {
    try {
      let query = `
        SELECT * FROM user_points
        WHERE user_id = $1 AND source = $2
      `;
      
      const queryParams: any[] = [userId, source];
      let paramIndex = 3;
      
      // Add date filters if provided
      if (options.startDate) {
        query += ` AND created_at >= $${paramIndex++}`;
        queryParams.push(options.startDate);
      }
      
      if (options.endDate) {
        query += ` AND created_at <= $${paramIndex++}`;
        queryParams.push(options.endDate);
      }
      
      query += ` ORDER BY created_at DESC`;
      
      const result = await this.db.query<UserPoints>(query, queryParams);
      return result.rows;
    } catch (error) {
      logger.error('Error getting points by source', { 
        error, 
        userId, 
        source, 
        options 
      });
      throw error;
    }
  }

  /**
   * Get points earned today by source
   */
  async getPointsEarnedTodayBySource(userId: string, source: PointsSource): Promise<number> {
    try {
      const query = `
        SELECT COALESCE(SUM(amount), 0) as total
        FROM user_points
        WHERE user_id = $1 
          AND source = $2
          AND amount > 0
          AND created_at >= DATE_TRUNC('day', NOW())
      `;
      
      const result = await this.db.query<{ total: string }>(query, [userId, source]);
      return parseInt(result.rows[0].total, 10);
    } catch (error) {
      logger.error('Error getting points earned today', { error, userId, source });
      throw error;
    }
  }

  /**
   * Get total points balance for a user
   */
  async getUserPointsBalance(userId: string): Promise<number> {
    try {
      const query = `
        SELECT COALESCE(SUM(amount), 0) as balance
        FROM user_points
        WHERE user_id = $1
      `;
      
      const result = await this.db.query<{ balance: string }>(query, [userId]);
      return parseInt(result.rows[0].balance, 10);
    } catch (error) {
      logger.error('Error getting user points balance', { error, userId });
      throw error;
    }
  }

  /**
   * Get points history for a user
   */
  async getUserPointsHistory(
    userId: string, 
    options: { 
      limit?: number; 
      offset?: number;
      minAmount?: number;
      maxAmount?: number;
      source?: PointsSource | PointsSource[];
      startDate?: Date;
      endDate?: Date;
      orderBy?: 'created_at_asc' | 'created_at_desc' | 'amount_asc' | 'amount_desc';
    } = {}
  ): Promise<UserPoints[]> {
    try {
      const { 
        limit = 20, 
        offset = 0,
        minAmount,
        maxAmount,
        source,
        startDate,
        endDate,
        orderBy = 'created_at_desc'
      } = options;
      
      let query = `SELECT * FROM user_points WHERE user_id = $1`;
      const queryParams: any[] = [userId];
      let paramIndex = 2;
      
      // Add filters
      if (minAmount !== undefined) {
        query += ` AND amount >= ${paramIndex++}`;
        queryParams.push(minAmount);
      }
      
      if (maxAmount !== undefined) {
        query += ` AND amount <= ${paramIndex++}`;
        queryParams.push(maxAmount);
      }
      
      if (source) {
        if (Array.isArray(source)) {
          query += ` AND source = ANY(${paramIndex++}::text[])`;
          queryParams.push(source);
        } else {
          query += ` AND source = ${paramIndex++}`;
          queryParams.push(source);
        }
      }
      
      if (startDate) {
        query += ` AND created_at >= ${paramIndex++}`;
        queryParams.push(startDate);
      }
      
      if (endDate) {
        query += ` AND created_at <= ${paramIndex++}`;
        queryParams.push(endDate);
      }
      
      // Add order by
      switch (orderBy) {
        case 'created_at_asc':
          query += ` ORDER BY created_at ASC`;
          break;
        case 'amount_asc':
          query += ` ORDER BY amount ASC`;
          break;
        case 'amount_desc':
          query += ` ORDER BY amount DESC`;
          break;
        case 'created_at_desc':
        default:
          query += ` ORDER BY created_at DESC`;
          break;
      }
      
      // Add pagination
      query += ` LIMIT ${paramIndex++} OFFSET ${paramIndex++}`;
      queryParams.push(limit, offset);
      
      const result = await this.db.query<UserPoints>(query, queryParams);
      return result.rows;
    } catch (error) {
      logger.error('Error getting user points history', { error, userId, options });
      throw error;
    }
  }

  /**
   * Get points redeemed this week by a user
   */
  async getPointsRedeemedThisWeek(userId: string): Promise<number> {
    try {
      const query = `
        SELECT COALESCE(SUM(ABS(amount)), 0) as total
        FROM user_points
        WHERE user_id = $1 
          AND source = 'redemption'
          AND amount < 0
          AND created_at >= DATE_TRUNC('week', NOW())
      `;
      
      const result = await this.db.query<{ total: string }>(query, [userId]);
      return parseInt(result.rows[0].total, 10);
    } catch (error) {
      logger.error('Error getting points redeemed this week', { error, userId });
      throw error;
    }
  }

  /**
   * Transfer points between users
   */
  async transferPoints(
    fromUserId: string, 
    toUserId: string, 
    amount: number, 
    description?: string
  ): Promise<{ fromTransaction: UserPoints; toTransaction: UserPoints }> {
    return this.executeTransaction(async (client) => {
      try {
        // Validate amount is positive
        if (amount <= 0) {
          throw new Error('Transfer amount must be positive');
        }
        
        // Check if user has sufficient balance
        const balanceQuery = `
          SELECT COALESCE(SUM(amount), 0) as balance
          FROM user_points
          WHERE user_id = $1
        `;
        
        const balanceResult = await client.query<{ balance: string }>(
          balanceQuery, 
          [fromUserId]
        );
        
        const currentBalance = parseInt(balanceResult.rows[0].balance, 10);
        
        if (currentBalance < amount) {
          throw new Error('Insufficient points balance for transfer');
        }
        
        // Create outgoing transaction
        const fromTransaction = await this.awardPointsWithTransaction(
          client,
          {
            user_id: fromUserId,
            amount: -amount,
            source: 'transfer_out',
            reference_id: toUserId,
            description: description || `Transfer to user ${toUserId}`
          }
        );
        
        // Create incoming transaction
        const toTransaction = await this.awardPointsWithTransaction(
          client,
          {
            user_id: toUserId,
            amount: amount,
            source: 'transfer_in',
            reference_id: fromUserId,
            description: description || `Transfer from user ${fromUserId}`
          }
        );
        
        return { fromTransaction, toTransaction };
      } catch (error) {
        logger.error('Error transferring points between users', { 
          error, 
          fromUserId, 
          toUserId, 
          amount 
        });
        throw error;
      }
    });
  }

  /**
   * Get leaderboard by points earned
   */
  async getPointsLeaderboard(
    options: { 
      timeframe?: 'day' | 'week' | 'month' | 'all'; 
      limit?: number; 
      offset?: number
    } = {}
  ): Promise<any[]> {
    try {
      const { timeframe = 'all', limit = 10, offset = 0 } = options;
      
      let timeConstraint = '';
      if (timeframe === 'day') {
        timeConstraint = 'AND p.created_at >= DATE_TRUNC(\'day\', NOW())';
      } else if (timeframe === 'week') {
        timeConstraint = 'AND p.created_at >= DATE_TRUNC(\'week\', NOW())';
      } else if (timeframe === 'month') {
        timeConstraint = 'AND p.created_at >= DATE_TRUNC(\'month\', NOW())';
      }
      
      const query = `
        SELECT 
          u.id as user_id, 
          u.display_name, 
          pf.avatar_url,
          pf.level,
          COALESCE(SUM(p.amount), 0) as points_total,
          COUNT(DISTINCT CASE WHEN p.amount > 0 THEN p.id END) as transactions_count
        FROM users u
        LEFT JOIN user_points p ON u.id = p.user_id ${timeConstraint}
        LEFT JOIN profiles pf ON u.id = pf.user_id
        WHERE u.status = 'active'
        GROUP BY u.id, u.display_name, pf.avatar_url, pf.level
        ORDER BY points_total DESC
        LIMIT $1 OFFSET $2
      `;
      
      const result = await this.db.query(query, [limit, offset]);
      return result.rows;
    } catch (error) {
      logger.error('Error getting points leaderboard', { error, options });
      throw error;
    }
  }
}
