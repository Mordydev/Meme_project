/**
 * Types for the Forum API module
 */
import { z } from 'zod';
import { createThreadSchema, updateThreadSchema } from '../../models/entities/forum/thread.model'; // Assuming these exist

// --- Params ---

export interface ForumSlugParam {
  slug: string;
}

export interface CategoryIdParam {
  id: string;
}

export interface ThreadIdParam {
  id: string;
}

export interface UserIdParam {
  id: string;
}

// --- Query Params ---

export const threadListingQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20),
  offset: z.coerce.number().int().min(0).default(0),
  sort: z.enum(['recent', 'newest', 'views']).default('recent')
});
export type ThreadListingQuery = z.infer<typeof threadListingQuerySchema>;

export const threadRepliesQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0)
});
export type ThreadRepliesQuery = z.infer<typeof threadRepliesQuerySchema>;

export const userThreadsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20),
  offset: z.coerce.number().int().min(0).default(0)
});
export type UserThreadsQuery = z.infer<typeof userThreadsQuerySchema>;

export const trendingThreadsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(10),
  period: z.enum(['day', 'week', 'month']).default('week')
});
export type TrendingThreadsQuery = z.infer<typeof trendingThreadsQuerySchema>;


// --- Body Schemas/Types ---

// Re-export or redefine thread creation/update schemas/types
export const createThreadApiSchema = createThreadSchema;
export type CreateThreadBody = z.infer<typeof createThreadApiSchema>;

export const updateThreadApiSchema = updateThreadSchema;
export type UpdateThreadBody = z.infer<typeof updateThreadApiSchema>;

export const replyContentSchema = z.object({
  content_text: z.string()
    .min(1, { message: 'Reply content is required' })
    .max(5000, { message: 'Reply cannot exceed 5000 characters' }),
  media_urls: z.array(z.string().url()).optional()
});
export type ReplyContentBody = z.infer<typeof replyContentSchema>;
