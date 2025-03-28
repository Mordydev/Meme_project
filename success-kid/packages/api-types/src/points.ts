/**
 * Points-related type definitions
 */

export interface PointsTransaction {
  id: string;
  userId: string;
  amount: number;
  source: PointsSource;
  referenceId?: string;
  description?: string;
  createdAt: string;
}

export enum PointsSource {
  CONTENT_CREATION = 'content_creation',
  COMMENT = 'comment',
  UPVOTE_RECEIVED = 'upvote_received',
  UPVOTE_GIVEN = 'upvote_given',
  DAILY_LOGIN = 'daily_login',
  STREAK_BONUS = 'streak_bonus',
  ACHIEVEMENT = 'achievement',
  LEVEL_UP = 'level_up',
  PROFILE_COMPLETION = 'profile_completion',
  WALLET_CONNECTION = 'wallet_connection',
  REFERRAL = 'referral',
  REDEMPTION = 'redemption',
  SYSTEM_REWARD = 'system_reward',
  CORRECTION = 'correction'
}

export interface PointsBalance {
  userId: string;
  total: number;
  available: number;
  pending: number;
  lastUpdated: string;
}

export interface AwardPointsRequest {
  userId: string;
  amount: number;
  source: PointsSource;
  referenceId?: string;
  description?: string;
}

export interface AwardPointsResponse {
  transaction: PointsTransaction;
  newBalance: number;
}

export interface RedeemPointsRequest {
  amount: number;
}

export interface RedeemPointsResponse {
  transactionId: string;
  pointsAmount: number;
  tokenAmount: number;
  status: 'processing' | 'completed' | 'failed';
  estimatedCompletionTime?: string;
}

export interface PointsHistoryRequest {
  userId?: string;
  startDate?: string;
  endDate?: string;
  sources?: PointsSource[];
  page?: number;
  pageSize?: number;
}

export interface DailyCapStatus {
  source: PointsSource;
  current: number;
  limit: number;
  remaining: number;
  resetsAt: string;
}
