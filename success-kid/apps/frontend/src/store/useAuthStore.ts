import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

export type AuthProvider = 'email' | 'google' | 'twitter' | 'wallet';

interface AuthError {
  code: string;
  message: string;
}

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  isOnboarded: boolean;
  authError: AuthError | null;
  authProvider: AuthProvider | null;
  hasWalletConnected: boolean;
  
  // Actions
  setAuthenticated: (status: boolean) => void;
  setLoading: (loading: boolean) => void;
  setOnboarded: (status: boolean) => void;
  setAuthError: (error: AuthError | null) => void;
  setAuthProvider: (provider: AuthProvider | null) => void;
  setWalletConnected: (connected: boolean) => void;
  
  // Cross-tab synchronization flag
  lastSyncAt: number;
  syncState: () => void;
}

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set, get) => ({
        isAuthenticated: false,
        isLoading: true,
        isOnboarded: false,
        authError: null,
        authProvider: null,
        hasWalletConnected: false,
        lastSyncAt: Date.now(),
        
        setAuthenticated: (status) => {
          set({ 
            isAuthenticated: status, 
            lastSyncAt: Date.now()
          });
          
          // Broadcast auth state change to other tabs
          if (typeof window !== 'undefined') {
            localStorage.setItem('auth_sync', JSON.stringify({
              timestamp: Date.now(),
              isAuthenticated: status
            }));
          }
        },
        
        setLoading: (loading) => {
          set({ isLoading: loading });
        },
        
        setOnboarded: (status) => {
          set({ 
            isOnboarded: status,
            lastSyncAt: Date.now()
          });
        },
        
        setAuthError: (error) => {
          set({ authError: error });
        },
        
        setAuthProvider: (provider) => {
          set({ authProvider: provider });
        },
        
        setWalletConnected: (connected) => {
          set({ hasWalletConnected: connected });
        },
        
        syncState: () => {
          const lastSync = get().lastSyncAt;
          
          // Check for auth state changes in other tabs
          if (typeof window !== 'undefined') {
            try {
              const syncData = localStorage.getItem('auth_sync');
              if (syncData) {
                const { timestamp, isAuthenticated } = JSON.parse(syncData);
                // Only update if the sync data is newer than our last sync
                if (timestamp > lastSync) {
                  set({ 
                    isAuthenticated,
                    lastSyncAt: timestamp
                  });
                }
              }
            } catch (error) {
              console.error('Error syncing auth state:', error);
            }
          }
        }
      }),
      {
        name: 'auth-store',
        partialize: (state) => ({
          isAuthenticated: state.isAuthenticated,
          isOnboarded: state.isOnboarded,
          authProvider: state.authProvider,
          hasWalletConnected: state.hasWalletConnected
        }),
      }
    )
  )
);
