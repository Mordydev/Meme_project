import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client'; // This will be created in step 3
import type { UserProfile } from '@/store/useUserStore';

export function useUserProfile(userId: string) {
  return useQuery({
    queryKey: ['user', userId],
    queryFn: async () => {
      // In a real implementation, this would use the API client
      // const response = await apiClient.get(`/api/users/${userId}`);
      // return response.data;
      
      // For now, return mock data after a delay to simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Mock data
      const mockProfile: UserProfile = {
        id: userId,
        displayName: `User ${userId}`,
        username: `user${userId}`,
        avatar: `/images/avatars/avatar${Math.floor(Math.random() * 10) + 1}.png`,
        level: Math.floor(Math.random() * 10) + 1,
        title: 'Community Member',
        bio: 'This is a mock user profile bio.',
        wallet: {
          connected: Math.random() > 0.5,
          address: Math.random() > 0.5 ? '0x' + Math.random().toString(16).substring(2, 42) : undefined,
          isVerified: Math.random() > 0.7,
        },
        achievements: ['first_post', 'first_comment'],
        joinedAt: new Date(Date.now() - Math.floor(Math.random() * 90) * 24 * 60 * 60 * 1000),
      };
      
      return mockProfile;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
