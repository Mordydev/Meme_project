/**
 * User Points Repository Types
 */

/**
 * User Points Transaction entity
 */
export interface UserPointsTransaction {
  id: string;
  userId: string;
  amount: number;
  source: string;
  referenceId?: string;
  createdAt: Date;
  description?: string;
}

/**
 * User Points Summary
 */
export interface UserPointsBalance {
  userId: string;
  balance: number;
  transactions: UserPointsTransaction[];
}

/**
 * Points Awarding Interface
 */
export interface PointsAwardInput {
  userId: string;
  amount: number;
  source: string;
  referenceId?: string;
  description?: string;
}

/**
 * Daily Points Summary
 */
export interface DailyPointsSummary {
  source: string;
  total: number;
  lastAwarded: Date;
}