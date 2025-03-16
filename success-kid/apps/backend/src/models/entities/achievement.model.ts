/**
 * Achievement Model
 * 
 * Defines the Achievement entity, validation schemas, and related data transfer objects.
 * Achievements are awarded to users for completing specific actions or milestones.
 */
import { z } from 'zod';

// Achievement Difficulty Enum
export const AchievementDifficultyEnum = z.enum(['common', 'uncommon', 'rare', 'epic', 'legendary']);
export type AchievementDifficulty = z.infer<typeof AchievementDifficultyEnum>;

// Achievement Category Enum
export const AchievementCategoryEnum = z.enum([
  'content',               // Content creation achievements
  'community',             // Community interaction achievements
  'points',                // Points milestones
  'profile',               // Profile completion achievements
  'wallet',                // Wallet and token achievements
  'streak',                // Login streak achievements
  'referral',              // Referral achievements
  'special',               // Special event achievements
  'hidden'                 // Hidden/secret achievements
]);

export type AchievementCategory = z.infer<typeof AchievementCategoryEnum>;

// Achievement Requirements Schema
// This defines the criteria needed to unlock an achievement
export const achievementRequirementsSchema = z.object({
  // Generic counters (for threshold-based achievements)
  count: z.number().int().optional(),              // Generic counter (e.g., "create 10 posts")
  threshold: z.number().int().optional(),          // Value that must be reached
  
  // Specific requirement types
  contentCount: z.number().int().optional(),       // Number of content items created
  commentCount: z.number().int().optional(),       // Number of comments posted
  reactionCount: z.number().int().optional(),      // Number of reactions received
  loginDays: z.number().int().optional(),          // Consecutive login days
  pointsEarned: z.number().int().optional(),       // Total points earned
  referralCount: z.number().int().optional(),      // Number of successful referrals
  profileCompletion: z.boolean().optional(),       // Whether profile is complete
  walletConnected: z.boolean().optional(),         // Whether wallet is connected
  
  // Special/custom requirements
  customRequirement: z.string().optional(),        // Custom requirement logic identifier
  metadata: z.record(z.string(), z.any()).optional() // Additional metadata
});

export type AchievementRequirements = z.infer<typeof achievementRequirementsSchema>;

// Achievement Zod Schema
export const achievementSchema = z.object({
  id: z.string().uuid({ message: 'Invalid achievement ID format' }),
  name: z.string().min(1).max(100),
  description: z.string().min(1).max(500),
  image_url: z.string().url().nullable(),
  points_reward: z.number().int().nonnegative().default(0),
  difficulty: AchievementDifficultyEnum,
  category: AchievementCategoryEnum,
  requirements: achievementRequirementsSchema,
  is_public: z.boolean().default(true),
  created_at: z.coerce.date().optional(),
  updated_at: z.coerce.date().optional()
});

// TypeScript Achievement Type derived from Zod schema
export type Achievement = z.infer<typeof achievementSchema>;

// Create Achievement Input Schema
export const createAchievementSchema = achievementSchema
  .omit({ 
    id: true,
    created_at: true,
    updated_at: true
  })
  .required({
    name: true,
    description: true,
    difficulty: true,
    category: true,
    requirements: true
  });

// Create Achievement DTO Type
export type CreateAchievementDto = z.infer<typeof createAchievementSchema>;

// Update Achievement Input Schema
export const updateAchievementSchema = achievementSchema
  .omit({ 
    id: true,
    created_at: true,
    updated_at: true
  })
  .partial();

// Update Achievement DTO Type
export type UpdateAchievementDto = z.infer<typeof updateAchievementSchema>;

// User Achievement Schema (junction table)
export const userAchievementSchema = z.object({
  user_id: z.string().uuid({ message: 'Invalid user ID format' }),
  achievement_id: z.string().uuid({ message: 'Invalid achievement ID format' }),
  unlocked_at: z.coerce.date(),
  progress: z.record(z.string(), z.any()).default({}),
  notified: z.boolean().default(false)
});

// User Achievement Type
export type UserAchievement = z.infer<typeof userAchievementSchema>;

// Achievement Progress Schema (for tracking progress)
export const achievementProgressSchema = z.object({
  user_id: z.string().uuid(),
  achievement_id: z.string().uuid(),
  current: z.number().int().nonnegative(),
  required: z.number().int().positive(),
  percentage: z.number().min(0).max(100),
  isComplete: z.boolean(),
  progress: z.record(z.string(), z.any()).optional()
});

// Achievement Progress Type
export type AchievementProgress = z.infer<typeof achievementProgressSchema>;

// Achievement Notification Schema (for WebSocket events)
export const achievementNotificationSchema = z.object({
  achievement: achievementSchema,
  unlocked_at: z.coerce.date(),
  points_awarded: z.number().int().nonnegative(),
  user_id: z.string().uuid()
});

// Achievement Notification Type
export type AchievementNotification = z.infer<typeof achievementNotificationSchema>;

// Achievement with User Progress (for achievement list views)
export interface AchievementWithProgress extends Achievement {
  progress?: {
    current: number;
    required: number;
    percentage: number;
    isComplete: boolean;
    unlocked_at?: Date;
  };
}
