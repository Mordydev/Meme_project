/**
 * Redemption Repository
 * 
 * Repository for managing redemption requests and processing batches.
 */
import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import { BaseRepository } from './base-repository';
import { logger } from '../lib/logger';
import { DatabaseError } from '../errors';
import { 
  Redemption, 
  RedemptionStatus, 
  CreateRedemptionRequestDto, 
  UpdateRedemptionStatusDto,
  RedemptionBatch
} from '../models/entities/redemption.model';

/**
 * Redemption repository implementation
 */
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
   * Create a new redemption request
   * 
   * @param data Redemption request data
   * @returns Created redemption request
   */
  async createRedemptionRequest(data: CreateRedemptionRequestDto): Promise<Redemption> {
    try {
      const result = await this.db.query<Redemption>(
        `INSERT INTO redemptions(
          id, user_id, points_amount, token_amount, wallet_address, status, created_at
        ) VALUES(
          $1, $2, $3, $4, $5, $6, NOW()
        ) RETURNING *`,
        [
          uuidv4(),
          data.userId,
          data.pointsAmount,
          data.pointsAmount / 100, // Convert based on 100 SP = 1 SKC
          data.walletAddress,
          'pending' as RedemptionStatus
        ]
      );
      
      return result.rows[0];
    } catch (error) {
      logger.error('Failed to create redemption request', { data, error });
      throw new DatabaseError('Failed to create redemption request', error);
    }
  }

  /**
   * Get redemption by ID
   * 
   * @param id Redemption ID
   * @returns Redemption or null if not found
   */
  async getRedemptionById(id: string): Promise<Redemption | null> {
    try {
      const result = await this.db.query<Redemption>(
        'SELECT * FROM redemptions WHERE id = $1',
        [id]
      );
      
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Failed to get redemption by ID', { id, error });
      throw new DatabaseError('Failed to get redemption by ID', error);
    }
  }

  /**
   * Update redemption status
   * 
   * @param data Redemption status update data
   * @returns Updated redemption
   */
  async updateRedemptionStatus(data: UpdateRedemptionStatusDto): Promise<Redemption> {
    try {
      let query = `
        UPDATE redemptions 
        SET status = $1, 
            processed_at = $2
      `;
      
      const params: any[] = [
        data.status,
        data.processedAt || new Date()
      ];
      
      // Add transaction hash if provided
      if (data.transactionHash !== undefined) {
        query += `, transaction_hash = $${params.length + 1}`;
        params.push(data.transactionHash);
      }
      
      // Add error message if provided
      if (data.errorMessage !== undefined) {
        query += `, error_message = $${params.length + 1}`;
        params.push(data.errorMessage);
      }
      
      // Add WHERE clause and RETURNING
      query += ` WHERE id = $${params.length + 1} RETURNING *`;
      params.push(data.id);
      
      const result = await this.db.query<Redemption>(query, params);
      
      if (result.rows.length === 0) {
        throw new Error(`Redemption with ID ${data.id} not found`);
      }
      
      return result.rows[0];
    } catch (error) {
      logger.error('Failed to update redemption status', { data, error });
      throw new DatabaseError('Failed to update redemption status', error);
    }
  }

  /**
   * Get user's pending redemptions
   * 
   * @param userId User ID
   * @returns Array of pending redemptions
   */
  async getUserPendingRedemptions(userId: string): Promise<Redemption[]> {
    try {
      const result = await this.db.query<Redemption>(
        "SELECT * FROM redemptions WHERE user_id = $1 AND status = 'pending' ORDER BY created_at DESC",
        [userId]
      );
      
      return result.rows;
    } catch (error) {
      logger.error('Failed to get user pending redemptions', { userId, error });
      throw new DatabaseError('Failed to get user pending redemptions', error);
    }
  }

  /**
   * Get user's redemption history
   * 
   * @param userId User ID
   * @param limit Maximum number of redemptions to return
   * @param offset Number of redemptions to skip
   * @returns Array of redemptions
   */
  async getUserRedemptions(userId: string, limit: number = 20, offset: number = 0): Promise<Redemption[]> {
    try {
      const result = await this.db.query<Redemption>(
        'SELECT * FROM redemptions WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3',
        [userId, limit, offset]
      );
      
      return result.rows;
    } catch (error) {
      logger.error('Failed to get user redemptions', { userId, limit, offset, error });
      throw new DatabaseError('Failed to get user redemptions', error);
    }
  }

  /**
   * Count pending redemptions
   * 
   * @returns Number of pending redemptions
   */
  async countPendingRedemptions(): Promise<number> {
    try {
      const result = await this.db.query<{ count: string }>(
        "SELECT COUNT(*) as count FROM redemptions WHERE status = 'pending'"
      );
      
      return parseInt(result.rows[0].count, 10);
    } catch (error) {
      logger.error('Failed to count pending redemptions', { error });
      throw new DatabaseError('Failed to count pending redemptions', error);
    }
  }

  /**
   * Get pending redemptions for processing
   * 
   * @param limit Maximum number of redemptions to return
   * @returns Array of pending redemptions
   */
  async getPendingRedemptionsForProcessing(limit: number = 100): Promise<Redemption[]> {
    try {
      const result = await this.db.query<Redemption>(
        "SELECT * FROM redemptions WHERE status = 'pending' ORDER BY created_at ASC LIMIT $1",
        [limit]
      );
      
      return result.rows;
    } catch (error) {
      logger.error('Failed to get pending redemptions for processing', { limit, error });
      throw new DatabaseError('Failed to get pending redemptions for processing', error);
    }
  }

  /**
   * Create a redemption batch
   * 
   * @param redemptions Redemptions to include in the batch
   * @returns Created batch with updated redemptions
   */
  async createRedemptionBatch(redemptions: Redemption[]): Promise<{ batch: RedemptionBatch; redemptions: Redemption[] }> {
    return this.withTransaction(async (client) => {
      try {
        if (redemptions.length === 0) {
          throw new Error('Cannot create batch with no redemptions');
        }
        
        // Calculate batch totals
        const totalPoints = redemptions.reduce((sum, r) => sum + r.points_amount, 0);
        const totalTokens = redemptions.reduce((sum, r) => sum + r.token_amount, 0);
        
        // Create batch
        const batchId = uuidv4();
        const batchResult = await client.query<RedemptionBatch>(
          `INSERT INTO redemption_batches(
            id, status, created_at, redemption_count, total_points, total_tokens
          ) VALUES(
            $1, $2, NOW(), $3, $4, $5
          ) RETURNING *`,
          [
            batchId,
            'pending',
            redemptions.length,
            totalPoints,
            totalTokens
          ]
        );
        
        const batch = batchResult.rows[0];
        
        // Update redemptions with batch ID and status
        const updatedRedemptions: Redemption[] = [];
        
        for (const redemption of redemptions) {
          const updateResult = await client.query<Redemption>(
            `UPDATE redemptions 
            SET batch_id = $1, status = $2 
            WHERE id = $3 
            RETURNING *`,
            [batchId, 'processing', redemption.id]
          );
          
          updatedRedemptions.push(updateResult.rows[0]);
        }
        
        return { batch, redemptions: updatedRedemptions };
      } catch (error) {
        logger.error('Failed to create redemption batch', { redemptionCount: redemptions.length, error });
        throw new DatabaseError('Failed to create redemption batch', error);
      }
    });
  }

  /**
   * Update batch status and all its redemptions
   * 
   * @param batchId Batch ID
   * @param status New status
   * @param transactionHash Optional transaction hash
   * @param errorMessage Optional error message
   * @returns Updated batch
   */
  async updateBatchStatus(
    batchId: string, 
    status: RedemptionStatus, 
    transactionHash?: string | null, 
    errorMessage?: string | null
  ): Promise<RedemptionBatch> {
    return this.withTransaction(async (client) => {
      try {
        // Update batch status
        const batchResult = await client.query<RedemptionBatch>(
          `UPDATE redemption_batches 
          SET status = $1, processed_at = NOW() 
          WHERE id = $2 
          RETURNING *`,
          [status, batchId]
        );
        
        if (batchResult.rows.length === 0) {
          throw new Error(`Batch with ID ${batchId} not found`);
        }
        
        // Update all redemptions in the batch
        await client.query(
          `UPDATE redemptions 
          SET status = $1, 
              processed_at = NOW(), 
              transaction_hash = $2, 
              error_message = $3 
          WHERE batch_id = $4`,
          [status, transactionHash, errorMessage, batchId]
        );
        
        return batchResult.rows[0];
      } catch (error) {
        logger.error('Failed to update batch status', { batchId, status, error });
        throw new DatabaseError('Failed to update batch status', error);
      }
    });
  }
}
