import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { apiClient } from '@/lib/api-client';

interface Transaction {
  id: string;
  amount: number;
  source: string;
  timestamp: Date;
  referenceId?: string;
  description?: string;
}

interface CategoryCap {
  limit: number;
  used: number;
  resetsAt: string;
}

interface PointsState {
  balance: number;
  transactions: Transaction[];
  dashboardData: {
    lifetimeEarned: number;
    redeemed: number;
    dailyEarned: number;
    breakdown: Array<{
      category: string;
      amount: number;
      percentage: number;
    }>;
    caps: Record<string, CategoryCap>;
  } | null;
  trends: {
    dailyEarnings: Array<{
      date: string;
      amount: number;
      breakdown: Record<string, number>;
    }>;
    categoryTotals: Record<string, number>;
  } | null;
  redemption: {
    isEligible: boolean;
    requirements: {
      minimumBalance: number;
      walletConnected: boolean;
      verificationComplete: boolean;
    };
    limits: {
      conversionRate: number;
      minimumAmount: number;
      weeklyLimit: number;
      weeklyUsed: number;
      resetsAt: string;
    };
  } | null;
  redemptionHistory: Array<{
    id: string;
    pointsAmount: number;
    tokenAmount: number;
    status: 'pending' | 'completed' | 'failed';
    requestedAt: string;
    processedAt?: string;
    transactionHash?: string;
  }>;
  isLoading: boolean;
  error: Error | null;
  
  // Actions
  addPoints: (amount: number, source: string, referenceId?: string) => void;
  fetchBalance: () => Promise<void>;
  fetchDashboard: () => Promise<void>;
  fetchTransactions: (filters?: Record<string, any>) => Promise<void>;
  fetchTrends: (period?: 'day' | 'week' | 'month' | 'year') => Promise<void>;
  fetchRedemptionEligibility: () => Promise<void>;
  fetchRedemptionHistory: () => Promise<void>;
  redeemPoints: (amount: number) => Promise<any>;
  resetError: () => void;
}

export const usePointsStore = create<PointsState>()(
  devtools(
    persist(
      (set, get) => ({
        balance: 0,
        transactions: [],
        dashboardData: null,
        trends: null,
        redemption: null,
        redemptionHistory: [],
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
          
          // In a real implementation, this would be an API call
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
            const response = await apiClient.get('/api/points');
            const { data } = response.data || {};
            
            if (data) {
              set({
                balance: data.balance,
                transactions: data.history.map((tx: any) => ({
                  ...tx,
                  timestamp: new Date(tx.createdAt)
                })),
                isLoading: false,
              });
            }
          } catch (error) {
            console.error('Error fetching points balance:', error);
            set({ 
              isLoading: false, 
              error: error instanceof Error ? error : new Error('Failed to fetch points balance')
            });
          }
        },
        
        fetchDashboard: async () => {
          set({ isLoading: true, error: null });
          
          try {
            const response = await apiClient.get('/api/points/dashboard');
            const { data } = response.data || {};
            
            if (data) {
              set({
                balance: data.currentBalance,
                dashboardData: {
                  lifetimeEarned: data.lifetimeEarned,
                  redeemed: data.redeemed,
                  dailyEarned: data.dailyEarned,
                  breakdown: data.breakdown,
                  caps: data.caps
                },
                isLoading: false,
              });
            }
          } catch (error) {
            console.error('Error fetching dashboard data:', error);
            set({ 
              isLoading: false, 
              error: error instanceof Error ? error : new Error('Failed to fetch dashboard data')
            });
          }
        },
        
        fetchTransactions: async (filters = {}) => {
          set({ isLoading: true, error: null });
          
          try {
            // Prepare query parameters
            const queryParams = new URLSearchParams();
            Object.entries(filters).forEach(([key, value]) => {
              if (value) queryParams.append(key, String(value));
            });
            
            const response = await apiClient.get(`/api/points/transactions?${queryParams}`);
            const { data } = response.data || {};
            
            if (data) {
              set({
                transactions: data.transactions.map((tx: any) => ({
                  ...tx,
                  timestamp: new Date(tx.timestamp)
                })),
                isLoading: false,
              });
            }
          } catch (error) {
            console.error('Error fetching transactions:', error);
            set({ 
              isLoading: false, 
              error: error instanceof Error ? error : new Error('Failed to fetch transactions')
            });
          }
        },
        
        fetchTrends: async (period = 'week') => {
          set({ isLoading: true, error: null });
          
          try {
            const response = await apiClient.get(`/api/points/trends?period=${period}`);
            const { data } = response.data || {};
            
            if (data) {
              set({
                trends: data,
                isLoading: false,
              });
            }
          } catch (error) {
            console.error('Error fetching trends data:', error);
            set({ 
              isLoading: false, 
              error: error instanceof Error ? error : new Error('Failed to fetch trends data')
            });
          }
        },
        
        fetchRedemptionEligibility: async () => {
          set({ isLoading: true, error: null });
          
          try {
            const response = await apiClient.get('/api/points/redemption/eligibility');
            const { data } = response.data || {};
            
            if (data) {
              set({
                redemption: data,
                isLoading: false,
              });
            }
          } catch (error) {
            console.error('Error fetching redemption eligibility:', error);
            set({ 
              isLoading: false, 
              error: error instanceof Error ? error : new Error('Failed to fetch redemption eligibility')
            });
          }
        },
        
        fetchRedemptionHistory: async () => {
          set({ isLoading: true, error: null });
          
          try {
            const response = await apiClient.get('/api/points/redemption/history');
            const { data } = response.data || {};
            
            if (data) {
              set({
                redemptionHistory: data.redemptions,
                isLoading: false,
              });
            }
          } catch (error) {
            console.error('Error fetching redemption history:', error);
            set({ 
              isLoading: false, 
              error: error instanceof Error ? error : new Error('Failed to fetch redemption history')
            });
          }
        },
        
        redeemPoints: async (amount) => {
          set({ isLoading: true, error: null });
          
          try {
            // This would be a real API call in production
            // For now, just simulate a successful redemption
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Update balance
            set(state => ({
              balance: state.balance - amount,
              transactions: [
                {
                  id: Date.now().toString(),
                  amount: -amount,
                  source: 'redemption',
                  description: 'Points redeemed for tokens',
                  timestamp: new Date(),
                },
                ...state.transactions,
              ],
              isLoading: false,
            }));
            
            return { success: true };
          } catch (error) {
            console.error('Error redeeming points:', error);
            set({ 
              isLoading: false, 
              error: error instanceof Error ? error : new Error('Failed to redeem points')
            });
            return { success: false, error };
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
