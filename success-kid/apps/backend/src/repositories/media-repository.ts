import { eq } from 'drizzle-orm';
import { BaseRepository, QueryOptions } from './base-repository'; // Import base class and options
import { db } from '../database'; // Assuming db client is exported from ../database/index.ts
import { media, Media, NewMedia, NewMediaInput } from '../database/schema/media'; // Import schema and types
import { Logger } from 'pino'; // Assuming pino logger

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
type MediaEntity = Media;

export class MediaRepository extends BaseRepository<MediaEntity, typeof media, NewMedia> {

  constructor() {
    // Pass the table schema, primary key column, and optional column mapping
    super(
        media,
        media.id, // Primary key column
        { // Optional mapping for sorting/filtering
            userId: media.userId,
            mimeType: media.mimeType,
            size: media.size,
            status: media.status,
            createdAt: media.createdAt,
            updatedAt: media.updatedAt
        }
    );
  }

  /**
   * Creates a new media record in the database after a file has been uploaded to blob storage.
   * @param data Input data containing media details and blob information.
   * @returns The newly created Media entity.
   */
  async createWithBlob(data: NewMediaInput): Promise<Media> {
    try {
      logger.info('Creating media record in database', { mediaId: data.id, userId: data.userId, blobUrl: data.blobUrl });
      const [result] = await db
        .insert(media)
        .values({
          id: data.id,
          userId: data.userId,
          originalName: data.originalName,
          mimeType: data.mimeType,
          size: data.size,
          blobUrl: data.blobUrl,
          blobPath: data.blobPath, // Include blobPath from input
          metadata: data.metadata || {},
          status: 'active', // Default status
          // createdAt and updatedAt will use default values defined in the schema
        })
        .returning(); // Return the inserted record

      if (!result) {
          throw new Error('Media record creation failed, no result returned.');
      }

      logger.info('Media record created successfully', { mediaId: result.id });
      // Use the mapToEntity method from the base class (or this class if overridden)
      return this.mapToEntity(result);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Error creating media record with blob', { error: errorMessage, data });
      // Consider more specific error handling or wrapping
      throw new Error(`Failed to create media record: ${errorMessage}`);
    }
  }

  // --- Methods inherited from BaseRepository are now available ---
  // findById, findMany, create, update, delete, count, transaction

  /**
   * Finds media records associated with a specific user.
   * (Example of a custom method using the base findMany)
   * @param userId The ID of the user.
   * @param options Optional query options.
   * @returns An array of Media entities.
   */
  async findByUserId(userId: string, options: QueryOptions<MediaEntity> = {}): Promise<MediaEntity[]> {
     return this.findMany({
         ...options,
         filter: { ...options.filter, userId: userId }
     });
  }

  /**
   * Implements the abstract mapToEntity method from BaseRepository.
   * Maps a raw database record object to the MediaEntity type.
   * @param record The raw database record.
   * @returns The mapped MediaEntity.
   */
  protected mapToEntity(record: Record<string, any>): MediaEntity {
    return {
      id: record.id,
      userId: record.userId,
      originalName: record.originalName,
      mimeType: record.mimeType,
      size: record.size,
      blobUrl: record.blobUrl,
      blobPath: record.blobPath,
      metadata: record.metadata, // Assuming JSONB is parsed correctly
      status: record.status,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt
    };
  }
}

// Export a singleton instance
export const mediaRepository = new MediaRepository();
