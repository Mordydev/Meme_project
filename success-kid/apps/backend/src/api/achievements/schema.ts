import { z } from 'zod';
import { PaginationMetaSchema } from '../points/schema'; // Re-use pagination schema

// Schema for a single achievement item in a list/summary
export const AchievementListItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  iconUrl: z.string().url().nullable(),
  pointsAwarded: z.number().int().positive(),
  criteriaType: z.string(), // e.g., 'count', 'streak', 'collection'
  criteriaThreshold: z.number().optional(), // For count/streak types
  isSecret: z.boolean(),
});

// Schema for user's progress on an achievement
export const UserAchievementProgressSchema = AchievementListItemSchema.extend({
  userId: z.string(),
  unlockedAt: z.string().datetime().nullable(),
  progress: z.number().int().nonnegative(), // Current progress count/streak
  isUnlocked: z.boolean(),
});

// Schema for the response of GET /achievements
export const ListAchievementsResponseSchema = z.object({
  data: z.array(AchievementListItemSchema),
  meta: z.object({ timestamp: z.string().datetime() }),
  // Add pagination if listing all achievements becomes paginated
});

// Schema for the response of GET /achievements/user/:userId
export const UserAchievementsResponseSchema = z.object({
  data: z.array(UserAchievementProgressSchema),
  meta: z.object({ timestamp: z.string().datetime() }),
  pagination: PaginationMetaSchema.optional(), // Make pagination optional or required based on implementation
});

// Schema for Params in GET /achievements/user/:userId
export const GetUserAchievementsParamsSchema = z.object({
  userId: z.string().uuid(),
});

// Schema for Query in GET /achievements/user/:userId
export const GetUserAchievementsQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(100).default(50).optional(),
  offset: z.coerce.number().int().nonnegative().default(0).optional(),
  filter: z.enum(['all', 'unlocked', 'locked']).default('all').optional(),
});
