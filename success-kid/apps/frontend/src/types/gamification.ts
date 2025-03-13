/**
 * Gamification Types
 * 
 * This file contains type definitions for the achievement and gamification system.
 */

/**
 * Achievement Definition
 * 
 * Represents an achievement that can be unlocked by a user.
 */
export interface Achievement {
  id: string;
  title: string;
  description: string;
  category: AchievementCategory;
  badgeUrl: string;
  requirements: any; // Achievement-specific criteria
  pointsReward: number;
  difficulty: AchievementDifficulty;
  hidden?: boolean;
}

/**
 * Achievement Progress
 * 
 * Tracks a user's progress toward unlocking an achievement.
 */
export interface AchievementProgress {
  id: string;          // Achievement ID
  progress: number;    // Progress percentage (0-100)
  criteria: {          // Detailed completion criteria status
    [key: string]: {
      current: number;
      target: number;
      completed: boolean;
    }
  };
  unlocked: boolean;
  unlockedAt?: string;
}

/**
 * Achievement with Progress
 * 
 * Combined type for achievement definition and user progress.
 */
export interface AchievementWithProgress extends Achievement {
  progress: number;    // Progress percentage (0-100)
  unlocked: boolean;
  unlockedAt?: string;
  criteria?: {
    [key: string]: {
      current: number;
      target: number;
      completed: boolean;
    }
  };
}

/**
 * Achievement Event
 * 
 * Represents an event that can trigger achievement progress or unlocks.
 */
export interface AchievementEvent {
  type: string;
  metadata: {
    [key: string]: any;
  };
  userId: string;
  timestamp: string;
}

/**
 * Achievement Notification
 * 
 * Data used for showing achievement unlock notifications.
 */
export interface AchievementNotification {
  achievementId: string;
  title: string;
  description: string;
  badgeUrl: string;
  pointsAwarded: number;
  unlockedAt: string;
}

/**
 * Achievement Categories
 */
export type AchievementCategory = 
  | 'onboarding'
  | 'engagement'
  | 'content'
  | 'community'
  | 'wallet'
  | 'referral'
  | 'milestones';

/**
 * Achievement Difficulty Levels
 */
export type AchievementDifficulty = 
  | 'common'
  | 'uncommon'
  | 'rare'
  | 'epic';

/**
 * User Level Data
 */
export interface UserLevelData {
  level: number;
  title: string;
  currentPoints: number;
  nextLevelPoints: number;
  progress: number; // 0-100 percentage
  benefits: string[];
  badges: {
    current: string; // Badge URL
    next?: string;
  };
}

/**
 * Leaderboard User Entry
 */
export interface LeaderboardUser {
  rank: number;
  userId: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  level: number;
  score: number;
  change?: number; // Position change since last period
}

/**
 * Leaderboard Period Type
 */
export type LeaderboardPeriod = 'daily' | 'weekly' | 'monthly' | 'all-time';

/**
 * Leaderboard Category
 */
export type LeaderboardCategory = 'points' | 'achievements' | 'content' | 'referrals';

/**
 * Gamification Analytics Data
 */
export interface GamificationAnalytics {
  totalAchievements: number;
  unlockedCount: number;
  completion: number; // percentage
  categoryBreakdown: Array<{
    category: AchievementCategory;
    total: number;
    unlocked: number;
    percentage: number;
  }>;
  recentUnlocks: Array<{
    id: string;
    title: string;
    badgeUrl: string;
    unlockedAt: string;
  }>;
  suggestedGoals: Array<{
    id: string;
    title: string;
    badgeUrl: string;
    progress: number;
  }>;
}
