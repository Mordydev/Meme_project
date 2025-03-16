/**
 * Content Model
 * Represents user-created content (posts, images, links, polls)
 */
import { z } from 'zod';

// Define the valid content types
export const ContentTypeEnum = z.enum(['text', 'image', 'link', 'poll']);
export type ContentType = z.infer<typeof ContentTypeEnum>;

// Define the content status enum
export const ContentStatusEnum = z.enum(['active', 'deleted', 'flagged', 'pending_review']);
export type ContentStatus = z.infer<typeof ContentStatusEnum>;

// Media URLs array schema
export const mediaUrlsSchema = z.array(z.string().url());

// Content schema with validation
export const contentSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string(),
  type: ContentTypeEnum,
  content_text: z.string().max(5000).nullable(),
  media_urls: mediaUrlsSchema.optional(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
  status: ContentStatusEnum
});

// TypeScript type derived from schema
export type Content = z.infer<typeof contentSchema>;

// Input DTOs with validation
export const createContentSchema = z.object({
  user_id: z.string(),
  type: ContentTypeEnum,
  content_text: z.string().max(5000).nullable(),
  media_urls: mediaUrlsSchema.optional(),
});

export type CreateContentDto = z.infer<typeof createContentSchema>;

export const updateContentSchema = z.object({
  content_text: z.string().max(5000).optional(),
  media_urls: mediaUrlsSchema.optional(),
  status: ContentStatusEnum.optional(),
});

export type UpdateContentDto = z.infer<typeof updateContentSchema>;

/**
 * Database column mapping - maps DB column names to TypeScript property names
 */
export const contentDbMapping = {
  id: 'id',
  user_id: 'user_id',
  type: 'type',
  content_text: 'content_text',
  media_urls: 'media_urls',
  created_at: 'created_at',
  updated_at: 'updated_at',
  status: 'status'
};
