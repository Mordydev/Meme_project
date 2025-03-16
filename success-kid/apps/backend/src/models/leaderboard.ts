/**
 * Leaderboard Model
 * Represents leaderboard configurations and user rankings
 */
import { z } from 'zod';

// Leaderboard category enum
export const LeaderboardCategoryEnum = z.enum([
  'points',          // Total points earned
  'content',         // Content creation
  'engagement',      // Overall engagement (comments, reactions)
  'referrals',       // Referral performance
  'achievements',    // Achievements unlocked
  'streak',          // Streak lengths
  'level',           // User level
  'token_holder'     // Token holding (if wallet connected)
]);
export type LeaderboardCategory = z.infer<typeof LeaderboardCategoryEnum>;

// Leaderboard time period enum
export const LeaderboardPeriodEnum = z.enum([
  'daily',
  'weekly',
  'monthly',
  'all_time',
  'season'          // For seasonal competitions
]);
export type LeaderboardPeriod = z.infer<typeof LeaderboardPeriodEnum>;

// Leaderboard configuration schema
export const leaderboardConfigSchema = z.object({
  id: z.string().uuid(),
  category: LeaderboardCategoryEnum,
  period: LeaderboardPeriodEnum,
  title: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  is_active: z.boolean().default(true),
  display_limit: z.number().int().positive(),
  reset_schedule: z.string().optional(), // CRON expression for reset timing
  metadata: z.record(z.string(), z.any()).optional()
});
export type LeaderboardConfig = z.infer<typeof leaderboardConfigSchema>;

// Leaderboard entry schema
export const leaderboardEntrySchema = z.object({
  id: z.string().uuid(),
  leaderboard_id: z.string().uuid(),
  user_id: z.string(),
  rank: z.number().int().nonnegative(),
  score: z.number().nonnegative(),
  previous_rank: z.number().int().nonnegative().optional(),
  timestamp: z.coerce.date()
});
export type LeaderboardEntry = z.infer<typeof leaderboardEntrySchema>;

// User ranking response
export interface UserRank {
  userId: string;
  rank: number;
  score: number;
  previousRank?: number;
  category: LeaderboardCategory;
  period: LeaderboardPeriod;
  rankChange?: number;
  percentile?: number;
  displayName?: string;
  avatarUrl?: string;
  level?: number;
}

// Leaderboard result response
export interface LeaderboardResult {
  category: LeaderboardCategory;
  period: LeaderboardPeriod;
  title: string;
  description?: string;
  lastUpdated: string; // ISO date string
  entries: UserRank[];
  total: number;
}

// Database column mappings
export const leaderboardConfigDbMapping = {
  id: 'id',
  category: 'category',
  period: 'period',
  title: 'title',
  description: 'description',
  is_active: 'is_active',
  display_limit: 'display_limit',
  reset_schedule: 'reset_schedule',
  metadata: 'metadata'
};

export const leaderboardEntryDbMapping = {
  id: 'id',
  leaderboard_id: 'leaderboard_id',
  user_id: 'user_id',
  rank: 'rank',
  score: 'score',
  previous_rank: 'previous_rank',
  timestamp: 'timestamp'
};

// Input DTOs
export const createLeaderboardConfigSchema = leaderboardConfigSchema
  .omit({ id: true })
  .extend({
    metadata: z.record(z.string(), z.any()).optional(),
    is_active: z.boolean().optional()
  });
export type CreateLeaderboardConfigDto = z.infer<typeof createLeaderboardConfigSchema>;

export const updateLeaderboardConfigSchema = leaderboardConfigSchema
  .omit({ id: true })
  .partial();
export type UpdateLeaderboardConfigDto = z.infer<typeof updateLeaderboardConfigSchema>;

// Leaderboard options for fetching
export interface LeaderboardOptions {
  limit?: number;
  offset?: number;
  includeUserDetails?: boolean;
  aroundUserId?: string; // Get entries around a specific user
  aroundRank?: number;   // Number of positions around the user to include
}
