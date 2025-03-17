/**
 * Redemption Repository
 * 
 * Handles data access for redemption transactions
 */
import { Pool, PoolClient } from 'pg';
import { BaseRepository } from './base-repository';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../lib/logger';
import { RedemptionRecord, RedemptionStatus } from '../services/points/redemption-service';

export interface CreateRedemptionDto {
  user_id: string;
  points_amount: number;
  token_amount: number;
  wallet_address: string;
  status: string;
  transaction_hash?: string;
  failure_reason?: string;
  metadata?: Record<string, any>;
}

export interface UpdateRedemptionDto {
  status?: string;
  processed_at?: Date;
  transaction_hash?: string;
  failure_reason?: string;
  metadata?: Record<string, any>;
}

export interface RedemptionQuery {
  userId?: string;
  status?: RedemptionStatus | RedemptionStatus[];
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}

/**
 * Repository for redemption transactions
 */
export class RedemptionRepository extends BaseRepository<RedemptionRecord> {
  constructor(db: Pool) {
    super(db, 'redemptions', 'id');
  }

  /**
   * Create a new redemption record
   */
  async createRedemption(data: CreateRedemptionDto): Promise<RedemptionRecord> {
    try {
      const id = uuidv4();
      const currentDate = new Date();
      
      const query = `
        INSERT INTO redemptions (
          id, 
          user_id, 
          points_amount, 
          token_amount, 
          wallet_address, 
          status, 
          requested_at,
          transaction_hash,
          failure_reason,
          metadata
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *
      `;
      
      const result = await this.db.query(query, [
        id,
        data.user_id,
        data.points_amount,
        data.token_amount,
        data.wallet_address,
        data.status,
        currentDate,
        data.transaction_hash || null,
        data.failure_reason || null,
        data.metadata ? JSON.stringify(data.metadata) : null
      ]);
      
      const redemption = this.mapDbRecordToRedemption(result.rows[0]);
      
      logger.info('Created redemption record', { 
        id, 
        userId: data.user_id,
        pointsAmount: data.points_amount,
        tokenAmount: data.token_amount 
      });
      
      return redemption;
    } catch (error) {
      logger.error('Error creating redemption record', { error, data });
      throw error;
    }
  }

  /**
   * Create redemption with transaction
   */
  async createRedemptionWithTransaction(
    client: PoolClient,
    data: CreateRedemptionDto
  ): Promise<RedemptionRecord> {
    try {
      const id = uuidv4();
      const currentDate = new Date();
      
      const query = `
        INSERT INTO redemptions (
          id, 
          user_id, 
          points_amount, 
          token_amount, 
          wallet_address, 
          status, 
          requested_at,
          transaction_hash,
          failure_reason,
          metadata
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *
      `;
      
      const result = await client.query(query, [
        id,
        data.user_id,
        data.points_amount,
        data.token_amount,
        data.wallet_address,
        data.status,
        currentDate,
        data.transaction_hash || null,
        data.failure_reason || null,
        data.metadata ? JSON.stringify(data.metadata) : null
      ]);
      
      return this.mapDbRecordToRedemption(result.rows[0]);
    } catch (error) {
      logger.error('Error creating redemption with transaction', { error, data });
      throw error;
    }
  }

