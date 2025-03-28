/**
 * Category Model
 * 
 * Defines the Category entity, validation schemas, and related data transfer objects.
 * Categories are used to organize content in the forum system.
 */
import { z } from 'zod';

// Category Status Enum
export const CategoryStatusEnum = z.enum(['active', 'inactive']);
export type CategoryStatus = z.infer<typeof CategoryStatusEnum>;

// Category Zod Schema
export const categorySchema = z.object({
  id: z.string().uuid({ message: 'Invalid category ID format' }),
  name: z.string()
    .min(2, { message: 'Category name must be at least 2 characters' })
    .max(50, { message: 'Category name cannot exceed 50 characters' }),
  description: z.string()
    .max(500, { message: 'Category description cannot exceed 500 characters' })
    .optional(),
  slug: z.string()
    .min(2, { message: 'Slug must be at least 2 characters' })
    .max(50, { message: 'Slug cannot exceed 50 characters' })
    .regex(/^[a-z0-9-]+$/, { message: 'Slug can only contain lowercase letters, numbers, and hyphens' }),
  parent_id: z.string().uuid({ message: 'Invalid parent category ID format' }).nullable(),
  order: z.number().int().nonnegative(),
  icon: z.string().optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, { message: 'Color must be a valid hex code' }).optional(),
  is_active: z.boolean().default(true),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
});

// TypeScript Category Type derived from Zod schema
export type Category = z.infer<typeof categorySchema>;

// Create Category Input Schema
export const createCategorySchema = categorySchema
  .omit({ 
    id: true, 
    created_at: true, 
    updated_at: true 
  })
  .partial({
    description: true,
    parent_id: true,
    icon: true,
    color: true,
    is_active: true
  })
  .required({
    name: true,
    slug: true,
    order: true
  });

// Create Category DTO Type
export type CreateCategoryDto = z.infer<typeof createCategorySchema>;

// Update Category Input Schema
export const updateCategorySchema = createCategorySchema.partial();

// Update Category DTO Type
export type UpdateCategoryDto = z.infer<typeof updateCategorySchema>;

// Category Response Schema (for API responses)
export const categoryResponseSchema = categorySchema
  .extend({
    subcategories: z.array(z.lazy(() => categoryResponseSchema)).optional(),
    content_count: z.number().int().nonnegative().optional()
  });

// Category Response DTO Type
export type CategoryResponseDto = z.infer<typeof categoryResponseSchema>;

// Category With Children (for hierarchical category responses)
export interface CategoryWithChildren extends Category {
  subcategories?: CategoryWithChildren[];
  content_count?: number;
}
