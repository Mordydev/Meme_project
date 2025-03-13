import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { apiClient } from '@/lib/api-client';

/**
 * Level data model
 */
export interface LevelData {
  level: number;
  title: string;
  currentPoints: number;
  nextLevelPoints: number;
  progress: number; // 0-100 percentage
  benefits: string[];
  badges: {
    current: string; // Badge URL
    next?: string;
  };
  history?: {
    level: number;
    achievedAt: string;
  }[];
}

/**
 * Level store state
 */
interface LevelState {
  userData: LevelData | null;
  isLevelUpActive: boolean;
  previousLevel: number | null;
  isLoading: boolean;
  error: Error | null;
  
  // Actions
  fetchUserLevel: () => Promise<void>;
  dismissLevelUp: () => void;
  simulateLevelUp: (newLevel: number) => void; // For testing/development
}

/**
 * Level system store
 */
export const useLevelStore = create<LevelState>()(
  devtools(
    persist(
      (set, get) => ({
        userData: null,
        isLevelUpActive: false,
        previousLevel: null,
        isLoading: false,
        error: null,
        
        // Fetch user level data
        fetchUserLevel: async () => {
          set({ isLoading: true, error: null });
          
          try {
            const response = await apiClient.get('/api/users/me/level');
            
            if (response.data) {
              const newLevelData = response.data;
              const currentData = get().userData;
              const previousLevel = currentData?.level;
              
              // Check for level up
              if (previousLevel && newLevelData.level > previousLevel) {
                set({
                  userData: newLevelData,
                  isLevelUpActive: true,
                  previousLevel,
                  isLoading: false,
                });
              } else {
                set({
                  userData: newLevelData,
                  isLoading: false,
                });
              }
            }
          } catch (error) {
            console.error('Error fetching user level:', error);
            set({ 
              isLoading: false, 
              error: error instanceof Error ? error : new Error('Failed to fetch user level')
            });
          }
        },
        
        // Dismiss level up celebration
        dismissLevelUp: () => {
          set({ isLevelUpActive: false });
        },
        
        // Simulate level up (for testing)
        simulateLevelUp: (newLevel) => {
          const currentData = get().userData;
          if (!currentData) return;
          
          const previousLevel = currentData.level;
          
          // Only trigger if new level is higher
          if (newLevel > previousLevel) {
            set({
              userData: {
                ...currentData,
                level: newLevel,
                title: `Level ${newLevel} Title`, // Would be actual title in real data
              },
              isLevelUpActive: true,
              previousLevel,
            });
          }
        },
      }),
      {
        name: 'level-storage',
        // Only persist minimal level info
        partialize: (state) => ({ 
          userData: state.userData 
            ? { 
                level: state.userData.level,
                title: state.userData.title,
                progress: state.userData.progress 
              } 
            : null
        }),
      }
    )
  )
);
