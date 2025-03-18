'use client';

import { useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ApiResponse } from '@/types/api';
import { apiClient } from '@/lib/api-client';

// Market data types
export interface MarketData {
  price: number;
  priceChangePercent24h: number;
  volume24h: number;
  volume7d: number;
  marketCap: number;
  liquidity: number;
  holders: number;
  trades24h: number;
  allTimeHigh: {
    price: number;
    date: string;
  };
  timestamp: string;
}

export interface MilestoneStatus {
  id: string;
  value: number;
  label: string;
  description: string;
  achievedAt: string | null;
}

export interface MilestoneData {
  milestones: MilestoneStatus[];
  currentMarketCap: number;
  nextMilestone: {
    id: string;
    value: number;
    label: string;
    progress: number;
  } | null;
}

export interface Transaction {
  hash: string;
  type: 'in' | 'out' | 'swap';
  amount: number;
  timestamp: string;
  fromAddress?: string;
  toAddress?: string;
  status: 'confirmed' | 'pending';
  usdValue?: number;
}

/**
 * Hook for market data
 */
export function useMarketData() {
  // Format a number with commas
  const formatNumber = useCallback((num: number): string => {
    return new Intl.NumberFormat('en-US').format(num);
  }, []);
  
  // Format a price with appropriate decimal places
  const formatPrice = useCallback((price: number): string => {
    if (price >= 1) {
      return price.toFixed(2);
    } else if (price >= 0.0001) {
      return price.toFixed(4);
    } else {
      return price.toExponential(2);
    }
  }, []);
  
  // Format a percentage
  const formatPercentage = useCallback((percent: number): string => {
    return `${percent >= 0 ? '+' : ''}${percent.toFixed(2)}%`;
  }, []);
  
  return {
    formatNumber,
    formatPrice,
    formatPercentage
  };
}

/**
 * Hook for market statistics
 */
export function useMarketStats() {
  return useQuery<ApiResponse<MarketData>, Error>({
    queryKey: ['marketStats'],
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<MarketData>>('/api/market/overview');
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 60 * 1000 // Refetch every minute
  });
}

/**
 * Hook for milestone data
 */
export function useMilestoneData() {
  return useQuery<ApiResponse<MilestoneData>, Error>({
    queryKey: ['milestones'],
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<MilestoneData>>('/api/market/milestones');
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 2 * 60 * 1000 // Refetch every 2 minutes
  });
}

/**
 * Hook for transaction feed
 */
export function useTransactionFeed(limit = 20) {
  return useQuery<ApiResponse<Transaction[]>, Error>({
    queryKey: ['transactionFeed', limit],
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<Transaction[]>>(
        `/api/market/transactions?limit=${limit}`
      );
      return response.data;
    },
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000 // Refetch every minute
  });
}
