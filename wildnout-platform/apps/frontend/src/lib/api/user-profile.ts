'use client';

import { createApiClient } from './client';

/**
 * Updates the user profile with onboarding data
 */
export async function saveUserProfile(token: string, profileData: {
  displayName?: string;
  bio?: string;
  interests?: string[];
  battleStyle?: string;
  onboardingComplete?: boolean;
}) {
  const api = createApiClient(token);
  
  try {
    const result = await api.patch('/api/users/profile', {
      ...profileData
    });
    
    return result;
  } catch (error) {
    console.error('Error saving user profile:', error);
    throw error;
  }
}

/**
 * Fetches the current user profile data
 */
export async function getUserProfile(token: string) {
  const api = createApiClient(token);
  
  try {
    const result = await api.get('/api/users/profile');
    return result;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw error;
  }
}
