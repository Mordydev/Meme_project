import { useQuery } from '@tanstack/react-query';

// Types
export interface PriceDataPoint {
  timestamp: number;
  price: number;
  volume?: number;
}

export interface PriceData {
  symbol: string;
  basePrice: number;
  priceChange: number;
  priceChangePercent: number;
  prices: PriceDataPoint[];
  lastUpdated: string;
}

export interface Milestone {
  id: string;
  value: number;
  label: string;
  description: string;
  achievedAt?: string | null;
}

export interface NextMilestone extends Omit<Milestone, 'achievedAt'> {
  progress: number;
}

export interface MilestoneData {
  currentMarketCap: number;
  milestones: Milestone[];
  nextMilestone: NextMilestone;
  lastUpdated: string;
}

export interface Transaction {
  hash: string;
  type: 'buy' | 'sell' | 'transfer';
  amount: number;
  price?: number | null;
  value?: number | null;
  timestamp: string;
  fromAddress: string;
  toAddress: string;
  isSignificant: boolean;
}

export interface TransactionData {
  transactions: Transaction[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
  };
}

export interface MarketStats {
  marketCap: number;
  volume24h: number;
  volume7d: number;
  liquidity: number;
  holders: number;
  trades24h: number;
  price: number;
  priceChange24h: number;
  priceChangePercent24h: number;
  allTimeHigh: {
    price: number;
    date: string;
  };
  lastUpdated: string;
}

export interface TokenAllocation {
  id: string;
  name: string;
  amount: number;
  percentage: number;
  description: string;
  color: string;
}

export interface SupplyData {
  totalSupply: number;
  circulatingSupply: number;
  burned: number;
  allocations: TokenAllocation[];
  lastUpdated: string;
}

// API response types
interface ApiResponse<T> {
  data: T;
  meta: {
    timestamp: string;
    requestId: string;
  };
}

// Hook to fetch price data
export function usePriceData(timeRange: string = '1d', resolution: string = '15m') {
  return useQuery<ApiResponse<PriceData>>({
    queryKey: ['priceData', timeRange, resolution],
    queryFn: async () => {
      const response = await fetch(`/api/market/price?timeRange=${timeRange}&resolution=${resolution}`);
      if (!response.ok) {
        throw new Error('Failed to fetch price data');
      }
      return response.json();
    },
    refetchInterval: 60000, // Refetch every minute
  });
}

// Hook to fetch milestone data
export function useMilestoneData() {
  return useQuery<ApiResponse<MilestoneData>>({
    queryKey: ['milestoneData'],
    queryFn: async () => {
      const response = await fetch('/api/market/milestones');
      if (!response.ok) {
        throw new Error('Failed to fetch milestone data');
      }
      return response.json();
    },
    refetchInterval: 300000, // Refetch every 5 minutes
  });
}

// Hook to fetch transaction data
export function useTransactionData(type: 'buy' | 'sell' | 'transfer' | 'all' = 'all', limit: number = 10, offset: number = 0) {
  return useQuery<ApiResponse<TransactionData>>({
    queryKey: ['transactionData', type, limit, offset],
    queryFn: async () => {
      const response = await fetch(`/api/market/transactions?type=${type}&limit=${limit}&offset=${offset}`);
      if (!response.ok) {
        throw new Error('Failed to fetch transaction data');
      }
      return response.json();
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}

// Hook to fetch market stats
export function useMarketStats() {
  return useQuery<ApiResponse<MarketStats>>({
    queryKey: ['marketStats'],
    queryFn: async () => {
      const response = await fetch('/api/market/stats');
      if (!response.ok) {
        throw new Error('Failed to fetch market stats');
      }
      return response.json();
    },
    refetchInterval: 60000, // Refetch every minute
  });
}

// Hook to fetch token supply data
export function useSupplyData() {
  return useQuery<ApiResponse<SupplyData>>({
    queryKey: ['supplyData'],
    queryFn: async () => {
      const response = await fetch('/api/market/supply');
      if (!response.ok) {
        throw new Error('Failed to fetch supply data');
      }
      return response.json();
    },
    refetchInterval: 300000, // Refetch every 5 minutes
  });
}
