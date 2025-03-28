/**
 * Points Repository
 * 
 * Repository for managing user points transactions and balances.
 */
import { Pool } from 'pg';
import { BaseRepository } from './base-repository';
import { logger } from '../lib/logger';
import { DatabaseError } from '../errors';

/**
 * Points transaction interface
 */
export interface PointsTransaction {
  id: string;
  user_id: string;
  amount: number;
  source: string;
  reference_id?: string;
  description?: string;
  created_at: Date;
}

/**
 * Points award data interface
 */
export interface PointsAwardData {
  userId: string;
  amount: number;
  source: string;
  referenceId?: string;
  description?: string;
}

/**
 * Points repository implementation
 */
export class PointsRepository extends BaseRepository<PointsTransaction> {
  /**
   * Create a new PointsRepository instance
   * 
   * @param db Database connection pool
   */
  constructor(db: Pool) {
    super(db, 'user_points');
  }

  /**
   * Get a user's total points
   * 
   * @param userId User ID
   * @returns Total points for the user
   */
  async getUserPointsTotal(userId: string): Promise<number> {
    try {
      const result = await this.db.query(
        'SELECT COALESCE(SUM(amount), 0) as total FROM user_points WHERE user_id = $1',
        [userId]
      );
      
      return parseInt(result.rows[0].total, 10);
    } catch (error) {
      logger.error('Failed to get user points total', { userId, error });
      throw new DatabaseError('Failed to get user points total', error);
    }
  }

  /**
   * Get points earned by a user from a specific source on a given day
   * 
   * @param userId User ID
   * @param source Source of points
   * @param date Date to check (defaults to today)
   * @returns Total points earned from the source on the date
   */
  async getDailyPointsBySource(userId: string, source: string, date: Date = new Date()): Promise<number> {
    try {
      // Create date range for the given date (start and end of day)
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      
      const result = await this.db.query(
        'SELECT COALESCE(SUM(amount), 0) as total FROM user_points WHERE user_id = $1 AND source = $2 AND created_at >= $3 AND created_at <= $4 AND amount > 0',
        [userId, source, startOfDay, endOfDay]
      );
      
      return parseInt(result.rows[0].total, 10);
    } catch (error) {
      logger.error('Failed to get daily points by source', { userId, source, date, error });
      throw new DatabaseError('Failed to get daily points by source', error);
    }
  }

  /**
   * Get recent points activity for a user
   * 
   * @param userId User ID
   * @param seconds Number of seconds to look back
   * @returns Total points earned in the time period
   */
  async getRecentPointsActivity(userId: string, seconds: number): Promise<number> {
    try {
      // Calculate time threshold
      const threshold = new Date(Date.now() - seconds * 1000);
      
      const result = await this.db.query(
        'SELECT COALESCE(SUM(amount), 0) as total FROM user_points WHERE user_id = $1 AND created_at >= $2 AND amount > 0',
        [userId, threshold]
      );
      
      return parseInt(result.rows[0].total, 10);
    } catch (error) {
      logger.error('Failed to get recent points activity', { userId, seconds, error });
      throw new DatabaseError('Failed to get recent points activity', error);
    }
  }

  /**
   * Get points transactions for a user
   * 
   * @param userId User ID
   * @param limit Maximum number of transactions to return
   * @param offset Number of transactions to skip
   * @returns Array of points transactions
   */
  async getUserPointsTransactions(userId: string, limit: number = 20, offset: number = 0): Promise<PointsTransaction[]> {
    try {
      const result = await this.db.query<PointsTransaction>(
        'SELECT * FROM user_points WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3',
        [userId, limit, offset]
      );
      
      return result.rows;
    } catch (error) {
      logger.error('Failed to get user points transactions', { userId, limit, offset, error });
      throw new DatabaseError('Failed to get user points transactions', error);
    }
  }

  /**
   * Add a points transaction
   * 
   * @param data Points transaction data
   * @returns Created points transaction
   */
  async addPointsTransaction(data: PointsAwardData): Promise<PointsTransaction> {
    return this.withTransaction(async (client) => {
      try {
        // Insert points transaction
        const result = await client.query<PointsTransaction>(
          `INSERT INTO user_points(
            id, user_id, amount, source, reference_id, description, created_at
          ) VALUES(
            uuid_generate_v4(), $1, $2, $3, $4, $5, NOW()
          ) RETURNING *`,
          [
            data.userId,
            data.amount,
            data.source,
            data.referenceId || null,
            data.description || null,
          ]
        );
        
        // Update user's total points in profile table
        await client.query(
          `UPDATE profiles 
          SET total_points = total_points + $1, 
              updated_at = NOW()
          WHERE user_id = $2`,
          [data.amount, data.userId]
        );
        
        return result.rows[0];
      } catch (error) {
        logger.error('Failed to add points transaction', { data, error });
        throw new DatabaseError('Failed to add points transaction', error);
      }
    });
  }

