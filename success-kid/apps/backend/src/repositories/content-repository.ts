import { eq, desc } from 'drizzle-orm';
import { BaseRepository, QueryOptions } from './base-repository'; // Import base class and options
import { content, Content, NewContent } from '../database/schema/content'; // Import schema and types
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
type ContentEntity = Content; // Using the inferred type from schema/content.ts

export class ContentRepository extends BaseRepository<ContentEntity, typeof content, NewContent> {
  constructor() {
    // Pass the table schema, primary key column, and optional column mapping
    super(
        content,
        content.id, // Primary key column
        { // Optional mapping for sorting/filtering
            userId: content.userId,
            type: content.type,
            status: content.status,
            createdAt: content.createdAt,
            updatedAt: content.updatedAt
        }
    );
  }

  /**
   * Finds content items created by a specific user.
   * @param userId The ID of the user whose content to find.
   * @param options Optional query options (limit, offset, etc.).
   * @returns An array of Content entities.
   */
  async findByUserId(userId: string, options: QueryOptions<ContentEntity> = {}): Promise<ContentEntity[]> {
    // Use the base findMany method with a filter for userId
    return this.findMany({
        ...options,
        filter: { ...options.filter, userId: userId } // Add userId to existing filters
    });
  }

   /**
   * Finds content items by type.
   * @param type The type of content to find.
   * @param options Optional query options (limit, offset, etc.).
   * @returns An array of Content entities.
   */
  async findByType(type: string, options: QueryOptions<ContentEntity> = {}): Promise<ContentEntity[]> {
    // Use the base findMany method with a filter for type
    return this.findMany({
        ...options,
        filter: { ...options.filter, type: type } // Add type to existing filters
    });
  }


  /**
   * Implements the abstract mapToEntity method from BaseRepository.
   * Maps a raw database record object to the ContentEntity type.
   * @param record The raw database record.
   * @returns The mapped ContentEntity.
   */
  protected mapToEntity(record: Record<string, any>): ContentEntity {
    return {
      id: record.id,
      userId: record.userId,
      type: record.type,
      contentText: record.contentText,
      mediaUrls: record.mediaUrls, // Assuming JSONB is parsed correctly by the driver/Drizzle
      metadata: record.metadata,   // Assuming JSONB is parsed correctly
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      status: record.status
    };
  }

  // Override mapToDatabase if needed (e.g., for snake_case conversion)
  // protected mapToDatabase(entity: Partial<ContentEntity | NewContent>): Record<string, any> {
  //    // ... mapping logic ...
  //    return dbRecord;
  // }
}

// Export a singleton instance
export const contentRepository = new ContentRepository();
