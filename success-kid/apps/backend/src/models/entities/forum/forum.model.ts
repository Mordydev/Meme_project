/**
 * Forum Model
 * 
 * Defines the Forum entity, validation schemas, and related data transfer objects.
 * Forums are top-level containers for discussion categories in the community platform.
 */
import { z } from 'zod';
import { CategoryWithChildren } from '../taxonomy/category.model';

// Forum Status Enum
export const ForumStatusEnum = z.enum(['active', 'inactive', 'archived']);
export type ForumStatus = z.infer<typeof ForumStatusEnum>;

// Forum Type Enum
export const ForumTypeEnum = z.enum(['public', 'restricted', 'private']);
export type ForumType = z.infer<typeof ForumTypeEnum>;

// Forum Zod Schema
export const forumSchema = z.object({
  id: z.string().uuid({ message: 'Invalid forum ID format' }),
  name: z.string()
    .min(2, { message: 'Forum name must be at least 2 characters' })
    .max(100, { message: 'Forum name cannot exceed 100 characters' }),
  description: z.string()
    .max(1000, { message: 'Forum description cannot exceed 1000 characters' })
    .optional(),
  slug: z.string()
    .min(2, { message: 'Slug must be at least 2 characters' })
    .max(100, { message: 'Slug cannot exceed 100 characters' })
    .regex(/^[a-z0-9-]+$/, { message: 'Slug can only contain lowercase letters, numbers, and hyphens' }),
  type: ForumTypeEnum.default('public'),
  status: ForumStatusEnum.default('active'),
  order: z.number().int().nonnegative(),
  icon: z.string().optional(),
  banner_image: z.string().optional(),
  theme_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, { message: 'Color must be a valid hex code' }).optional(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
  
  // Metadata
  metadata: z.record(z.string(), z.any()).default({})
});

// TypeScript Forum Type derived from Zod schema
export type Forum = z.infer<typeof forumSchema>;

// Create Forum Input Schema
export const createForumSchema = forumSchema
  .omit({ 
    id: true, 
    created_at: true, 
    updated_at: true,
    metadata: true
  })
  .partial({
    description: true,
    type: true,
    status: true,
    icon: true,
    banner_image: true,
    theme_color: true
  })
  .required({
    name: true,
    slug: true,
    order: true
  });

// Create Forum DTO Type
export type CreateForumDto = z.infer<typeof createForumSchema>;

// Update Forum Input Schema
export const updateForumSchema = createForumSchema.partial();

// Update Forum DTO Type
export type UpdateForumDto = z.infer<typeof updateForumSchema>;

// Forum Response Schema (for API responses)
export const forumResponseSchema = forumSchema
  .extend({
    categories: z.array(z.lazy(() => CategoryWithChildren)).optional(),
    stats: z.object({
      threads: z.number().int().nonnegative(),
      posts: z.number().int().nonnegative(),
      activity: z.number().int().nonnegative() // Last activity timestamp
    }).optional()
  });

// Forum Response DTO Type
export type ForumResponseDto = z.infer<typeof forumResponseSchema>;

// Forum List Item Schema (for forum list responses)
export const forumListItemSchema = forumSchema
  .pick({
    id: true,
    name: true,
    description: true,
    slug: true,
    type: true,
    status: true,
    order: true,
    icon: true,
    theme_color: true
  })
  .extend({
    stats: z.object({
      threads: z.number().int().nonnegative(),
      posts: z.number().int().nonnegative(),
      activity: z.number().int().nonnegative() // Last activity timestamp
    })
  });

// Forum List Item Type
export type ForumListItem = z.infer<typeof forumListItemSchema>;
