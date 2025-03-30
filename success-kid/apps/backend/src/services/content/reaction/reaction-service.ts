/**
 * Reaction Service
 *
 * Handles business logic for adding/removing reactions, awarding points, and publishing events.
 */
import { logger } from '../../../lib/logger'; // Corrected path
import { reactionRepository, ReactionRepository } from '../../../repositories/reaction-repository'; // Corrected path
import { contentRepository, ContentRepository } from '../../../repositories/content-repository'; // Corrected path
import { pointsService, EnhancedPointsService } from '../../points'; // Corrected path relative to services/content
import { eventBus, EventBus, EventType } from '../../../lib/event-bus'; // Corrected path
import { NewReaction, Reaction } from '../../../database/schema/reactions'; // Corrected path
import { NotFoundError, ValidationError } from '../../../errors'; // Corrected path
// Assuming PointsSource is defined in points.model.ts
import { PointsSource } from '../../../models/entities/points.model'; // Corrected path

// Define allowed reaction types (could be moved to config)
const ALLOWED_REACTION_TYPES = ['like', 'love', 'celebrate', 'insightful', 'funny'];

export class ReactionService {
  constructor(
    private reactionRepo: ReactionRepository,
    private contentRepo: ContentRepository,
    private pointsSvc: EnhancedPointsService,
    private evtBus: EventBus
  ) {}

  /**
   * Add a reaction to a content item.
   * @param userId The ID of the user adding the reaction.
   * @param contentId The ID of the content item being reacted to.
   * @param reactionType The type of reaction (e.g., 'like').
   * @returns The added reaction or null if it already existed.
   */
  async addReaction(userId: string, contentId: string, reactionType: string): Promise<Reaction | null> {
    logger.debug(`User ${userId} attempting to add reaction '${reactionType}' to content ${contentId}`);

    // Validate reaction type
    if (!ALLOWED_REACTION_TYPES.includes(reactionType)) {
      throw new ValidationError(`Invalid reaction type: ${reactionType}`);
    }

    // Check if content exists
    const content = await this.contentRepo.findById(contentId);
    if (!content) {
      throw new NotFoundError('Content', contentId);
    }

    // Prevent reacting to own content (optional business rule)
    if (content.userId === userId) {
       logger.warn(`User ${userId} attempted to react to their own content ${contentId}`);
       // Decide whether to throw an error or just silently ignore
       // throw new ValidationError('Users cannot react to their own content.');
       return null; // Silently ignore for now
    }

    const newReactionData: NewReaction = { userId, contentId, reactionType };

    try {
      const addedReaction = await this.reactionRepo.addReaction(newReactionData);

      // If reaction was newly added (not a conflict)
      if (addedReaction) {
        logger.info(`User ${userId} added reaction '${reactionType}' to content ${contentId}`);

        // Award points to the content creator
        // TODO: Confirm 'reaction_received' is the correct PointsSource string literal
        await this.pointsSvc.awardPoints({
          userId: content.userId, // Award points to the content author
          amount: 5, // Example points value for receiving a reaction
          source: 'reaction_received',
          referenceId: addedReaction.id // Link points to the reaction ID
        });

        // Publish event
        await this.evtBus.publish(EventType.REACTION_ADDED, {
          reactionId: addedReaction.id,
          userId,
          contentId,
          contentUserId: content.userId,
          reactionType
        });

        return addedReaction;
      } else {
        logger.debug(`User ${userId} already reacted with '${reactionType}' to content ${contentId}`);
        return null; // Indicate reaction already existed
      }
    } catch (error) {
      logger.error('Error in addReaction service', { error, userId, contentId, reactionType });
      throw error; // Rethrow after logging
    }
  }

  /**
   * Remove a reaction from a content item.
   * @param userId The ID of the user removing the reaction.
   * @param contentId The ID of the content item.
   * @param reactionType The type of reaction to remove.
   * @returns True if the reaction was successfully removed, false otherwise.
   */
  async removeReaction(userId: string, contentId: string, reactionType: string): Promise<boolean> {
     logger.debug(`User ${userId} attempting to remove reaction '${reactionType}' from content ${contentId}`);

     // Validate reaction type (optional, but good practice)
     if (!ALLOWED_REACTION_TYPES.includes(reactionType)) {
       // Silently ignore invalid type removal attempts or throw error
       logger.warn(`Attempted removal of invalid reaction type: ${reactionType}`);
       return false;
     }

    try {
      const removed = await this.reactionRepo.removeReaction(userId, contentId, reactionType);

      if (removed) {
        logger.info(`User ${userId} removed reaction '${reactionType}' from content ${contentId}`);

        // Optional: Deduct points from content creator (might be complex/undesirable)
        // await this.pointsSvc.deductPoints(...)

        // Publish event
        await this.evtBus.publish(EventType.REACTION_REMOVED, {
          userId,
          contentId,
          reactionType
        });
      } else {
         logger.debug(`Reaction '${reactionType}' by user ${userId} on content ${contentId} not found for removal.`);
      }
      return removed;
    } catch (error) {
      logger.error('Error in removeReaction service', { error, userId, contentId, reactionType });
      throw error; // Rethrow after logging
    }
  }

  /**
   * Get reaction counts for a content item.
   * @param contentId The ID of the content item.
   * @returns An object mapping reaction types to their counts.
   */
  async getReactionCounts(contentId: string): Promise<Record<string, number>> {
    logger.debug(`Getting reaction counts for content ${contentId}`);
    try {
      // Check if content exists first (optional, repo might handle it)
      // const content = await this.contentRepo.findById(contentId);
      // if (!content) {
      //   throw new NotFoundError('Content', contentId);
      // }
      return await this.reactionRepo.getReactionCounts(contentId);
    } catch (error) {
      logger.error('Error in getReactionCounts service', { error, contentId });
      throw error; // Rethrow after logging
    }
  }

   /**
   * Get reactions for a content item, possibly filtered by user.
   * @param contentId The ID of the content item.
   * @param reactingUserId Optional: Filter reactions by this user ID.
   * @returns An array of reactions.
   */
  async getContentReactions(contentId: string, reactingUserId?: string): Promise<Reaction[]> {
    logger.debug(`Getting reactions for content ${contentId}`, { reactingUserId });
    try {
      // TODO: Add filtering by reactingUserId in the repository if needed
      // Currently fetches all reactions for the content
      const reactions = await this.reactionRepo.getContentReactions(contentId);
      if (reactingUserId) {
          // Add explicit type for 'r'
          return reactions.filter((r: Reaction) => r.userId === reactingUserId);
      }
      return reactions;
    } catch (error) {
      logger.error('Error in getContentReactions service', { error, contentId, reactingUserId });
      throw error; // Rethrow after logging
    }
  }
}

// Export a singleton instance using imported singletons/instances
export const reactionService = new ReactionService(
  reactionRepository,
  contentRepository,
  pointsService,
  eventBus
);
