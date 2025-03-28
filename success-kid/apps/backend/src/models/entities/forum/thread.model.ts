/**
 * Thread Model
 * 
 * Defines the Thread entity, validation schemas, and related data transfer objects.
 * Threads are discussions within categories in the forum system.
 */
import { z } from 'zod';

// Thread Status Enum
export const ThreadStatusEnum = z.enum(['active', 'locked', 'pinned', 'archived', 'deleted', 'flagged']);
export type ThreadStatus = z.infer<typeof ThreadStatusEnum>;

// Thread Type Enum
export const ThreadTypeEnum = z.enum(['discussion', 'question', 'announcement', 'poll']);
export type ThreadType = z.infer<typeof ThreadTypeEnum>;

// Thread Zod Schema
export const threadSchema = z.object({
  id: z.string().uuid({ message: 'Invalid thread ID format' }),
  title: z.string()
    .min(3, { message: 'Thread title must be at least 3 characters' })
    .max(200, { message: 'Thread title cannot exceed 200 characters' }),
  user_id: z.string().uuid({ message: 'Invalid user ID format' }),
  category_id: z.string().uuid({ message: 'Invalid category ID format' }),
  forum_id: z.string().uuid({ message: 'Invalid forum ID format' }),
  content_id: z.string().uuid({ message: 'Invalid content ID format' }), // First post is stored as content
  type: ThreadTypeEnum.default('discussion'),
  status: ThreadStatusEnum.default('active'),
  is_pinned: z.boolean().default(false),
  is_locked: z.boolean().default(false),
  views: z.number().int().nonnegative().default(0),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
  last_activity_at: z.coerce.date(),
  last_post_id: z.string().uuid({ message: 'Invalid post ID format' }).nullable(),
  last_post_user_id: z.string().uuid({ message: 'Invalid user ID format' }).nullable(),
  
  // Metadata
  tags: z.array(z.string()).default([]),
  metadata: z.record(z.string(), z.any()).default({})
});

// TypeScript Thread Type derived from Zod schema
export type Thread = z.infer<typeof threadSchema>;

// Create Thread Input Schema
export const createThreadSchema = z.object({
  title: z.string()
    .min(3, { message: 'Thread title must be at least 3 characters' })
    .max(200, { message: 'Thread title cannot exceed 200 characters' }),
  category_id: z.string().uuid({ message: 'Invalid category ID format' }),
  forum_id: z.string().uuid({ message: 'Invalid forum ID format' }),
  type: ThreadTypeEnum.optional(),
  content: z.object({
    content_text: z.string()
      .min(1, { message: 'Thread content is required' })
      .max(10000, { message: 'Thread content cannot exceed 10000 characters' }),
    media_urls: z.array(z.string()).optional(),
    poll_options: z.array(z.object({
      id: z.string(),
      text: z.string().min(1).max(100),
    })).optional()
  }),
  tags: z.array(z.string()).optional()
});

// Create Thread DTO Type
export type CreateThreadDto = z.infer<typeof createThreadSchema>;

// Update Thread Input Schema
export const updateThreadSchema = z.object({
  title: z.string()
    .min(3, { message: 'Thread title must be at least 3 characters' })
    .max(200, { message: 'Thread title cannot exceed 200 characters' })
    .optional(),
  category_id: z.string().uuid({ message: 'Invalid category ID format' }).optional(),
  type: ThreadTypeEnum.optional(),
  status: ThreadStatusEnum.optional(),
  is_pinned: z.boolean().optional(),
  is_locked: z.boolean().optional(),
  tags: z.array(z.string()).optional()
});

// Update Thread DTO Type
export type UpdateThreadDto = z.infer<typeof updateThreadSchema>;

// Thread Response Schema (for API responses)
export const threadResponseSchema = threadSchema
  .extend({
    // First post content
    content: z.object({
      id: z.string(),
      content_text: z.string(),
      media_urls: z.array(z.string()).default([]),
      poll_options: z.array(z.object({
        id: z.string(),
        text: z.string(),
        votes: z.number()
      })).optional()
    }),
    
    // Author information
    author: z.object({
      id: z.string(),
      display_name: z.string(),
      avatar_url: z.string().nullable()
    }),
    
    // Category information
    category: z.object({
      id: z.string(),
      name: z.string(),
      slug: z.string()
    }),
    
    // Forum information
    forum: z.object({
      id: z.string(),
      name: z.string(),
      slug: z.string()
    }),
    
    // Stats
    stats: z.object({
      replies: z.number().int().nonnegative(),
      participants: z.number().int().nonnegative(),
      likes: z.number().int().nonnegative()
    }),
    
    // Last post information
    last_activity: z.object({
      post_id: z.string().nullable(),
      user_id: z.string().nullable(),
      user_name: z.string().nullable(),
      timestamp: z.coerce.date()
    })
  });

// Thread Response DTO Type
export type ThreadResponseDto = z.infer<typeof threadResponseSchema>;

// Thread List Item Schema (for thread list responses)
export const threadListItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  user_id: z.string(),
  category_id: z.string(),
  forum_id: z.string(),
  type: z.string(),
  status: z.string(),
  is_pinned: z.boolean(),
  is_locked: z.boolean(),
  views: z.number(),
  created_at: z.coerce.date(),
  last_activity_at: z.coerce.date(),
  
  // Preview of first post content
  preview: z.string().max(200),
  
  // Author information
  author: z.object({
    id: z.string(),
    display_name: z.string(),
    avatar_url: z.string().nullable()
  }),
  
  // Category information
  category: z.object({
    id: z.string(),
    name: z.string(),
    slug: z.string()
  }),
  
  // Stats
  stats: z.object({
    replies: z.number(),
    participants: z.number(),
    likes: z.number()
  }),
  
  // Last activity information
  last_activity: z.object({
    user_id: z.string().nullable(),
    user_name: z.string().nullable(),
    timestamp: z.coerce.date()
  })
});

// Thread List Item Type
export type ThreadListItem = z.infer<typeof threadListItemSchema>;
