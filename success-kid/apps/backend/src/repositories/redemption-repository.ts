/**
 * Redemption Repository
 *
 * Repository for managing redemption requests and processing batches.
 */
import { v4 as uuidv4 } from 'uuid';
import { eq, and, inArray, sql } from 'drizzle-orm';
import { BaseRepository } from './base-repository';
import { logger } from '../lib/logger';
// Removed DatabaseError import - use this.wrapError from BaseRepository
import { db } from '../database';
import { redemptions, redemptionBatches } from '../database/schema';
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
export class RedemptionRepository extends BaseRepository<Redemption, typeof redemptions> {
  /**
   * Create a new RedemptionRepository instance
   */
  constructor() {
    // Pass the table schema (camelCase) and the ID column to the base constructor
    super(redemptions, redemptions.id);
  }

  // Implement the abstract mapToEntity method
  protected mapToEntity(record: Record<string, any>): Redemption {
    // Assume Drizzle returns objects matching the camelCase schema definition.
    // Perform casting to the Redemption type.
    // Let BaseRepository handle potential type issues if Drizzle returns something unexpected.
    return record as Redemption;
  }

  // Map RedemptionBatch type (camelCase) from database record (camelCase from Drizzle)
  protected mapBatchToEntity(record: Record<string, any>): RedemptionBatch {
     // Assume Drizzle returns objects matching the camelCase schema definition.
     return record as RedemptionBatch;
  }


  /**
   * Create a new redemption request
   *
   * @param data Redemption request data
   * @returns Created redemption request
   */
  async createRedemptionRequest(data: CreateRedemptionRequestDto): Promise<Redemption> {
    try {
      // Use Drizzle's insert method with camelCase keys matching the schema
      const results = await db.insert(this.table)
        .values({
          // id handled by defaultRandom()
          userId: data.userId,
          pointsAmount: data.pointsAmount,
          tokenAmount: data.pointsAmount / 100, // Conversion logic
          walletAddress: data.walletAddress,
          status: 'pending' as RedemptionStatus,
          // createdAt handled by defaultNow()
        })
        .returning();

      if (results.length === 0) {
        throw new Error('Redemption creation failed, no result returned.');
      }
      // Drizzle's returning() should give an object matching the schema (camelCase)
      // BaseRepository expects the raw record, mapping happens there if needed by findById/findMany
      // However, since we return directly here, map it.
      return this.mapToEntity(results[0]);
    } catch (error) {
      this.logError('createRedemptionRequest', error, { data });
      throw this.wrapError('Failed to create redemption request', error);
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
      // Use camelCase keys matching the schema for updateData
      const updateData: Partial<typeof this.table.$inferInsert> = {
        status: data.status,
        processedAt: data.processedAt || new Date(),
      };

      // Use camelCase keys matching the schema
      if (data.transactionHash !== undefined) {
        updateData.transactionHash = data.transactionHash;
      }
      if (data.errorMessage !== undefined) {
        updateData.errorMessage = data.errorMessage;
      }

      // Use the base repository's update method
      const updatedEntity = await this.update(data.id, updateData);

      if (!updatedEntity) {
        // Base repository update returns null if not found
        throw new Error(`Redemption with ID ${data.id} not found or failed to update`);
      }

      // BaseRepository.update already calls mapToEntity
      return updatedEntity;
    } catch (error) {
      this.logError('updateRedemptionStatus', error, { data });
      throw this.wrapError('Failed to update redemption status', error);
    }
  }

  /**
   * Get user's pending redemptions
   *
   * @param userId User ID
   * @returns Array of pending redemptions
   */
  async getUserPendingRedemptions(userId: string): Promise<Redemption[]> {
    // Use the base repository's findMany method with camelCase filter/orderBy keys
    // Cast filter to Partial<TEntity> which is Redemption (camelCase)
    return this.findMany({
      filter: { userId: userId, status: 'pending' } as Partial<Redemption>,
      orderBy: 'created_at', // Use snake_case based on TS error
      orderDir: 'desc'
    });
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
     // Use the base repository's findMany method with camelCase filter/orderBy keys
     // Cast filter to Partial<TEntity> which is Redemption (camelCase)
    return this.findMany({
      filter: { userId: userId } as Partial<Redemption>,
      orderBy: 'created_at', // Use snake_case based on TS error
      orderDir: 'desc',
      limit: limit,
      offset: offset
    });
  }

  /**
   * Count pending redemptions
   *
   * @returns Number of pending redemptions
   */
  async countPendingRedemptions(): Promise<number> {
    // Use the base repository's count method with camelCase filter keys
    // Cast filter to Partial<TEntity> which is Redemption (camelCase)
    return this.count({ status: 'pending' } as Partial<Redemption>);
  }

