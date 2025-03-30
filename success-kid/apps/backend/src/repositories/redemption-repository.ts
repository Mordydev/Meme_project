/**
 * Redemption Repository
 *
 * Repository for managing redemption requests and processing batches.
 */
import { v4 as uuidv4 } from 'uuid';
import { eq, and, inArray, sql, desc, count, SQL, gte, lte } from 'drizzle-orm';
import { BaseRepository } from './base-repository';
import { logger } from '../lib/logger';
import { db } from '../database';
// Import all relevant schemas
import { redemptions, redemptionBatches, redemptionTransactions } from '../database/schema'; 
import {
  Redemption, // Now camelCase
  RedemptionStatus,
  CreateRedemptionRequestDto, // camelCase DTO
  RedemptionBatch, // Now camelCase
  RedemptionTransaction, // Now camelCase
  RedemptionFilterOptions // Interface from model
} from '../models/entities/redemption.model';
import { REDEMPTION_CONSTANTS } from '../models/entities/redemption.model';

// Define the type for the Drizzle schema select result (camelCase)
type RedemptionSchemaSelect = typeof redemptions.$inferSelect;
// Define the type for the Drizzle schema insert data (camelCase)
type RedemptionSchemaInsert = typeof redemptions.$inferInsert;
// Define the type for the Drizzle transaction schema select result (camelCase)
type RedemptionTransactionSchemaSelect = typeof redemptionTransactions.$inferSelect;
// Define the type for the Drizzle transaction schema insert data (camelCase)
type RedemptionTransactionSchemaInsert = typeof redemptionTransactions.$inferInsert;


/**
 * Redemption repository implementation
 */
// BaseRepository<ModelType (camelCase), SchemaType (camelCase)>
export class RedemptionRepository extends BaseRepository<Redemption, typeof redemptions> {
  /**
   * Create a new RedemptionRepository instance
   */
  constructor() {
    // Pass the Drizzle schema object (camelCase) and the ID column (camelCase)
    super(redemptions, redemptions.id); 
  }

  // Map from Drizzle result (camelCase) to Model type (camelCase)
  protected mapToEntity(record: RedemptionSchemaSelect): Redemption {
    // Should be a direct mapping now if model is camelCase
    return record; 
  }

  // Map from Drizzle batch result (camelCase) to Model batch type (camelCase)
  protected mapBatchToEntity(record: typeof redemptionBatches.$inferSelect): RedemptionBatch {
     // Should be a direct mapping now if model is camelCase
     return record;
  }

  // Map from Drizzle transaction result (camelCase) to Model transaction type (camelCase)
  protected mapTransactionToEntity(record: RedemptionTransactionSchemaSelect): RedemptionTransaction {
      // Should be a direct mapping now if model is camelCase
      return {
          ...record,
          status: record.status as any // Cast status if needed, ensure enum values match
      };
  }


  /**
   * Create a new redemption request
   *
   * @param data Redemption request data (using camelCase matching DTO)
   * @returns Created redemption request (mapped to camelCase model type)
   */
  async createRedemption(data: {
      userId: string;
      pointsAmount: number;
      walletAddress: string;
      referenceId?: string; // Not inserted, but kept for context if needed
  }): Promise<Redemption> {
    try {
      // Prepare data for Drizzle insert (camelCase)
      const insertData: RedemptionSchemaInsert = {
          userId: data.userId,
          pointsAmount: data.pointsAmount,
          tokenAmount: data.pointsAmount / REDEMPTION_CONSTANTS.CONVERSION_RATIO, 
          walletAddress: data.walletAddress,
          status: 'pending',
          // referenceId is not in the schema, so it's omitted here
      };

      const results = await db.insert(this.table)
        .values(insertData)
        .returning();

      if (results.length === 0) {
        throw new Error('Redemption creation failed, no result returned.');
      }
      // Map the raw Drizzle result (camelCase) back to the camelCase model type
      return this.mapToEntity(results[0]);
    } catch (error) {
      this.logError('createRedemption', error, { data });
      throw this.wrapError('Failed to create redemption request', error);
    }
  }

