import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { 
  Achievement, 
  AchievementProgress, 
  AchievementEvent,
  AchievementNotification
} from '@/types';

interface AchievementState {
  // Data
  achievements: Achievement[];
  progress: Record<string, AchievementProgress>;
  notifications: AchievementNotification[];
  isLoading: boolean;
  error: Error | null;
  
  // Actions
  setAchievements: (achievements: Achievement[]) => void;
  setProgress: (progress: Record<string, AchievementProgress>) => void;
  updateProgress: (achievementId: string, progress: Partial<AchievementProgress>) => void;
  unlockAchievement: (achievementId: string, pointsAwarded: number) => void;
  triggerEvent: (event: AchievementEvent) => Promise<AchievementNotification[]>;
  fetchAchievements: () => Promise<void>;
  dismissNotification: (achievementId: string) => void;
  clearNotifications: () => void;
  resetError: () => void;
}

/**
 * Achievement System Store
 * 
 * Central state management for the achievement and gamification system.
 */
export const useAchievementStore = create<AchievementState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        achievements: [],
        progress: {},
        notifications: [],
        isLoading: false,
        error: null,
        
        // Set all achievements
        setAchievements: (achievements) => {
          set({ achievements, error: null });
        },
        
        // Set progress for all achievements
        setProgress: (progress) => {
          set({ progress, error: null });
        },
        
        // Update progress for a single achievement
        updateProgress: (achievementId, progressUpdate) => {
          set((state) => {
            const currentProgress = state.progress[achievementId] || {
              id: achievementId,
              progress: 0,
              criteria: {},
              unlocked: false
            };
            
            return {
              progress: {
                ...state.progress,
                [achievementId]: {
                  ...currentProgress,
                  ...progressUpdate
                }
              },
              error: null
            };
          });
        },
        
        // Mark an achievement as unlocked
        unlockAchievement: (achievementId, pointsAwarded) => {
          set((state) => {
            // Find the achievement definition
            const achievement = state.achievements.find(a => a.id === achievementId);
            if (!achievement) return state;
            
            // Update progress to show as unlocked
            const updatedProgress = {
              ...state.progress,
              [achievementId]: {
                ...(state.progress[achievementId] || { id: achievementId, criteria: {}, progress: 0 }),
                progress: 100,
                unlocked: true,
                unlockedAt: new Date().toISOString()
              }
            };
            
            // Create notification for the unlock
            const notification: AchievementNotification = {
              achievementId,
              title: achievement.title,
              description: achievement.description,
              badgeUrl: achievement.badgeUrl,
              pointsAwarded,
              unlockedAt: new Date().toISOString()
            };
            
            return {
              progress: updatedProgress,
              notifications: [...state.notifications, notification],
              error: null
            };
          });
        },
        
        // Trigger an achievement event check
        triggerEvent: async (event) => {
          // This would be a server call in production
          // For now, we'll simulate a local check
          const { achievements, progress } = get();
          
          const newNotifications: AchievementNotification[] = [];
          
          // Simulate delay to mimic API call
          await new Promise(resolve => setTimeout(resolve, 300));
          
          // Example simple event processing logic
          if (event.type === 'profile_updated' && achievements.length > 0) {
            // For demo, unlock the profile_complete achievement if it exists and is not already unlocked
            const profileAchievement = achievements.find(a => a.id === 'profile_complete');
            if (profileAchievement && (!progress['profile_complete'] || !progress['profile_complete'].unlocked)) {
              set((state) => {
                const notification: AchievementNotification = {
                  achievementId: profileAchievement.id,
                  title: profileAchievement.title,
                  description: profileAchievement.description,
                  badgeUrl: profileAchievement.badgeUrl,
                  pointsAwarded: profileAchievement.pointsReward,
                  unlockedAt: new Date().toISOString()
                };
                
                newNotifications.push(notification);
                
                return {
                  progress: {
                    ...state.progress,
                    [profileAchievement.id]: {
                      id: profileAchievement.id,
                      progress: 100,
                      criteria: {},
                      unlocked: true,
                      unlockedAt: new Date().toISOString()
                    }
                  },
                  notifications: [...state.notifications, notification]
                };
              });
            }
          }
          
          if (event.type === 'wallet_connected' && achievements.length > 0) {
            // Unlock the wallet connection achievement if it exists
            const walletAchievement = achievements.find(a => a.id === 'connect_wallet');
            if (walletAchievement && (!progress['connect_wallet'] || !progress['connect_wallet'].unlocked)) {
              set((state) => {
                const notification: AchievementNotification = {
                  achievementId: walletAchievement.id,
                  title: walletAchievement.title,
                  description: walletAchievement.description,
                  badgeUrl: walletAchievement.badgeUrl,
                  pointsAwarded: walletAchievement.pointsReward,
                  unlockedAt: new Date().toISOString()
                };
                
                newNotifications.push(notification);
                
                return {
                  progress: {
                    ...state.progress,
                    [walletAchievement.id]: {
                      id: walletAchievement.id,
                      progress: 100,
                      criteria: {},
                      unlocked: true,
                      unlockedAt: new Date().toISOString()
                    }
                  },
                  notifications: [...state.notifications, notification]
                };
              });
            }
          }
          
          if (event.type === 'content_created' && achievements.length > 0) {
            // Unlock the first post achievement if it exists
            const postAchievement = achievements.find(a => a.id === 'first_post');
            if (postAchievement && (!progress['first_post'] || !progress['first_post'].unlocked)) {
              set((state) => {
                const notification: AchievementNotification = {
                  achievementId: postAchievement.id,
                  title: postAchievement.title,
                  description: postAchievement.description,
                  badgeUrl: postAchievement.badgeUrl,
                  pointsAwarded: postAchievement.pointsReward,
                  unlockedAt: new Date().toISOString()
                };
                
                newNotifications.push(notification);
                
                return {
                  progress: {
                    ...state.progress,
                    [postAchievement.id]: {
                      id: postAchievement.id,
                      progress: 100,
                      criteria: {},
                      unlocked: true,
                      unlockedAt: new Date().toISOString()
                    }
                  },
                  notifications: [...state.notifications, notification]
                };
              });
            }
          }
          
          if (event.type === 'comment_created' && achievements.length > 0) {
            // Unlock the first comment achievement if it exists
            const commentAchievement = achievements.find(a => a.id === 'first_comment');
            if (commentAchievement && (!progress['first_comment'] || !progress['first_comment'].unlocked)) {
              set((state) => {
                const notification: AchievementNotification = {
                  achievementId: commentAchievement.id,
                  title: commentAchievement.title,
                  description: commentAchievement.description,
                  badgeUrl: commentAchievement.badgeUrl,
                  pointsAwarded: commentAchievement.pointsReward,
                  unlockedAt: new Date().toISOString()
                };
                
                newNotifications.push(notification);
                
                return {
                  progress: {
                    ...state.progress,
                    [commentAchievement.id]: {
                      id: commentAchievement.id,
                      progress: 100,
                      criteria: {},
                      unlocked: true,
                      unlockedAt: new Date().toISOString()
                    }
                  },
                  notifications: [...state.notifications, notification]
                };
              });
            }
          }
          
          return newNotifications;
        },
        
        // Fetch achievements and progress from API
        fetchAchievements: async () => {
          set({ isLoading: true, error: null });
          
          try {
            // This would be an API call in production
            // For now, we'll simulate the response with demo data
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Mock achievement data
            const mockAchievements: Achievement[] = [
              {
                id: 'first_steps',
                title: 'First Steps',
                description: 'Complete your profile setup',
                category: 'onboarding',
                badgeUrl: '/images/achievements/first-steps.svg',
                requirements: { profileComplete: true },
                pointsReward: 100,
                difficulty: 'common'
              },
              {
                id: 'profile_complete',
                title: 'Identity Established',
                description: 'Create your Success Kid identity',
                category: 'onboarding',
                badgeUrl: '/images/achievements/profile-complete.svg',
                requirements: { 
                  bio: true, 
                  avatar: true
                },
                pointsReward: 150,
                difficulty: 'common'
              },
              {
                id: 'connect_wallet',
                title: 'Wallet Warrior',
                description: 'Connect your first wallet',
                category: 'wallet',
                badgeUrl: '/images/achievements/wallet-connected.svg',
                requirements: { walletConnected: true },
                pointsReward: 200,
                difficulty: 'common'
              },
              {
                id: 'first_post',
                title: 'Content Creator',
                description: 'Share your first post with the community',
                category: 'content',
                badgeUrl: '/images/achievements/first-post.svg',
                requirements: { postsCreated: 1 },
                pointsReward: 150,
                difficulty: 'common'
              },
              {
                id: 'first_comment',
                title: 'Conversation Starter',
                description: 'Join the discussion with your first comment',
                category: 'engagement',
                badgeUrl: '/images/achievements/first-comment.svg',
                requirements: { commentsCreated: 1 },
                pointsReward: 100,
                difficulty: 'common'
              },
              {
                id: 'loyal_visitor',
                title: 'Loyal Visitor',
                description: 'Visit the platform for 7 consecutive days',
                category: 'engagement',
                badgeUrl: '/images/achievements/loyal-visitor.svg',
                requirements: { dailyVisits: 7 },
                pointsReward: 300,
                difficulty: 'uncommon'
              },
              {
                id: 'rising_creator',
                title: 'Rising Creator',
                description: 'Create 10 posts that receive at least 5 upvotes each',
                category: 'content',
                badgeUrl: '/images/achievements/rising-creator.svg',
                requirements: { 
                  postsWithUpvotes: {
                    count: 10,
                    upvotes: 5
                  }
                },
                pointsReward: 500,
                difficulty: 'rare'
              },
              {
                id: 'community_pillar',
                title: 'Community Pillar',
                description: 'Earn 1000 total points from community activities',
                category: 'milestones',
                badgeUrl: '/images/achievements/community-pillar.svg',
                requirements: { 
                  totalPoints: 1000
                },
                pointsReward: 750,
                difficulty: 'epic'
              },
              {
                id: 'first_referral',
                title: 'Friend Bringer',
                description: 'Refer your first friend to the platform',
                category: 'referral',
                badgeUrl: '/images/achievements/first-referral.svg',
                requirements: { 
                  referrals: 1
                },
                pointsReward: 250,
                difficulty: 'uncommon'
              },
              {
                id: 'weekly_streak',
                title: 'Weekly Warrior',
                description: 'Complete all daily tasks for a full week',
                category: 'engagement',
                badgeUrl: '/images/achievements/weekly-streak.svg',
                requirements: { 
                  dailyTasksCompleted: 7
                },
                pointsReward: 350,
                difficulty: 'uncommon'
              }
            ];
            
            // Mock progress data
            const mockProgress: Record<string, AchievementProgress> = {
              'first_steps': {
                id: 'first_steps',
                progress: 100,
                criteria: {
                  profileComplete: {
                    current: 1,
                    target: 1,
                    completed: true
                  }
                },
                unlocked: true,
                unlockedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
              },
              'connect_wallet': {
                id: 'connect_wallet',
                progress: 0,
                criteria: {
                  walletConnected: {
                    current: 0,
                    target: 1,
                    completed: false
                  }
                },
                unlocked: false
              },
              'first_post': {
                id: 'first_post',
                progress: 0,
                criteria: {
                  postsCreated: {
                    current: 0,
                    target: 1,
                    completed: false
                  }
                },
                unlocked: false
              },
              'loyal_visitor': {
                id: 'loyal_visitor',
                progress: 43,
                criteria: {
                  dailyVisits: {
                    current: 3,
                    target: 7,
                    completed: false
                  }
                },
                unlocked: false
              }
            };
            
            set({
              achievements: mockAchievements,
              progress: mockProgress,
              isLoading: false
            });
          } catch (error) {
            console.error('Error fetching achievements:', error);
            set({ 
              isLoading: false, 
              error: error instanceof Error ? error : new Error('Failed to fetch achievements')
            });
          }
        },
        
        // Dismiss a single notification
        dismissNotification: (achievementId) => {
          set((state) => ({
            notifications: state.notifications.filter(n => n.achievementId !== achievementId)
          }));
        },
        
        // Clear all notifications
        clearNotifications: () => {
          set({ notifications: [] });
        },
        
        // Reset error state
        resetError: () => {
          set({ error: null });
        }
      }),
      {
        name: 'achievement-storage',
        // Only persist non-sensitive data
        partialize: (state) => ({
          // Don't persist loading state or errors
          // Only persist achievement IDs that have been unlocked
          progress: Object.fromEntries(
            Object.entries(state.progress)
              .filter(([_, progress]) => progress.unlocked)
              .map(([id, progress]) => [id, { 
                id, 
                unlocked: progress.unlocked,
                unlockedAt: progress.unlockedAt
              }])
          ),
          // Don't persist notifications - they will be shown fresh on next load
        }),
      }
    )
  )
);
