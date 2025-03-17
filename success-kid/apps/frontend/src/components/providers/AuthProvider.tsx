'use client';

import { createContext, useEffect, useState, ReactNode, useContext, useCallback } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { ClerkProvider, useAuth as useClerkAuth } from '@clerk/nextjs';
import { useUserStore } from '@/store/useUserStore';
import { useToast } from '@/components/ui/use-toast';
import { SessionRecovery } from '@/components/auth/SessionRecovery';

interface AuthContextType {
  isInitializing: boolean;
  isSyncing: boolean;
  lastSyncError: Error | null;
  syncState: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType>({
  isInitializing: true,
  isSyncing: false,
  lastSyncError: null,
  syncState: async () => false,
});

export const useAuthContext = () => useContext(AuthContext);

interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Authentication Provider Component
 * 
 * Provides global authentication state and synchronization across the application
 * Ensures consistent auth state between Clerk, custom auth store, and server
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const [isInitializing, setIsInitializing] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncError, setLastSyncError] = useState<Error | null>(null);
  const { toast } = useToast();
  
  // Custom auth sync function - can be called manually to force sync
  const syncState = useCallback(async () => {
    try {
      setIsSyncing(true);
      setLastSyncError(null);
      
      // Call auth status endpoint to verify current session
      const response = await fetch('/api/v1/auth/status', {
        method: 'GET',
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to sync authentication state');
      }
      
      const data = await response.json();
      
      // Update state based on server response
      useAuthStore.setState({
        isAuthenticated: data.data.isAuthenticated,
        isOnboarded: data.data.isOnboarded,
        authProvider: data.data.authProvider,
        hasWalletConnected: data.data.hasWalletConnected,
      });
      
      // If authenticated, update user profile
      if (data.data.isAuthenticated && data.data.profile) {
        useUserStore.setState({
          profile: data.data.profile,
        });
      }
      
      return true;
    } catch (error) {
      console.error('Error syncing auth state:', error);
      setLastSyncError(error instanceof Error ? error : new Error('Unknown error'));
      
      // Only show toast for manual syncs, not automatic ones
      toast({
        title: 'Sync Error',
        description: 'Failed to sync authentication state',
        variant: 'destructive',
      });
      
      return false;
    } finally {
      setIsSyncing(false);
      setIsInitializing(false);
    }
  }, [toast]);
  
  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        await syncState();
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setIsInitializing(false);
      }
    };
    
    initializeAuth();
  }, [syncState]);
  
  // Cross-tab synchronization using the BroadcastChannel API
  useEffect(() => {
    // Only run in browser environment
    if (typeof window === 'undefined') return;
    
    // Create broadcast channel for auth state
    let authChannel: BroadcastChannel;
    
    try {
      authChannel = new BroadcastChannel('auth_sync_channel');
      
      // Listen for auth state changes from other tabs
      authChannel.onmessage = (event) => {
        if (event.data?.type === 'AUTH_STATE_CHANGE') {
          // Sync with server to ensure consistent state
          syncState();
        }
      };
      
      // When this tab's auth state changes, broadcast to other tabs
      const unsubscribe = useAuthStore.subscribe((state, prevState) => {
        if (state.isAuthenticated !== prevState.isAuthenticated) {
          authChannel.postMessage({
            type: 'AUTH_STATE_CHANGE',
            timestamp: Date.now(),
          });
        }
      });
      
      return () => {
        unsubscribe();
        authChannel.close();
      };
    } catch (error) {
      // BroadcastChannel not supported in some browsers
      console.warn('BroadcastChannel not supported:', error);
    }
  }, [syncState]);
  
  // Periodically check auth state for long-running sessions
  useEffect(() => {
    // Skip during initialization
    if (isInitializing) return;
    
    // Only set up periodic sync when authenticated
    if (!useAuthStore.getState().isAuthenticated) return;
    
    // Check every 15 minutes
    const intervalId = setInterval(() => {
      syncState();
    }, 15 * 60 * 1000);
    
    return () => clearInterval(intervalId);
  }, [isInitializing, syncState]);
  
  // Setup visibility change listener to sync auth state when tab becomes visible
  useEffect(() => {
    // Only run in browser
    if (typeof window === 'undefined') return;
    
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Only sync if we're already authenticated
        if (useAuthStore.getState().isAuthenticated) {
          syncState();
        }
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [syncState]);
  
  // Value for context
  const contextValue: AuthContextType = {
    isInitializing,
    isSyncing,
    lastSyncError,
    syncState,
  };
  
  return (
    <AuthContext.Provider value={contextValue}>
      <ClerkProvider>
        <SessionSyncProvider>
          {children}
        </SessionSyncProvider>
      </ClerkProvider>
    </AuthContext.Provider>
  );
}

// Internal provider to sync Clerk auth state with our custom auth store
function SessionSyncProvider({ children }: { children: ReactNode }) {
  const { isLoaded, isSignedIn } = useClerkAuth();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const setAuthenticated = useAuthStore((state) => state.setAuthenticated);
  const [showRecovery, setShowRecovery] = useState(false);
  
  // Sync Clerk auth state with our store
  useEffect(() => {
    if (!isLoaded) return;
    
    // If Clerk auth state is different from our store, update
    if (isSignedIn !== isAuthenticated) {
      setAuthenticated(isSignedIn || false);
      
      // If we lost authentication, check if we need to show recovery
      if (!isSignedIn && isAuthenticated) {
        setShowRecovery(true);
      }
    }
  }, [isLoaded, isSignedIn, isAuthenticated, setAuthenticated]);
  
  return (
    <>
      {showRecovery && <SessionRecovery />}
      {children}
    </>
  );
}
