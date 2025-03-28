/**
 * Leaderboard Model
 * 
 * Defines the Leaderboard entity, validation schemas, and related data transfer objects.
 * This includes leaderboard categories, time periods, and ranking calculation.
 */
import { z } from 'zod';

// Leaderboard Category Enum
export const LeaderboardCategoryEnum = z.enum([
  'points',       // Total points earned
  'content',      // Content creation
  'engagement',   // Community engagement
  'achievements', // Achievements unlocked
  'referrals',    // Referrals made
  'streak',       // Streak maintenance
  'level',        // User level
  'composite'     // Composite score (multiple factors)
]);
export type LeaderboardCategory = z.infer<typeof LeaderboardCategoryEnum>;

// Leaderboard Time Period Enum
export const LeaderboardPeriodEnum = z.enum([
  'daily',    // Daily rankings
  'weekly',   // Weekly rankings
  'monthly',  // Monthly rankings
  'seasonal', // Seasonal rankings
  'allTime'   // All-time rankings
]);
export type LeaderboardPeriod = z.infer<typeof LeaderboardPeriodEnum>;

// Leaderboard Entry Schema - represents a single entry in a leaderboard
export const leaderboardEntrySchema = z.object({
  user_id: z.string(),
  rank: z.number().int().positive(),
  score: z.number(),
  display_name: z.string(),
  level: z.number().int().positive(),
  avatar_url: z.string().nullable(),
  previous_rank: z.number().int().positive().nullable(), // For tracking movement
  category: LeaderboardCategoryEnum,
  period: LeaderboardPeriodEnum,
  updated_at: z.coerce.date()
});
export type LeaderboardEntry = z.infer<typeof leaderboardEntrySchema>;

// Leaderboard Options Schema - used for fetching leaderboards
export const leaderboardOptionsSchema = z.object({
  limit: z.number().int().positive().default(100),
  offset: z.number().int().nonnegative().default(0),
  includeCurrentUser: z.boolean().default(true),
  extendedProfiles: z.boolean().default(false)
});
export type LeaderboardOptions = z.infer<typeof leaderboardOptionsSchema>;

// Leaderboard Result Schema - returned from leaderboard queries
export const leaderboardResultSchema = z.object({
  category: LeaderboardCategoryEnum,
  period: LeaderboardPeriodEnum,
  entries: z.array(leaderboardEntrySchema),
  total: z.number().int().nonnegative(),
  lastUpdated: z.coerce.date(),
  userEntry: leaderboardEntrySchema.nullable()
});
export type LeaderboardResult = z.infer<typeof leaderboardResultSchema>;

// User Rank Schema - for querying a specific user's rank
export const userRankSchema = z.object({
  userId: z.string(),
  rank: z.number().int().positive(),
  score: z.number(),
  category: LeaderboardCategoryEnum,
  period: LeaderboardPeriodEnum,
  percentile: z.number().min(0).max(100), // Percentile ranking (0-100)
  aboveUser: leaderboardEntrySchema.nullable(),
  belowUser: leaderboardEntrySchema.nullable(),
  movement: z.number().int() // Positive for improvement, negative for decline
});
export type UserRank = z.infer<typeof userRankSchema>;

// Ranking Weights Schema - used for composite ranking calculation
export const rankingWeightsSchema = z.object({
  points: z.number().min(0).max(1),
  content: z.number().min(0).max(1),
  engagement: z.number().min(0).max(1),
  achievements: z.number().min(0).max(1),
  longevity: z.number().min(0).max(1)
});
export type RankingWeights = z.infer<typeof rankingWeightsSchema>;

// Default ranking weights
export const DEFAULT_RANKING_WEIGHTS: RankingWeights = {
  points: 0.3,        // 30% weight for points
  content: 0.25,      // 25% weight for content creation
  engagement: 0.2,    // 20% weight for engagement
  achievements: 0.15, // 15% weight for achievements
  longevity: 0.1      // 10% weight for account longevity
};

// Leaderboard Refresh Schedule (how often each period is recalculated)
export const LEADERBOARD_REFRESH_SCHEDULE = {
  daily: 60 * 60 * 1000,       // 1 hour in milliseconds
  weekly: 6 * 60 * 60 * 1000,  // 6 hours in milliseconds
  monthly: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
  seasonal: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
  allTime: 24 * 60 * 60 * 1000  // 24 hours in milliseconds
};

// Timestamp format for leaderboard cache keys
export const getLeaderboardTimePeriod = (period: LeaderboardPeriod): string => {
  const now = new Date();
  
  switch (period) {
    case 'daily':
      return `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
    case 'weekly':
      // Get ISO week number
      const d = new Date(now);
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7);
      const week = Math.floor((d.getTime() - new Date(d.getFullYear(), 0, 4).getTime()) / 86400000 / 7) + 1;
      return `${now.getFullYear()}-W${week}`;
    case 'monthly':
      return `${now.getFullYear()}-${now.getMonth() + 1}`;
    case 'seasonal':
      // Simplified seasons: Q1, Q2, Q3, Q4
      const quarter = Math.floor(now.getMonth() / 3) + 1;
      return `${now.getFullYear()}-Q${quarter}`;
    case 'allTime':
      return 'all-time';
    default:
      return 'unknown';
  }
};

// Leaderboard cache TTL values (in seconds)
export const LEADERBOARD_CACHE_TTL = {
  daily: 60 * 5,        // 5 minutes
  weekly: 60 * 15,      // 15 minutes
  monthly: 60 * 60,     // 1 hour
  seasonal: 60 * 60 * 2, // 2 hours
  allTime: 60 * 60 * 6   // 6 hours
};
