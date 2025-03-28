import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { 
  MarketData,
  MarketStats,
  MarketTransaction,
  Milestone,
  NextMilestone,
  PriceDataPoint,
  TokenAllocation
} from '@/types';
import { apiClient } from '@/lib/api/api-client';

interface MarketState {
  // Price data
  currentPrice: number;
  priceChange24h: number;
  priceChangePercent24h: number;
  prices: PriceDataPoint[];
  selectedTimeRange: string;
  
  // Market cap and milestones
  marketCap: number;
  milestones: Milestone[];
  nextMilestone: NextMilestone | null;
  
  // Stats
  stats: MarketStats | null;
  
  // Supply
  totalSupply: number;
  circulatingSupply: number;
  burned: number;
  allocations: TokenAllocation[];
  
  // Transactions
  transactions: MarketTransaction[];
  transactionFilters: {
    type: string;
    limit: number;
    offset: number;
  };
  transactionPagination: {
    total: number;
    limit: number;
    offset: number;
  };
  
  // UI state
  isLoading: {
    price: boolean;
    milestones: boolean;
    stats: boolean;
    supply: boolean;
    transactions: boolean;
  };
  error: Error | null;
  lastUpdated: string | null;
  
  // Actions
  fetchPriceData: (timeRange?: string) => Promise<void>;
  fetchMilestones: () => Promise<void>;
  fetchStats: () => Promise<void>;
  fetchSupply: () => Promise<void>;
  fetchTransactions: (filters?: Partial<{
    type: string;
    limit: number;
    offset: number;
  }>) => Promise<void>;
  fetchAllMarketData: () => Promise<void>;
  resetError: () => void;
}

export const useMarketStore = create<MarketState>()(
  devtools(
    (set, get) => ({
      // Price data
      currentPrice: 0,
      priceChange24h: 0,
      priceChangePercent24h: 0,
      prices: [],
      selectedTimeRange: '1d',
      
      // Market cap and milestones
      marketCap: 0,
      milestones: [],
      nextMilestone: null,
      
      // Stats
      stats: null,
      
      // Supply
      totalSupply: 0,
      circulatingSupply: 0,
      burned: 0,
      allocations: [],
      
      // Transactions
      transactions: [],
      transactionFilters: {
        type: 'all',
        limit: 20,
        offset: 0,
      },
      transactionPagination: {
        total: 0,
        limit: 20,
        offset: 0,
      },
      
      // UI state
      isLoading: {
        price: false,
        milestones: false,
        stats: false,
        supply: false,
        transactions: false,
      },
      error: null,
      lastUpdated: null,
      
      // Actions
      fetchPriceData: async (timeRange) => {
        const selectedTimeRange = timeRange || get().selectedTimeRange;
        
        set(state => ({
          isLoading: { ...state.isLoading, price: true },
          error: null,
          selectedTimeRange,
        }));
        
        try {
          const response = await apiClient.get(`/api/market/price?timeRange=${selectedTimeRange}`);
          const { data } = response;
          
          set(state => ({
            currentPrice: data.basePrice,
            priceChange24h: data.priceChange,
            priceChangePercent24h: data.priceChangePercent,
            prices: data.prices,
            isLoading: { ...state.isLoading, price: false },
            lastUpdated: data.lastUpdated,
          }));
        } catch (error) {
          console.error('Error fetching price data:', error);
          set(state => ({ 
            isLoading: { ...state.isLoading, price: false }, 
            error: error instanceof Error ? error : new Error('Failed to fetch price data')
          }));
        }
      },
      
      fetchMilestones: async () => {
        set(state => ({
          isLoading: { ...state.isLoading, milestones: true },
          error: null,
        }));
        
        try {
          const response = await apiClient.get('/api/market/milestones');
          const { data } = response;
          
          set(state => ({
            marketCap: data.currentMarketCap,
            milestones: data.milestones,
            nextMilestone: data.nextMilestone,
            isLoading: { ...state.isLoading, milestones: false },
            lastUpdated: data.lastUpdated,
          }));
        } catch (error) {
          console.error('Error fetching milestone data:', error);
          set(state => ({ 
            isLoading: { ...state.isLoading, milestones: false }, 
            error: error instanceof Error ? error : new Error('Failed to fetch milestone data')
          }));
        }
      },
      
      fetchStats: async () => {
        set(state => ({
          isLoading: { ...state.isLoading, stats: true },
          error: null,
        }));
        
        try {
          const response = await apiClient.get('/api/market/stats');
          const { data } = response;
          
          set(state => ({
            stats: data,
            isLoading: { ...state.isLoading, stats: false },
            lastUpdated: data.lastUpdated,
          }));
        } catch (error) {
          console.error('Error fetching market stats:', error);
          set(state => ({ 
            isLoading: { ...state.isLoading, stats: false }, 
            error: error instanceof Error ? error : new Error('Failed to fetch market stats')
          }));
        }
      },
      
      fetchSupply: async () => {
        set(state => ({
          isLoading: { ...state.isLoading, supply: true },
          error: null,
        }));
        
        try {
          const response = await apiClient.get('/api/market/supply');
          const { data } = response;
          
          set(state => ({
            totalSupply: data.totalSupply,
            circulatingSupply: data.circulatingSupply,
            burned: data.burned,
            allocations: data.allocations,
            isLoading: { ...state.isLoading, supply: false },
            lastUpdated: data.lastUpdated,
          }));
        } catch (error) {
          console.error('Error fetching supply data:', error);
          set(state => ({ 
            isLoading: { ...state.isLoading, supply: false }, 
            error: error instanceof Error ? error : new Error('Failed to fetch supply data')
          }));
        }
      },
      
      fetchTransactions: async (filters) => {
        const currentFilters = get().transactionFilters;
        const updatedFilters = { ...currentFilters, ...filters };
        
        set(state => ({
          isLoading: { ...state.isLoading, transactions: true },
          error: null,
          transactionFilters: updatedFilters,
        }));
        
        try {
          // Build query params
          const params = new URLSearchParams();
          Object.entries(updatedFilters).forEach(([key, value]) => {
            params.append(key, String(value));
          });
          
          const response = await apiClient.get(`/api/market/transactions?${params.toString()}`);
          const { data } = response;
          
          set(state => ({
            transactions: data.transactions,
            transactionPagination: data.pagination,
            isLoading: { ...state.isLoading, transactions: false },
            lastUpdated: new Date().toISOString(),
          }));
        } catch (error) {
          console.error('Error fetching transactions:', error);
          set(state => ({ 
            isLoading: { ...state.isLoading, transactions: false }, 
            error: error instanceof Error ? error : new Error('Failed to fetch transactions')
          }));
        }
      },
      
      fetchAllMarketData: async () => {
        // Set all loading states to true
        set(state => ({
          isLoading: {
            price: true,
            milestones: true,
            stats: true,
            supply: true,
            transactions: true,
          },
          error: null,
        }));
        
        // Fetch all data in parallel
        try {
          await Promise.all([
            get().fetchPriceData(),
            get().fetchMilestones(),
            get().fetchStats(),
            get().fetchSupply(),
            get().fetchTransactions(),
          ]);
        } catch (error) {
          console.error('Error fetching market data:', error);
          set({ 
            error: error instanceof Error ? error : new Error('Failed to fetch market data')
          });
        }
      },
      
      resetError: () => set({ error: null }),
    }),
    { name: 'market-store' }
  )
);
