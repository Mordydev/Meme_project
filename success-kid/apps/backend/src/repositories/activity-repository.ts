import { eq, desc } from 'drizzle-orm';
import { BaseRepository, QueryOptions } from './base-repository'; // Import base class and options
import { activities, Activity, NewActivity } from '../database/schema/activities'; // Import schema and types
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
type ActivityEntity = Activity;

export class ActivityRepository extends BaseRepository<ActivityEntity, typeof activities, NewActivity> {
  constructor() {
    // Pass the table schema, primary key column, and optional column mapping
    super(
        activities,
        activities.id, // Primary key column
        { // Optional mapping for sorting/filtering
            userId: activities.userId,
            type: activities.type,
            createdAt: activities.createdAt
        }
    );
  }

  /**
   * Finds activities performed by a specific user.
   * @param userId The ID of the user whose activities to find.
   * @param options Optional query options (limit, offset, etc.).
   * @returns An array of Activity entities.
   */
  async findByUserId(userId: string, options: QueryOptions<ActivityEntity> = {}): Promise<ActivityEntity[]> {
    // Use the base findMany method with a filter for userId and default sorting
    return this.findMany({
        ...options,
        filter: { ...options.filter, userId: userId },
        orderBy: options.orderBy || 'createdAt', // Default sort by createdAt if not specified
        orderDir: options.orderDir || 'desc'
    });
  }

   /**
   * Finds activities by type.
   * @param type The type of activity to find.
   * @param options Optional query options (limit, offset, etc.).
   * @returns An array of Activity entities.
   */
  async findByType(type: string, options: QueryOptions<ActivityEntity> = {}): Promise<ActivityEntity[]> {
    // Use the base findMany method with a filter for type
    return this.findMany({
        ...options,
        filter: { ...options.filter, type: type },
        orderBy: options.orderBy || 'createdAt', // Default sort by createdAt if not specified
        orderDir: options.orderDir || 'desc'
    });
  }


  /**
   * Implements the abstract mapToEntity method from BaseRepository.
   * Maps a raw database record object to the ActivityEntity type.
   * @param record The raw database record.
   * @returns The mapped ActivityEntity.
   */
  protected mapToEntity(record: Record<string, any>): ActivityEntity {
    return {
      id: record.id,
      userId: record.userId,
      type: record.type,
      details: record.details, // Assuming JSONB is parsed correctly
      createdAt: record.createdAt
    };
  }
}

// Export a singleton instance
export const activityRepository = new ActivityRepository();
