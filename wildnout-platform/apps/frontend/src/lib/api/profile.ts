import { UserProfile, UserAchievement } from '@/types/profile';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

/**
 * Get current user profile
 */
export async function getCurrentProfile(): Promise<{
  profile: UserProfile;
  achievements: UserAchievement[];
}> {
  const response = await fetch(`${API_URL}/api/users/profile`, {
    next: { revalidate: 60 }, // Revalidate every minute
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch profile');
  }
  
  const data = await response.json();
  return data.data;
}

/**
 * Get user profile by username
 */
export async function getUserProfile(username: string): Promise<{
  profile: UserProfile;
  achievements: UserAchievement[];
  isCurrentUser: boolean;
  isFollowing: boolean;
}> {
  const response = await fetch(`${API_URL}/api/users/profile/${username}`, {
    next: { revalidate: 60 }, // Revalidate every minute
  });
  
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('User not found');
    }
    throw new Error('Failed to fetch profile');
  }
  
  const data = await response.json();
  return data.data;
}

/**
 * Update user profile
 */
export async function updateProfile(profileData: Partial<UserProfile>): Promise<{
  profile: UserProfile;
  updated: boolean;
}> {
  const response = await fetch(`${API_URL}/api/users/profile`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(profileData),
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error?.message || 'Failed to update profile');
  }
  
  const data = await response.json();
  return data.data;
}

/**
 * Follow a user
 */
export async function followUser(userId: string): Promise<{
  following: boolean;
  followerId: string;
  followedId: string;
}> {
  const response = await fetch(`${API_URL}/api/users/${userId}/follow`, {
    method: 'POST',
  });
  
  if (!response.ok) {
    throw new Error('Failed to follow user');
  }
  
  const data = await response.json();
  return data.data;
}

/**
 * Unfollow a user
 */
export async function unfollowUser(userId: string): Promise<{
  following: boolean;
  followerId: string;
  followedId: string;
}> {
  const response = await fetch(`${API_URL}/api/users/${userId}/follow`, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    throw new Error('Failed to unfollow user');
  }
  
  const data = await response.json();
  return data.data;
}

/**
 * Get followers of a user
 */
export async function getUserFollowers(
  userId: string, 
  limit = 20, 
  offset = 0
): Promise<{
  id: string;
  userId: string;
  username: string;
  displayName: string;
  imageUrl: string;
  isFollowing: boolean;
}[]> {
  const response = await fetch(
    `${API_URL}/api/users/${userId}/followers?limit=${limit}&offset=${offset}`,
    { next: { revalidate: 300 } } // Cache for 5 minutes
  );
  
  if (!response.ok) {
    throw new Error('Failed to fetch followers');
  }
  
  const data = await response.json();
  return data.data;
}

/**
 * Get users followed by a user
 */
export async function getUserFollowing(
  userId: string, 
  limit = 20, 
  offset = 0
): Promise<{
  id: string;
  userId: string;
  username: string;
  displayName: string;
  imageUrl: string;
  isFollowing: boolean;
}[]> {
  const response = await fetch(
    `${API_URL}/api/users/${userId}/following?limit=${limit}&offset=${offset}`,
    { next: { revalidate: 300 } } // Cache for 5 minutes
  );
  
  if (!response.ok) {
    throw new Error('Failed to fetch following users');
  }
  
  const data = await response.json();
  return data.data;
}
