'use client';

import { ReactNode, useState, useEffect, createContext, useContext } from 'react';
import { useAuth as useClerkAuth, useUser, useSession } from '@clerk/nextjs';
import { useAuthStore } from '@/store/auth/authStore';
import { useWallet } from '@/hooks/useWallet';

// Define enhanced authentication context
interface EnhancedAuthContext {
  isLoaded: boolean;
  isSignedIn: boolean;
  userId: string | null;
  isProfileComplete: boolean;
  isOnboarded: boolean;
  hasWallet: boolean;
  walletAddress: string | null;
  isAdmin: boolean;
  isLoading: boolean;
  role: string | null;
  hasPermission: (permission: string) => boolean;
}

// Create context for enhanced auth functionality
const AuthContext = createContext<EnhancedAuthContext | null>(null);

/**
 * Provider component that wraps app and makes auth available throughout
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const { isLoaded: isClerkLoaded, isSignedIn } = useClerkAuth();
  const { user, isLoaded: isUserLoaded } = useUser();
  const { session, isLoaded: isSessionLoaded } = useSession();
  const { publicKey, connected } = useWallet();
  
  const [isLoading, setIsLoading] = useState(true);
  
  // Get auth store state and actions
  const {
    profile,
    onboarding,
    setUserId,
    setIsSignedIn,
    setIsLoaded,
    setProfile,
    userId
  } = useAuthStore();
  
  // Sync Clerk auth state with our store
  useEffect(() => {
    // Check if all clerk data is loaded
    if (isClerkLoaded && isUserLoaded && isSessionLoaded) {
      // Update auth store with Clerk state
      setIsSignedIn(!!isSignedIn);
      setIsLoaded(true);
      
      if (isSignedIn && user) {
        setUserId(user.id);
        
        // Fetch user profile data if signed in
        const fetchUserProfile = async () => {
          try {
            // Get onboarding status
            const isOnboarded = user.publicMetadata.onboarded === true;
            
            // If profile doesn't exist in store, but user is onboarded, fetch it from API
            if (!profile && isOnboarded) {
              // In a real app, fetch the profile from your backend API
              // For now, create a minimal profile from Clerk user data
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
            
            setIsLoading(false);
          } catch (error) {
            console.error('Error fetching user profile:', error);
            setIsLoading(false);
          }
        };
        
        fetchUserProfile();
      } else {
        setUserId(null);
        setIsLoading(false);
      }
    }
  }, [isClerkLoaded, isUserLoaded, isSessionLoaded, isSignedIn, user, setUserId, setIsSignedIn, setIsLoaded, setProfile, profile]);
  
  // User permissions check helper
  const hasPermission = (permission: string): boolean => {
    // If not signed in, definitely doesn't have permission
    if (!isSignedIn || !user) return false;
    
    // Admin has all permissions
    if (user.publicMetadata?.role === 'admin') return true;
    
    // Check for specific permissions
    const userPermissions = user.publicMetadata?.permissions as string[] || [];
    return userPermissions.includes(permission);
  };
  
  // Combined loading state
  const allLoaded = isClerkLoaded && isUserLoaded && !isLoading;
  
  // Auth context value
  const authContextValue: EnhancedAuthContext = {
    isLoaded: allLoaded,
    isSignedIn: !!isSignedIn,
    userId: user?.id || null,
    isProfileComplete: !!profile && !!profile.username && !!profile.displayName,
    isOnboarded: onboarding.isOnboarded || (user?.publicMetadata?.onboarded as boolean) || false,
    hasWallet: connected,
    walletAddress: publicKey?.toString() || null,
    isAdmin: user?.publicMetadata?.role === 'admin',
    isLoading,
    role: user?.publicMetadata?.role as string || null,
    hasPermission
  };
  
  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook to access enhanced auth context
 */
export function useEnhancedAuth() {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useEnhancedAuth must be used within an AuthProvider');
  }
  
  return context;
}
