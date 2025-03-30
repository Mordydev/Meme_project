/**
 * Comment Repository
 * 
 * Handles data access operations for comments using Drizzle ORM.
 */
import { eq, desc, asc, and, count as drizzleCount, SQL, or, isNull, inArray } from 'drizzle-orm';
import { BaseRepository, QueryOptions } from './base-repository';
import { comments, Comment, NewComment } from '../database/schema/comments'; // Import Drizzle schema/types
import { users, profiles } from '../database/schema/users'; // For author info
// Assuming reactions schema exists for like count - Placeholder import
// import { reactions } from '../database/schema/reactions'; 
import { db } from '../database';
import { Logger } from 'pino';
import { CommentThread } from '../models/entities/comment.model'; // Import CommentThread interface

// Placeholder for logger import
let logger: Logger;
try {
  // Corrected path assuming logger is in lib
  const loggerModule = require('../lib/logger'); 
  logger = loggerModule.logger;
} catch (e) {
  console.warn("Logger module not found at '../lib/logger', using console.", e);
  logger = console as any;
}

type CommentEntity = Comment; // Use Drizzle inferred type

export class CommentRepository extends BaseRepository<CommentEntity, typeof comments, NewComment> {
  constructor() {
    // Pass the Drizzle schema, ID column, and optional column mapping
    super(
        comments,
        comments.id, // Primary key column
        { // Optional mapping for sorting/filtering
            contentId: comments.contentId,
            userId: comments.userId,
            parentId: comments.parentId,
            createdAt: comments.createdAt,
            status: comments.status
            // Add updatedAt if needed for sorting/filtering
            // updatedAt: comments.updatedAt 
        }
    );
  }

  /**
   * Create a new comment using the base class method.
   * @param data Comment data (already camelCase from service)
   * @returns Created comment entity (camelCase)
   */
  async createComment(data: NewComment): Promise<CommentEntity> {
    // Base class 'create' handles insertion and returns the mapped entity
    // Ensure required fields like status are set if not provided in NewComment type
    const dataToInsert = {
        ...data,
        status: data.status ?? 'active', // Default status if not provided
        // createdAt and updatedAt are usually handled by DB defaults
    };
    return this.create(dataToInsert);
  }

  /**
   * Update a comment using the base class method.
   * Handles partial updates correctly as BaseRepository filters undefined keys.
   * @param id Comment ID
   * @param data Comment data to update (Partial<NewComment>, camelCase)
   * @returns Updated comment entity or null if not found
   */
  async updateComment(id: string, data: Partial<NewComment>): Promise<CommentEntity | null> {
    // Add updatedAt timestamp automatically if not provided
    const dataToUpdate = {
        ...data,
        updatedAt: data.updatedAt ?? new Date() 
    };
    // Base class 'update' handles partial updates and returns the mapped entity
    return this.update(id, dataToUpdate);
  }

  /**
   * Soft delete a comment by setting its status to 'deleted'.
   * @param id Comment ID
   * @returns True if deleted, false if not found
   */
  async softDeleteComment(id: string): Promise<boolean> {
    try {
      const result = await db.update(this.table)
          .set({ status: 'deleted', updatedAt: new Date() }) // Assuming an updatedAt column exists
          .where(eq(this.table.id, id))
          .returning({ id: this.table.id });
      return result.length > 0;
    } catch (error) {
      this.logError('softDeleteComment', error, { id });
      throw this.wrapError('Failed to soft-delete comment', error);
    }
  }

