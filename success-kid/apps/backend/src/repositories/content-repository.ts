import { eq, desc, sql, ilike, and, SQL, or, gt, lt, inArray, asc } from 'drizzle-orm'; // Added asc, inArray
import { z } from 'zod'; // Import z
import { BaseRepository, QueryOptions } from './base-repository'; // Import base class and options
// Import enums along with schema and types
// Explicitly import the enum values
import { content, Content, NewContent, contentStatusEnum, contentTypeEnum } from '../database/schema/content'; 
import { users, profiles } from '../database/schema/users'; // Correct import for users and profiles
import { contentTags } from '../database/schema/tags'; // Import join table for tag filtering
import { db } from '../database'; // Import db instance
import { Logger } from 'pino';
import { PgSelect } from 'drizzle-orm/pg-core'; // Import PgSelect for query building type safety

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

// Define ContentFeedOptions within the repository or import if shared
// Note: This might be better placed in a shared types file or the service layer
export interface ContentFeedOptions {
  lastId?: string;
  lastCreatedAt?: Date;
  limit?: number;
  type?: string;
  categoryId?: string; // Assuming category filtering happens elsewhere or via metadata
  userId?: string;
  tagIds?: string[]; // Expect tag IDs now
  orderBy?: string;
  orderDir?: 'asc' | 'desc';
  // Add sortBy and timeframe if needed for complex sorting logic here
}

// Define SearchOptions
export interface SearchOptions {
    limit?: number;
    offset?: number;
    type?: string;
    userId?: string;
    // Add other potential search filters like categoryId, tagId, date ranges etc.
}

