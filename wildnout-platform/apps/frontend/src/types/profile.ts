/**
 * User profile types
 */

export interface UserProfile {
  userId: string;
  username: string;
  displayName: string;
  bio: string;
  imageUrl: string;
  stats: UserStats;
  createdAt: string;
  updatedAt: string;
}

export interface UserStats {
  battleCount: number;
  battleWins: number;
  contentCount: number;
  followerCount: number;
  followingCount: number;
  totalPoints: number;
  level: number;
}

/**
 * Achievement types
 */

export type AchievementCategory = 
  | 'battle' 
  | 'content' 
  | 'community' 
  | 'token' 
  | 'special';

export type AchievementTier = 'bronze' | 'silver' | 'gold' | 'platinum';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  category: AchievementCategory;
  tier: AchievementTier;
  icon: string;
  pointsReward: number;
  criteria: string;
  createdAt: string;
}

export interface UserAchievement {
  id: string;
  userId: string;
  achievementId: string;
  achievement: Achievement;
  unlockedAt: string | null;
  progress: number; // 0-100 percentage
  isUnlocked: boolean;
}

/**
 * User content types
 */

export interface UserContent {
  id: string;
  userId: string;
  type: 'battle' | 'post' | 'comment';
  title?: string;
  body?: string;
  mediaUrl?: string;
  battleId?: string;
  createdAt: string;
  updatedAt: string;
  metrics: {
    viewCount: number;
    reactionCount: number;
    commentCount: number;
  };
}
