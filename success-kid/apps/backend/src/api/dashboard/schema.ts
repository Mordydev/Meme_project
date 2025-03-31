import { z } from 'zod';

// Transaction Schema
const PointsTransactionSchema = z.object({
  id: z.string(),
  userId: z.string(),
  amount: z.number(),
  source: z.string(),
  referenceId: z.string().optional(),
  description: z.string().optional(),
  createdAt: z.union([z.date(), z.string()])
});

// Cap Status Schema
const CapStatusSchema = z.object({
  used: z.number(),
  limit: z.number()
});

// Points Summary Schema
const PointsSummarySchema = z.object({
  currentBalance: z.number(),
  lifetimeEarned: z.number(),
  redeemedTotal: z.number(),
  dailyEarned: z.number(),
  recentTransactions: z.array(PointsTransactionSchema),
  dailyCapStatus: CapStatusSchema,
  weeklyCapStatus: CapStatusSchema
});

// Achievement Unlock Schema
const AchievementUnlockSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  iconUrl: z.string().optional(),
  pointsAwarded: z.number(),
  unlockedAt: z.union([z.date(), z.string()])
});

// Achievement Progress Schema
const AchievementProgressSchema = z.object({
  id: z.string(),
  name: z.string(),
  iconUrl: z.string().optional(),
  progressPercent: z.number()
});

// Achievements Summary Schema
const AchievementsSummarySchema = z.object({
  recentUnlocks: z.array(AchievementUnlockSchema),
  topInProgress: z.array(AchievementProgressSchema)
});

// Activity Item Schema
const ActivityItemSchema = z.object({
  id: z.string(),
  type: z.string(),
  userId: z.string(),
  userName: z.string().optional(),
  userAvatarUrl: z.string().optional(),
  title: z.string().optional(),
  contentText: z.string().optional(),
  mediaUrls: z.array(z.string()).optional(),
  createdAt: z.union([z.date(), z.string()]),
  stats: z.object({
    comments: z.number().optional(),
    reactions: z.number().optional()
  }).optional()
});

// Activity Summary Schema
const ActivitySummarySchema = z.object({
  recentItems: z.array(ActivityItemSchema)
});

// Market Summary Schema
const MarketSummarySchema = z.object({
  currentPrice: z.number(),
  change24h: z.number(),
  marketCap: z.number(),
  nextMilestoneProgress: z.number()
});

// Referral Summary Schema
const ReferralSummarySchema = z.object({
  referralCode: z.string(),
  successfulReferrals: z.number(),
  pendingReferrals: z.number()
});

// Dashboard Data Schema
export const DashboardDataSchema = z.object({
  points: PointsSummarySchema,
  achievements: AchievementsSummarySchema,
  activity: ActivitySummarySchema,
  market: MarketSummarySchema,
  referral: ReferralSummarySchema
});

// Response Schema
export const GetDashboardResponseSchema = z.object({
  data: DashboardDataSchema,
  meta: z.object({
    timestamp: z.string(),
    fromCache: z.boolean().optional(),
    duration: z.string().optional(),
    services: z.record(z.string()).optional()
  })
});

// Request Schema (currently no parameters needed)
export const GetDashboardRequestSchema = z.object({});

// Type alias for the response based on the Zod schema
export type GetDashboardResponseType = z.infer<typeof GetDashboardResponseSchema>;
