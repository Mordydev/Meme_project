'use server';

import { auth, clerkClient } from '@clerk/nextjs';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

/**
 * Updates the user profile with onboarding data using a server action
 */
export async function updateOnboardingData(
  formData: FormData | Record<string, any>
) {
  try {
    // Get the current authenticated user
    const { userId } = auth();
    
    if (!userId) {
      return {
        success: false,
        error: 'Not authenticated'
      };
    }
    
    // Convert FormData to regular object if needed
    let data = formData;
    if (formData instanceof FormData) {
      data = Object.fromEntries(formData.entries());
    }
    
    const { 
      displayName, 
      bio, 
      interests, 
      battleStyle = 'wildStyle',
      onboardingComplete = true
    } = data as any;
    
    // Get the current user
    const user = await clerkClient.users.getUser(userId);
    
    // Update user data in Clerk
    await clerkClient.users.updateUser(userId, {
      firstName: displayName?.split(' ')?.[0] || user.firstName,
      lastName: displayName?.split(' ')?.slice(1).join(' ') || user.lastName,
      publicMetadata: {
        ...user.publicMetadata,
        bio,
        interests,
        battleStyle,
        onboardingComplete
      }
    });
    
    // Revalidate user data across the app
    revalidatePath('/');
    
    // Return success
    return {
      success: true
    };
  } catch (error) {
    console.error('Error updating user profile:', error);
    
    return {
      success: false,
      error: 'Failed to update profile'
    };
  }
}

/**
 * Completes onboarding and redirects to battle page
 */
export async function completeOnboarding(
  formData: FormData | Record<string, any>
) {
  const result = await updateOnboardingData(formData);
  
  if (result.success) {
    redirect('/battle');
  }
  
  return result;
}
