import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { apiClient } from '@/lib/api-client';

/**
 * Achievement category type
 */
export type AchievementCategory = 
  | 'onboarding'
  | 'content'
  | 'engagement'
  | 'holder'
  | 'community'
  | 'milestone';

/**
 * Achievement model
 */
export interface Achievement {
  id: string;
  title: string;
  description: string;
  category: AchievementCategory;
  badgeUrl: string;
  difficulty: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  requirements: Record<string, any>;
  pointsReward: number;
  unlocked: boolean;
  unlockedAt?: Date;
  progress: number; // 0-100 percentage
}

/**
 * Achievement progress update
 */
export interface AchievementProgress {
  id: string;
  progress: number;
}

/**
 * Achievement unlock info
 */
export interface AchievementUnlock {
  id: string;
  unlockedAt: Date;
}

/**
 * Achievement store state
 */
interface AchievementState {
  achievements: Achievement[];
  isLoading: boolean;
  error: Error | null;
  
  // Computed values
  unlockedAchievements: Achievement[];
  inProgressAchievements: Achievement[];
  achievementsByCategory: Record<AchievementCategory, Achievement[]>;
  
  // Actions
  fetchAchievements: () => Promise<void>;
  unlockAchievement: (unlock: AchievementUnlock) => void;
  updateProgress: (progressUpdates: AchievementProgress[]) => void;
  triggerEvent: (eventType: string, eventData?: any) => Promise<{
    unlockedAchievements: Achievement[];
    updatedProgress: AchievementProgress[];
  }>;
  resetError: () => void;
}

/**
 * Achievement store
 */
export const useAchievementStore = create<AchievementState>()(
  devtools(
    persist(
      (set, get) => ({
        achievements: [],
        isLoading: false,
        error: null,
        
        // Computed values that will be calculated from the achievements array
        get unlockedAchievements() {
          return get().achievements.filter(a => a.unlocked);
        },
        
        get inProgressAchievements() {
          return get().achievements.filter(a => !a.unlocked && a.progress > 0);
        },
        
        get achievementsByCategory() {
          return get().achievements.reduce((acc, achievement) => {
            if (!acc[achievement.category]) {
              acc[achievement.category] = [];
            }
            acc[achievement.category].push(achievement);
            return acc;
          }, {} as Record<AchievementCategory, Achievement[]>);
        },
        
        // Fetch all achievements with their progress
        fetchAchievements: async () => {
          set({ isLoading: true, error: null });
          
          try {
            const response = await apiClient.get('/api/achievements');
            
            if (response.data?.achievements) {
              // Transform dates from strings to Date objects
              const achievements = response.data.achievements.map((achievement: any) => ({
                ...achievement,
                unlockedAt: achievement.unlockedAt ? new Date(achievement.unlockedAt) : undefined,
              }));
              
              set({ achievements, isLoading: false });
            }
          } catch (error) {
            console.error('Error fetching achievements:', error);
            set({ 
              isLoading: false, 
              error: error instanceof Error ? error : new Error('Failed to fetch achievements')
            });
          }
        },
        
        // Mark an achievement as unlocked
        unlockAchievement: (unlock) => {
          set(state => ({
            achievements: state.achievements.map(achievement => 
              achievement.id === unlock.id 
                ? { 
                    ...achievement, 
                    unlocked: true, 
                    unlockedAt: unlock.unlockedAt,
                    progress: 100 
                  }
                : achievement
            )
          }));
        },
        
        // Update progress for achievements
        updateProgress: (progressUpdates) => {
          set(state => ({
            achievements: state.achievements.map(achievement => {
              const update = progressUpdates.find(p => p.id === achievement.id);
              return update 
                ? { ...achievement, progress: update.progress }
                : achievement;
            })
          }));
        },
        
        // Trigger an achievement event
        triggerEvent: async (eventType, eventData) => {
          try {
            const response = await apiClient.post('/api/achievements/events', {
              data: {
                eventType,
                metadata: eventData
              }
            });
            
            const result = {
              unlockedAchievements: [] as Achievement[],
              updatedProgress: [] as AchievementProgress[]
            };
            
            // Update unlocked achievements
            if (response.data?.unlockedAchievements?.length) {
              const unlocks = response.data.unlockedAchievements.map((unlock: any) => ({
                id: unlock.id,
                unlockedAt: new Date(unlock.timestamp || Date.now())
              }));
              
              unlocks.forEach(unlock => {
                get().unlockAchievement(unlock);
              });
              
              result.unlockedAchievements = get().achievements.filter(
                a => unlocks.some(u => u.id === a.id)
              );
            }
            
            // Update progress
            if (response.data?.updatedProgress?.length) {
              get().updateProgress(response.data.updatedProgress);
              
              result.updatedProgress = response.data.updatedProgress;
            }
            
            return result;
          } catch (error) {
            console.error('Error triggering achievement event:', error);
            return {
              unlockedAchievements: [],
              updatedProgress: []
            };
          }
        },
        
        resetError: () => set({ error: null }),
      }),
      {
        name: 'achievement-storage',
        partialize: (state) => ({
          // Only persist the IDs of unlocked achievements and their timestamps
          unlockedAchievements: state.achievements
            .filter(a => a.unlocked)
            .map(a => ({ id: a.id, unlockedAt: a.unlockedAt })),
        }),
      }
    )
  )
);
