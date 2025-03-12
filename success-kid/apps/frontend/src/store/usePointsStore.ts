import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

interface Transaction {
  id: string;
  amount: number;
  source: string;
  timestamp: Date;
  referenceId?: string;
  description?: string;
}

interface PointsState {
  balance: number;
  transactions: Transaction[];
  isLoading: boolean;
  error: Error | null;
  
  // Actions
  addPoints: (amount: number, source: string, referenceId?: string) => void;
  fetchBalance: () => Promise<void>;
  resetError: () => void;
}

export const usePointsStore = create<PointsState>()(
  devtools(
    persist(
      (set, get) => ({
        balance: 0,
        transactions: [],
        isLoading: false,
        error: null,
        
        addPoints: (amount, source, referenceId) => {
          // Optimistic update
          set((state) => ({
            balance: state.balance + amount,
            transactions: [
              {
                id: Date.now().toString(),
                amount,
                source,
                referenceId,
                timestamp: new Date(),
              },
              ...state.transactions,
            ],
            error: null,
          }));
          
          // API call would go here in real implementation
          // Example:
          // apiClient.post('/api/points/add', { amount, source, referenceId })
          //   .catch(error => {
          //     // Revert on error
          //     set((state) => ({
          //       balance: state.balance - amount,
          //       transactions: state.transactions.slice(1),
          //       error
          //     }));
          //   });
        },
        
        fetchBalance: async () => {
          set({ isLoading: true, error: null });
          
          try {
            // This would be replaced with actual API call
            // Example:
            // const data = await apiClient.get('/api/points/balance');
            // For now, simulate API call with timeout
            await new Promise(resolve => setTimeout(resolve, 500));
            const mockData = {
              balance: 1000,
              transactions: [
                {
                  id: '1',
                  amount: 500,
                  source: 'content_creation',
                  timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
                },
                {
                  id: '2',
                  amount: 250,
                  source: 'referral',
                  timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
                },
                {
                  id: '3',
                  amount: 250,
                  source: 'daily_login',
                  timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
                },
              ],
            };
            
            set({
              balance: mockData.balance,
              transactions: mockData.transactions,
              isLoading: false,
            });
          } catch (error) {
            set({ 
              isLoading: false, 
              error: error instanceof Error ? error : new Error('Failed to fetch points balance')
            });
          }
        },
        
        resetError: () => set({ error: null }),
      }),
      {
        name: 'points-storage',
        // Only persist non-sensitive data
        partialize: (state) => ({ 
          balance: state.balance,
          // Don't persist loading state or errors
        }),
      }
    )
  )
);