  /**
   * Update redemption status by ID
   *
   * @param id Redemption ID
   * @param status New status
   * @param updateData Optional additional data (camelCase matching schema fields)
   * @returns Updated redemption (mapped to camelCase model type)
   */
  async updateRedemptionStatus(
      id: string,
      status: RedemptionStatus,
      // Input data uses camelCase matching Drizzle schema fields
      updateData: Partial<Pick<RedemptionSchemaSelect, 'errorMessage' | 'transactionHash' | 'processedAt'>> = {} 
  ): Promise<Redemption> {
      try {
          const dataToSet: Partial<RedemptionSchemaInsert> = {
              status: status,
              processedAt: updateData.processedAt !== undefined ? updateData.processedAt : (status !== 'pending' ? new Date() : null), 
              errorMessage: updateData.errorMessage,
              transactionHash: updateData.transactionHash,
          };

          // Remove undefined keys explicitly
          if (dataToSet.processedAt === undefined) delete dataToSet.processedAt;
          if (dataToSet.errorMessage === undefined) delete dataToSet.errorMessage;
          if (dataToSet.transactionHash === undefined) delete dataToSet.transactionHash;


          // Use BaseRepository update which expects camelCase data for Drizzle
          const updatedEntity = await this.update(id, dataToSet); 

          if (!updatedEntity) {
              throw new Error(`Redemption with ID ${id} not found or failed to update`);
          }
          // BaseRepository.update returns the entity mapped by mapToEntity (now camelCase)
          return updatedEntity; 
      } catch (error) {
          this.logError('updateRedemptionStatus', error, { id, status, updateData });
          throw this.wrapError('Failed to update redemption status', error);
      }
  }

  /**
   * Get user's redemption history with pagination.
   *
   * @param userId User ID
   * @param limit Maximum number of redemptions to return
   * @param offset Number of redemptions to skip
   * @returns Array of redemptions (mapped to camelCase model type)
   */
  async findByUserId(userId: string, limit: number = 20, offset: number = 0): Promise<Redemption[]> {
      // Use BaseRepository findMany, filter/orderBy keys match schema (camelCase)
      return this.findMany({
          filter: { userId: userId } as Partial<RedemptionSchemaSelect>, 
          orderBy: 'createdAt', // Use camelCase schema field for orderBy
          orderDir: 'desc',
          limit: limit,
          offset: offset
      });
  }

  /**
   * Count redemptions for a specific user.
   *
   * @param userId User ID
   * @returns Total count of redemptions for the user.
   */
  async countByUserId(userId: string): Promise<number> {
      // Use BaseRepository count, filter keys should match the Drizzle schema (camelCase)
      return this.count({ userId: userId } as Partial<RedemptionSchemaSelect>); 
  }

  /**
   * Count redemptions by status.
   *
   * @param status The status to count.
   * @returns Number of redemptions with the given status.
   */
  async countByStatus(status: RedemptionStatus): Promise<number> {
      // Use BaseRepository count, filter keys should match the Drizzle schema (camelCase)
      return this.count({ status: status } as Partial<RedemptionSchemaSelect>); 
  }

  /**
   * Find redemptions based on filter criteria.
   *
   * @param options Filtering and pagination options.
   * @returns Array of matching redemptions (mapped to camelCase model type).
   */
  async findWithFilters(options: RedemptionFilterOptions): Promise<Redemption[]> {
      const conditions: SQL[] = [];
      // Use camelCase schema fields for conditions
      if (options.userId) conditions.push(eq(this.table.userId, options.userId));
      if (options.status) conditions.push(eq(this.table.status, options.status));
      if (options.batchId) conditions.push(eq(this.table.batchId, options.batchId));
      if (options.startDate) conditions.push(gte(this.table.createdAt, options.startDate));
      if (options.endDate) conditions.push(lte(this.table.createdAt, options.endDate));

      const whereCondition = conditions.length > 0 ? and(...conditions) : undefined;

      try {
          const results = await db.select()
              .from(this.table)
              .where(whereCondition)
              .orderBy(desc(this.table.createdAt)) // Use camelCase schema field
              .limit(options.limit)
              .offset((options.page - 1) * options.limit);
          // Map results to camelCase model type
          return results.map(this.mapToEntity); 
      } catch (error) {
          this.logError('findWithFilters', error, { options });
          throw this.wrapError('Failed to find redemptions with filters', error);
      }
  }