  /**
   * Update a redemption record
   */
  async updateRedemption(id: string, data: UpdateRedemptionDto): Promise<RedemptionRecord> {
    try {
      // Build the SET clause dynamically based on what's provided
      const updateFields: string[] = [];
      const values: any[] = [];
      let valueIndex = 1;
      
      // Add fields that are provided
      if (data.status !== undefined) {
        updateFields.push(`status = $${valueIndex++}`);
        values.push(data.status);
      }
      
      if (data.processed_at !== undefined) {
        updateFields.push(`processed_at = $${valueIndex++}`);
        values.push(data.processed_at);
      }
      
      if (data.transaction_hash !== undefined) {
        updateFields.push(`transaction_hash = $${valueIndex++}`);
        values.push(data.transaction_hash);
      }
      
      if (data.failure_reason !== undefined) {
        updateFields.push(`failure_reason = $${valueIndex++}`);
        values.push(data.failure_reason);
      }
      
      if (data.metadata !== undefined) {
        updateFields.push(`metadata = $${valueIndex++}`);
        values.push(JSON.stringify(data.metadata));
      }
      
      // Add updated_at timestamp
      updateFields.push(`updated_at = $${valueIndex++}`);
      values.push(new Date());
      
      // Add ID as the last parameter
      values.push(id);
      
      // Construct and execute the query if there are fields to update
      if (updateFields.length === 0) {
        throw new Error('No fields provided for update');
      }
      
      const query = `
        UPDATE redemptions
        SET ${updateFields.join(', ')}
        WHERE id = $${valueIndex}
        RETURNING *
      `;
      
      const result = await this.db.query(query, values);
      
      if (result.rows.length === 0) {
        throw new Error(`Redemption record not found with ID: ${id}`);
      }
      
      return this.mapDbRecordToRedemption(result.rows[0]);
    } catch (error) {
      logger.error('Error updating redemption record', { error, id, data });
      throw error;
    }
  }

  /**
   * Update redemption status
   */
  async updateStatus(
    id: string, 
    status: RedemptionStatus, 
    options: { 
      transactionHash?: string; 
      failureReason?: string;
      processedAt?: Date;
    } = {}
  ): Promise<RedemptionRecord> {
    try {
      const updateData: UpdateRedemptionDto = { status };
      
      if (options.transactionHash) {
        updateData.transaction_hash = options.transactionHash;
      }
      
      if (options.failureReason) {
        updateData.failure_reason = options.failureReason;
      }
      
      if (options.processedAt || status === RedemptionStatus.COMPLETED || status === RedemptionStatus.FAILED) {
        updateData.processed_at = options.processedAt || new Date();
      }
      
      return this.updateRedemption(id, updateData);
    } catch (error) {
      logger.error('Error updating redemption status', { error, id, status, options });
      throw error;
    }
  }

  /**
   * Update transaction hash
   */
  async updateTransactionHash(id: string, transactionHash: string): Promise<RedemptionRecord> {
    try {
      return this.updateRedemption(id, { transaction_hash: transactionHash });
    } catch (error) {
      logger.error('Error updating transaction hash', { error, id, transactionHash });
      throw error;
    }
  }

