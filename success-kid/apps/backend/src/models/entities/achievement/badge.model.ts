/**
 * Badge Model
 * 
 * Defines the Badge entity, validation schemas, and related data transfer objects.
 * This includes badge definitions, user badge tracking, and badge display preferences.
 */
import { z } from 'zod';

// Badge Tier Enum
export const BadgeTierEnum = z.enum([
  'bronze',    // Entry-level badges
  'silver',    // Mid-level badges
  'gold',      // High-level badges
  'platinum',  // Top-tier badges
  'special'    // Special event or limited-edition badges
]);
export type BadgeTier = z.infer<typeof BadgeTierEnum>;

// Badge Category Enum
export const BadgeCategoryEnum = z.enum([
  'achievement',  // Earned through achievements
  'rank',         // Earned through leaderboard rankings
  'event',        // Event participation badges
  'supporter',    // Special badges for platform supporters
  'milestone',    // Platform milestone badges
  'custom'        // Custom badges (e.g., for staff)
]);
export type BadgeCategory = z.infer<typeof BadgeCategoryEnum>;

// Badge Schema
export const badgeSchema = z.object({
  id: z.string().uuid({ message: 'Invalid badge ID format' }),
  name: z.string(),
  description: z.string(),
  image_url: z.string().url(),
  category: BadgeCategoryEnum,
  tier: BadgeTierEnum,
  points_value: z.number().int().nonnegative().default(0),
  display_priority: z.number().int().default(0),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});
export type Badge = z.infer<typeof badgeSchema>;

// User Badge Schema
export const userBadgeSchema = z.object({
  user_id: z.string(),
  badge_id: z.string(),
  awarded_at: z.coerce.date(),
  source: z.string(),
  equipped: z.boolean().default(false),
  slot: z.number().int().nonnegative().optional(),
  updated_at: z.coerce.date()
});
export type UserBadge = z.infer<typeof userBadgeSchema>;

// Badge Filter Schema
export const badgeFilterSchema = z.object({
  category: BadgeCategoryEnum.optional(),
  tier: BadgeTierEnum.optional(),
  search: z.string().optional()
});
export type BadgeFilter = z.infer<typeof badgeFilterSchema>;

// Create Badge DTO Schema
export const createBadgeSchema = z.object({
  name: z.string(),
  description: z.string(),
  image_url: z.string().url(),
  category: BadgeCategoryEnum,
  tier: BadgeTierEnum,
  points_value: z.number().int().nonnegative().default(0),
  display_priority: z.number().int().default(0)
});
export type CreateBadgeDto = z.infer<typeof createBadgeSchema>;

// Update Badge DTO Schema
export const updateBadgeSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  image_url: z.string().url().optional(),
  category: BadgeCategoryEnum.optional(),
  tier: BadgeTierEnum.optional(),
  points_value: z.number().int().nonnegative().optional(),
  display_priority: z.number().int().optional()
});
export type UpdateBadgeDto = z.infer<typeof updateBadgeSchema>;

// Badge Award Request Schema
export const badgeAwardRequestSchema = z.object({
  userId: z.string(),
  badgeId: z.string(),
  source: z.string(),
  reason: z.string().optional()
});
export type BadgeAwardRequest = z.infer<typeof badgeAwardRequestSchema>;

// Badge Equipped Status Schema
export const badgeEquipRequestSchema = z.object({
  equipped: z.boolean(),
  slot: z.number().int().nonnegative().optional()
});
export type BadgeEquipRequest = z.infer<typeof badgeEquipRequestSchema>;

// Badge Awarded Event
export interface BadgeAwardedEvent {
  userId: string;
  badgeId: string;
  badge: {
    name: string;
    description: string;
    imageUrl: string;
    tier: BadgeTier;
    category: BadgeCategory;
    pointsValue: number;
  };
  source: string;
  timestamp: Date;
}

// Max number of badges that can be equipped at once
export const MAX_EQUIPPED_BADGES = 3;