  /**
   * Count redemptions based on filter criteria.
   *
   * @param options Filtering options.
   * @returns Total count of matching redemptions.
   */
  async countWithFilters(options: RedemptionFilterOptions): Promise<number> {
      const conditions: SQL[] = [];
       // Use camelCase schema fields for conditions
      if (options.userId) conditions.push(eq(this.table.userId, options.userId));
      if (options.status) conditions.push(eq(this.table.status, options.status));
      if (options.batchId) conditions.push(eq(this.table.batchId, options.batchId));
      if (options.startDate) conditions.push(gte(this.table.createdAt, options.startDate));
      if (options.endDate) conditions.push(lte(this.table.createdAt, options.endDate));

      const whereCondition = conditions.length > 0 ? and(...conditions) : undefined;

      try {
          const result = await db.select({ count: count() })
              .from(this.table)
              .where(whereCondition);
          return result[0]?.count || 0;
      } catch (error) {
          this.logError('countWithFilters', error, { options });
          throw this.wrapError('Failed to count redemptions with filters', error);
      }
  }

  /**
   * Update the transaction hash for a specific redemption.
   *
   * @param id Redemption ID.
   * @param transactionHash The blockchain transaction hash.
   * @returns The updated redemption (mapped to camelCase model type).
   */
  async updateTransactionHash(id: string, transactionHash: string): Promise<Redemption> {
      // Use BaseRepository update, expects camelCase data
      const updatedEntity = await this.update(id, { transactionHash }); 
      if (!updatedEntity) {
          throw new Error(`Redemption with ID ${id} not found or failed to update transaction hash`);
      }
      // BaseRepository.update returns the entity mapped by mapToEntity (camelCase)
      return updatedEntity;
  }

  /**
   * Create a transaction record associated with a redemption.
   *
   * @param redemptionId The ID of the redemption.
   * @returns The created redemption transaction record (mapped to camelCase model type).
   */
  async createRedemptionTransaction(redemptionId: string): Promise<RedemptionTransaction> {
      try {
          const transactionId = uuidv4();
          // Use camelCase keys matching the Drizzle schema
          const [newTransaction] = await db.insert(redemptionTransactions) 
              .values({
                  id: transactionId,
                  redemptionId: redemptionId, // camelCase schema field
                  status: 'queued', 
                  // createdAt handled by defaultNow()
              })
              .returning();

          if (!newTransaction) {
              throw new Error('Failed to create redemption transaction record.');
          }
          // Map raw Drizzle result (camelCase) to camelCase model type
          return this.mapTransactionToEntity(newTransaction); // Use specific mapper
      } catch (error) {
          this.logError('createRedemptionTransaction', error, { redemptionId });
          throw this.wrapError('Failed to create redemption transaction record', error);
      }
  }

  /**
   * Get user's pending redemptions
   *
   * @param userId User ID
   * @returns Array of pending redemptions (mapped to camelCase model type)
   */
  async getUserPendingRedemptions(userId: string): Promise<Redemption[]> {
      // Use BaseRepository findMany, filter/orderBy keys match schema (camelCase)
      return this.findMany({
          filter: { userId: userId, status: 'pending' } as Partial<RedemptionSchemaSelect>, 
          orderBy: 'createdAt', // Use camelCase schema field for orderBy
          orderDir: 'desc'
      });
  }

