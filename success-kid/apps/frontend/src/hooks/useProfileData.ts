'use client';

import { useState, useEffect } from 'react';
import { UserProfile, useUserStore } from '@/store/useUserStore';
import { usePointsStore } from '@/store/usePointsStore';

export interface UserStats {
  pointsBalance: number;
  leaderboardRank?: number;
  postsCount: number;
  achievementsCount: number;
  followersCount: number;
  followingCount: number;
}

export interface ProfileData {
  profile: UserProfile | null;
  stats: UserStats | null;
  isLoading: boolean;
  error: Error | null;
}

/**
 * Custom hook to fetch profile data for the current user or a specific username
 * 
 * @param username Optional username to fetch data for (if not current user)
 * @returns ProfileData object with profile, stats, loading state, and errors
 */
export function useProfileData(username?: string): ProfileData {
  const { profile: currentProfile, isLoading: isProfileLoading, error: profileError, fetchProfile } = useUserStore();
  const { balance: pointsBalance, isLoading: isPointsLoading, error: pointsError } = usePointsStore();
  
  const [otherUserProfile, setOtherUserProfile] = useState<UserProfile | null>(null);
  const [otherUserStats, setOtherUserStats] = useState<UserStats | null>(null);
  const [isOtherProfileLoading, setIsOtherProfileLoading] = useState(false);
  const [otherProfileError, setOtherProfileError] = useState<Error | null>(null);
  
  // If viewing another user's profile
  useEffect(() => {
    if (username && (!currentProfile || username !== currentProfile.username)) {
      const fetchOtherUserProfile = async () => {
        setIsOtherProfileLoading(true);
        setOtherProfileError(null);
        
        try {
          // In a real implementation, this would be an API call
          // For now, simulating with a timeout and mock data
          await new Promise(resolve => setTimeout(resolve, 800));
          
          // Mock user data
          const mockUser: UserProfile = {
            id: `user_${username}`,
            displayName: `${username.charAt(0).toUpperCase()}${username.slice(1)}`,
            username: username,
            avatar: '/images/avatars/avatar1.png',
            level: Math.floor(Math.random() * 20) + 1,
            title: 'Community Member',
            bio: 'This is a sample profile for demonstration purposes. In a real implementation, this would be loaded from the API based on the username.',
            joinedAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
            wallet: {
              connected: true,
              isVerified: true,
            },
            achievements: ['first_post', 'connect_wallet'],
          };
          
          setOtherUserProfile(mockUser);
          
          // Mock user stats
          setOtherUserStats({
            pointsBalance: Math.floor(Math.random() * 5000) + 500,
            leaderboardRank: Math.floor(Math.random() * 100) + 1,
            postsCount: Math.floor(Math.random() * 50) + 1,
            achievementsCount: Math.floor(Math.random() * 15) + 1,
            followersCount: Math.floor(Math.random() * 100) + 1,
            followingCount: Math.floor(Math.random() * 100) + 1,
          });
        } catch (error) {
          console.error('Error fetching other user profile:', error);
          setOtherProfileError(error instanceof Error ? error : new Error('Failed to fetch profile'));
        } finally {
          setIsOtherProfileLoading(false);
        }
      };
      
      fetchOtherUserProfile();
    }
  }, [username, currentProfile]);
  
  // If viewing current user's profile
  useEffect(() => {
    if (!username && !currentProfile && !isProfileLoading) {
      fetchProfile();
    }
  }, [username, currentProfile, isProfileLoading, fetchProfile]);
  
  // For current user, use store data
  if (!username) {
    // Create stats object for current user
    const stats: UserStats | null = currentProfile ? {
      pointsBalance,
      leaderboardRank: 24, // Mock data - would come from an API
      postsCount: 35, // Mock data - would come from an API
      achievementsCount: currentProfile.achievements?.length || 0,
      followersCount: 47, // Mock data - would come from an API
      followingCount: 64 // Mock data - would come from an API
    } : null;
    
    return {
      profile: currentProfile,
      stats,
      isLoading: isProfileLoading || isPointsLoading,
      error: profileError || pointsError
    };
  }
  
  // For other users, use the fetched data
  return {
    profile: otherUserProfile,
    stats: otherUserStats,
    isLoading: isOtherProfileLoading,
    error: otherProfileError
  };
}
