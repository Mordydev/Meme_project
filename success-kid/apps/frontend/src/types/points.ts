/**
 * Types for the points system
 */

/**
 * Available point source types
 */
export type PointSource =
  | 'login'
  | 'content_creation'
  | 'comment'
  | 'upvote_received'
  | 'upvote_given'
  | 'achievement'
  | 'referral'
  | 'daily_login_streak'
  | 'profile_completion'
  | 'wallet_connection';

/**
 * Point transaction record
 */
export interface PointTransaction {
  id: string;
  userId: string;
  amount: number;
  source: PointSource;
  referenceId?: string;
  description?: string;
  createdAt: string;
}

/**
 * User points summary
 */
export interface PointsSummary {
  balance: number;
  earned24h: number;
  lifetimeEarned: number;
  lifetimeRedeemed: number;
}