  /**
   * Get pending redemptions for processing
   *
   * @param limit Maximum number of redemptions to return
   * @returns Array of pending redemptions (mapped to camelCase model type)
   */
  async getPendingRedemptionsForProcessing(limit: number = 100): Promise<Redemption[]> {
      // Use BaseRepository findMany, filter/orderBy keys match schema (camelCase)
      return this.findMany({
          filter: { status: 'pending' } as Partial<RedemptionSchemaSelect>, 
          orderBy: 'createdAt', // Use camelCase schema field for orderBy
          orderDir: 'asc',
          limit: limit
      });
  }

  /**
   * Create a redemption batch
   *
   * @param redemptionEntities Redemptions to include in the batch (typed as Redemption[], now camelCase from model)
   * @returns Created batch with updated redemptions (mapped to camelCase model type)
   */
  async createRedemptionBatch(redemptionEntities: Redemption[]): Promise<{ batch: RedemptionBatch; redemptions: Redemption[] }> {
      // Use this.transaction from BaseRepository
      return this.transaction(async (tx) => {
          try {
              if (redemptionEntities.length === 0) {
                  throw new Error('Cannot create batch with no redemptions');
              }

              // Calculate batch totals using camelCase properties from Redemption type
              const totalPoints = redemptionEntities.reduce((sum, r) => sum + r.pointsAmount, 0);
              const totalTokens = redemptionEntities.reduce((sum, r) => sum + r.tokenAmount, 0);

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
              // Map the raw result (camelCase from Drizzle) to the camelCase RedemptionBatch type
              const batch = this.mapBatchToEntity(batchResult[0]);

              // Update redemptions with batch ID and status using the transaction client 'tx'
              const updatedRedemptions: Redemption[] = [];
              for (const redemption of redemptionEntities) {
                  // Use Drizzle update within the transaction
                  // Use camelCase keys matching the redemptions schema
                  const updateResult = await tx.update(this.table)
                      .set({ batchId: batchId, status: 'processing' as RedemptionStatus }) 
                      .where(eq(this.table.id, redemption.id)) // Use explicit id column from schema
                      .returning();

                  if (updateResult.length > 0) {
                      // Drizzle returning() gives camelCase object matching schema, map it
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
   * @returns Updated batch (mapped to camelCase model type)
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
              // Map the raw result (camelCase from Drizzle) to the camelCase RedemptionBatch type
              const updatedBatch = this.mapBatchToEntity(batchUpdateResult[0]);

              // Update all redemptions in the batch using the transaction client 'tx'
              // Use camelCase keys matching the redemptions schema
              const dataToSet: Partial<RedemptionSchemaInsert> = { // Use Insert type
                  status: status,
                  processedAt: new Date(),
                  transactionHash: transactionHash ?? undefined, // Handle null/undefined
                  errorMessage: errorMessage ?? undefined, // Handle null/undefined
              };
              // Remove undefined keys before setting
              Object.keys(dataToSet).forEach(key => dataToSet[key as keyof typeof dataToSet] === undefined && delete dataToSet[key as keyof typeof dataToSet]);

              await tx.update(this.table)
                  .set(dataToSet)
                  .where(eq(this.table.batchId, batchId)); // Use camelCase batchId from schema

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
              sum: sql<number>`sum(${redemptions.pointsAmount})`.mapWith(Number) // Use schema directly
          })
          .from(redemptions) // Use schema directly
          .where(and(
              eq(redemptions.userId, userId), // Use schema directly
              inArray(redemptions.status, ['pending', 'processing', 'completed']), // Use schema directly
              // Use SQL fragment for date comparison - use correct camelCase column name from schema
              sql`${redemptions.createdAt} >= date_trunc('week', NOW())` // Use schema directly
          ));

          // If sum is null or undefined (no redemptions found), return 0
          return result[0]?.sum ?? 0;
      } catch (error) {
          this.logError('getWeeklyRedemptionTotal', error, { userId });
          throw this.wrapError('Failed to get weekly redemption total', error);
      }
  }
}