  /**
   * Get pending redemptions for processing
   *
   * @param limit Maximum number of redemptions to return
   * @returns Array of pending redemptions
   */
  async getPendingRedemptionsForProcessing(limit: number = 100): Promise<Redemption[]> {
    // Use the base repository's findMany method with camelCase filter/orderBy keys
    // Cast filter to Partial<TEntity> which is Redemption (camelCase)
    return this.findMany({
      filter: { status: 'pending' } as Partial<Redemption>,
      orderBy: 'created_at', // Use snake_case based on TS error
      orderDir: 'asc',
      limit: limit
    });
  }

  /**
   * Create a redemption batch
   *
   * @param redemptionEntities Redemptions to include in the batch (typed as Redemption[], so camelCase)
   * @returns Created batch with updated redemptions
   */
  async createRedemptionBatch(redemptionEntities: Redemption[]): Promise<{ batch: RedemptionBatch; redemptions: Redemption[] }> {
    // Use this.transaction from BaseRepository
    return this.transaction(async (tx) => {
      try {
        if (redemptionEntities.length === 0) {
          throw new Error('Cannot create batch with no redemptions');
        }

        // Calculate batch totals using snake_case properties based on TS error
        const totalPoints = redemptionEntities.reduce((sum, r) => sum + r.points_amount, 0);
        const totalTokens = redemptionEntities.reduce((sum, r) => sum + r.token_amount, 0);

        // Create batch using the transaction client 'tx' and Drizzle insert
        const batchId = uuidv4();
        // Use camelCase keys matching the redemptionBatches schema
        const batchResult = await tx.insert(redemptionBatches)
          .values({
            id: batchId,
            status: 'pending' as RedemptionStatus,
            // createdAt handled by defaultNow()
            redemptionCount: redemptionEntities.length,
            totalPoints: totalPoints,
            totalTokens: totalTokens
          })
          .returning();

        if (batchResult.length === 0) {
            throw new Error('Batch creation failed, no result returned.');
        }
        // Map the raw result (should be camelCase from Drizzle) to the RedemptionBatch type
        const batch = this.mapBatchToEntity(batchResult[0]);

        // Update redemptions with batch ID and status using the transaction client 'tx'
        const updatedRedemptions: Redemption[] = [];
        for (const redemption of redemptionEntities) {
          // Use Drizzle update within the transaction
          const updateResult = await tx.update(this.table)
            .set({ batchId: batchId, status: 'processing' as RedemptionStatus }) // Use camelCase batchId
            .where(eq(this.idColumn, redemption.id)) // Use this.idColumn from BaseRepository
            .returning();

          if (updateResult.length > 0) {
             // Drizzle returning() gives camelCase object matching schema
             updatedRedemptions.push(this.mapToEntity(updateResult[0]));
          }
        }

        return { batch, redemptions: updatedRedemptions };
      } catch (error) {
        this.logError('createRedemptionBatch', error, { redemptionCount: redemptionEntities.length });
        throw this.wrapError('Failed to create redemption batch', error);
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
     // Use this.transaction from BaseRepository
    return this.transaction(async (tx) => {
      try {
        // Update batch status using the transaction client 'tx' and Drizzle update
        // Use camelCase keys matching the redemptionBatches schema
        const batchUpdateResult = await tx.update(redemptionBatches)
          .set({ status: status, processedAt: new Date() })
          .where(eq(redemptionBatches.id, batchId))
          .returning();

        if (batchUpdateResult.length === 0) {
          throw new Error(`Batch with ID ${batchId} not found`);
        }
         // Map the raw result (should be camelCase from Drizzle) to the RedemptionBatch type
        const updatedBatch = this.mapBatchToEntity(batchUpdateResult[0]);

        // Update all redemptions in the batch using the transaction client 'tx'
        // Use camelCase keys matching the redemptions schema
        await tx.update(this.table)
          .set({
            status: status,
            processedAt: new Date(),
            transactionHash: transactionHash,
            errorMessage: errorMessage
          })
          .where(eq(this.table.batchId, batchId)); // Use camelCase batchId

        return updatedBatch;
      } catch (error) {
        this.logError('updateBatchStatus', error, { batchId, status });
        throw this.wrapError('Failed to update batch status', error);
      }
    });
  }

  /**
   * Get the total points redeemed by a user in the current week
   *
   * @param userId User ID
   * @returns Total points redeemed this week
   */
  async getWeeklyRedemptionTotal(userId: string): Promise<number> {
    try {
      // Use the imported 'db' instance and Drizzle methods
      const result = await db.select({
          // Use drizzle's sum function - use correct camelCase column name from schema
          sum: sql<number>`sum(${this.table.pointsAmount})`.mapWith(Number)
        })
        .from(this.table)
        .where(and(
          eq(this.table.userId, userId), // Use camelCase userId from schema
          inArray(this.table.status, ['pending', 'processing', 'completed']),
          // Use SQL fragment for date comparison - use correct camelCase column name from schema
          sql`${this.table.createdAt} >= date_trunc('week', NOW())`
        ));

      // If sum is null or undefined (no redemptions found), return 0
      return result[0]?.sum ?? 0;
    } catch (error) {
      this.logError('getWeeklyRedemptionTotal', error, { userId });
      throw this.wrapError('Failed to get weekly redemption total', error);
    }
  }
}
