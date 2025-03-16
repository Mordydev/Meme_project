/**
 * Streak Model
 * Represents user activity streaks for consistent engagement
 */
import { z } from 'zod';

// Streak activity type enum
export const StreakActivityTypeEnum = z.enum([
  'login',
  'content_creation',
  'engagement',
  'points_earning'
]);
export type StreakActivityType = z.infer<typeof StreakActivityTypeEnum>;

// Period type for streak tracking
export const StreakPeriodTypeEnum = z.enum([
  'daily',    // Track daily activity
  'weekly'    // Track weekly activity
]);
export type StreakPeriodType = z.infer<typeof StreakPeriodTypeEnum>;

// Streak threshold for rewards at specific day counts
export const streakThresholdSchema = z.object({
  days: z.number().int().positive(),
  points_bonus: z.number().int().nonnegative(),
  description: z.string().optional()
});
export type StreakThreshold = z.infer<typeof streakThresholdSchema>;

// Streak definition schema
export const streakDefinitionSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  activity_type: StreakActivityTypeEnum,
  period_type: StreakPeriodTypeEnum,
  thresholds: z.array(streakThresholdSchema),
  description: z.string().max(500).optional(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date().nullable()
});
export type StreakDefinition = z.infer<typeof streakDefinitionSchema>;

// User streak schema - tracks an individual user's streak
export const userStreakSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string(),
  activity_type: StreakActivityTypeEnum,
  current_count: z.number().int().nonnegative(),
  longest_count: z.number().int().nonnegative(),
  last_activity_date: z.coerce.date().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});
export type UserStreak = z.infer<typeof userStreakSchema>;

// Streak milestone schema - tracks when users hit specific streak thresholds
export const streakMilestoneSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string(),
  activity_type: StreakActivityTypeEnum,
  days: z.number().int().positive(),
  reached_at: z.coerce.date(),
  points_awarded: z.number().int().nonnegative()
});
export type StreakMilestone = z.infer<typeof streakMilestoneSchema>;

// Input DTOs 
export const createStreakDefinitionSchema = streakDefinitionSchema
  .omit({ id: true, created_at: true, updated_at: true });
export type CreateStreakDefinitionDto = z.infer<typeof createStreakDefinitionSchema>;

export const updateStreakDefinitionSchema = streakDefinitionSchema
  .omit({ id: true, created_at: true, updated_at: true })
  .partial();
export type UpdateStreakDefinitionDto = z.infer<typeof updateStreakDefinitionSchema>;

// Streak record update output type
export interface StreakUpdate {
  currentStreak: number;
  streakUpdated: boolean;
  lastActivityDate: Date;
  milestoneReached?: number;
  gracePeriodUsed?: boolean;
}

// Database column mappings
export const streakDefinitionDbMapping = {
  id: 'id',
  name: 'name',
  activity_type: 'activity_type',
  period_type: 'period_type',
  thresholds: 'thresholds',
  description: 'description',
  created_at: 'created_at',
  updated_at: 'updated_at'
};

export const userStreakDbMapping = {
  id: 'id',
  user_id: 'user_id',
  activity_type: 'activity_type',
  current_count: 'current_count',
  longest_count: 'longest_count',
  last_activity_date: 'last_activity_date',
  created_at: 'created_at',
  updated_at: 'updated_at'
};

export const streakMilestoneDbMapping = {
  id: 'id',
  user_id: 'user_id',
  activity_type: 'activity_type',
  days: 'days',
  reached_at: 'reached_at',
  points_awarded: 'points_awarded'
};
