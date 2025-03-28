/**
 * Reaction Model
 * 
 * Defines the Reaction entity, validation schemas, and related data transfer objects.
 * Reactions represent user interactions with content like likes, upvotes, etc.
 */
import { z } from 'zod';

// Reaction Type Enum
export const ReactionTypeEnum = z.enum([
  'like',         // Standard like/upvote
  'love',         // Love reaction
  'laugh',        // Laugh reaction
  'support',      // Support/clap reaction
  'interesting',  // Found interesting
  'sad',          // Sad reaction
  'success',      // Success Kid themed reaction
  'share'         // Shared the content
]);

export type ReactionType = z.infer<typeof ReactionTypeEnum>;

// Reaction Zod Schema
export const reactionSchema = z.object({
  user_id: z.string().uuid({ message: 'Invalid user ID format' }),
  content_id: z.string().uuid({ message: 'Invalid content ID format' }),
  reaction_type: ReactionTypeEnum,
  created_at: z.coerce.date(),
  
  // Optional fields for comment reactions
  comment_id: z.string().uuid({ message: 'Invalid comment ID format' }).optional(),
  
  // Additional metadata
  metadata: z.record(z.string(), z.any()).default({})
});

// TypeScript Reaction Type derived from Zod schema
export type Reaction = z.infer<typeof reactionSchema>;

// Create Reaction Input Schema
export const createReactionSchema = z.object({
  user_id: z.string().uuid({ message: 'Invalid user ID format' }),
  content_id: z.string().uuid({ message: 'Invalid content ID format' }),
  reaction_type: ReactionTypeEnum,
  comment_id: z.string().uuid({ message: 'Invalid comment ID format' }).optional(),
  metadata: z.record(z.string(), z.any()).optional()
});

// Create Reaction DTO Type
export type CreateReactionDto = z.infer<typeof createReactionSchema>;

// Update Reaction Input Schema
export const updateReactionSchema = z.object({
  reaction_type: ReactionTypeEnum
});

// Update Reaction DTO Type
export type UpdateReactionDto = z.infer<typeof updateReactionSchema>;

// Delete Reaction Input Schema
export const deleteReactionSchema = z.object({
  user_id: z.string().uuid({ message: 'Invalid user ID format' }),
  content_id: z.string().uuid({ message: 'Invalid content ID format' }),
  reaction_type: ReactionTypeEnum.optional()
});

// Delete Reaction DTO Type
export type DeleteReactionDto = z.infer<typeof deleteReactionSchema>;

// Reaction Count Summary Schema
export const reactionCountSchema = z.object({
  content_id: z.string().uuid(),
  total: z.number().int().nonnegative(),
  by_type: z.record(z.string(), z.number().int().nonnegative()),
  user_reaction: ReactionTypeEnum.nullable()
});

// Reaction Count Summary Type
export type ReactionCountSummary = z.infer<typeof reactionCountSchema>;

// Reaction Notification Schema
export const reactionNotificationSchema = z.object({
  user_id: z.string().uuid(),         // User who received the reaction
  reactor_id: z.string().uuid(),      // User who reacted
  content_id: z.string().uuid(),      // Content that received the reaction
  comment_id: z.string().uuid().optional(), // Optional comment that received the reaction
  reaction_type: ReactionTypeEnum,    // Type of reaction
  created_at: z.coerce.date(),        // When the reaction occurred
  
  // Additional context for notification
  reactor_name: z.string(),           // Name of reactor
  reactor_avatar: z.string().nullable(), // Avatar of reactor
  content_preview: z.string().max(100).optional() // Preview of content reacted to
});

// Reaction Notification Type
export type ReactionNotification = z.infer<typeof reactionNotificationSchema>;
