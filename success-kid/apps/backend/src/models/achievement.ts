/**
 * Achievement Model
 * Represents achievements that users can unlock through platform activities
 */
import { z } from 'zod';

// Define achievement difficulty levels
export const AchievementDifficultyEnum = z.enum([
  'common',
  'uncommon',
  'rare',
  'epic'
]);
export type AchievementDifficulty = z.infer<typeof AchievementDifficultyEnum>;

// Define achievement category types
export const AchievementCategoryEnum = z.enum([
  'content',
  'engagement',
  'profile',
  'wallet',
  'community',
  'referral',
  'milestone',
  'special'
]);
export type AchievementCategory = z.infer<typeof AchievementCategoryEnum>;

// Achievement criteria type
export const AchievementCriteriaTypeEnum = z.enum([
  'count',           // Count of actions (e.g., create 10 posts)
  'streak',          // Consecutive actions (e.g., login 7 days in a row)
  'threshold',       // Reach a specific value (e.g., 1000 points)
  'milestone',       // One-time event (e.g., connect wallet)
  'combination',     // Multiple conditions (e.g., 100 points AND 5 posts)
  'duration',        // Time-based (e.g., member for 30 days)
  'quality',         // Quality metrics (e.g., 10 posts with 5+ upvotes)
  'special'          // Special criteria with custom logic
]);
export type AchievementCriteriaType = z.infer<typeof AchievementCriteriaTypeEnum>;

// Achievement trigger events
export const AchievementTriggerEnum = z.enum([
  'content.created',
  'comment.created',
  'points.awarded',
  'points.redeemed',
  'wallet.connected',
  'profile.updated',
  'user.login',
  'user.referral',
  'market.milestone.reached',
  'user.levelUp',
  'reaction.received',
  'manual'  // For admin-triggered achievements
]);
export type AchievementTrigger = z.infer<typeof AchievementTriggerEnum>;

// Achievement criteria schema
export const achievementCriteriaSchema = z.object({
  type: AchievementCriteriaTypeEnum,
  trigger: AchievementTriggerEnum,
  threshold: z.number().int().positive().optional(),
  timeframe: z.number().int().optional(), // In days, if applicable
  metadata: z.record(z.string(), z.any()).optional()
});
export type AchievementCriteria = z.infer<typeof achievementCriteriaSchema>;

// Achievement schema with validation
export const achievementSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(2).max(100),
  description: z.string().max(500),
  image_url: z.string().url().nullable(),
  category: AchievementCategoryEnum,
  difficulty: AchievementDifficultyEnum,
  points_reward: z.number().int().nonnegative(),
  criteria: z.array(achievementCriteriaSchema),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date().nullable(),
  secret: z.boolean().default(false)
});

// TypeScript type derived from schema
export type Achievement = z.infer<typeof achievementSchema>;

// Input DTOs with validation
export const createAchievementSchema = achievementSchema
  .omit({ id: true, created_at: true, updated_at: true })
  .extend({
    image_url: z.string().url().nullable().optional(),
    secret: z.boolean().optional()
  });

export type CreateAchievementDto = z.infer<typeof createAchievementSchema>;

export const updateAchievementSchema = achievementSchema
  .omit({ id: true, created_at: true, updated_at: true })
  .partial();

export type UpdateAchievementDto = z.infer<typeof updateAchievementSchema>;

/**
 * Database column mapping - maps DB column names to TypeScript property names
 */
export const achievementDbMapping = {
  id: 'id',
  name: 'name',
  description: 'description',
  image_url: 'image_url',
  category: 'category',
  difficulty: 'difficulty',
  points_reward: 'points_reward',
  criteria: 'criteria',
  created_at: 'created_at',
  updated_at: 'updated_at',
  secret: 'secret'
};
