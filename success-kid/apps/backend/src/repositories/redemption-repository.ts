/**
 * Redemption Repository
 * 
 * Handles data access for redemption records and transactions.
 */
import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import { BaseRepository } from './base-repository';
import {
  Redemption,
  CreateRedemptionDto,
  UpdateRedemptionDto,
  RedemptionStatus,
  RedemptionFilterOptions,
  RedemptionTransaction
} from '../models/entities/redemption.model';
import { logger } from '../lib/logger';
import { DatabaseError, NotFoundError } from '../errors';

export class RedemptionRepository extends BaseRepository<Redemption> {
  /**
   * Create a new RedemptionRepository instance
   * 
   * @param db Database connection pool
   */
  constructor(db: Pool) {
    super(db, 'redemptions');
  }

  /**
   * Create a new redemption record
   * 
   * @param data Redemption data
   * @returns Created redemption record
   */
  async createRedemption(data: CreateRedemptionDto): Promise<Redemption> {
    return this.withTransaction(async (client) => {
      try {
        // Calculate token amount based on points (100 SP = 1 SKC)
        const tokenAmount = data.points_amount / 100;

        const result = await client.query<Redemption>(`
          INSERT INTO redemptions(
            id, user_id, points_amount, token_amount, wallet_address,
            status, created_at, reference_id
          ) VALUES(
            $1, $2, $3, $4, $5, $6, $7, $8
          ) RETURNING *
        `, [
          uuidv4(),
          data.user_id,
          data.points_amount,
          tokenAmount,
          data.wallet_address,
          'pending',
          new Date(),
          data.reference_id || null
        ]);

        return this.mapToEntity(result.rows[0]);
      } catch (error) {
        logger.error('Failed to create redemption record', { data, error });
        throw new DatabaseError('Failed to create redemption record', error);
      }
    });
  }

  /**
   * Find redemption by ID
   * 
   * @param id Redemption ID
   * @returns Redemption record or null if not found
   */
  async findById(id: string): Promise<Redemption | null> {
    try {
      const result = await this.db.query<Redemption>(`
        SELECT * FROM redemptions
        WHERE id = $1
      `, [id]);

      return result.rows.length > 0 ? this.mapToEntity(result.rows[0]) : null;
    } catch (error) {
      logger.error('Failed to find redemption by ID', { id, error });
      throw new DatabaseError('Failed to find redemption by ID', error);
    }
  }

  /**
   * Update redemption status
   * 
   * @param id Redemption ID
   * @param status New status
   * @param data Additional data to update
   * @returns Updated redemption record
   */
  async updateRedemptionStatus(
    id: string,
    status: RedemptionStatus,
    data: Partial<UpdateRedemptionDto> = {}
  ): Promise<Redemption> {
    return this.withTransaction(async (client) => {
      try {
        // Build dynamic query parts
        let setClauses = ['status = $1'];
        const params: any[] = [status];
        let paramIndex = 2;

        if (status === 'processing') {
          setClauses.push(`processed_at = $${paramIndex}`);
          params.push(data.processed_at || new Date());
          paramIndex++;
        }

        if (status === 'completed') {
          setClauses.push(`completed_at = $${paramIndex}`);
          params.push(data.completed_at || new Date());
          paramIndex++;
        }

        if (data.transaction_hash) {
          setClauses.push(`transaction_hash = $${paramIndex}`);
          params.push(data.transaction_hash);
          paramIndex++;
        }

        if (data.error) {
          setClauses.push(`error = $${paramIndex}`);
          params.push(data.error);
          paramIndex++;
        }

        if (data.metadata) {
          setClauses.push(`metadata = $${paramIndex}`);
          params.push(data.metadata);
          paramIndex++;
        }

        // Add ID as the last parameter
        params.push(id);

        const result = await client.query<Redemption>(`
          UPDATE redemptions
          SET ${setClauses.join(', ')}
          WHERE id = $${paramIndex}
          RETURNING *
        `, params);

        if (result.rows.length === 0) {
          throw new NotFoundError('Redemption not found');
        }

        return this.mapToEntity(result.rows[0]);
      } catch (error) {
        logger.error('Failed to update redemption status', { id, status, data, error });
        if (error instanceof NotFoundError) {
          throw error;
        }
        throw new DatabaseError('Failed to update redemption status', error);
      }
    });
  }