  /**
   * Get comments for a content item, optionally grouped by thread.
   * @param contentId Content ID
   * @param options Options for retrieving comments
   * @returns Array of comments or comment threads
   */
  async getContentComments(
    contentId: string,
    options: {
      limit?: number;
      offset?: number;
      threaded?: boolean;
      includeDeleted?: boolean;
    } = {}
  ): Promise<Comment[] | CommentThread[]> { // Return Drizzle Comment type or custom CommentThread
    const { limit = 50, offset = 0, threaded = true, includeDeleted = false } = options;
    const conditions: SQL[] = [eq(this.table.contentId, contentId)];
    if (!includeDeleted) {
      conditions.push(eq(this.table.status, 'active'));
    }

    try {
      // Base query to select comments with author info
      // Define the selection explicitly
      const selection = {
          comment: this.table,
          author: {
              id: users.id,
              displayName: users.displayName,
              avatarUrl: profiles.avatarUrl
          },
          // TODO: Add like count (requires reactions table join/subquery)
          // likeCount: sql<number>`(select count(*) from reactions where reactions.comment_id = ${this.table.id})`.as('like_count') // Example subquery
      };

      const baseQuery = db.select(selection)
        .from(this.table)
        .innerJoin(users, eq(this.table.userId, users.id))
        .leftJoin(profiles, eq(users.id, profiles.userId))
        // .leftJoin(reactions, eq(this.table.id, reactions.commentId)) // Placeholder join for likes
        .$dynamic();

      if (!threaded) {
        // Flat list
        const results = await baseQuery
          .where(and(...conditions))
          .orderBy(asc(this.table.createdAt))
          .limit(limit)
          .offset(offset);
          // .groupBy(this.table.id, users.id, profiles.id); // Placeholder groupBy if needed for likes

        return results.map(row => ({
            ...this.mapToEntity(row.comment),
            author: row.author,
            stats: { likes: 0 } // Placeholder for like count
        }));
      } else {
        // Threaded list
        // 1. Get top-level comments
        const topLevelConditions = [...conditions, isNull(this.table.parentId)];
        const topLevelResults = await baseQuery
          .where(and(...topLevelConditions))
          .orderBy(asc(this.table.createdAt))
          .limit(limit)
          .offset(offset);
          // .groupBy(this.table.id, users.id, profiles.id); // Placeholder groupBy

        if (topLevelResults.length === 0) return [];

        const topLevelIds = topLevelResults.map(row => row.comment.id);

        // 2. Get replies for these top-level comments (re-use baseQuery structure)
        const repliesQuery = db.select(selection)
            .from(this.table)
            .innerJoin(users, eq(this.table.userId, users.id))
            .leftJoin(profiles, eq(users.id, profiles.userId))
            // .leftJoin(reactions, eq(this.table.id, reactions.commentId)) // Placeholder join
            .$dynamic();

        const replyConditions = [...conditions, inArray(this.table.parentId, topLevelIds)];
        const repliesResults = await repliesQuery
            .where(and(...replyConditions))
            .orderBy(asc(this.table.createdAt));
            // .groupBy(this.table.id, users.id, profiles.id); // Placeholder groupBy

        // 3. Map replies by parent ID
        const repliesByParent = new Map<string, CommentThread[]>();
        repliesResults.forEach(row => {
            const parentId = row.comment.parentId;
            if (parentId) {
                const reply: CommentThread = {
                    ...this.mapToEntity(row.comment),
                    author: row.author,
                    stats: { likes: 0 }, // Placeholder
                    replies: [] // Replies don't have further nesting in this query
                };
                if (!repliesByParent.has(parentId)) {
                    repliesByParent.set(parentId, []);
                }
                repliesByParent.get(parentId)!.push(reply);
            }
        });

        // 4. Construct the final threaded structure
        return topLevelResults.map(row => ({
            ...this.mapToEntity(row.comment),
            author: row.author,
            stats: { likes: 0 }, // Placeholder
            replies: repliesByParent.get(row.comment.id) || []
        }));
      }
    } catch (error) {
      this.logError('getContentComments', error, { contentId, options });
      throw this.wrapError('Failed to get content comments', error);
    }
  }

  // --- Other methods like countContentComments, countByUserInPeriod, etc. ---
  // --- would also need to be refactored to use Drizzle ORM ---
  // --- Placeholder implementations using Drizzle: ---

  async countContentComments(contentId: string, includeDeleted: boolean = false): Promise<number> {
    const conditions: SQL[] = [eq(this.table.contentId, contentId)];
    if (!includeDeleted) {
      conditions.push(eq(this.table.status, 'active'));
    }
    try {
        const result = await db.select({ value: drizzleCount() })
            .from(this.table)
            .where(and(...conditions));
        return Number(result[0]?.value || 0);
    } catch (error) {
        this.logError('countContentComments', error, { contentId });
        throw this.wrapError('Failed to count content comments', error);
    }
  }

  // ... (Refactor other methods similarly if needed) ...

  /**
   * Implements the abstract mapToEntity method from BaseRepository.
   * Maps a raw database record object to the CommentEntity type.
   * @param record The raw database record.
   * @returns The mapped CommentEntity.
   */
  protected mapToEntity(record: Record<string, any>): CommentEntity {
    // Drizzle returns camelCase objects matching the schema definition
    // So direct return (or spreading) is usually sufficient if TEntity matches schema type
    return {
        id: record.id,
        contentId: record.contentId,
        userId: record.userId,
        commentText: record.commentText,
        parentId: record.parentId,
        createdAt: record.createdAt,
        status: record.status,
        metadata: record.metadata || {},
        updatedAt: record.updatedAt // Ensure updatedAt is included if it's in the Comment type
    };
  }
}

// Export a singleton instance (or handle instantiation via DI)
// Ensure BaseRepository constructor doesn't require db if using the Drizzle one
export const commentRepository = new CommentRepository();
