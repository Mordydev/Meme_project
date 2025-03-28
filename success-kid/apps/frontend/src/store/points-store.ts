import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer'; // Optional: for easier immutable updates

// Define the shape of a points transaction
export interface PointsTransaction {
  id: string; // Assuming transaction ID is available
  amount: number;
  source: string;
  description?: string;
  createdAt: string | Date; // Use string or Date based on API response
}

// Define the state structure
interface PointsState {
  total: number;
  history: PointsTransaction[];
  isLoading: boolean;
  error: string | null;
  lastFetchedUserId: string | null; // Track which user's data is loaded

  // Actions
  fetchPointsData: (userId: string, forceRefresh?: boolean) => Promise<void>;
  // Removed fetchHistory as fetchPointsData gets both total and history
  // Removed awardPoints as this should be handled via API calls/Server Actions triggering backend logic
  reset: () => void;
  _setLoading: (loading: boolean) => void; // Internal helper
  _setError: (error: string | null) => void; // Internal helper
}

// Define the initial state
const initialState = {
  total: 0,
  history: [],
  isLoading: false,
  error: null,
  lastFetchedUserId: null,
};

export const usePointsStore = create<PointsState>()(
  // Immer middleware for easier state updates (optional)
  immer(
    // Persist middleware to save state to localStorage (optional)
    persist(
      (set, get) => ({
        ...initialState,

        _setLoading: (loading) => set({ isLoading: loading }),
        _setError: (error) => set({ error: error }),

        /**
         * Fetches the user's points total and recent history from the API.
         * Avoids refetching if data for the same user is already loaded, unless forceRefresh is true.
         * @param userId The ID of the user whose points to fetch.
         * @param forceRefresh If true, fetches data even if already loaded for the user.
         */
        fetchPointsData: async (userId, forceRefresh = false) => {
          const currentState = get();
          // Avoid refetch if already loading or if data for this user is loaded and not forcing refresh
          if (currentState.isLoading || (currentState.lastFetchedUserId === userId && !forceRefresh)) {
            return;
          }

          set({ isLoading: true, error: null, lastFetchedUserId: userId });

          try {
            // Fetch data from the backend API endpoint we created
            // Example uses fetch, replace with your API client if needed
            const response = await fetch(`/api/users/${userId}/points?limit=20`); // Fetch recent 20 transactions

            if (!response.ok) {
              let errorMsg = 'Failed to fetch points data.';
              try {
                  const errorData = await response.json();
                  errorMsg = errorData.error || errorMsg;
              } catch (e) { /* Ignore parsing error */ }
              throw new Error(errorMsg);
            }

            const result = await response.json();

            if (!result.data || typeof result.data.total === 'undefined' || !Array.isArray(result.data.history)) {
                throw new Error('Invalid data format received from API.');
            }

            // Update state with fetched data
            set({
              total: result.data.total,
              // Ensure history items have correct types (e.g., Date objects) if needed
              history: result.data.history.map((item: any) => ({
                  ...item,
                  createdAt: new Date(item.createdAt) // Convert timestamp string to Date object
              })),
              isLoading: false,
              error: null,
            });

          } catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Failed to fetch points data.';
            console.error("Error in fetchPointsData:", error);
            set({
              isLoading: false,
              error: errorMsg,
              // Optionally reset data on error or keep stale data
              // total: 0,
              // history: [],
              // lastFetchedUserId: null,
            });
          }
        },

        /**
         * Resets the store to its initial state.
         */
        reset: () => {
          set(initialState);
        },

      }),
      {
        name: 'points-storage', // Name for localStorage key
        storage: createJSONStorage(() => localStorage), // Use localStorage
        partialize: (state) => ({
          // Only persist parts of the state if needed, e.g., not isLoading or error
          total: state.total,
          history: state.history.slice(0, 50), // Limit persisted history size
          lastFetchedUserId: state.lastFetchedUserId,
        }),
        // Optional: migration logic if state shape changes over time
        // version: 1,
        // migrate: (persistedState, version) => { ... }
      }
    )
  )
);

// Note: The 'awardPoints' action was removed from the store.
// Points should be awarded on the backend triggered by user actions (e.g., via Server Actions or API calls).
// The frontend store should then refetch data or receive updates via WebSockets to reflect the change.