  /**
   * Update transaction hash
   * 
   * @param id Redemption ID
   * @param transactionHash Blockchain transaction hash
   * @returns Updated redemption record
   */
  async updateTransactionHash(id: string, transactionHash: string): Promise<Redemption> {
    try {
      const result = await this.db.query<Redemption>(`
        UPDATE redemptions
        SET transaction_hash = $1
        WHERE id = $2
        RETURNING *
      `, [transactionHash, id]);

      if (result.rows.length === 0) {
        throw new NotFoundError('Redemption not found');
      }

      return this.mapToEntity(result.rows[0]);
    } catch (error) {
      logger.error('Failed to update transaction hash', { id, transactionHash, error });
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new DatabaseError('Failed to update transaction hash', error);
    }
  }

  /**
   * Find redemptions by user ID
   * 
   * @param userId User ID
   * @param limit Maximum number of records
   * @param offset Number of records to skip
   * @returns Array of redemption records
   */
  async findByUserId(userId: string, limit: number = 20, offset: number = 0): Promise<Redemption[]> {
    try {
      const result = await this.db.query<Redemption>(`
        SELECT * FROM redemptions
        WHERE user_id = $1
        ORDER BY created_at DESC
        LIMIT $2 OFFSET $3
      `, [userId, limit, offset]);

      return result.rows.map(row => this.mapToEntity(row));
    } catch (error) {
      logger.error('Failed to find redemptions by user ID', { userId, limit, offset, error });
      throw new DatabaseError('Failed to find redemptions by user ID', error);
    }
  }

  /**
   * Count redemptions by user ID
   * 
   * @param userId User ID
   * @returns Number of redemption records
   */
  async countByUserId(userId: string): Promise<number> {
    try {
      const result = await this.db.query(`
        SELECT COUNT(*) as count FROM redemptions
        WHERE user_id = $1
      `, [userId]);

      return parseInt(result.rows[0].count);
    } catch (error) {
      logger.error('Failed to count redemptions by user ID', { userId, error });
      throw new DatabaseError('Failed to count redemptions by user ID', error);
    }
  }

  /**
   * Find redemptions by status
   * 
   * @param status Redemption status
   * @param limit Maximum number of records
   * @param offset Number of records to skip
   * @returns Array of redemption records
   */
  async findByStatus(status: RedemptionStatus, limit: number = 20, offset: number = 0): Promise<Redemption[]> {
    try {
      const result = await this.db.query<Redemption>(`
        SELECT * FROM redemptions
        WHERE status = $1
        ORDER BY created_at ASC
        LIMIT $2 OFFSET $3
      `, [status, limit, offset]);

      return result.rows.map(row => this.mapToEntity(row));
    } catch (error) {
      logger.error('Failed to find redemptions by status', { status, limit, offset, error });
      throw new DatabaseError('Failed to find redemptions by status', error);
    }
  }

  /**
   * Count redemptions by status
   * 
   * @param status Redemption status
   * @returns Number of redemption records
   */
  async countByStatus(status: RedemptionStatus): Promise<number> {
    try {
      const result = await this.db.query(`
        SELECT COUNT(*) as count FROM redemptions
        WHERE status = $1
      `, [status]);

      return parseInt(result.rows[0].count);
    } catch (error) {
      logger.error('Failed to count redemptions by status', { status, error });
      throw new DatabaseError('Failed to count redemptions by status', error);
    }
  }

  /**
   * Get weekly redemption total for a user
   * 
   * @param userId User ID
   * @param startDate Start of week date
   * @param endDate End of week date
   * @returns Total points redeemed in the given week
   */
  async getWeeklyRedemptionTotal(
    userId: string,
    startDate: Date = this.getStartOfWeek(),
    endDate: Date = this.getEndOfWeek()
  ): Promise<number> {
    try {
      const result = await this.db.query(`
        SELECT COALESCE(SUM(points_amount), 0) as total
        FROM redemptions
        WHERE user_id = $1
        AND created_at >= $2
        AND created_at <= $3
        AND status != 'cancelled'
      `, [userId, startDate, endDate]);

      return parseInt(result.rows[0].total);
    } catch (error) {
      logger.error('Failed to get weekly redemption total', { userId, startDate, endDate, error });
      throw new DatabaseError('Failed to get weekly redemption total', error);
    }
  }

