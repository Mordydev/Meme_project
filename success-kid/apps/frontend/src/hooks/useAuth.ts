'use client';

import { useAuth as useClerkAuth, useUser } from '@clerk/nextjs';

/**
 * Custom hook for auth state management
 * Combines Clerk's useAuth and useUser hooks
 */
export function useAuth() {
  const { isLoaded, isSignedIn } = useClerkAuth();
  const { user, isLoaded: isUserLoaded } = useUser();
  
  const isAdmin = user?.publicMetadata?.role === 'admin';
  
  return {
    isLoaded: isLoaded && isUserLoaded,
    isSignedIn,
    user,
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
    }
  };
}
