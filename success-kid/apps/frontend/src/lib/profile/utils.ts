import { UserResource } from '@clerk/types';
import { UserStats } from '@/components/features/profile';

/**
 * Formats the user's display name from Clerk user object
 */
export function formatDisplayName(user: UserResource | null): string {
  if (!user) return 'Anonymous User';
  
  if (user.firstName && user.lastName) {
    return `${user.firstName} ${user.lastName}`;
  }
  
  if (user.firstName) {
    return user.firstName;
  }
  
  if (user.username) {
    return user.username;
  }
  
  return 'Anonymous User';
}

/**
 * Gets the first letter of user's name for avatar fallback
 */
export function getNameInitial(user: UserResource | null): string {
  if (!user) return '?';
  
  if (user.firstName) {
    return user.firstName[0].toUpperCase();
  }
  
  if (user.username) {
    return user.username[0].toUpperCase();
  }
  
  return '?';
}

/**
 * Formats the join date in a human-readable format
 */
export function formatJoinDate(dateString?: string | null): string {
  if (!dateString) return 'Recently';
  
  const joinDate = new Date(dateString);
  return joinDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Gets the URL for a user's profile
 */
export function getUserProfileUrl(username: string): string {
  return `/profile/${encodeURIComponent(username)}`;
}

/**
 * Formats stats for display
 */
export function formatStatValue(value: number): string {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }
  
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }
  
  return value.toString();
}

/**
 * Maps achievement difficulty to display names
 */
export function formatDifficulty(difficulty?: string): string {
  switch (difficulty) {
    case 'common':
      return 'Common';
    case 'uncommon':
      return 'Uncommon';
    case 'rare':
      return 'Rare';
    case 'epic':
      return 'Epic';
    default:
      return 'Common';
  }
}

/**
 * Validates username format
 */
export function isValidUsername(username: string): boolean {
  // 3-20 characters, letters, numbers, and underscores only
  return /^[a-zA-Z0-9_]{3,20}$/.test(username);
}

/**
 * Creates mock user stats for development
 */
export function getMockUserStats(userId: string): UserStats {
  // Create deterministic but randomized stats based on userId
  const hash = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const seed = hash % 1000;
  
  return {
    points: seed + 500,
    achievements: (seed % 10) + 2,
    posts: (seed % 30) + 5,
    followers: (seed % 20) + 3,
    following: (seed % 40) + 10,
  };
}
