/**
 * Comment Model
 * Represents a comment on a content item with optional threading
 */
import { z } from 'zod';

// Define the comment status enum
export const CommentStatusEnum = z.enum(['active', 'deleted', 'flagged']);
export type CommentStatus = z.infer<typeof CommentStatusEnum>;

// Comment schema with validation
export const commentSchema = z.object({
  id: z.string().uuid(),
  content_id: z.string(),
  user_id: z.string(),
  comment_text: z.string().min(1).max(1000),
  parent_id: z.string().nullable(),
  created_at: z.coerce.date(),
  status: CommentStatusEnum
});

// TypeScript type derived from schema
export type Comment = z.infer<typeof commentSchema>;

// Input DTOs with validation
export const createCommentSchema = z.object({
  content_id: z.string(),
  user_id: z.string(),
  comment_text: z.string().min(1).max(1000),
  parent_id: z.string().nullable().optional(),
});

export type CreateCommentDto = z.infer<typeof createCommentSchema>;

export const updateCommentSchema = z.object({
  comment_text: z.string().min(1).max(1000).optional(),
  status: CommentStatusEnum.optional(),
});

export type UpdateCommentDto = z.infer<typeof updateCommentSchema>;

/**
 * Database column mapping - maps DB column names to TypeScript property names
 */
export const commentDbMapping = {
  id: 'id',
  content_id: 'content_id',
  user_id: 'user_id',
  comment_text: 'comment_text',
  parent_id: 'parent_id',
  created_at: 'created_at',
  status: 'status'
};
