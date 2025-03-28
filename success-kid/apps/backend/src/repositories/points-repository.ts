import { eq, sum, desc } from 'drizzle-orm';
import { randomUUID } from 'crypto'; // Import randomUUID
import { BaseRepository, QueryOptions } from './base-repository'; // Import base class and options
import { userPoints, UserPoints, NewUserPoints } from '../database/schema/points'; // Import schema and types
import { db } from '../database'; // Import db instance
import { Logger } from 'pino';

// Placeholder for logger import (adjust path as needed)
let logger: Logger;
try {
  const loggerModule = require('../lib/logger.js'); // Using require for CommonJS
  logger = loggerModule.logger;
} catch (e) {
  console.warn("Logger module not found at '../lib/logger.js', using console.", e);
  logger = console as any;
}

// Define the specific entity type for the repository
type PointsEntity = UserPoints; // Using the inferred type from schema/points.ts

// Interface matching the input for the service layer example
export interface AwardPointsInput {
    userId: string;
    amount: number;
    source: string;
    description?: string;
    referenceId?: string; // Added based on schema
}


export class PointsRepository extends BaseRepository<PointsEntity, typeof userPoints, NewUserPoints> {
  constructor() {
    // Pass the table schema, primary key column, and optional column mapping
    super(
        userPoints,
        userPoints.id, // Primary key column
        { // Optional mapping for sorting/filtering
            userId: userPoints.userId,
            amount: userPoints.amount,
            source: userPoints.source,
            createdAt: userPoints.createdAt
        }
    );
  }

  /**
   * Gets the total points for a specific user.
   * @param userId The ID of the user.
   * @returns The total points balance.
   */
  async getUserPointsTotal(userId: string): Promise<number> {
    try {
      const result = await db
        .select({ total: sum(userPoints.amount) })
        .from(this.table) // Use this.table from base class
        .where(eq(userPoints.userId, userId));

      // sum() might return null if there are no records, default to 0
      return Number(result[0]?.total || 0);
    } catch (error) {
      this.logError('getUserPointsTotal', error, { userId });
      throw this.wrapError('Failed to get user points total', error);
    }
  }

  /**
   * Adds a new points transaction for a user.
   * This uses the base 'create' method.
   * @param transaction The points transaction data.
   * @returns The newly created PointsEntity.
   */
   async awardPoints(transaction: AwardPointsInput): Promise<PointsEntity> {
     // Map the input to the NewUserPoints schema type expected by base 'create'
     const newPointsData: NewUserPoints = {
         id: randomUUID(), // Generate a UUID for the primary key
         userId: transaction.userId,
         amount: transaction.amount,
         source: transaction.source,
         referenceId: transaction.referenceId,
         description: transaction.description,
         // createdAt: will use default value
     };
     // We need to handle the ID generation. Assuming it's not auto-generated based on varchar schema.
     // If your DB generates IDs (e.g., using uuid_generate_v4()), you might omit 'id'.
     // For now, let's assume an ID needs to be generated or passed in.
     // This example will fail if 'id' is required and not provided.
     // Consider adding UUID generation here if needed: import { randomUUID } from 'crypto'; newPointsData.id = randomUUID();
     if (!newPointsData.id) {
     // logger.warn("Attempting to award points without providing an ID. Ensure ID generation is handled.", { transaction }); // Warning no longer needed
     } // End of the if block (was missing)

     return this.create(newPointsData);
  } // End of awardPoints method

   /**
   * Gets the points transaction history for a user, ordered by creation date.
   * @param userId The ID of the user.
   * @param limit The maximum number of records to return.
   * @param offset The number of records to skip.
   * @returns An array of PointsEntity transactions.
   */
  async getPointsHistory(userId: string, limit: number = 20, offset: number = 0): Promise<PointsEntity[]> {
     // Use the base findMany method with appropriate filter and sorting
     return this.findMany({
         filter: { userId: userId },
         orderBy: 'createdAt', // Use the key mapped in the constructor
         orderDir: 'desc',
         limit: limit,
         offset: offset
     });
  }

  // --- Additional methods specific to Points might go here ---
  // Example: Get total points earned from a specific source today
  async getDailyPointsBySource(userId: string, source: string): Promise<number> {
      // Implementation would involve querying userPoints table with date and source filters
      // This requires date functions which vary by DB (e.g., DATE() in SQLite, CURRENT_DATE in PG)
      // Placeholder - requires specific SQL or Drizzle date functions
      logger.warn("getDailyPointsBySource not fully implemented due to DB-specific date functions.");
      return 0; // Placeholder return
  }


  /**
   * Implements the abstract mapToEntity method from BaseRepository.
   * Maps a raw database record object to the PointsEntity type.
   * @param record The raw database record.
   * @returns The mapped PointsEntity.
   */
  protected mapToEntity(record: Record<string, any>): PointsEntity {
    return {
      id: record.id,
      userId: record.userId,
      amount: record.amount,
      source: record.source,
      referenceId: record.referenceId,
      description: record.description,
      createdAt: record.createdAt
    };
  }
}

// Export a singleton instance
export const pointsRepository = new PointsRepository();
