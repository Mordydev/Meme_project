import { eq, sum, desc, sql, gte, and, count, SQL } from 'drizzle-orm'; 
import { randomUUID } from 'crypto'; 
import { BaseRepository, QueryOptions } from './base-repository';
import { userPoints, UserPoints as PointsEntitySchema, NewUserPoints as NewPointsSchema } from '../database/schema/points'; // Use schema types
import { db } from '../database';
// Import only necessary types from API layer if needed, or define internal types
import { TrendDataPoint, TrendsQueryParams } from '../api/points/types';
import { logger } from '../lib/logger';

// Define the internal representation/model type used by the repository and service
// This should align with what the service expects and what mapToEntity returns
export interface PointsTransactionModel {
    id: string;
    userId: string;
    amount: number;
    source: string; // Consider using PointsSource enum/type here if available
    referenceId: string | null;
    createdAt: Date;
    description: string | null;
    metadata: Record<string, any>; // Add metadata back to the model
}


// Interface matching the input for the service layer example (now camelCase)
export interface AwardPointsInput {
    userId: string;
    amount: number;
    source: string; // Assuming PointsSource type is compatible
    description?: string;
    referenceId?: string;
} // Added missing closing brace

// BaseRepository<ModelType (camelCase), SchemaType (Drizzle schema)>
export class PointsRepository extends BaseRepository<PointsTransactionModel, typeof userPoints> {
  constructor() {
    // Pass the Drizzle schema object and the ID column
    // Map model keys (camelCase) to schema keys (camelCase)
    super(
        userPoints,
        userPoints.id, 
        { 
            userId: userPoints.userId,
            amount: userPoints.amount,
            source: userPoints.source,
            createdAt: userPoints.createdAt,
            referenceId: userPoints.referenceId, // Add if needed for sorting/filtering
            description: userPoints.description, // Add if needed
            // metadata: userPoints.metadata // Removed - Not in schema
        }
    );
  // Map from Drizzle result (camelCase) to Model type (PointsTransactionModel)
  protected mapToEntity(record: PointsEntitySchema): PointsTransactionModel {
    // Map schema fields to the model type
    return {
        id: record.id, // id is varchar in schema, string in model
        userId: record.userId,
        amount: record.amount,
        source: record.source, // source is text in schema, string in model
        referenceId: record.referenceId ?? null, // Ensure null if undefined
        createdAt: record.createdAt,
        description: record.description ?? null, // Ensure null if undefined
        metadata: {} // Keep metadata empty as it's not in DB schema
    };
  }


  /**
   * Gets the total points for a specific user.
   * @param userId The ID of the user.
   * @returns The total points balance.
   */
  async getUserPointsTotal(userId: string): Promise<number> {
    try {
      const result = await db
        .select({ total: sum(this.table.amount) }) // Use this.table
        .from(this.table) 
        .where(eq(this.table.userId, userId));

      return Number(result[0]?.total || 0);
    } catch (error) {
      this.logError('getUserPointsTotal', error, { userId });
      throw this.wrapError('Failed to get user points total', error);
    }
  }

  /**
   * Adds a new points transaction for a user.
   * @param transaction The points transaction data.
   * @returns The newly created PointsTransactionModel.
   */
   async awardPoints(transaction: AwardPointsInput): Promise<PointsTransactionModel> {
     // Map the input to the NewPointsSchema type
     const newPointsData: NewPointsSchema = {
         id: randomUUID(),
         userId: transaction.userId,
         amount: transaction.amount,
         source: transaction.source,
         referenceId: transaction.referenceId,
         description: transaction.description,
         // metadata is not part of the DB schema insert type
     };
     return this.create(newPointsData); // create returns the mapped entity (camelCase)
  } 

   /**
   * Gets the points transaction history for a user, ordered by creation date.
   * @param userId The ID of the user.
   * @param limit The maximum number of records to return.
   * @param offset The number of records to skip.
   * @returns An array of PointsTransactionModel transactions.
   */
  async getPointsHistory(userId: string, limit: number = 20, offset: number = 0): Promise<PointsTransactionModel[]> {
     // Use the base findMany method
     return this.findMany({
         filter: { userId: userId }, // Use direct field name
         orderBy: 'createdAt', // Use camelCase mapping key
         orderDir: 'desc',
         limit: limit,
         offset: offset
     });
  }

  // --- Additional methods specific to Points might go here ---

  // Removed getDailyPointsBySource - Cap logic is handled in RedisCapTracker

  // --- Placeholder methods to satisfy EnhancedPointsService ---
  // Note: These might be consolidated later if the service layer changes how it interacts.

  // Placeholder for adding a transaction (award or deduction) - Used by service
  async addPointsTransaction(data: NewPointsSchema): Promise<PointsTransactionModel> {
    logger.debug('addPointsTransaction called', { data });
    // This should ideally use the base 'create' method for consistency
    // Replicating base 'create' logic here for now:
    try {
        const [newRecord] = await db.insert(this.table).values(data).returning();
        if (!newRecord) {
            throw new Error('Failed to create points transaction, no record returned.');
        }
        logger.info('Points transaction created successfully', { id: newRecord.id, userId: newRecord.userId });
        return this.mapToEntity(newRecord);
    } catch (error) {
        this.logError('addPointsTransaction', error, { data });
        throw this.wrapError('Failed to add points transaction', error);
    }
    /* // Original placeholder:
    const newRecord = {
      ...data, // Spread the input data
      id: data.id || randomUUID(), 
      createdAt: new Date(), 
      // metadata: data.metadata || {} // metadata not in schema
    };
    return this.mapToEntity(newRecord as PointsEntitySchema);
    */
  }

  // Placeholder for deducting points (creates a negative transaction) - Used by service
  async deductPoints(data: Omit<NewPointsSchema, 'id'> & { amount: number }): Promise<PointsTransactionModel> {
    logger.debug('deductPoints called', { data });
    const deductionData: NewPointsSchema = {
      ...data, // Spread the input data
      id: randomUUID(),
      amount: -Math.abs(data.amount), // Ensure amount is negative
    };
    return this.addPointsTransaction(deductionData);
  }

  /**
   * Gets the points transaction history for a user, with optional filtering and pagination.
   * Returns both the transactions and the total count for pagination.
   * @param userId The ID of the user.
   * @param options Query options including limit, offset, and optional source filter.
   * @returns An object containing the list of transactions (PointsTransactionModel) and the total count.
   */
  async getUserPointsTransactions(
    userId: string,
    options: { limit?: number; offset?: number; source?: string }
  ): Promise<{ transactions: PointsTransactionModel[]; total: number }> {
    const { limit = 20, offset = 0, source } = options;
    logger.debug('Fetching user points transactions', { userId, limit, offset, source });

    try {
      // Build the where condition dynamically using camelCase schema fields
      const conditions: SQL[] = [eq(this.table.userId, userId)];
      if (source) {
        conditions.push(eq(this.table.source, source));
      }
      const whereCondition = and(...conditions);

      // Fetch transactions with pagination and filtering
      const results = await db
        .select()
        .from(this.table)
        .where(whereCondition)
        .orderBy(desc(this.table.createdAt)) // Use camelCase schema field
        .limit(limit)
        .offset(offset);

      // Fetch the total count matching the filter
      const totalResult = await db
        .select({ count: count() })
        .from(this.table)
        .where(whereCondition);

      const total = totalResult[0]?.count || 0;

      logger.debug(`Found ${results.length} transactions, total matching: ${total}`, { userId, limit, offset, source });
      return {
        transactions: results.map(this.mapToEntity), // Map to camelCase model type
        total,
      };
    } catch (error) {
      this.logError('getUserPointsTransactions', error, { userId, options });
      throw this.wrapError('Failed to get user points transactions', error);
    }
  }

  // Removed transferPointsBetweenUsers - Service layer should handle this via award/deduct calls.

  // --- End Placeholder methods ---

  /**
   * Gets points trends data for a user over a specified period.
   * @param userId The ID of the user.
   * @param period The time period ('day', 'week', 'month', 'year').
   * @returns An array of TrendDataPoint objects (camelCase).
   */
  async getPointsTrends(userId: string, period: NonNullable<TrendsQueryParams['period']>): Promise<TrendDataPoint[]> {
    try {
      const now = new Date();
      let startDate: Date;
      let dateFormat: string;
      let dateTruncUnit: string;

      switch (period) {
        case 'day':
          startDate = new Date(now.setDate(now.getDate() - 30));
          dateFormat = '%Y-%m-%d'; 
          dateTruncUnit = 'day';
          break;
        case 'month':
          startDate = new Date(now.setMonth(now.getMonth() - 12));
          dateFormat = '%Y-%m'; 
          dateTruncUnit = 'month';
          break;
        case 'year':
           startDate = new Date(now.setFullYear(now.getFullYear() - 5));
           dateFormat = '%Y'; 
           dateTruncUnit = 'year';
           break;
        case 'week':
        default:
          startDate = new Date(now.setDate(now.getDate() - 12 * 7));
          dateFormat = '%Y-W%W'; 
          dateTruncUnit = 'week';
          break;
      }

      // Use camelCase schema fields
      const dateCol = sql<string>`to_char(${this.table.createdAt}, ${dateFormat})`;
      const dateTruncCol = sql`date_trunc(${dateTruncUnit}, ${this.table.createdAt})`;

      const results = await db
        .select({
          date: dateCol,
          source: this.table.source,
          totalPoints: sum(this.table.amount).mapWith(Number), 
        })
        .from(this.table)
        .where(and(
          eq(this.table.userId, userId),
          gte(this.table.createdAt, startDate)
        ))
        .groupBy(dateCol, this.table.source) 
        .orderBy(dateCol); 

      // Process results: Group by date and aggregate sources
      const trendsMap = new Map<string, TrendDataPoint>();

      for (const row of results) {
        if (!row.date) continue; 

        let entry = trendsMap.get(row.date);
        if (!entry) {
          entry = {
            date: row.date,
            totalPoints: 0,
            sources: {},
          };
          trendsMap.set(row.date, entry);
        }

        entry.totalPoints += row.totalPoints;
        if (row.source && row.totalPoints > 0) { 
            entry.sources = entry.sources || {}; 
            entry.sources[row.source] = (entry.sources[row.source] || 0) + row.totalPoints;
        }
      }

      return Array.from(trendsMap.values()).sort((a, b) => a.date.localeCompare(b.date));

    } catch (error) {
      this.logError('getPointsTrends', error, { userId, period });
      throw this.wrapError('Failed to get points trends data', error);
    }
  }

}

// Export a singleton instance
export const pointsRepository = new PointsRepository();