  /**
   * Find redemption by ID
   */
  async findById(id: string): Promise<RedemptionRecord | null> {
    try {
      const query = `
        SELECT * FROM redemptions WHERE id = $1
      `;
      
      const result = await this.db.query(query, [id]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return this.mapDbRecordToRedemption(result.rows[0]);
    } catch (error) {
      logger.error('Error finding redemption by ID', { error, id });
      throw error;
    }
  }

  /**
   * Find redemptions by user ID
   */
  async findByUserId(
    userId: string, 
    options: { 
      status?: RedemptionStatus | RedemptionStatus[];
      limit?: number;
      offset?: number;
      sortBy?: string;
      sortDirection?: 'asc' | 'desc';
    } = {}
  ): Promise<RedemptionRecord[]> {
    try {
      const { 
        status, 
        limit = 20, 
        offset = 0, 
        sortBy = 'requested_at', 
        sortDirection = 'desc' 
      } = options;
      
      let query = `SELECT * FROM redemptions WHERE user_id = $1`;
      const queryParams: any[] = [userId];
      let paramIndex = 2;
      
      // Add status filter if provided
      if (status) {
        if (Array.isArray(status)) {
          query += ` AND status IN (${status.map((_, i) => `$${paramIndex + i}`).join(', ')})`;
          queryParams.push(...status);
          paramIndex += status.length;
        } else {
          query += ` AND status = $${paramIndex}`;
          queryParams.push(status);
          paramIndex += 1;
        }
      }
      
      // Add sorting
      query += ` ORDER BY ${sortBy} ${sortDirection === 'asc' ? 'ASC' : 'DESC'}`;
      
      // Add pagination
      query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      queryParams.push(limit, offset);
      
      const result = await this.db.query(query, queryParams);
      
      return result.rows.map(row => this.mapDbRecordToRedemption(row));
    } catch (error) {
      logger.error('Error finding redemptions by user ID', { error, userId, options });
      throw error;
    }
  }

  /**
   * Find redemptions by query parameters
   */
  async findByQuery(query: RedemptionQuery): Promise<RedemptionRecord[]> {
    try {
      const { 
        userId, 
        status, 
        startDate, 
        endDate, 
        limit = 20, 
        offset = 0, 
        sortBy = 'requested_at', 
        sortDirection = 'desc' 
      } = query;
      
      let sqlQuery = `SELECT * FROM redemptions WHERE 1=1`;
      const queryParams: any[] = [];
      let paramIndex = 1;
      
      // Add filters
      if (userId) {
        sqlQuery += ` AND user_id = $${paramIndex++}`;
        queryParams.push(userId);
      }
      
      if (status) {
        if (Array.isArray(status)) {
          sqlQuery += ` AND status IN (${status.map((_, i) => `$${paramIndex + i}`).join(', ')})`;
          queryParams.push(...status);
          paramIndex += status.length;
        } else {
          sqlQuery += ` AND status = $${paramIndex++}`;
          queryParams.push(status);
        }
      }
      
      if (startDate) {
        sqlQuery += ` AND requested_at >= $${paramIndex++}`;
        queryParams.push(startDate);
      }
      
      if (endDate) {
        sqlQuery += ` AND requested_at <= $${paramIndex++}`;
        queryParams.push(endDate);
      }
      
      // Add sorting
      sqlQuery += ` ORDER BY ${sortBy} ${sortDirection === 'asc' ? 'ASC' : 'DESC'}`;
      
      // Add pagination
      sqlQuery += ` LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
      queryParams.push(limit, offset);
      
      const result = await this.db.query(sqlQuery, queryParams);
      
      return result.rows.map(row => this.mapDbRecordToRedemption(row));
    } catch (error) {
      logger.error('Error finding redemptions by query', { error, query });
      throw error;
    }
  }

  /**
   * Count redemptions by query parameters
   */
  async countByQuery(query: Omit<RedemptionQuery, 'limit' | 'offset' | 'sortBy' | 'sortDirection'>): Promise<number> {
    try {
      const { userId, status, startDate, endDate } = query;
      
      let sqlQuery = `SELECT COUNT(*) as count FROM redemptions WHERE 1=1`;
      const queryParams: any[] = [];
      let paramIndex = 1;
      
      // Add filters
      if (userId) {
        sqlQuery += ` AND user_id = $${paramIndex++}`;
        queryParams.push(userId);
      }
      
      if (status) {
        if (Array.isArray(status)) {
          sqlQuery += ` AND status IN (${status.map((_, i) => `$${paramIndex + i}`).join(', ')})`;
          queryParams.push(...status);
          paramIndex += status.length;
        } else {
          sqlQuery += ` AND status = $${paramIndex++}`;
          queryParams.push(status);
        }
      }
      
      if (startDate) {
        sqlQuery += ` AND requested_at >= $${paramIndex++}`;
        queryParams.push(startDate);
      }
      
      if (endDate) {
        sqlQuery += ` AND requested_at <= $${paramIndex++}`;
        queryParams.push(endDate);
      }
      
      const result = await this.db.query(sqlQuery, queryParams);
      
      return parseInt(result.rows[0].count, 10);
    } catch (error) {
      logger.error('Error counting redemptions by query', { error, query });
      throw error;
    }
  }

  /**
   * Map database record to RedemptionRecord
   */
  private mapDbRecordToRedemption(row: any): RedemptionRecord {
    return {
      id: row.id,
      userId: row.user_id,
      pointsAmount: row.points_amount,
      tokenAmount: row.token_amount,
      walletAddress: row.wallet_address,
      status: row.status as RedemptionStatus,
      requestedAt: row.requested_at,
      processedAt: row.processed_at,
      transactionHash: row.transaction_hash,
      failureReason: row.failure_reason,
      metadata: row.metadata ? JSON.parse(row.metadata) : null
    };
  }
}
