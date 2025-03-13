'use client';

import { useAuth } from './useAuth';
import { useAuthStore, UserProfile } from '@/store/auth/authStore';
import { useUser } from '@clerk/nextjs';
import { useState, useCallback } from 'react';

export function useProfile() {
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  const { profile, setProfile, updateProfile } = useAuthStore();
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const saveProfile = useCallback(async (profileData: Partial<UserProfile>) => {
    if (!isLoaded || !isSignedIn || !user) {
      return { success: false, error: 'User not authenticated' };
    }
    
    setIsSaving(true);
    setError(null);
    
    try {
      // Update local state
      if (profile) {
        updateProfile(profileData);
      } else {
        // Initialize profile if it doesn't exist
        setProfile({
          displayName: profileData.displayName || user.fullName || '',
          username: profileData.username || user.username || '',
          bio: profileData.bio || '',
          avatarUrl: profileData.avatarUrl || user.imageUrl || '',
          interests: profileData.interests || [],
          notificationPreferences: profileData.notificationPreferences || {
            email: true,
            push: false,
          }
        });
      }
      
      // In a real implementation, we would make an API call to save the profile
      // For now, we'll simulate a successful save
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Update the onboarded flag in Clerk's user metadata
      // In a real implementation, this would be done through an API call
      // const updatedUser = await user.update({
      //   publicMetadata: {
      //     ...user.publicMetadata,
      //     onboarded: true,
      //   }
      // });
      
      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save profile';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsSaving(false);
    }
  }, [isLoaded, isSignedIn, user, profile, updateProfile, setProfile]);
  
  return {
    profile,
    isLoaded,
    isSaving,
    error,
    saveProfile,
    updateProfile,
  };
}
