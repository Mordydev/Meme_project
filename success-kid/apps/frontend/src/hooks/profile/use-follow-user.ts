'use client';

import { useState } from 'react';

interface UseFollowUserReturn {
  followUser: (userId: string) => Promise<void>;
  unfollowUser: (userId: string) => Promise<void>;
  isLoading: boolean;
  error: Error | null;
}

export function useFollowUser(): UseFollowUserReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  // Follow user
  const followUser = async (userId: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // In a real implementation, we would call the API
      // For now, just simulate a delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      console.log(`Following user: ${userId}`);
      // API call would be something like:
      // await fetch(`/api/users/${userId}/follow`, { method: 'POST' });
    } catch (err) {
      console.error('Error following user:', err);
      setError(err instanceof Error ? err : new Error('Failed to follow user'));
      throw err;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Unfollow user
  const unfollowUser = async (userId: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // In a real implementation, we would call the API
      // For now, just simulate a delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      console.log(`Unfollowing user: ${userId}`);
      // API call would be something like:
      // await fetch(`/api/users/${userId}/follow`, { method: 'DELETE' });
    } catch (err) {
      console.error('Error unfollowing user:', err);
      setError(err instanceof Error ? err : new Error('Failed to unfollow user'));
      throw err;
    } finally {
      setIsLoading(false);
    }
  };
  
  return {
    followUser,
    unfollowUser,
    isLoading,
    error
  };
}
