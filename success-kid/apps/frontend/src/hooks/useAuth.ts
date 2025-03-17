/**
 * useAuth Hook
 * 
 * Centralized hook for authentication state and operations
 * Combines Clerk auth with our custom auth store
 */
import { useCallback, useEffect, useState } from 'react';
import { useAuth as useClerkAuth, useUser, SignOutParams, SignInParams } from '@clerk/nextjs';
import { useAuthStore } from '@/store/useAuthStore';
import { useUserStore } from '@/store/useUserStore';
import { useToast } from '@/components/ui/use-toast';

export type AuthErrorCode = 
  | 'unauthorized' 
  | 'invalid_credentials' 
  | 'account_suspended' 
  | 'network_error' 
  | 'session_expired' 
  | 'unknown'
  | 'wallet_error'
  | 'wallet_connection_failed'
  | 'wallet_signature_failed'
  | 'wallet_verification_failed';

export interface AuthError {
  code: AuthErrorCode;
  message: string;
}

export type AuthProvider = 'email' | 'google' | 'twitter' | 'wallet';

export function useAuth() {
  // Internal state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<AuthError | null>(null);
  
  // Clerk auth
  const { isLoaded: clerkLoaded, userId, sessionId, signOut: clerkSignOut } = useClerkAuth();
  const { user: clerkUser, isLoaded: clerkUserLoaded } = useUser();
  
  // Our auth store
  const { 
    isAuthenticated, 
    isOnboarded,
    authProvider,
    hasWalletConnected,
    setAuthenticated, 
    setLoading: setAuthStoreLoading,
    setOnboarded,
    setAuthProvider,
    setWalletConnected
  } = useAuthStore();
  
  // User store for profile data
  const { 
    profile,
    fetchProfile, 
    setProfile,
    connectWallet: connectWalletToProfile,
    logout: clearUserProfile 
  } = useUserStore();
  
  // Toast notifications
  const { toast } = useToast();
  
  // Effect to sync authentication state when Clerk auth changes
  useEffect(() => {
    const syncAuthState = async () => {
      // Wait for Clerk to be loaded
      if (!clerkLoaded || !clerkUserLoaded) {
        setAuthStoreLoading(true);
        return;
      }
      
      setAuthStoreLoading(false);
      
      const isAuthenticatedWithClerk = Boolean(userId && sessionId);
      
      // Update auth store to match Clerk state
      if (isAuthenticated !== isAuthenticatedWithClerk) {
        setAuthenticated(isAuthenticatedWithClerk);
        
        // If newly authenticated, fetch user profile
        if (isAuthenticatedWithClerk && !profile && userId) {
          try {
            await fetchProfile();
          } catch (err) {
            console.error('Error fetching user profile:', err);
            setError({
              code: 'network_error',
              message: 'Failed to fetch user profile'
            });
          }
        }
      }
    };
    
    syncAuthState();
  }, [clerkLoaded, clerkUserLoaded, userId, sessionId, isAuthenticated, profile, fetchProfile, setAuthenticated, setAuthStoreLoading]);
  
  // Check onboarding status when profile is loaded
  useEffect(() => {
    if (profile) {
      // A user is considered onboarded if they have completed the required profile fields
      const isProfileComplete = Boolean(
        profile.username && 
        profile.displayName && 
        profile.bio
      );
      
      setOnboarded(isProfileComplete);

      // Update wallet connection status
      if (profile.wallet?.connected) {
        setWalletConnected(true);
      }
    }
  }, [profile, setOnboarded, setWalletConnected]);
  
  // Listen for auth errors from store and display toast
  useEffect(() => {
    if (error) {
      toast({
        title: 'Authentication Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  }, [error, toast]);
  
  // Sign out function
  const signOut = useCallback(async (params?: SignOutParams) => {
    setIsLoading(true);
    try {
      await clerkSignOut(params);
      
      // Also clear our stores
      clearUserProfile();
      setAuthenticated(false);
      setWalletConnected(false);
      
      // Clear local storage auth data if any
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_sync');
      }
      
      return true;
    } catch (err) {
      console.error('Sign out error:', err);
      setError({
        code: 'unknown',
        message: 'Failed to sign out properly'
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [clerkSignOut, clearUserProfile, setAuthenticated, setWalletConnected]);
  
  // Function to handle wallet authentication
  const connectWallet = useCallback(async (
    walletAddress: string, 
    signature: string, 
    sessionId: string
  ) => {
    setIsLoading(true);
    try {
      // Make request to our backend to authenticate with wallet
      const response = await fetch('/api/v1/auth/wallet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: {
            walletAddress,
            signature,
            sessionId
          }
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.errors?.[0]?.message || 'Failed to authenticate with wallet');
      }
      
      const data = await response.json();
      
      // Process successful authentication
      setAuthenticated(true);
      setAuthProvider('wallet');
      setWalletConnected(true);
      
      // Update profile with wallet info
      connectWalletToProfile(walletAddress);
      
      // If profile not loaded yet, fetch it
      if (!profile) {
        await fetchProfile();
      }
      
      return true;
    } catch (err) {
      console.error('Wallet authentication error:', err);
      setError({
        code: 'wallet_error',
        message: err instanceof Error ? err.message : 'Failed to authenticate with wallet'
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [connectWalletToProfile, fetchProfile, profile, setAuthProvider, setAuthenticated, setWalletConnected]);
  
  // Reset error state
  const clearError = useCallback(() => {
    setError(null);
  }, []);
  
  return {
    // Authentication state
    isAuthenticated,
    isLoading: isLoading || !clerkLoaded || !clerkUserLoaded || useUserStore.getState().isLoading,
    isOnboarded,
    authProvider,
    hasWalletConnected,
    user: clerkUser,
    profile,
    error,
    
    // Actions
    signOut,
    connectWallet,
    clearError,
  };
}
