/**
 * Reaction Repository
 *
 * Handles data access operations for content reactions.
 */
import { db } from '../database'; // Assuming db client from ../database/index.ts
import { reactions, NewReaction, Reaction } from '../database/schema/reactions';
import { eq, and, sql, desc, count } from 'drizzle-orm';
import { logger } from '../lib/logger';
import { BaseRepository } from './base-repository'; // Assuming BaseRepository exists

// TODO: Define the actual table schema and ID column for BaseRepository
// For now, using placeholders. Replace 'reactions.id' with the actual primary key column.
// Need to instantiate BaseRepository correctly.
// export class ReactionRepository extends BaseRepository<Reaction, typeof reactions, NewReaction> {
//   constructor() {
//     super(reactions, reactions.id); // Pass table schema and ID column
//   }

// Temporary implementation without BaseRepository due to potential issues
export class ReactionRepository {

  /**
   * Adds a reaction to a content item.
   * Handles potential unique constraint violations gracefully.
   * @param data New reaction data (userId, contentId, reactionType)
   * @returns The created reaction or null if it already existed.
   */
  async addReaction(data: NewReaction): Promise<Reaction | null> {
    try {
      const result = await db.insert(reactions)
        .values(data)
        .onConflictDoNothing({ target: [reactions.userId, reactions.contentId, reactions.reactionType] }) // Handle unique constraint
        .returning();

      return result.length > 0 ? result[0] : null; // Return the inserted reaction or null if conflict occurred
    } catch (error) {
      logger.error('Error adding reaction', { error, data });
      throw new Error('Failed to add reaction');
    }
  }

  /**
   * Removes a reaction from a content item.
   * @param userId User ID removing the reaction.
   * @param contentId Content ID the reaction is on.
   * @param reactionType The type of reaction to remove.
   * @returns True if a reaction was removed, false otherwise.
   */
  async removeReaction(userId: string, contentId: string, reactionType: string): Promise<boolean> {
    try {
      const result = await db.delete(reactions)
        .where(and(
          eq(reactions.userId, userId),
          eq(reactions.contentId, contentId),
          eq(reactions.reactionType, reactionType)
        ))
        .returning({ id: reactions.id }); // Check if any row was actually deleted

      return result.length > 0;
    } catch (error) {
      logger.error('Error removing reaction', { error, userId, contentId, reactionType });
      throw new Error('Failed to remove reaction');
    }
  }

  /**
   * Gets reaction counts for a specific content item, grouped by reaction type.
   * @param contentId The ID of the content item.
   * @returns An object mapping reaction types to their counts.
   */
  async getReactionCounts(contentId: string): Promise<Record<string, number>> {
    try {
      const results = await db.select({
          reactionType: reactions.reactionType,
          count: count(reactions.id) // Use Drizzle's count function
        })
        .from(reactions)
        .where(eq(reactions.contentId, contentId))
        .groupBy(reactions.reactionType);

      const counts: Record<string, number> = {};
      results.forEach(row => {
        counts[row.reactionType] = Number(row.count); // Ensure count is a number
      });
      return counts;
    } catch (error) {
      logger.error('Error getting reaction counts', { error, contentId });
      throw new Error('Failed to get reaction counts');
    }
  }

   /**
   * Checks if a user has reacted to a specific content item with a specific reaction type.
   * @param userId The user's ID.
   * @param contentId The content's ID.
   * @param reactionType The type of reaction.
   * @returns True if the user has reacted, false otherwise.
   */
  async hasUserReacted(userId: string, contentId: string, reactionType: string): Promise<boolean> {
    try {
      const result = await db.select({ id: reactions.id })
        .from(reactions)
        .where(and(
          eq(reactions.userId, userId),
          eq(reactions.contentId, contentId),
          eq(reactions.reactionType, reactionType)
        ))
        .limit(1);

      return result.length > 0;
    } catch (error) {
      logger.error('Error checking user reaction', { error, userId, contentId, reactionType });
      throw new Error('Failed to check user reaction');
    }
  }

  /**
   * Gets all reactions for a specific content item.
   * @param contentId The ID of the content item.
   * @returns An array of reactions.
   */
  async getContentReactions(contentId: string): Promise<Reaction[]> {
    try {
      return await db.select()
        .from(reactions)
        .where(eq(reactions.contentId, contentId))
        .orderBy(desc(reactions.createdAt));
    } catch (error) {
      logger.error('Error getting content reactions', { error, contentId });
      throw new Error('Failed to get content reactions');
    }
  }

  // mapToEntity is not needed if not extending BaseRepository
  // protected mapToEntity(row: Record<string, any>): Reaction {
  //   return {
  //     id: row.id,
  //     userId: row.user_id, // Adjust based on actual column names if needed
  //     contentId: row.content_id,
  //     reactionType: row.reaction_type,
  //     createdAt: row.created_at,
  //   };
  // }
}

// Export a singleton instance
export const reactionRepository = new ReactionRepository();
