/**
 * Challenge Model
 * 
 * Defines the Challenge entity, validation schemas, and related data transfer objects.
 * This includes challenge definitions, requirements, rewards, and user progress tracking.
 */
import { z } from 'zod';

// Challenge Difficulty Enum
export const ChallengeDifficultyEnum = z.enum([
  'easy',    // Entry-level challenges
  'medium',  // Moderate difficulty challenges
  'hard',    // Difficult challenges
  'expert'   // Very challenging tasks
]);
export type ChallengeDifficulty = z.infer<typeof ChallengeDifficultyEnum>;

// Challenge Category Enum
export const ChallengeCategoryEnum = z.enum([
  'daily',     // Daily challenges
  'weekly',    // Weekly challenges
  'seasonal',  // Seasonal challenges
  'special',   // Special event challenges
  'onboarding' // New user challenges
]);
export type ChallengeCategory = z.infer<typeof ChallengeCategoryEnum>;

// Challenge Status Enum
export const ChallengeStatusEnum = z.enum([
  'active',     // Currently active challenges
  'upcoming',   // Scheduled for the future
  'completed',  // Finished challenges
  'expired'     // Past challenges that can no longer be completed
]);
export type ChallengeStatus = z.infer<typeof ChallengeStatusEnum>;

// Challenge Requirement Schema
export const challengeRequirementSchema = z.object({
  id: z.string(),
  type: z.string(), // The type of requirement (e.g., 'create_content', 'login', etc.)
  description: z.string(),
  target_value: z.number().int().positive(),
  metadata: z.record(z.string(), z.any()).optional()
});
export type ChallengeRequirement = z.infer<typeof challengeRequirementSchema>;

// Challenge Reward Schema
export const challengeRewardSchema = z.object({
  type: z.enum(['points', 'badge', 'xp', 'custom']),
  value: z.number().int().nonnegative(),
  metadata: z.record(z.string(), z.any()).optional()
});
export type ChallengeReward = z.infer<typeof challengeRewardSchema>;

// Challenge Schema
export const challengeSchema = z.object({
  id: z.string().uuid({ message: 'Invalid challenge ID format' }),
  title: z.string(),
  description: z.string(),
  image_url: z.string().url().nullable(),
  category: ChallengeCategoryEnum,
  difficulty: ChallengeDifficultyEnum,
  start_date: z.coerce.date(),
  end_date: z.coerce.date(),
  requirements: z.array(challengeRequirementSchema),
  rewards: z.array(challengeRewardSchema),
  status: ChallengeStatusEnum,
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});
export type Challenge = z.infer<typeof challengeSchema>;

// User Challenge Schema
export const userChallengeSchema = z.object({
  user_id: z.string(),
  challenge_id: z.string(),
  joined_at: z.coerce.date(),
  completed_at: z.coerce.date().nullable(),
  status: z.enum(['active', 'completed', 'abandoned']),
  updated_at: z.coerce.date()
});
export type UserChallenge = z.infer<typeof userChallengeSchema>;

// User Challenge Progress Schema
export const userChallengeProgressSchema = z.object({
  user_id: z.string(),
  challenge_id: z.string(),
  requirement_id: z.string(),
  current_value: z.number().int().nonnegative(),
  target_value: z.number().int().positive(),
  updated_at: z.coerce.date()
});
export type UserChallengeProgress = z.infer<typeof userChallengeProgressSchema>;

// Challenge Filter Schema
export const challengeFilterSchema = z.object({
  category: ChallengeCategoryEnum.optional(),
  difficulty: ChallengeDifficultyEnum.optional(),
  status: ChallengeStatusEnum.optional(),
  search: z.string().optional()
});
export type ChallengeFilter = z.infer<typeof challengeFilterSchema>;

// Challenge Progress Update Schema
export const challengeProgressUpdateSchema = z.object({
  updated: z.boolean(),
  progressed: z.array(z.object({
    challengeId: z.string(),
    requirements: z.array(z.object({
      requirementId: z.string(),
      currentValue: z.number().int(),
      targetValue: z.number().int()
    }))
  })).optional(),
  completed: z.array(z.object({
    challengeId: z.string(),
    rewards: z.array(challengeRewardSchema)
  })).optional()
});
export type ChallengeProgressUpdate = z.infer<typeof challengeProgressUpdateSchema>;

// Challenge Completion Schema
export const challengeCompletionSchema = z.object({
  challengeId: z.string(),
  userId: z.string(),
  completedAt: z.coerce.date(),
  rewards: z.array(challengeRewardSchema),
  transactionIds: z.array(z.string()).optional() // IDs of any transactions created (e.g., points awards)
});
export type ChallengeCompletion = z.infer<typeof challengeCompletionSchema>;

// Challenge Completed Event
export interface ChallengeCompletedEvent {
  userId: string;
  challengeId: string;
  challenge: {
    title: string;
    category: ChallengeCategory;
    difficulty: ChallengeDifficulty;
  };
  rewards: ChallengeReward[];
  completedAt: Date;
}
