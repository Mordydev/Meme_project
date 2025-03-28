import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

export interface UserProfile {
  id: string;
  displayName: string;
  username: string;
  avatar?: string;
  level: number;
  title?: string;
  bio?: string;
  socialLinks?: Record<string, string>;
  wallet?: {
    connected: boolean;
    address?: string;
    isVerified: boolean;
  };
  achievements?: string[]; // IDs of earned achievements
  joinedAt: Date;
}

interface UserState {
  profile: UserProfile | null;
  isLoading: boolean;
  error: Error | null;
  
  // Actions
  setProfile: (profile: UserProfile) => void;
  updateProfile: (updates: Partial<UserProfile>) => void;
  connectWallet: (address: string) => void;
  disconnectWallet: () => void;
  fetchProfile: () => Promise<void>;
  resetError: () => void;
  logout: () => void;
}

export const useUserStore = create<UserState>()(
  devtools(
    persist(
      (set, get) => ({
        profile: null,
        isLoading: false,
        error: null,
        
        setProfile: (profile) => {
          set({ profile, error: null });
        },
        
        updateProfile: (updates) => {
          const currentProfile = get().profile;
          if (!currentProfile) return;
          
          set({
            profile: { ...currentProfile, ...updates },
            error: null,
          });
          
          // API call would go here in real implementation
          // Example:
          // apiClient.put('/api/users/profile', updates)
          //   .catch(error => {
          //     set({ error });
          //   });
        },
        
        connectWallet: (address) => {
          const currentProfile = get().profile;
          if (!currentProfile) return;
          
          set({
            profile: {
              ...currentProfile,
              wallet: {
                connected: true,
                address,
                isVerified: true, // This would be set based on verification status
              },
            },
            error: null,
          });
          
          // API call would go here in real implementation
        },
        
        disconnectWallet: () => {
          const currentProfile = get().profile;
          if (!currentProfile) return;
          
          set({
            profile: {
              ...currentProfile,
              wallet: {
                connected: false,
                isVerified: false,
              },
            },
            error: null,
          });
          
          // API call would go here in real implementation
        },
        
        fetchProfile: async () => {
          set({ isLoading: true, error: null });
          
          try {
            // This would be replaced with actual API call
            // Example:
            // const data = await apiClient.get('/api/users/profile');
            
            // For now, simulate API call with timeout
            await new Promise(resolve => setTimeout(resolve, 500));
            const mockProfile: UserProfile = {
              id: 'user123',
              displayName: 'Demo User',
              username: 'demouser',
              avatar: '/images/avatars/default.png',
              level: 3,
              title: 'Early Adopter',
              bio: 'Just a demo user exploring the Success Kid platform!',
              wallet: {
                connected: false,
                isVerified: false,
              },
              achievements: ['first_post', 'connect_wallet'],
              joinedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            };
            
            set({
              profile: mockProfile,
              isLoading: false,
            });
          } catch (error) {
            set({ 
              isLoading: false, 
              error: error instanceof Error ? error : new Error('Failed to fetch user profile')
            });
          }
        },
        
        resetError: () => set({ error: null }),
        
        logout: () => {
          set({ profile: null, error: null });
          
          // API call would go here in real implementation
          // Example:
          // apiClient.post('/api/auth/logout')
          //   .catch(error => {
          //     // Handle logout error if needed
          //   });
        },
      }),
      {
        name: 'user-storage',
        // Only persist minimal user info, not the whole profile for security
        partialize: (state) => state.profile ? { 
          profile: {
            id: state.profile.id,
            displayName: state.profile.displayName,
            username: state.profile.username,
            avatar: state.profile.avatar,
            level: state.profile.level,
          }
        } : {},
      }
    )
  )
);
