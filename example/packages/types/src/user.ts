/**
 * User types for the Wild 'n Out platform
 */

export interface User {
  id: string;
  username: string;
  email: string;
  displayName: string;
  bio?: string;
  avatarUrl?: string;
  pointsBalance: number;
  level: number;
  walletAddress?: string;
  lastActive: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserAchievement {
  id: string;
  userId: string;
  achievementId: string;
  unlockedAt: Date;
  progress?: number; // For incomplete achievements
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  criteria: string;
  pointsReward: number;
  category: string;
  tier: 'bronze' | 'silver' | 'gold';
}
