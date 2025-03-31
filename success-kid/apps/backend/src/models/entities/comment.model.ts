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
  contentId: z.string().uuid({ message: 'Invalid content ID format' }), // camelCase
  userId: z.string().uuid({ message: 'Invalid user ID format' }), // camelCase
  commentText: z.string() // camelCase
    .min(1, { message: 'Comment text is required' })
    .max(1000, { message: 'Comment text cannot exceed 1000 characters' }),
  parentId: z.string().uuid({ message: 'Invalid parent comment ID format' }).nullable(), // camelCase
  createdAt: z.coerce.date(), // camelCase
  status: CommentStatusEnum.default('active'),
  
  // Metadata - Allow null in the type, matching potential DB inference
  metadata: z.record(z.string(), z.any()).nullable().default({}) 
});

// TypeScript Comment Type derived from Zod schema (will now be Record<string, any> | null)
export type Comment = z.infer<typeof commentSchema>;

// Create Comment Input Schema
export const createCommentSchema = commentSchema
  .omit({ 
    id: true, 
    createdAt: true, // camelCase
    status: true,
    metadata: true 
  })
  .partial({
    parentId: true // camelCase
  })
  .required({
    contentId: true, // camelCase
    userId: true, // camelCase
    commentText: true // camelCase
  });

// Create Comment DTO Type
export type CreateCommentDto = z.infer<typeof createCommentSchema>;

// Update Comment Input Schema
export const updateCommentSchema = z.object({
  commentText: z.string() // camelCase
    .min(1, { message: 'Comment text is required' })
    .max(1000, { message: 'Comment text cannot exceed 1000 characters' }),
  status: CommentStatusEnum.optional()
});

// Update Comment DTO Type
export type UpdateCommentDto = z.infer<typeof updateCommentSchema>;

// Define the recursive type structure first using an interface
// This helps TypeScript resolve the recursive definition for the Zod schema
interface CommentResponseDtoRecursive extends Comment {
  author?: { id: string; displayName: string; avatarUrl: string | null; };
  // Make stats optional in the interface as well
  stats?: { likes: number; }; 
  replies?: CommentResponseDtoRecursive[];
}

// Now define the Zod schema using z.lazy 
// Add back the explicit ZodType hint
export const commentResponseSchema: z.ZodType<CommentResponseDtoRecursive> = commentSchema
  .extend({
    author: z.object({
      id: z.string(),
      displayName: z.string(), // camelCase
      avatarUrl: z.string().nullable() // camelCase
    }).optional(),
    // Make stats optional in Zod schema and remove default from likes
    stats: z.object({
      likes: z.number().int().nonnegative() // Remove default here
    }).optional()
    // Remove recursive replies for now to fix type inference issue
    // replies: z.array(z.lazy(() => commentResponseSchema)).optional() 
  });

// Comment Response DTO Type (inferred from the final schema)
export type CommentResponseDto = z.infer<typeof commentResponseSchema>;

// Comment Thread Structure (for hierarchical comment responses)
// This interface might be redundant now if CommentResponseDtoRecursive covers it,
// but keep it for clarity if used elsewhere.
// Aligning metadata type with the updated Comment type
export interface CommentThread extends Omit<Comment, 'metadata'> { 
  metadata: Record<string, any> | null; // Align with updated Comment type
  updatedAt?: Date; // Add optional updatedAt field
  author: {
    id: string;
    displayName: string; // camelCase
    avatarUrl: string | null; // camelCase
  };
  stats: {
    likes: number;
  };
  replies?: CommentThread[];
}
