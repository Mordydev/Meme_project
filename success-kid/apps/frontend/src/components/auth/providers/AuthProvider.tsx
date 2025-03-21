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
        // Set the user ID in our store
        setUserId(user.id);
        
        // Create a serializable user object for the profile
        const hasOnboarded = user.publicMetadata?.onboarded === true;
        
        if (!profile || profile.displayName !== user.fullName) {
          setProfile({
            displayName: user.fullName || user.username || '',
            username: user.username || '',
            interests: [],
            notificationPreferences: {
              email: true,
              push: false
            }
          });
        }
        
        // Set onboarding status
        if (hasOnboarded) {
          useAuthStore.setState(state => ({
            onboarding: {
              ...state.onboarding,
              isOnboarded: true
            }
          }));
        }
        
        setCheckingOnboardingStatus(false);
      } else {
        setUserId(null);
        setCheckingOnboardingStatus(false);
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
