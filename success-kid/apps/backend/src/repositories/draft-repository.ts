import { eq } from 'drizzle-orm';
import { BaseRepository, QueryOptions } from './base-repository';
import { db } from '../database';
import { drafts, Draft, NewDraft } from '../database/schema/drafts';
import { logger } from '../lib/logger';

// Define the specific entity type for the repository
type DraftEntity = Draft;

export class DraftRepository extends BaseRepository<DraftEntity, typeof drafts, NewDraft> {
  constructor() {
    // Pass the table schema, primary key column, and optional column mapping
    super(
      drafts,
      drafts.id, // Primary key column
      { // Optional mapping for sorting/filtering
        userId: drafts.userId,
        type: drafts.type,
        lastSaved: drafts.lastSaved,
        createdAt: drafts.createdAt,
        updatedAt: drafts.updatedAt
      }
    );
  }

  /**
   * Finds all drafts for a specific user
   * @param userId The user ID
   * @param options Optional query options
   * @returns Array of draft entities
   */
  async findByUserId(userId: string, options: QueryOptions<DraftEntity> = {}): Promise<DraftEntity[]> {
    return this.findMany({
      ...options,
      filter: { ...options.filter, userId }
    });
  }

  /**
   * Creates a new draft
   * @param data The draft data
   * @returns The created draft entity
   */
  async createDraft(data: NewDraft): Promise<DraftEntity> {
    try {
      logger.info('Creating draft in database', { userId: data.userId, type: data.type });
      return await this.create(data);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Error creating draft', { error: errorMessage, data });
      throw new Error(`Failed to create draft: ${errorMessage}`);
    }
  }

  /**
   * Updates an existing draft
   * @param id The draft ID
   * @param data The draft data to update
   * @returns The updated draft entity
   */
  async updateDraft(id: string, data: Partial<NewDraft>): Promise<DraftEntity | null> {
    try {
      logger.info('Updating draft in database', { id, data });
      return await this.update(id, data);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Error updating draft', { error: errorMessage, id, data });
      throw new Error(`Failed to update draft: ${errorMessage}`);
    }
  }

  /**
   * Deletes a draft
   * @param id The draft ID
   * @returns True if successfully deleted
   */
  async deleteDraft(id: string): Promise<boolean> {
    try {
      logger.info('Deleting draft from database', { id });
      return await this.delete(id);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Error deleting draft', { error: errorMessage, id });
      throw new Error(`Failed to delete draft: ${errorMessage}`);
    }
  }

  /**
   * Maps a raw database record to a draft entity
   * @param record The raw database record
   * @returns The mapped draft entity
   */
  protected mapToEntity(record: Record<string, any>): DraftEntity {
    return {
      id: record.id,
      userId: record.userId,
      type: record.type,
      contentText: record.contentText,
      mediaUrls: record.mediaUrls,
      metadata: record.metadata,
      lastSaved: record.lastSaved,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt
    };
  }
}

// Export a singleton instance
export const draftRepository = new DraftRepository();
