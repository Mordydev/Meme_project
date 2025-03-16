/**
 * User Achievement Model
 * Represents achievements that have been unlocked by users
 */
import { z } from 'zod';

// User achievement schema with validation
export const userAchievementSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string(),
  achievement_id: z.string().uuid(),
  unlocked_at: z.coerce.date(),
  progress: z.number().min(0).max(100).optional(), // For partial progress tracking
  metadata: z.record(z.string(), z.any()).optional() // Additional data about the unlock
});

// TypeScript type derived from schema
export type UserAchievement = z.infer<typeof userAchievementSchema>;

// Input DTOs with validation
export const createUserAchievementSchema = userAchievementSchema
  .omit({ id: true })
  .extend({
    progress: z.number().min(0).max(100).optional(),
    metadata: z.record(z.string(), z.any()).optional()
  });

export type CreateUserAchievementDto = z.infer<typeof createUserAchievementSchema>;

export const updateUserAchievementSchema = userAchievementSchema
  .omit({ id: true, user_id: true, achievement_id: true, unlocked_at: true })
  .partial();

export type UpdateUserAchievementDto = z.infer<typeof updateUserAchievementSchema>;

/**
 * User Achievement Progress schema for tracking partial progress
 */
export const userAchievementProgressSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string(),
  achievement_id: z.string().uuid(),
  current_value: z.number().int().nonnegative(),
  updated_at: z.coerce.date()
});

export type UserAchievementProgress = z.infer<typeof userAchievementProgressSchema>;

/**
 * Database column mapping - maps DB column names to TypeScript property names
 */
export const userAchievementDbMapping = {
  id: 'id',
  user_id: 'user_id',
  achievement_id: 'achievement_id',
  unlocked_at: 'unlocked_at',
  progress: 'progress',
  metadata: 'metadata'
};

export const userAchievementProgressDbMapping = {
  id: 'id',
  user_id: 'user_id',
  achievement_id: 'achievement_id',
  current_value: 'current_value',
  updated_at: 'updated_at'
};
