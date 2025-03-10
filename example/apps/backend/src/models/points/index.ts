/**
 * Points models for the database
 */

export enum PointsSource {
  BATTLE_PARTICIPATION = 'battle_participation',
  BATTLE_WIN = 'battle_win',
  CONTENT_CREATION = 'content_creation',
  CONTENT_ENGAGEMENT = 'content_engagement',
  ACHIEVEMENT_UNLOCKED = 'achievement_unlocked',
  DAILY_LOGIN = 'daily_login',
  PROFILE_COMPLETION = 'profile_completion',
  REFERRAL = 'referral',
  WALLET_CONNECTION = 'wallet_connection',
  ADMIN_GRANT = 'admin_grant',
  SPECIAL_EVENT = 'special_event'
}

export interface PointTransaction {
  id: string;
  userId: string;
  amount: number;
  source: PointsSource | string;
  detail?: string;
  multiplier?: number;
  referenceId?: string;
  referenceType?: string;
  createdAt: Date;
}

export interface UserPointsBalance {
  userId: string;
  totalPoints: number;
  level: number;
  lastUpdated: Date;
}

/**
 * Source-specific daily limits to prevent abuse
 */
export const DAILY_POINTS_LIMITS: Record<PointsSource, number> = {
  [PointsSource.BATTLE_PARTICIPATION]: 500,
  [PointsSource.BATTLE_WIN]: 1000,
  [PointsSource.CONTENT_CREATION]: 500,
  [PointsSource.CONTENT_ENGAGEMENT]: 200,
  [PointsSource.ACHIEVEMENT_UNLOCKED]: Infinity, // No limit on achievement rewards
  [PointsSource.DAILY_LOGIN]: 50, // Limited by nature (once per day)
  [PointsSource.PROFILE_COMPLETION]: 200, // Limited by nature (one-time)
  [PointsSource.REFERRAL]: 1000,
  [PointsSource.WALLET_CONNECTION]: 200, // Limited by nature (one-time)
  [PointsSource.ADMIN_GRANT]: Infinity, // Admin action, no limit
  [PointsSource.SPECIAL_EVENT]: 2000
};

/**
 * Points base values for different actions
 */
export const POINTS_VALUES: Record<PointsSource, number> = {
  [PointsSource.BATTLE_PARTICIPATION]: 50,
  [PointsSource.BATTLE_WIN]: 200,
  [PointsSource.CONTENT_CREATION]: 25,
  [PointsSource.CONTENT_ENGAGEMENT]: 5,
  [PointsSource.ACHIEVEMENT_UNLOCKED]: 0, // Variable based on achievement
  [PointsSource.DAILY_LOGIN]: 10,
  [PointsSource.PROFILE_COMPLETION]: 100,
  [PointsSource.REFERRAL]: 100,
  [PointsSource.WALLET_CONNECTION]: 100,
  [PointsSource.ADMIN_GRANT]: 0, // Variable based on admin action
  [PointsSource.SPECIAL_EVENT]: 0 // Variable based on event
};

/**
 * User level thresholds based on total points
 */
export const LEVEL_THRESHOLDS: number[] = [
  0,      // Level 1: 0+ points
  1000,   // Level 2: 1,000+ points
  2500,   // Level 3: 2,500+ points
  5000,   // Level 4: 5,000+ points
  10000,  // Level 5: 10,000+ points
  25000,  // Level 6: 25,000+ points
  50000,  // Level 7: 50,000+ points
  100000, // Level 8: 100,000+ points
  250000, // Level 9: 250,000+ points
  500000  // Level 10: 500,000+ points
];

/**
 * Calculate user level based on points
 */
export function calculateLevel(points: number): number {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (points >= LEVEL_THRESHOLDS[i]) {
      return i + 1;
    }
  }
  return 1; // Default to level 1
}

/**
 * Calculate points needed for next level
 */
export function pointsToNextLevel(currentPoints: number): number {
  const currentLevel = calculateLevel(currentPoints);
  if (currentLevel >= LEVEL_THRESHOLDS.length) {
    return 0; // Max level reached
  }
  
  return LEVEL_THRESHOLDS[currentLevel] - currentPoints;
}
