/**
 * User profile models for the database
 */

export interface UserProfileModel {
  id: string;
  userId: string;
  username: string;
  displayName: string;
  bio: string;
  imageUrl: string;
  stats: {
    battleCount: number;
    battleWins: number;
    contentCount: number;
    followerCount: number;
    followingCount: number;
    totalPoints: number;
    level: number;
  };
  preferences: {
    notifications: boolean;
    privacy: 'public' | 'private' | 'followers';
    theme: 'default' | 'dark' | 'light';
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface FollowModel {
  id: string;
  followerId: string;
  followedId: string;
  createdAt: Date;
}

/**
 * Calculate user level based on points
 * @param points Total user points
 * @returns Calculated level
 */
export function calculateLevel(points: number): number {
  // Simple logarithmic level calculation
  // Level 1: 0-100 points
  // Level 2: 101-300 points
  // Level 3: 301-600 points
  // Level 4: 601-1000 points
  // etc.
  if (points <= 0) return 1;
  return Math.floor(Math.log(points / 50) / Math.log(1.5)) + 1;
}
