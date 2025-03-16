/**
 * Achievement Models
 * 
 * Defines the Achievement entity, validation schemas, and related data transfer objects.
 * This includes achievement definitions, categories, user achievement tracking, and criteria structures.
 */
import { z } from 'zod';

// Achievement Difficulty Enum
export const AchievementDifficultyEnum = z.enum([
  'common',
  'uncommon',
  'rare',
  'epic',
  'legendary'
]);
export type AchievementDifficulty = z.infer<typeof AchievementDifficultyEnum>;

// Achievement Category Enum
export const AchievementCategoryEnum = z.enum([
  'content',      // Content creation achievements
  'community',    // Community interaction achievements
  'points',       // Points earning achievements
  'profile',      // Profile completion achievements
  'wallet',       // Wallet connection achievements
  'streak',       // Login streak achievements
  'referral',     // Referral achievements
  'special',      // Special event achievements
  'hidden'        // Hidden/secret achievements
]);
export type AchievementCategory = z.infer<typeof AchievementCategoryEnum>;

// Achievement Criteria Types
export const AchievementCriteriaTypeEnum = z.enum([
  'count',        // Count of a specific activity (e.g., create 10 posts)
  'streak',       // Maintain a streak (e.g., login 7 days in a row)
  'aggregate',    // Aggregate value (e.g., earn 1000 points)
  'milestone',    // Reach a specific milestone (e.g., reach level 5)
  'boolean',      // One-time achievement (e.g., connect wallet)
  'complex'       // Complex criteria with multiple conditions
]);
export type AchievementCriteriaType = z.infer<typeof AchievementCriteriaTypeEnum>;

// Achievement Criteria Schema
export const achievementCriteriaSchema = z.object({
  type: AchievementCriteriaTypeEnum,
  eventType: z.string().optional(),
  targetValue: z.number().optional(),
  metadata: z.record(z.string(), z.any()).optional(),
  description: z.string().optional()
});
export type AchievementCriteria = z.infer<typeof achievementCriteriaSchema>;

// Achievement Schema
export const achievementSchema = z.object({
  id: z.string().uuid({ message: 'Invalid achievement ID format' }),
  name: z.string()
    .min(3, { message: 'Achievement name must be at least 3 characters' })
    .max(50, { message: 'Achievement name cannot exceed 50 characters' }),
  description: z.string()
    .min(10, { message: 'Achievement description must be at least 10 characters' })
    .max(500, { message: 'Achievement description cannot exceed 500 characters' }),
  image_url: z.string().url().nullable(),
  points_reward: z.number().int().nonnegative(),
  difficulty: AchievementDifficultyEnum,
  category: AchievementCategoryEnum,
  requirements: z.array(achievementCriteriaSchema),
  is_public: z.boolean().default(true),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});
export type Achievement = z.infer<typeof achievementSchema>;

// User Achievement Status Schema
export const userAchievementSchema = z.object({
  user_id: z.string(),
  achievement_id: z.string(),
  unlocked_at: z.coerce.date().nullable(),
  progress: z.record(z.string(), z.any()).default({}),
  notified: z.boolean().default(false)
});
export type UserAchievement = z.infer<typeof userAchievementSchema>;

// Achievement Progress Schema
export const achievementProgressSchema = z.object({
  currentValue: z.number(),
  targetValue: z.number(),
  percentComplete: z.number(),
  isComplete: z.boolean()
});
export type AchievementProgress = z.infer<typeof achievementProgressSchema>;

// Create Achievement DTO Schema
export const createAchievementSchema = z.object({
  name: z.string()
    .min(3, { message: 'Achievement name must be at least 3 characters' })
    .max(50, { message: 'Achievement name cannot exceed 50 characters' }),
  description: z.string()
    .min(10, { message: 'Achievement description must be at least 10 characters' })
    .max(500, { message: 'Achievement description cannot exceed 500 characters' }),
  image_url: z.string().url().nullable(),
  points_reward: z.number().int().nonnegative(),
  difficulty: AchievementDifficultyEnum,
  category: AchievementCategoryEnum,
  requirements: z.array(achievementCriteriaSchema),
  is_public: z.boolean().default(true)
});
export type CreateAchievementDto = z.infer<typeof createAchievementSchema>;

// Achievement Response DTO
export const achievementResponseSchema = achievementSchema.omit({
  // Remove any fields that shouldn't be exposed in responses
  // For achievements, we typically want to show most fields except for perhaps internal ones
});
export type AchievementResponseDto = z.infer<typeof achievementResponseSchema>;

// Achievement Filter Schema - used for filtering achievements in queries
export const achievementFilterSchema = z.object({
  category: AchievementCategoryEnum.optional(),
  difficulty: AchievementDifficultyEnum.optional(),
  is_public: z.boolean().optional(),
  search: z.string().optional()
});
export type AchievementFilter = z.infer<typeof achievementFilterSchema>;

// Achievement Unlocked Event Structure
export interface AchievementUnlockedEvent {
  userId: string;
  achievementId: string;
  achievement: {
    name: string;
    description: string;
    imageUrl: string | null;
    difficulty: AchievementDifficulty;
    pointsRewarded: number;
    category: AchievementCategory;
  };
  unlockedAt: Date;
}
