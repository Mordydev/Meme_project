import { useState, useEffect, useCallback } from 'react';
import { useAuth as useClerkAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';

/**
 * Hook for handling user authentication state and actions
 * 
 * @returns Authentication state and methods
 */
export function useAuth() {
  const router = useRouter();
  
  // Use Clerk auth directly
  const { isLoaded, isSignedIn, user } = useClerkAuth();
  
  // For backwards compatibility with some components still using these properties
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [localUser, setLocalUser] = useState<any>(null);

  // Sync with Clerk's auth state
  useEffect(() => {
    if (isLoaded) {
      setIsAuthenticated(!!isSignedIn);
      setIsLoading(false);
      
      if (isSignedIn && user) {
        // Create a serializable user object
        setLocalUser({
          id: user.id,
          username: user.username,
          email: user.primaryEmailAddress?.emailAddress,
          fullName: user.fullName,
          firstName: user.firstName,
          lastName: user.lastName,
          imageUrl: user.imageUrl
        });
      } else {
        setLocalUser(null);
      }
    }
  }, [isLoaded, isSignedIn, user]);

  // Helper for redirecting to sign-in
  const login = useCallback(() => {
    router.push('/sign-in');
  }, [router]);

  // Helper for signing out
  const logout = useCallback(() => {
    router.push('/sign-out');
  }, [router]);
  
  // Detect if user has completed onboarding
  const isOnboarded = user?.publicMetadata?.onboarded === true;
  
  // Simple permission check function
  const hasPermission = useCallback((permission: string) => {
    // This could check user roles/permissions in a real implementation
    return true;
  }, []);

  return {
    // Clerk properties (primary source of truth)
    isLoaded,
    isSignedIn,
    
    // For backwards compatibility
    isAuthenticated,
    isLoading,
    
    // User data - ensure it's serializable
    user: localUser,
    
    // Auth actions
    login,
    logout,
    
    // Additional auth state
    isOnboarded,
    hasPermission,
    
    // For UserProfile on dashboard
    profile: localUser ? {
      displayName: localUser.fullName || localUser.username,
      username: localUser.username
    } : null,
    
    // Simple admin check (could be enhanced)
    isAdmin: false
  };
}

export default useAuth;
