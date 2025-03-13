'use client';

import { useAuth as useClerkAuth, useUser } from '@clerk/nextjs';
import { useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useUserStore } from '@/store/useUserStore';

/**
 * Enhanced auth hook that combines Clerk auth state with custom auth store
 * Handles cross-tab synchronization and onboarding status
 */
export function useAuth() {
  const { isLoaded: clerkLoaded, isSignedIn } = useClerkAuth();
  const { user, isLoaded: isUserLoaded } = useUser();
  
  const {
    isLoading, 
    isOnboarded,
    authError,
    setAuthenticated,
    setLoading,
    setAuthError,
    syncState
  } = useAuthStore();
  
  const { profile, fetchProfile } = useUserStore();
  
  // Sync authentication state when Clerk auth changes
  useEffect(() => {
    if (clerkLoaded) {
      setAuthenticated(!!isSignedIn);
      
      if (isSignedIn && user) {
        // User is signed in, check if onboarded by fetching profile
        fetchProfile().catch(error => {
          console.error('Error fetching user profile:', error);
        });
      }
      
      // Set loading to false once Clerk auth is loaded
      setLoading(false);
    }
  }, [clerkLoaded, isSignedIn, user, setAuthenticated, setLoading, fetchProfile]);
  
  // Determine if user is onboarded based on profile completeness
  const checkOnboarded = () => {
    return profile && profile.username && profile.displayName;
  };
  
  // Determine admin status from user metadata
  const isAdmin = user?.publicMetadata?.role === 'admin';
  
  // Handle cross-tab synchronization
  useEffect(() => {
    // Initial sync
    syncState();
    
    // Listen for storage events to detect changes in other tabs
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'auth_sync') {
        syncState();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [syncState]);
  
  return {
    isLoaded: clerkLoaded && isUserLoaded && !isLoading,
    isSignedIn,
    isOnboarded: isOnboarded || checkOnboarded(), 
    user,
    profile,
    authError,
    isAdmin,
    
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
    },
    
    /**
     * Clear any auth errors
     */
    clearAuthError: () => {
      setAuthError(null);
    }
  };
}
