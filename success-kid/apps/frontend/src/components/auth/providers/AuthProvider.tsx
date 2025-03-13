'use client';

import { useAuth as useClerkAuth, useUser } from '@clerk/nextjs';
import { useEffect, createContext, useContext, useState } from 'react';
import { useAuthStore } from '@/store/auth/authStore';

// Create a context for any additional auth functionality
interface AuthContextType {
  isLoaded: boolean;
  isSignedIn: boolean;
  userId: string | null;
  isOnboarded: boolean;
  isProfileComplete: boolean;
  checkingOnboardingStatus: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

/**
 * Enhanced Auth Provider that combines Clerk with our custom state
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { isLoaded: isClerkLoaded, isSignedIn } = useClerkAuth();
  const { user, isLoaded: isUserLoaded } = useUser();
  const [checkingOnboardingStatus, setCheckingOnboardingStatus] = useState(true);
  
  // Auth store actions
  const {
    setUserId,
    setIsSignedIn,
    setIsLoaded,
    onboarding,
    profile,
    setProfile
  } = useAuthStore();
  
  // Sync Clerk auth state with our store
  useEffect(() => {
    if (isClerkLoaded && isUserLoaded) {
      setIsSignedIn(!!isSignedIn);
      setIsLoaded(true);
      
      if (isSignedIn && user) {
        setUserId(user.id);
        
        // Check if user has completed onboarding
        const checkUserProfile = async () => {
          try {
            setCheckingOnboardingStatus(true);
            // Here you would normally fetch the profile from your API
            // For now, we'll check if the user has any existing profile data in Clerk
            const hasOnboarded = user.publicMetadata.onboarded === true;
            
            // If we find profile data in our store, but the user hasn't onboarded yet
            // in Clerk, we should update Clerk
            if (profile && !hasOnboarded) {
              // This would normally be an API call
              console.log('User has profile in store but not in Clerk');
            }
            
            // If the user has onboarded in Clerk but we don't have local profile data
            if (hasOnboarded && !profile) {
              // Fetch user profile from API
              // For now, we'll use a placeholder profile
              setProfile({
                displayName: user.fullName || '',
                username: user.username || '',
                interests: [],
                notificationPreferences: {
                  email: true,
                  push: false
                }
              });
            }
          } catch (error) {
            console.error('Error checking user profile:', error);
          } finally {
            setCheckingOnboardingStatus(false);
          }
        };
        
        if (user.id) {
          checkUserProfile();
        }
      } else {
        setUserId(null);
      }
    }
  }, [isClerkLoaded, isUserLoaded, isSignedIn, user, setUserId, setIsSignedIn, setIsLoaded, setProfile, profile]);
  
  const contextValue = {
    isLoaded: isClerkLoaded && isUserLoaded && !checkingOnboardingStatus,
    isSignedIn: !!isSignedIn,
    userId: user?.id || null,
    isOnboarded: onboarding.isOnboarded,
    isProfileComplete: !!profile && !!profile.username && !!profile.displayName,
    checkingOnboardingStatus
  };
  
  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Custom hook to access the enhanced auth context
 */
export function useEnhancedAuth() {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useEnhancedAuth must be used within an AuthProvider');
  }
  
  return context;
}