  /**
   * Find redemptions with filter options
   * 
   * @param options Filter options
   * @returns Array of redemption records
   */
  async findWithFilters(options: RedemptionFilterOptions): Promise<Redemption[]> {
    try {
      // Build WHERE clause
      const conditions: string[] = [];
      const params: any[] = [];
      let paramIndex = 1;

      if (options.user_id) {
        conditions.push(`user_id = $${paramIndex++}`);
        params.push(options.user_id);
      }

      if (options.status && options.status.length > 0) {
        conditions.push(`status = ANY($${paramIndex++})`);
        params.push(options.status);
      }

      if (options.from_date) {
        conditions.push(`created_at >= $${paramIndex++}`);
        params.push(options.from_date);
      }

      if (options.to_date) {
        conditions.push(`created_at <= $${paramIndex++}`);
        params.push(options.to_date);
      }

      if (options.min_points) {
        conditions.push(`points_amount >= $${paramIndex++}`);
        params.push(options.min_points);
      }

      if (options.max_points) {
        conditions.push(`points_amount <= $${paramIndex++}`);
        params.push(options.max_points);
      }

      if (options.wallet_address) {
        conditions.push(`wallet_address = $${paramIndex++}`);
        params.push(options.wallet_address);
      }

      if (options.transaction_hash) {
        conditions.push(`transaction_hash = $${paramIndex++}`);
        params.push(options.transaction_hash);
      }

      // Build WHERE clause
      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

      // Build query
      const offset = (options.page - 1) * options.limit;
      const sortDirection = options.sort_direction.toUpperCase();

      const query = `
        SELECT * FROM redemptions
        ${whereClause}
        ORDER BY ${options.sort_by} ${sortDirection}
        LIMIT $${paramIndex++} OFFSET $${paramIndex++}
      `;

      params.push(options.limit, offset);

      const result = await this.db.query<Redemption>(query, params);
      return result.rows.map(row => this.mapToEntity(row));
    } catch (error) {
      logger.error('Failed to find redemptions with filters', { options, error });
      throw new DatabaseError('Failed to find redemptions with filters', error);
    }
  }

  /**
   * Count redemptions with filter options
   * 
   * @param options Filter options
   * @returns Number of matching records
   */
  async countWithFilters(options: Omit<RedemptionFilterOptions, 'page' | 'limit' | 'sort_by' | 'sort_direction'>): Promise<number> {
    try {
      // Build WHERE clause
      const conditions: string[] = [];
      const params: any[] = [];
      let paramIndex = 1;

      if (options.user_id) {
        conditions.push(`user_id = $${paramIndex++}`);
        params.push(options.user_id);
      }

      if (options.status && options.status.length > 0) {
        conditions.push(`status = ANY($${paramIndex++})`);
        params.push(options.status);
      }

      if (options.from_date) {
        conditions.push(`created_at >= $${paramIndex++}`);
        params.push(options.from_date);
      }

      if (options.to_date) {
        conditions.push(`created_at <= $${paramIndex++}`);
        params.push(options.to_date);
      }

      if (options.min_points) {
        conditions.push(`points_amount >= $${paramIndex++}`);
        params.push(options.min_points);
      }

      if (options.max_points) {
        conditions.push(`points_amount <= $${paramIndex++}`);
        params.push(options.max_points);
      }

      if (options.wallet_address) {
        conditions.push(`wallet_address = $${paramIndex++}`);
        params.push(options.wallet_address);
      }

      if (options.transaction_hash) {
        conditions.push(`transaction_hash = $${paramIndex++}`);
        params.push(options.transaction_hash);
      }

      // Build WHERE clause
      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

      const query = `
        SELECT COUNT(*) as count FROM redemptions
        ${whereClause}
      `;

      const result = await this.db.query(query, params);
      return parseInt(result.rows[0].count);
    } catch (error) {
      logger.error('Failed to count redemptions with filters', { options, error });
      throw new DatabaseError('Failed to count redemptions with filters', error);
    }
  }

  /**
   * Create a redemption transaction record
   * 
   * @param redemptionId Redemption ID
   * @returns Created transaction record
   */
  async createRedemptionTransaction(redemptionId: string): Promise<RedemptionTransaction> {
    try {
      const result = await this.db.query<RedemptionTransaction>(`
        INSERT INTO redemption_transactions(
          id, redemption_id, status, attempts, created_at
        ) VALUES(
          $1, $2, $3, $4, $5
        ) RETURNING *
      `, [
        uuidv4(),
        redemptionId,
        'pending',
        0,
        new Date()
      ]);

      return result.rows[0];
    } catch (error) {
      logger.error('Failed to create redemption transaction', { redemptionId, error });
      throw new DatabaseError('Failed to create redemption transaction', error);
    }
  }

