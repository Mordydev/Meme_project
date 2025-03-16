/**
 * Streak Model
 * 
 * Defines the Streak entity, validation schemas, and related data transfer objects.
 * This includes streak definitions, user streak tracking, and streak milestone rewards.
 */
import { z } from 'zod';

// Streak Period Type
export const StreakPeriodEnum = z.enum([
  'daily',    // Daily streaks (most common)
  'weekly'    // Weekly streaks (for recurring activities)
]);
export type StreakPeriod = z.infer<typeof StreakPeriodEnum>;

// Streak Activity Type - what activities can be tracked with streaks
export const StreakActivityTypeEnum = z.enum([
  'login',           // Daily login
  'content_creation', // Creating content
  'engagement',      // General engagement (comments, reactions)
  'challenge',       // Challenge participation
  'custom'           // Custom streak types
]);
export type StreakActivityType = z.infer<typeof StreakActivityTypeEnum>;

// Streak Threshold Schema
export const streakThresholdSchema = z.object({
  count: z.number().int().positive(),
  bonus_points: z.number().int().nonnegative()
});
export type StreakThreshold = z.infer<typeof streakThresholdSchema>;

// Streak Definition Schema
export const streakDefinitionSchema = z.object({
  id: z.string().uuid({ message: 'Invalid streak definition ID format' }),
  name: z.string(),
  activity_type: StreakActivityTypeEnum,
  period_type: StreakPeriodEnum,
  thresholds: z.array(streakThresholdSchema),
  bonus_formula: z.string().optional(), // Formula for calculating bonus points (e.g., 'base * streakDays')
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});
export type StreakDefinition = z.infer<typeof streakDefinitionSchema>;

// User Streak Schema
export const userStreakSchema = z.object({
  user_id: z.string(),
  streak_id: z.string(),
  current_count: z.number().int().nonnegative(),
  longest_count: z.number().int().nonnegative(),
  last_activity_date: z.coerce.date().nullable(),
  grace_period_used: z.boolean().default(false),
  updated_at: z.coerce.date()
});
export type UserStreak = z.infer<typeof userStreakSchema>;

// Streak Update Schema - used for response when recording streak activity
export const streakUpdateSchema = z.object({
  currentStreak: z.number().int().nonnegative(),
  streakUpdated: z.boolean(),
  lastActivityDate: z.coerce.date(),
  milestoneReached: z.number().int().positive().optional(),
  gracePeriodUsed: z.boolean().optional()
});
export type StreakUpdate = z.infer<typeof streakUpdateSchema>;

// Streak Status Schema - used for querying streak status
export const streakStatusSchema = z.object({
  userId: z.string(),
  streakId: z.string(),
  activityType: StreakActivityTypeEnum,
  currentCount: z.number().int().nonnegative(),
  longestCount: z.number().int().nonnegative(),
  lastActivityDate: z.coerce.date().nullable(),
  nextMilestone: z.number().int().positive().optional(),
  pointsForNextMilestone: z.number().int().nonnegative().optional(),
  isActiveToday: z.boolean()
});
export type StreakStatus = z.infer<typeof streakStatusSchema>;

// Streak Milestone Event
export interface StreakMilestoneEvent {
  userId: string;
  streakId: string;
  activityType: StreakActivityType;
  streakCount: number;
  bonusPoints: number;
  timestamp: Date;
}

// Activity Data for recording streak activity
export interface ActivityData {
  userId: string;
  activityType: StreakActivityType;
  timestamp?: Date;
  metadata?: Record<string, any>;
}

// Default streak thresholds
export const DEFAULT_STREAK_THRESHOLDS: StreakThreshold[] = [
  { count: 3, bonus_points: 15 },   // 3-day streak
  { count: 7, bonus_points: 50 },   // 7-day streak
  { count: 14, bonus_points: 100 },  // 14-day streak
  { count: 30, bonus_points: 250 },  // 30-day streak
  { count: 60, bonus_points: 500 },  // 60-day streak
  { count: 90, bonus_points: 750 },  // 90-day streak
  { count: 180, bonus_points: 1500 }, // 180-day streak
  { count: 365, bonus_points: 5000 }  // 365-day streak
];

// Predefined streak definitions
export const PREDEFINED_STREAKS: Omit<StreakDefinition, 'id' | 'created_at' | 'updated_at'>[] = [
  {
    name: 'Daily Login Streak',
    activity_type: 'login',
    period_type: 'daily',
    thresholds: DEFAULT_STREAK_THRESHOLDS,
    bonus_formula: 'basePoints * 0.1 * streakDays' // 10% extra points per streak day
  },
  {
    name: 'Content Creation Streak',
    activity_type: 'content_creation',
    period_type: 'daily',
    thresholds: DEFAULT_STREAK_THRESHOLDS,
    bonus_formula: 'basePoints * 0.15 * streakDays' // 15% extra points per streak day
  },
  {
    name: 'Engagement Streak',
    activity_type: 'engagement',
    period_type: 'daily',
    thresholds: DEFAULT_STREAK_THRESHOLDS,
    bonus_formula: 'basePoints * 0.05 * streakDays' // 5% extra points per streak day
  }
];
