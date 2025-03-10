import { Achievement, UserAchievement } from '@/types/profile';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

/**
 * Get all achievements
 */
export async function getAllAchievements(): Promise<Achievement[]> {
  const response = await fetch(`${API_URL}/api/achievements`, {
    next: { revalidate: 3600 }, // Cache for 1 hour
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch achievements');
  }
  
  const data = await response.json();
  return data.data;
}

/**
 * Get achievements by category
 */
export async function getAchievementsByCategory(category: string): Promise<Achievement[]> {
  const response = await fetch(`${API_URL}/api/achievements/category/${category}`, {
    next: { revalidate: 3600 }, // Cache for 1 hour
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch achievements for category ${category}`);
  }
  
  const data = await response.json();
  return data.data;
}

/**
 * Get user achievements
 */
export async function getUserAchievements(): Promise<UserAchievement[]> {
  const response = await fetch(`${API_URL}/api/users/achievements`, {
    next: { revalidate: 60 }, // Revalidate every minute
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch user achievements');
  }
  
  const data = await response.json();
  return data.data;
}

/**
 * Update achievement progress
 */
export async function updateAchievementProgress(
  achievementId: string, 
  progress: number
): Promise<{
  id: string;
  userId: string;
  achievementId: string;
  progress: number;
  unlockedAt: string | null;
  updated: boolean;
}> {
  const response = await fetch(
    `${API_URL}/api/users/achievements/${achievementId}/progress`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ progress }),
    }
  );
  
  if (!response.ok) {
    throw new Error('Failed to update achievement progress');
  }
  
  const data = await response.json();
  return data.data;
}
