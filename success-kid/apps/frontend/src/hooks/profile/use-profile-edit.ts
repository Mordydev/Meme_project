'use client';

import { useState } from 'react';
import { UserResource } from '@clerk/types';
import { useAuth, useUser } from '@clerk/nextjs';
import { ProfileFormData } from '@/components/features/profile/profile-edit';

interface UseProfileEditReturn {
  updateProfile: (data: ProfileFormData) => Promise<void>;
  isLoading: boolean;
  error: Error | null;
}

export function useProfileEdit(): UseProfileEditReturn {
  const { isLoaded } = useAuth();
  const { user, isSignedIn } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  // Update profile
  const updateProfile = async (data: ProfileFormData) => {
    if (!isLoaded || !isSignedIn || !user) {
      throw new Error('User is not authenticated');
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Handle image upload if provided
      let imageUrl = data.imageUrl;
      if (data.imageFile) {
        // In a real implementation, we would upload the image to a storage service
        // For now, just simulate a delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        console.log('Image file would be uploaded here');
        
        // In a real implementation, imageUrl would be the URL of the uploaded image
        imageUrl = URL.createObjectURL(data.imageFile);
      }
      
      // Update user data in Clerk
      const firstName = data.displayName?.split(' ')[0] || user.firstName;
      const lastName = data.displayName?.split(' ').slice(1).join(' ') || user.lastName;
      
      // Updating username requires special handling in Clerk
      if (data.username !== user.username) {
        await user.update({
          username: data.username,
        });
      }
      
      // Update name and other profile data
      await user.update({
        firstName,
        lastName,
        ...(imageUrl !== user.imageUrl ? { imageUrl } : {}),
      });
      
      // Update public metadata for bio
      if (data.bio !== user.publicMetadata?.bio) {
        await user.update({
          publicMetadata: {
            ...user.publicMetadata,
            bio: data.bio,
          },
        });
      }
      
      console.log('Profile updated successfully');
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err instanceof Error ? err : new Error('Failed to update profile'));
      throw err;
    } finally {
      setIsLoading(false);
    }
  };
  
  return {
    updateProfile,
    isLoading,
    error
  };
}
