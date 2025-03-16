/**
 * Badge Model
 * Represents display badges that users can earn and showcase on their profiles
 */
import { z } from 'zod';

// Badge tier enum
export const BadgeTierEnum = z.enum([
  'bronze',
  'silver',
  'gold',
  'platinum',
  'special'
]);
export type BadgeTier = z.infer<typeof BadgeTierEnum>;

// Badge category enum
export const BadgeCategoryEnum = z.enum([
  'achievements',
  'participation',
  'community',
  'contribution',
  'holder',
  'special',
  'seasonal'
]);
export type BadgeCategory = z.infer<typeof BadgeCategoryEnum>;

// Badge schema
export const badgeSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  description: z.string().max(500),
  image_url: z.string().url(),
  category: BadgeCategoryEnum,
  tier: BadgeTierEnum,
  display_priority: z.number().int(),
  created_at: z.coerce.date(),
  requirements: z.string().max(1000).optional(),
  limited_time: z.boolean().default(false),
  available_until: z.coerce.date().nullable().optional()
});
export type Badge = z.infer<typeof badgeSchema>;

// User badge schema to track badges earned by users
export const userBadgeSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string(),
  badge_id: z.string().uuid(),
  awarded_at: z.coerce.date(),
  source: z.string().optional(),
  equipped: z.boolean().default(false),
  metadata: z.record(z.string(), z.any()).optional()
});
export type UserBadge = z.infer<typeof userBadgeSchema>;

// Input DTOs
export const createBadgeSchema = badgeSchema
  .omit({ id: true, created_at: true })
  .extend({
    available_until: z.coerce.date().nullable().optional()
  });
export type CreateBadgeDto = z.infer<typeof createBadgeSchema>;

export const updateBadgeSchema = badgeSchema
  .omit({ id: true, created_at: true })
  .partial();
export type UpdateBadgeDto = z.infer<typeof updateBadgeSchema>;

export const createUserBadgeSchema = userBadgeSchema
  .omit({ id: true })
  .extend({
    source: z.string().optional(),
    metadata: z.record(z.string(), z.any()).optional()
  });
export type CreateUserBadgeDto = z.infer<typeof createUserBadgeSchema>;

// Database column mappings
export const badgeDbMapping = {
  id: 'id',
  name: 'name',
  description: 'description',
  image_url: 'image_url',
  category: 'category',
  tier: 'tier',
  display_priority: 'display_priority',
  created_at: 'created_at',
  requirements: 'requirements',
  limited_time: 'limited_time',
  available_until: 'available_until'
};

export const userBadgeDbMapping = {
  id: 'id',
  user_id: 'user_id',
  badge_id: 'badge_id',
  awarded_at: 'awarded_at',
  source: 'source',
  equipped: 'equipped',
  metadata: 'metadata'
};
