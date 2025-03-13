import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { apiClient, AppError } from '@/lib/api-client';
import {
  LeaderboardCategory,
  TimeFrame,
  RankedUser,
  CurrentUserRank,
  RankHistoryPoint,
  CategoryBreakdown,
} from '@/types/leaderboard';

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
  // Global leaderboard data
  rankings: RankedUser[];
  userRank: CurrentUserRank | null;
  pagination: Pagination | null;
  
  // Filters and view settings
  period: TimeFrame;
  category: LeaderboardCategory;
  
  // Personal ranking data
  rankingHistory: RankHistoryPoint[];
  categoryBreakdown: CategoryBreakdown;
  
  // Loading and error states
  isLoading: boolean;
  isHistoryLoading: boolean;
  error: Error | null;
  
  // Actions
  fetchLeaderboard: (options?: {
    period?: TimeFrame;
    category?: LeaderboardCategory;
    limit?: number;
    offset?: number;
  }) => Promise<void>;
  
  fetchRankingHistory: (options?: {
    category?: LeaderboardCategory;
    period?: TimeFrame;
  }) => Promise<void>;
  
  setPeriod: (period: TimeFrame) => void;
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
      // Initial state
      rankings: [],
      userRank: null,
      pagination: null,
      period: 'weekly',
      category: 'points',
      rankingHistory: [],
      categoryBreakdown: {},
      isLoading: false,
      isHistoryLoading: false,
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
            timeframe: period,
            category,
            limit: limit.toString(),
            offset: offset.toString()
          });
          
          const response = await apiClient.get(`/api/v1/leaderboard?${params.toString()}`);
          
          if (response.data) {
            set({
              rankings: response.data.rankings,
              userRank: response.data.currentUser,
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
      
      // Fetch personal ranking history
      fetchRankingHistory: async (options) => {
        const state = get();
        
        // Apply options or use current state
        const category = options?.category || state.category;
        const period = options?.period || 'monthly';
        
        set({ isHistoryLoading: true, error: null });
        
        try {
          // Prepare query parameters
          const params = new URLSearchParams({
            category,
            timeframe: period,
          });
          
          const response = await apiClient.get(`/api/v1/leaderboard/history?${params.toString()}`);
          
          if (response.data) {
            set({
              rankingHistory: response.data.history,
              categoryBreakdown: response.data.categories,
              isHistoryLoading: false,
            });
          }
        } catch (error) {
          console.error('Error fetching ranking history:', error);
          set({ 
            isHistoryLoading: false, 
            error: error instanceof Error ? error : new Error('Failed to fetch ranking history')
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
    }),
    {
      name: 'leaderboard-store',
    }
  )
);
