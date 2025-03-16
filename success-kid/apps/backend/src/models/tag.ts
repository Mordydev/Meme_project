/**
 * Tag Model
 * Represents a content tag for categorization
 */
import { z } from 'zod';

// Define the tag schema with validation
export const tagSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(2).max(50),
  slug: z.string().min(2).max(50).regex(/^[a-z0-9-]+$/),
  count: z.number().int().nonnegative(),
  created_at: z.coerce.date()
});

// TypeScript type derived from schema
export type Tag = z.infer<typeof tagSchema>;

// Content tag relationship schema
export const contentTagSchema = z.object({
  content_id: z.string().uuid(),
  tag_id: z.string().uuid(),
  created_at: z.coerce.date()
});

export type ContentTag = z.infer<typeof contentTagSchema>;

// Input DTOs with validation
export const createTagSchema = z.object({
  name: z.string().min(2).max(50),
  slug: z.string().min(2).max(50).regex(/^[a-z0-9-]+$/).optional(),
});

export type CreateTagDto = z.infer<typeof createTagSchema>;

export const updateTagSchema = z.object({
  name: z.string().min(2).max(50).optional(),
  slug: z.string().min(2).max(50).regex(/^[a-z0-9-]+$/).optional(),
});

export type UpdateTagDto = z.infer<typeof updateTagSchema>;

/**
 * Database column mapping - maps DB column names to TypeScript property names
 */
export const tagDbMapping = {
  id: 'id',
  name: 'name',
  slug: 'slug',
  count: 'count',
  created_at: 'created_at'
};

export const contentTagDbMapping = {
  content_id: 'content_id',
  tag_id: 'tag_id',
  created_at: 'created_at'
};
