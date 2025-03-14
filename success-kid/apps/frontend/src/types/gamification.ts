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

/**
 * Competition Status
 */
export type CompetitionStatus = 'active' | 'upcoming' | 'past' | 'all';

/**
 * Competition Type
 */
export type CompetitionType = 'individual' | 'team';

/**
 * Participation Status
 */
export type ParticipationStatus = 'participating' | 'eligible' | 'ineligible';

/**
 * Competition Objective Type
 */
export type ObjectiveType = 'posts' | 'comments' | 'reactions' | 'referrals' | 'achievements' | 'custom';

/**
 * Competition Reward Type
 */
export type RewardType = 'points' | 'badge' | 'token';

/**
 * Competition Objective
 */
export interface CompetitionObjective {
  id: string;
  description: string;
  type: ObjectiveType;
  target: number;
  currentProgress?: number;
  completed?: boolean;
}

/**
 * Competition Reward
 */
export interface CompetitionReward {
  rank: number | string; // number for specific rank, string for ranges like "top 10"
  type: RewardType;
  value: number | string;
  description: string;
  imageUrl?: string;
}

/**
 * Competition Ranking Entry
 */
export interface CompetitionRanking {
  rank: number;
  userId: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  score: number;
  progress: Record<string, number>; // Objective progress
}

/**
 * Competition Entry
 */
export interface Competition {
  id: string;
  title: string;
  description: string;
  status: 'active' | 'upcoming' | 'past';
  type: CompetitionType;
  startDate: string;
  endDate: string;
  rules?: string;
  objectives: CompetitionObjective[];
  rewards: CompetitionReward[];
  participantCount: number;
  leaderboard?: CompetitionRanking[];
  userStatus?: ParticipationStatus;
  userProgress?: {
    isParticipating: boolean;
    currentRank?: number;
    score?: number;
    progress?: Record<string, number>;
  };
  teamBased: boolean;
}

/**
 * Team Member
 */
export interface TeamMember {
  userId: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  joinedAt: string;
  contribution: number; // Percentage of team score
  score: number;
}

/**
 * Team
 */
export interface Team {
  id: string;
  name: string;
  description?: string;
  competitionId: string;
  members: TeamMember[];
  memberCount: number;
  score: number;
  rank?: number;
  change?: number;
  createdAt: string;
  createdBy: string;
  inviteCode?: string;
}
