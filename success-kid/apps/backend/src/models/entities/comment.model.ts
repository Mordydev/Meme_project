/**
 * Comment Model
 * 
 * Defines the Comment entity, validation schemas, and related data transfer objects.
 * Comments are user responses to content items.
 */
import { z } from 'zod';

// Comment Status Enum
export const CommentStatusEnum = z.enum(['active', 'deleted', 'flagged', 'pending_review']);
export type CommentStatus = z.infer<typeof CommentStatusEnum>;

// Comment Zod Schema
export const commentSchema = z.object({
  id: z.string().uuid({ message: 'Invalid comment ID format' }),
  content_id: z.string().uuid({ message: 'Invalid content ID format' }),
  user_id: z.string().uuid({ message: 'Invalid user ID format' }),
  comment_text: z.string()
    .min(1, { message: 'Comment text is required' })
    .max(1000, { message: 'Comment text cannot exceed 1000 characters' }),
  parent_id: z.string().uuid({ message: 'Invalid parent comment ID format' }).nullable(),
  created_at: z.coerce.date(),
  status: CommentStatusEnum.default('active'),
  
  // Metadata
  metadata: z.record(z.string(), z.any()).default({})
});

// TypeScript Comment Type derived from Zod schema
export type Comment = z.infer<typeof commentSchema>;

// Create Comment Input Schema
export const createCommentSchema = commentSchema
  .omit({ 
    id: true, 
    created_at: true, 
    status: true,
    metadata: true 
  })
  .partial({
    parent_id: true
  })
  .required({
    content_id: true,
    user_id: true,
    comment_text: true
  });

// Create Comment DTO Type
export type CreateCommentDto = z.infer<typeof createCommentSchema>;

// Update Comment Input Schema
export const updateCommentSchema = z.object({
  comment_text: z.string()
    .min(1, { message: 'Comment text is required' })
    .max(1000, { message: 'Comment text cannot exceed 1000 characters' }),
  status: CommentStatusEnum.optional()
});

// Update Comment DTO Type
export type UpdateCommentDto = z.infer<typeof updateCommentSchema>;

// Comment Response Schema (for API responses)
export const commentResponseSchema = commentSchema
  .extend({
    // Include additional fields that are populated for responses
    author: z.object({
      id: z.string(),
      display_name: z.string(),
      avatar_url: z.string().nullable()
    }).optional(),
    stats: z.object({
      likes: z.number().default(0)
    }).optional(),
    replies: z.array(z.lazy(() => commentResponseSchema)).optional()
  });

// Comment Response DTO Type
export type CommentResponseDto = z.infer<typeof commentResponseSchema>;

// Comment Thread Structure (for hierarchical comment responses)
export interface CommentThread extends Comment {
  author: {
    id: string;
    display_name: string;
    avatar_url: string | null;
  };
  stats: {
    likes: number;
  };
  replies?: CommentThread[];
}
