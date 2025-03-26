import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client'; // This will be created in step 3

export interface LeaderboardUser {
  id: string;
  username: string;
  displayName: string;
  avatar?: string;
  level: number;
  points: number;
  rank: number;
  position_change?: number; // Change in ranking since last period
}

export interface LeaderboardFilters {
  timeframe?: 'daily' | 'weekly' | 'monthly' | 'all-time';
  category?: 'overall' | 'content_creation' | 'engagement' | 'referrals';
  limit?: number;
}

export function useLeaderboard(filters: LeaderboardFilters = {}) {
  return useQuery({
    queryKey: ['leaderboard', filters],
    queryFn: async () => {
      // In a real implementation, this would use the API client
      // const response = await apiClient.get('/api/leaderboard', { params: filters });
      // return response.data;
      
      // For now, return mock data after a delay to simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Mock data
      const mockLeaderboard: LeaderboardUser[] = Array.from({ length: 10 }, (_, i) => ({
        id: `user${i + 1}`,
        username: `user${i + 1}`,
        displayName: `User ${i + 1}`,
        avatar: `/images/avatars/avatar${i + 1}.png`,
        level: Math.floor(Math.random() * 10) + 1,
        points: Math.floor(Math.random() * 10000) + 1000,
        rank: i + 1,
        position_change: Math.floor(Math.random() * 5) * (Math.random() > 0.5 ? 1 : -1),
      })).sort((a, b) => b.points - a.points);
      
      return mockLeaderboard;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