// Define ContentListItem locally for now
// TODO: Move to a shared types location (e.g., models/entities/content.model.ts)
export interface ContentListItem {
    id: string;
    userId: string;
    type: Content['type']; // Infer directly from Content type
    contentText: Content['contentText']; // Infer from Content type
    mediaUrls: Content['mediaUrls']; // Infer from Content type
    createdAt: Content['createdAt']; // Infer from Content type
    status: Content['status']; // Infer directly from Content type
    author: {
        id: string;
        displayName: string;
        avatarUrl: string | null;
    };
    stats: { // Placeholder stats
        comments: number;
        reactions: number;
    };
}


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
  async findByType(type: Content['type'], options: QueryOptions<ContentEntity> = {}): Promise<ContentEntity[]> {
    // Use the base findMany method with a filter for type
    // Ensure the input 'type' matches the expected enum values
    return this.findMany({
        ...options,
        filter: { ...options.filter, type: type } // Add type to existing filters
    });
  }

  /**
   * Gets detailed content information including author details.
   * @param contentId The ID of the content.
   * @returns Content entity with author details or null if not found.
   */
  async getContentWithDetails(contentId: string): Promise<any | null> { // Return type might need refinement
    try {
        const result = await db.select({
            content: this.table,
            author: { // Select specific author fields
                id: users.id,
                displayName: users.displayName,
                avatarUrl: profiles.avatarUrl // Assuming avatar is in profiles
            }
        })
        .from(this.table)
        .innerJoin(users, eq(this.table.userId, users.id))
        .leftJoin(profiles, eq(users.id, profiles.userId)) // Join profiles for avatar
        .where(and(eq(this.table.id, contentId), eq(this.table.status, 'active'))) // Ensure content is active
        .limit(1);

        if (result.length === 0) {
            return null;
        }
        // Combine content and author data
        return {
            ...this.mapToEntity(result[0].content),
            author: result[0].author
            // TODO: Add stats like comment count, reaction count via subqueries or separate queries
        };
    } catch (error) {
        this.logError('getContentWithDetails', error, { contentId });
        throw this.wrapError('Failed to get content details', error);
    }
  }

  /**
   * Creates a new content record.
   * @param data Data for the new content.
   * @returns The created Content entity.
   */
  async createContent(data: NewContent): Promise<ContentEntity> {
      // Use the base create method
      return this.create(data);
  }

  /**
   * Updates existing content.
   * @param id The ID of the content to update.
   * @param data The data to update.
   * @returns The updated Content entity or null if not found.
   */
  async updateContent(id: string, data: Partial<NewContent>): Promise<ContentEntity | null> {
      // Use the base update method
      return this.update(id, data);
  }

  /**
   * Soft deletes content by setting its status to 'deleted'.
   * @param id The ID of the content to delete.
   * @returns True if the content was soft-deleted, false otherwise.
   */
  async softDeleteContent(id: string): Promise<boolean> {
      try {
          const result = await db.update(this.table)
              .set({ status: 'deleted', updatedAt: new Date() })
              .where(eq(this.table.id, id))
              .returning({ id: this.table.id }); // Return ID to confirm update
          return result.length > 0;
      } catch (error) {
          this.logError('softDeleteContent', error, { id });
          throw this.wrapError('Failed to soft-delete content', error);
      }
  }


  // --- Feed and Search Methods ---

  // TODO: Implement actual feed fetching logic based on options
  async getContentFeed(options: ContentFeedOptions): Promise<ContentListItem[]> {
      logger.warn('getContentFeed needs full implementation in ContentRepository', { options });
      const { limit = 20, type, userId, tagIds, orderBy = 'createdAt', orderDir = 'desc', lastId, lastCreatedAt } = options;

      try {
          const conditions: (SQL | undefined)[] = [eq(this.table.status, 'active')]; // Use (SQL | undefined)[]
          // Cast string 'type' to the enum type for comparison using Content['type']
          if (type) conditions.push(eq(this.table.type, type as Content['type'])); 
          if (userId) conditions.push(eq(this.table.userId, userId));

          // Cursor pagination based on createdAt and id
          if (lastCreatedAt && lastId) {
              const cursorDate = new Date(lastCreatedAt);
              // WHERE (createdAt < lastCreatedAt) OR (createdAt = lastCreatedAt AND id < lastId) for DESC order
              conditions.push(
                  or(
                      lt(this.table.createdAt, cursorDate),
                      and(
                          eq(this.table.createdAt, cursorDate),
                          lt(this.table.id, lastId) // Assuming ID is sortable string like UUID
                      )
                  ) // Removed non-null assertion
              );
          } else if (lastId && orderBy === 'id') { // Simple ID cursor if sorting by ID
               conditions.push(lt(this.table.id, lastId));
          }

          // Define the core selection
          const coreSelect = {
              id: this.table.id,
              userId: this.table.userId,
              type: this.table.type,
              contentText: this.table.contentText,
              mediaUrls: this.table.mediaUrls,
              createdAt: this.table.createdAt,
              status: this.table.status,
              authorDisplayName: users.displayName,
              authorAvatarUrl: profiles.avatarUrl,
          };

          // Start building the query
          let query = db.select(coreSelect)
            .from(this.table)
            .innerJoin(users, eq(this.table.userId, users.id))
            .leftJoin(profiles, eq(users.id, profiles.userId))
            .$dynamic(); // Use .$dynamic() to allow conditional building

          // Handle tag filtering with a subquery or join
          if (tagIds && tagIds.length > 0) {
              // Option 1: Subquery (might be cleaner)
              // conditions.push(inArray(this.table.id, db.select({ contentId: contentTags.contentId }).from(contentTags).where(inArray(contentTags.tagId, tagIds))));
              // Option 2: Join (might require groupBy) - Let's use Join for now
              query = query.innerJoin(contentTags, eq(this.table.id, contentTags.contentId));
              conditions.push(inArray(contentTags.tagId, tagIds));
              // If using join, might need groupBy to avoid duplicate content rows if content has multiple matching tags
              // query = query.groupBy(this.table.id, users.id, profiles.id); // Add all selected non-aggregated columns
          }

          // Apply conditions before ordering and limiting
          query = query.where(and(...conditions.filter(c => c !== undefined) as SQL[]));

          // Apply ordering explicitly based on allowed columns
          const orderFunction = orderDir === 'asc' ? asc : desc;
          if (orderBy === 'createdAt') {
              query = query.orderBy(orderFunction(this.table.createdAt));
          } else if (orderBy === 'updatedAt') {
              query = query.orderBy(orderFunction(this.table.updatedAt));
          } else {
              logger.warn(`Invalid orderBy column specified: ${orderBy}, defaulting to createdAt`);
              query = query.orderBy(desc(this.table.createdAt)); // Default order
          }

          // Apply LIMIT
          const finalQuery = query.limit(limit);
          const results = await finalQuery;

          // Map results to ContentListItem format
          return results.map(row => ({
              id: row.id,
              userId: row.userId,
              type: row.type,
              contentText: row.contentText,
              mediaUrls: row.mediaUrls,
              createdAt: row.createdAt,
              status: row.status,
              author: {
                  id: row.userId, // Assuming userId is the author's ID
                  displayName: row.authorDisplayName,
                  avatarUrl: row.authorAvatarUrl
              },
              stats: { // Placeholder stats
                  comments: 0,
                  reactions: 0
              }
          }));

      } catch (error) {
          this.logError('getContentFeed', error, { options });
          throw this.wrapError('Failed to get content feed', error);
      }
  }

  // TODO: Implement actual search logic (e.g., using full-text search)
  async searchContent(searchText: string, options: SearchOptions): Promise<ContentListItem[]> {
      logger.warn('searchContent needs full implementation in ContentRepository', { searchText, options });
      const { limit = 20, offset = 0, type, userId } = options;
      try {
          const conditions: (SQL | undefined)[] = [eq(this.table.status, 'active')]; // Use (SQL | undefined)[]
          if (searchText) {
              // Basic ILIKE search on contentText (replace with FTS later)
              conditions.push(ilike(this.table.contentText, `%${searchText}%`));
          }
          // Cast string 'type' to the enum type for comparison using Content['type']
          if (type) conditions.push(eq(this.table.type, type as Content['type']));
          if (userId) conditions.push(eq(this.table.userId, userId));

          const results = await db.select({
                // Select fields needed for ContentListItem
                id: this.table.id,
                userId: this.table.userId,
                type: this.table.type,
                contentText: this.table.contentText,
                mediaUrls: this.table.mediaUrls,
                createdAt: this.table.createdAt,
                status: this.table.status,
                authorDisplayName: users.displayName,
                authorAvatarUrl: profiles.avatarUrl,
            })
            .from(this.table)
            .innerJoin(users, eq(this.table.userId, users.id))
            .leftJoin(profiles, eq(users.id, profiles.userId))
            .where(and(...conditions.filter(c => c !== undefined) as SQL[])) // Filter out undefined conditions
            .orderBy(desc(this.table.createdAt)) // TODO: Order by relevance for search
            .limit(limit)
            .offset(offset);

           // Map results
           return results.map(row => ({
              id: row.id,
              userId: row.userId,
              type: row.type,
              contentText: row.contentText,
              mediaUrls: row.mediaUrls,
              createdAt: row.createdAt,
              status: row.status,
              author: {
                  id: row.userId,
                  displayName: row.authorDisplayName,
                  avatarUrl: row.authorAvatarUrl
              },
              stats: { comments: 0, reactions: 0 } // Placeholder
          }));

      } catch (error) {
          this.logError('searchContent', error, { searchText, options });
          throw this.wrapError('Failed to search content', error);
      }
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
