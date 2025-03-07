'use client';

import { useAuth, useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';

/**
 * Custom hook to handle authentication state and actions
 */
export function useAuthentication() {
  const { isLoaded, isSignedIn, userId, sessionId } = useAuth();
  const { user, isLoaded: isUserLoaded } = useUser();
  const router = useRouter();

  /**
   * Redirect to sign-in page with return URL
   */
  const signIn = (returnUrl?: string) => {
    const encodedReturnUrl = returnUrl ? `?redirect_url=${encodeURIComponent(returnUrl)}` : '';
    router.push(`/sign-in${encodedReturnUrl}`);
  };

  /**
   * Redirect to sign-up page with return URL
   */
  const signUp = (returnUrl?: string) => {
    const encodedReturnUrl = returnUrl ? `?redirect_url=${encodeURIComponent(returnUrl)}` : '';
    router.push(`/sign-up${encodedReturnUrl}`);
  };

  /**
   * Sign out and redirect to home page
   */
  const signOut = async () => {
    try {
      await user?.signOut();
      router.push('/');
      // Force a refresh to ensure all auth state is cleared
      router.refresh();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  /**
   * Check if user is authenticated, redirect to sign-in if not
   */
  const requireAuth = (returnUrl?: string) => {
    if (isLoaded && !isSignedIn) {
      signIn(returnUrl || window.location.pathname);
      return false;
    }
    return true;
  };

  /**
   * Get the authentication token for API requests
   */
  const getToken = async () => {
    if (!isSignedIn) return null;
    try {
      const token = await user?.getToken();
      return token;
    } catch (error) {
      console.error('Error getting token:', error);
      return null;
    }
  };

  return {
    isLoaded,
    isAuthenticated: isLoaded && isSignedIn,
    userId,
    sessionId,
    user: isUserLoaded ? user : null,
    signIn,
    signUp,
    signOut,
    requireAuth,
    getToken,
  };
}
