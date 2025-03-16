/**
 * Achievement Model
 * Represents achievements that users can unlock through platform activities
 */
import { z } from 'zod';

// Define the achievement difficulty enum
export const AchievementDifficultyEnum = z.enum(['common', 'uncommon', 'rare', 'epic', 'legendary']);
export type AchievementDifficulty = z.infer<typeof AchievementDifficultyEnum>;

// Achievement requirements schema
export const achievementRequirementsSchema = z.object({
  criterion: z.string(),
  value: z.number().or(z.string()),
  operator: z.enum(['equals', 'greater_than', 'less_than', 'contains']).optional(),
}).array();

// Achievement schema with validation
export const achievementSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(3).max(255),
  description: z.string().max(1000),
  image_url: z.string().url().nullable(),
  points_reward: z.number().int().min(0),
  difficulty: AchievementDifficultyEnum,
  requirements: achievementRequirementsSchema
});

// TypeScript type derived from schema
export type Achievement = z.infer<typeof achievementSchema>;

// User achievement schema
export const userAchievementSchema = z.object({
  user_id: z.string(),
  achievement_id: z.string(),
  unlocked_at: z.coerce.date(),
  progress: z.record(z.string(), z.any()).optional()
});

export type UserAchievement = z.infer<typeof userAchievementSchema>;

// Input DTOs with validation
export const createAchievementSchema = achievementSchema.omit({ id: true });
export type CreateAchievementDto = z.infer<typeof createAchievementSchema>;

export const updateAchievementSchema = createAchievementSchema.partial();
export type UpdateAchievementDto = z.infer<typeof updateAchievementSchema>;

// User achievement DTOs
export const createUserAchievementSchema = userAchievementSchema.omit({ unlocked_at: true });
export type CreateUserAchievementDto = z.infer<typeof createUserAchievementSchema>;

export const updateUserAchievementProgressSchema = z.object({
  progress: z.record(z.string(), z.any())
});
export type UpdateUserAchievementProgressDto = z.infer<typeof updateUserAchievementProgressSchema>;

/**
 * Database column mapping - maps DB column names to TypeScript property names
 */
export const achievementDbMapping = {
  id: 'id',
  name: 'name',
  description: 'description',
  image_url: 'image_url',
  points_reward: 'points_reward',
  difficulty: 'difficulty',
  requirements: 'requirements'
};

export const userAchievementDbMapping = {
  user_id: 'user_id',
  achievement_id: 'achievement_id',
  unlocked_at: 'unlocked_at',
  progress: 'progress'
};
