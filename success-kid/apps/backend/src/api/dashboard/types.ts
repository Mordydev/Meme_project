// Placeholder types - will be refined based on actual service responses
// Assuming types exist in other modules or will be created

// Example: Assuming PointTransaction, AchievementStatus, ActivityItem, MarketStats, ReferralInfo types exist
// import { PointTransaction } from '../points/types'; // Example
// import { AchievementStatus } from '../achievements/types'; // Example
// import { ActivityItem } from '../activity/types'; // Example
// import { MarketStats } from '../market/types'; // Example

interface PointsSummary {
  currentBalance: number;
  lifetimeEarned: number;
  redeemedTotal: number;
  dailyEarned: number;
  recentTransactions: any[]; // Replace 'any' with actual PointTransaction type
  dailyCapStatus: { used: number; limit: number };
  weeklyCapStatus: { used: number; limit: number };
}

interface AchievementsSummary {
  recentUnlocks: any[]; // Replace 'any' with actual AchievementStatus type
  topInProgress: any[]; // Replace 'any' with actual AchievementStatus type (with progress)
}

interface ActivitySummary {
  recentItems: any[]; // Replace 'any' with actual ActivityItem type
}

interface MarketSummary {
  currentPrice: number;
  change24h: number;
  marketCap: number;
  nextMilestoneProgress: number;
}

interface ReferralSummary {
  referralCode: string;
  successfulReferrals: number;
}

export interface DashboardData {
  points: PointsSummary;
  achievements: AchievementsSummary;
  activity: ActivitySummary;
  market: MarketSummary;
  referral: ReferralSummary;
}

// Type for the Fastify route handler context or request
export interface GetDashboardRequest {
  // Potentially include user ID if not automatically inferred from auth middleware
  // userId: string;
}
