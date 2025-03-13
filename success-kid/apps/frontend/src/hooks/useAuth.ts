'use client';

import { useAuth as useClerkAuth, useUser } from '@clerk/nextjs';
import { useEnhancedAuth } from '@/components/auth/providers/AuthProvider';
import { useAuthStore } from '@/store/auth/authStore';

/**
 * Custom hook for auth state management
 * Combines Clerk's auth with our custom state
 */
export function useAuth() {
  const { isLoaded, isSignedIn } = useClerkAuth();
  const { user, isLoaded: isUserLoaded } = useUser();
  const enhancedAuth = useEnhancedAuth();
  const { profile, onboarding } = useAuthStore();
  
  const isAdmin = user?.publicMetadata?.role === 'admin';
  
  return {
    // Clerk auth state
    isLoaded: isLoaded && isUserLoaded && enhancedAuth.isLoaded,
    isSignedIn,
    user,
    isAdmin,
    
    // Enhanced auth state
    isProfileComplete: !!profile && !!profile.username && !!profile.displayName,
    isOnboarded: onboarding.isOnboarded,
    profile,
    
    /**
     * Check if the user has a specific role
     */
    hasRole: (role: string | string[]) => {
      if (!user) return false;
      
      const userRole = user.publicMetadata?.role as string;
      
      if (!userRole) return false;
      
      return Array.isArray(role) 
        ? role.includes(userRole)
        : userRole === role;
    }
  };
}