  /**
   * Update a redemption transaction
   * 
   * @param id Transaction ID
   * @param data Update data
   * @returns Updated transaction
   */
  async updateRedemptionTransaction(
    id: string,
    data: Partial<RedemptionTransaction>
  ): Promise<RedemptionTransaction> {
    try {
      // Build SET clause dynamically
      const setClauses: string[] = [];
      const params: any[] = [];
      let paramIndex = 1;

      if (data.status) {
        setClauses.push(`status = $${paramIndex++}`);
        params.push(data.status);
      }

      if (data.transaction_hash) {
        setClauses.push(`transaction_hash = $${paramIndex++}`);
        params.push(data.transaction_hash);
      }

      if (data.attempts !== undefined) {
        setClauses.push(`attempts = $${paramIndex++}`);
        params.push(data.attempts);
      }

      setClauses.push(`last_attempt = $${paramIndex++}`);
      params.push(data.last_attempt || new Date());

      if (data.completed_at) {
        setClauses.push(`completed_at = $${paramIndex++}`);
        params.push(data.completed_at);
      }

      if (data.error) {
        setClauses.push(`error = $${paramIndex++}`);
        params.push(data.error);
      }

      // Add ID as the last parameter
      params.push(id);

      const query = `
        UPDATE redemption_transactions
        SET ${setClauses.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING *
      `;

      const result = await this.db.query<RedemptionTransaction>(query, params);

      if (result.rows.length === 0) {
        throw new NotFoundError('Redemption transaction not found');
      }

      return result.rows[0];
    } catch (error) {
      logger.error('Failed to update redemption transaction', { id, data, error });
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new DatabaseError('Failed to update redemption transaction', error);
    }
  }

  /**
   * Find pending transactions ready for processing
   * 
   * @param limit Maximum number of transactions
   * @returns Array of pending transactions
   */
  async findPendingTransactions(limit: number = 10): Promise<RedemptionTransaction[]> {
    try {
      const result = await this.db.query<RedemptionTransaction>(`
        SELECT t.* FROM redemption_transactions t
        JOIN redemptions r ON t.redemption_id = r.id
        WHERE t.status = 'pending'
        AND r.status = 'processing'
        ORDER BY t.created_at ASC
        LIMIT $1
      `, [limit]);

      return result.rows;
    } catch (error) {
      logger.error('Failed to find pending transactions', { limit, error });
      throw new DatabaseError('Failed to find pending transactions', error);
    }
  }

  /**
   * Find transactions that need retry
   * 
   * @param maxAttempts Maximum number of attempts before giving up
   * @param limit Maximum number of transactions to return
   * @returns Array of transactions to retry
   */
  async findTransactionsForRetry(maxAttempts: number = 3, limit: number = 10): Promise<RedemptionTransaction[]> {
    try {
      // Find transactions that failed but haven't exceeded max attempts
      const result = await this.db.query<RedemptionTransaction>(`
        SELECT t.* FROM redemption_transactions t
        JOIN redemptions r ON t.redemption_id = r.id
        WHERE t.status = 'failed'
        AND t.attempts < $1
        AND r.status = 'processing'
        ORDER BY t.last_attempt ASC
        LIMIT $2
      `, [maxAttempts, limit]);

      return result.rows;
    } catch (error) {
      logger.error('Failed to find transactions for retry', { maxAttempts, limit, error });
      throw new DatabaseError('Failed to find transactions for retry', error);
    }
  }

  /**
   * Get start of current week
   * 
   * @returns Date representing start of week (Sunday)
   */
  private getStartOfWeek(): Date {
    const date = new Date();
    const day = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const diff = date.getDate() - day;
    
    const startOfWeek = new Date(date);
    startOfWeek.setDate(diff);
    startOfWeek.setHours(0, 0, 0, 0);
    
    return startOfWeek;
  }

  /**
   * Get end of current week
   * 
   * @returns Date representing end of week (Saturday)
   */
  private getEndOfWeek(): Date {
    const startOfWeek = this.getStartOfWeek();
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);
    
    return endOfWeek;
  }

  /**
   * Map database row to entity
   * 
   * @param row Database row
   * @returns Mapped entity
   */
  protected mapToEntity(row: Record<string, any>): Redemption {
    return {
      id: row.id,
      user_id: row.user_id,
      points_amount: parseFloat(row.points_amount),
      token_amount: parseFloat(row.token_amount),
      wallet_address: row.wallet_address,
      status: row.status,
      transaction_hash: row.transaction_hash,
      created_at: row.created_at,
      processed_at: row.processed_at,
      completed_at: row.completed_at,
      error: row.error,
      reference_id: row.reference_id,
      metadata: row.metadata || {}
    };
  }
}
