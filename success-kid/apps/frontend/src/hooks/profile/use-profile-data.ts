'use client';

import { useState, useEffect } from 'react';
import { UserResource } from '@clerk/types';
import { useUser } from '@clerk/nextjs';
import { UserStats } from '@/components/features/profile';

// Types
export interface ProfileData {
  user: UserResource | null;
  stats: UserStats;
  isOwnProfile: boolean;
  isLoading: boolean;
  error: Error | null;
}

// Hook for fetching profile data
export function useProfileData(userId?: string): ProfileData {
  const { user: currentUser, isLoaded } = useUser();
  const [stats, setStats] = useState<UserStats>({
    points: 0,
    achievements: 0,
    posts: 0,
    followers: 0,
    following: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  // Determine if this is the current user's profile
  const isOwnProfile = !userId || (currentUser?.id === userId);
  
  // Fetch user data
  useEffect(() => {
    // Only fetch when Clerk has loaded
    if (!isLoaded) return;
    
    const fetchProfileData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Get the user ID to fetch
        const targetUserId = isOwnProfile ? currentUser?.id : userId;
        
        if (!targetUserId) {
          throw new Error('User ID not available');
        }
        
        // Fetch profile data from API
        const response = await fetch(`/api/users/${targetUserId}/profile`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch profile: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // Update stats from API response
        setStats(data.data.stats);
      } catch (err) {
        console.error('Error fetching profile data:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch profile data'));
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProfileData();
  }, [userId, isLoaded, currentUser?.id, isOwnProfile]);
  
  return {
    user: isOwnProfile ? currentUser : null, // Would fetch other user data from API in real implementation
    stats,
    isOwnProfile,
    isLoading,
    error
  };
}
