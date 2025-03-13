import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { apiClient } from '@/lib/api-client';

/**
 * Leaderboard period types
 */
export type LeaderboardPeriod = 'daily' | 'weekly' | 'monthly' | 'all-time';

/**
 * Leaderboard category types
 */
export type LeaderboardCategory = 'points' | 'achievements' | 'content' | 'referrals';

/**
 * User ranking data
 */
export interface UserRanking {
  rank: number;
  userId: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  level: number;
  score: number;
  change?: number; // Position change since last period
}

/**
 * User's personal rank
 */
export interface UserRank {
  rank: number;
  score: number;
  change?: number;
}

/**
 * Pagination data
 */
export interface Pagination {
  total: number;
  limit: number;
  offset: number;
}

/**
 * Leaderboard store state
 */
interface LeaderboardState {
  rankings: UserRanking[];
  userRank: UserRank | null;
  pagination: Pagination | null;
  period: LeaderboardPeriod;
  category: LeaderboardCategory;
  isLoading: boolean;
  error: Error | null;
  
  // Actions
  fetchLeaderboard: (options?: {
    period?: LeaderboardPeriod;
    category?: LeaderboardCategory;
    limit?: number;
    offset?: number;
  }) => Promise<void>;
  setPeriod: (period: LeaderboardPeriod) => void;
  setCategory: (category: LeaderboardCategory) => void;
  setPage: (page: number) => void;
  resetError: () => void;
}

/**
 * Leaderboard store
 */
export const useLeaderboardStore = create<LeaderboardState>()(
  devtools(
    (set, get) => ({
      rankings: [],
      userRank: null,
      pagination: null,
      period: 'weekly',
      category: 'points',
      isLoading: false,
      error: null,
      
      // Fetch leaderboard data
      fetchLeaderboard: async (options) => {
        const state = get();
        
        // Apply options or use current state
        const period = options?.period || state.period;
        const category = options?.category || state.category;
        const limit = options?.limit || (state.pagination?.limit || 20);
        const offset = options?.offset || 0;
        
        set({ 
          isLoading: true, 
          error: null,
          // Update period and category if changed
          ...(period !== state.period ? { period } : {}),
          ...(category !== state.category ? { category } : {})
        });
        
        try {
          // Prepare query parameters
          const params = new URLSearchParams({
            period,
            category,
            limit: limit.toString(),
            offset: offset.toString()
          });
          
          const response = await apiClient.get(`/api/leaderboard?${params}`);
          
          if (response.data) {
            set({
              rankings: response.data.rankings,
              userRank: response.data.userRank,
              pagination: response.data.pagination,
              isLoading: false,
            });
          }
        } catch (error) {
          console.error('Error fetching leaderboard:', error);
          set({ 
            isLoading: false, 
            error: error instanceof Error ? error : new Error('Failed to fetch leaderboard')
          });
        }
      },
      
      // Set time period
      setPeriod: (period) => {
        // Only fetch if period changes
        if (period !== get().period) {
          set({ period });
          get().fetchLeaderboard({ period });
        }
      },
      
      // Set category
      setCategory: (category) => {
        // Only fetch if category changes
        if (category !== get().category) {
          set({ category });
          get().fetchLeaderboard({ category });
        }
      },
      
      // Set page (for pagination)
      setPage: (page) => {
        const { pagination } = get();
        if (!pagination) return;
        
        const offset = (page - 1) * pagination.limit;
        get().fetchLeaderboard({ offset });
      },
      
      // Reset error state
      resetError: () => set({ error: null }),
    })
  )
);
