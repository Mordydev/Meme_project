/**
 * Category Model
 * Represents a discussion category for organizing content
 */
import { z } from 'zod';

// Define the category schema with validation
export const categorySchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(2).max(100),
  description: z.string().max(500),
  slug: z.string().min(2).max(100).regex(/^[a-z0-9-]+$/),
  parent_id: z.string().uuid().nullable(),
  order: z.number().int().positive(),
  is_active: z.boolean(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

// TypeScript type derived from schema
export type Category = z.infer<typeof categorySchema>;

// Input DTOs with validation
export const createCategorySchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(500),
  slug: z.string().min(2).max(100).regex(/^[a-z0-9-]+$/),
  parent_id: z.string().uuid().nullable().optional(),
  order: z.number().int().positive().optional(),
  is_active: z.boolean().optional(),
});

export type CreateCategoryDto = z.infer<typeof createCategorySchema>;

export const updateCategorySchema = z.object({
  name: z.string().min(2).max(100).optional(),
  description: z.string().max(500).optional(),
  slug: z.string().min(2).max(100).regex(/^[a-z0-9-]+$/).optional(),
  parent_id: z.string().uuid().nullable().optional(),
  order: z.number().int().positive().optional(),
  is_active: z.boolean().optional(),
});

export type UpdateCategoryDto = z.infer<typeof updateCategorySchema>;

/**
 * Database column mapping - maps DB column names to TypeScript property names
 */
export const categoryDbMapping = {
  id: 'id',
  name: 'name',
  description: 'description',
  slug: 'slug',
  parent_id: 'parent_id',
  order: 'order',
  is_active: 'is_active',
  created_at: 'created_at',
  updated_at: 'updated_at'
};
