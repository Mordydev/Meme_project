import { z } from 'zod';
import { DashboardData } from './types'; // Import the main data type

// Define Zod schemas based on the interfaces in types.ts
// These are placeholders and should be refined with actual data constraints

const PointsSummarySchema = z.object({
  currentBalance: z.number(),
  lifetimeEarned: z.number(),
  redeemedTotal: z.number(),
  dailyEarned: z.number(),
  recentTransactions: z.array(z.any()), // Replace z.any() with specific transaction schema
  dailyCapStatus: z.object({ used: z.number(), limit: z.number() }),
  weeklyCapStatus: z.object({ used: z.number(), limit: z.number() }),
});

const AchievementsSummarySchema = z.object({
  recentUnlocks: z.array(z.any()), // Replace z.any() with specific achievement schema
  topInProgress: z.array(z.any()), // Replace z.any() with specific achievement schema
});

const ActivitySummarySchema = z.object({
  recentItems: z.array(z.any()), // Replace z.any() with specific activity item schema
});

const MarketSummarySchema = z.object({
  currentPrice: z.number(),
  change24h: z.number(),
  marketCap: z.number(),
  nextMilestoneProgress: z.number(),
});

const ReferralSummarySchema = z.object({
  referralCode: z.string(),
  successfulReferrals: z.number(),
});

// Main schema for the dashboard response
export const GetDashboardResponseSchema = z.object({
  data: z.object({
    points: PointsSummarySchema,
    achievements: AchievementsSummarySchema,
    activity: ActivitySummarySchema,
    market: MarketSummarySchema,
    referral: ReferralSummarySchema,
  }),
  // Optionally add metadata for pagination, timestamps, etc.
  // meta: z.object({ ... })
});

// Type alias for the response based on the Zod schema
export type GetDashboardResponseType = z.infer<typeof GetDashboardResponseSchema>;

// Schema for request validation (if needed, e.g., query params)
// export const GetDashboardRequestSchema = z.object({ ... });
