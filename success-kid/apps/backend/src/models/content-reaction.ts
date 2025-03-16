/**
 * Content Reaction Model
 * Represents a user's reaction to content (like, upvote, etc.)
 */
import { z } from 'zod';

// Define the reaction type enum
export const ReactionTypeEnum = z.enum(['like', 'love', 'laugh', 'wow', 'sad', 'angry', 'upvote', 'downvote']);
export type ReactionType = z.infer<typeof ReactionTypeEnum>;

// Content reaction schema with validation
export const contentReactionSchema = z.object({
  user_id: z.string(),
  content_id: z.string(),
  reaction_type: ReactionTypeEnum,
  created_at: z.coerce.date()
});

// TypeScript type derived from schema
export type ContentReaction = z.infer<typeof contentReactionSchema>;

// Input DTOs with validation
export const createContentReactionSchema = z.object({
  user_id: z.string(),
  content_id: z.string(),
  reaction_type: ReactionTypeEnum
});

export type CreateContentReactionDto = z.infer<typeof createContentReactionSchema>;

/**
 * Database column mapping - maps DB column names to TypeScript property names
 */
export const contentReactionDbMapping = {
  user_id: 'user_id',
  content_id: 'content_id',
  reaction_type: 'reaction_type',
  created_at: 'created_at'
};
