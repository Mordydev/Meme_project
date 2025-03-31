// Dashboard API Types
// These types define the structure of data returned by the Dashboard API

/**
 * Points summary for the dashboard
 */
export interface PointsSummary {
  currentBalance: number;
  lifetimeEarned: number;
  redeemedTotal: number;
  dailyEarned: number;
  recentTransactions: PointsTransaction[];
  dailyCapStatus: CapStatus;
  weeklyCapStatus: CapStatus;
}

/**
 * Achievements summary for the dashboard
 */
export interface AchievementsSummary {
  recentUnlocks: AchievementUnlock[];
  topInProgress: AchievementProgress[];
}

/**
 * Activity summary for the dashboard
 */
export interface ActivitySummary {
  recentItems: ActivityItem[];
}

/**
 * Market summary for the dashboard
 */
export interface MarketSummary {
  currentPrice: number;
  change24h: number;
  marketCap: number;
  nextMilestoneProgress: number;
}

/**
 * Referral summary for the dashboard
 */
export interface ReferralSummary {
  referralCode: string;
  successfulReferrals: number;
  pendingReferrals: number;
}

/**
 * Main dashboard data structure
 */
export interface DashboardData {
  points: PointsSummary;
  achievements: AchievementsSummary;
  activity: ActivitySummary;
  market: MarketSummary;
  referral: ReferralSummary;
}

/**
 * Points transaction for the dashboard
 */
export interface PointsTransaction {
  id: string;
  userId: string;
  amount: number;
  source: string;
  referenceId?: string;
  description?: string;
  createdAt: Date | string;
}

/**
 * Cap status for daily/weekly points limits
 */
export interface CapStatus {
  used: number;
  limit: number;
}

/**
 * Achievement unlock for the dashboard
 */
export interface AchievementUnlock {
  id: string;
  name: string;
  description?: string;
  iconUrl?: string;
  pointsAwarded: number;
  unlockedAt: Date | string;
}

/**
 * Achievement in progress for the dashboard
 */
export interface AchievementProgress {
  id: string;
  name: string;
  iconUrl?: string;
  progressPercent: number;
}

/**
 * Activity item for the dashboard
 */
export interface ActivityItem {
  id: string;
  type: string;
  userId: string;
  userName?: string;
  userAvatarUrl?: string;
  title?: string;
  contentText?: string;
  mediaUrls?: string[];
  createdAt: Date | string;
  stats?: {
    comments?: number;
    reactions?: number;
  };
}

/**
 * Get dashboard request parameters
 */
export interface GetDashboardRequest {
  // Currently no parameters needed, authentication is handled through request.user
}