  /**
   * Deduct points from a user
   * 
   * @param data Points deduction data
   * @returns Points transaction for the deduction
   */
  async deductPoints(data: PointsAwardData): Promise<PointsTransaction> {
    return this.withTransaction(async (client) => {
      try {
        // Ensure amount is negative for deduction
        const deductionAmount = -Math.abs(data.amount);
        
        // Check if user has enough points
        const balanceResult = await client.query(
          'SELECT COALESCE(SUM(amount), 0) as total FROM user_points WHERE user_id = $1',
          [data.userId]
        );
        
        const currentBalance = parseInt(balanceResult.rows[0].total, 10);
        
        if (currentBalance < Math.abs(deductionAmount)) {
          throw new Error(`Insufficient points: ${currentBalance} available, ${Math.abs(deductionAmount)} required`);
        }
        
        // Insert deduction transaction
        const result = await client.query<PointsTransaction>(
          `INSERT INTO user_points(
            id, user_id, amount, source, reference_id, description, created_at
          ) VALUES(
            uuid_generate_v4(), $1, $2, $3, $4, $5, NOW()
          ) RETURNING *`,
          [
            data.userId,
            deductionAmount,
            data.source,
            data.referenceId || null,
            data.description || null,
          ]
        );
        
        // Update user's total points in profile table
        await client.query(
          `UPDATE profiles 
          SET total_points = total_points + $1, 
              updated_at = NOW()
          WHERE user_id = $2`,
          [deductionAmount, data.userId]
        );
        
        return result.rows[0];
      } catch (error) {
        logger.error('Failed to deduct points', { data, error });
        throw new DatabaseError('Failed to deduct points', error);
      }
    });
  }

  /**
   * Transfer points between users
   * 
   * @param fromUserId User ID to transfer from
   * @param toUserId User ID to transfer to
   * @param amount Amount to transfer
   * @param source Source identifier for the transfer
   * @returns Object with both transactions
   */
  async transferPointsBetweenUsers(
    fromUserId: string,
    toUserId: string,
    amount: number,
    source: string
  ): Promise<{ from: PointsTransaction; to: PointsTransaction }> {
    return this.withTransaction(async (client) => {
      try {
        // Check if sender has sufficient balance
        const balanceResult = await client.query(
          'SELECT COALESCE(SUM(amount), 0) as total FROM user_points WHERE user_id = $1',
          [fromUserId]
        );
        
        const currentBalance = parseInt(balanceResult.rows[0].total, 10);
        
        if (currentBalance < amount) {
          throw new Error(`Insufficient points: ${currentBalance} available, ${amount} required`);
        }
        
        // Create deduction transaction for sender
        const fromResult = await client.query<PointsTransaction>(
          `INSERT INTO user_points(
            id, user_id, amount, source, reference_id, description, created_at
          ) VALUES(
            uuid_generate_v4(), $1, $2, $3, $4, $5, NOW()
          ) RETURNING *`,
          [
            fromUserId,
            -amount,
            `${source}_out`,
            toUserId,
            `Transfer to user ${toUserId}`,
          ]
        );
        
        // Create addition transaction for recipient
        const toResult = await client.query<PointsTransaction>(
          `INSERT INTO user_points(
            id, user_id, amount, source, reference_id, description, created_at
          ) VALUES(
            uuid_generate_v4(), $1, $2, $3, $4, $5, NOW()
          ) RETURNING *`,
          [
            toUserId,
            amount,
            `${source}_in`,
            fromUserId,
            `Transfer from user ${fromUserId}`,
          ]
        );
        
        // Update both users' profile points totals
        await client.query(
          `UPDATE profiles 
          SET total_points = total_points - $1, 
              updated_at = NOW()
          WHERE user_id = $2`,
          [amount, fromUserId]
        );
        
        await client.query(
          `UPDATE profiles 
          SET total_points = total_points + $1, 
              updated_at = NOW()
          WHERE user_id = $2`,
          [amount, toUserId]
        );
        
        // Return both transactions
        return {
          from: fromResult.rows[0],
          to: toResult.rows[0],
        };
      } catch (error) {
        logger.error('Failed to transfer points between users', { 
          fromUserId, toUserId, amount, source, error 
        });
        throw new DatabaseError('Failed to transfer points between users', error);
      }
    });
  }
}
