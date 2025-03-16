/**
 * Tag Model
 * 
 * Defines the Tag entity, validation schemas, and related data transfer objects.
 * Tags are used for content categorization and discovery.
 */
import { z } from 'zod';

// Tag Zod Schema
export const tagSchema = z.object({
  id: z.string().uuid({ message: 'Invalid tag ID format' }),
  name: z.string()
    .min(2, { message: 'Tag name must be at least 2 characters' })
    .max(30, { message: 'Tag name cannot exceed 30 characters' }),
  slug: z.string()
    .min(2, { message: 'Slug must be at least 2 characters' })
    .max(30, { message: 'Slug cannot exceed 30 characters' })
    .regex(/^[a-z0-9-]+$/, { message: 'Slug can only contain lowercase letters, numbers, and hyphens' }),
  description: z.string().max(200, { message: 'Description cannot exceed 200 characters' }).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, { message: 'Color must be a valid hex code' }).optional(),
  is_featured: z.boolean().default(false),
  usage_count: z.number().int().nonnegative().default(0),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
});

// TypeScript Tag Type derived from Zod schema
export type Tag = z.infer<typeof tagSchema>;

// Create Tag Input Schema
export const createTagSchema = tagSchema
  .omit({ 
    id: true, 
    usage_count: true,
    created_at: true, 
    updated_at: true 
  })
  .partial({
    description: true,
    color: true,
    is_featured: true
  })
  .required({
    name: true,
    slug: true
  });

// Create Tag DTO Type
export type CreateTagDto = z.infer<typeof createTagSchema>;

// Update Tag Input Schema
export const updateTagSchema = createTagSchema.partial();

// Update Tag DTO Type
export type UpdateTagDto = z.infer<typeof updateTagSchema>;

// Tag Response Schema (for API responses)
export const tagResponseSchema = tagSchema;

// Tag Response DTO Type
export type TagResponseDto = z.infer<typeof tagResponseSchema>;

// Tag With Content Count
export interface TagWithCount extends Tag {
  content_count: number;
}

// Content Tags Association Schema
export const contentTagsSchema = z.object({
  content_id: z.string().uuid({ message: 'Invalid content ID format' }),
  tag_id: z.string().uuid({ message: 'Invalid tag ID format' }),
  created_at: z.coerce.date(),
});

// Content Tags Association Type
export type ContentTags = z.infer<typeof contentTagsSchema>;
