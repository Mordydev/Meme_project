'use client';

import { useState, useCallback } from 'react';
import { ApiResponse } from '@/types/api';
import { useWallet } from './useWallet';
import { apiClient } from '@/lib/api-client';

export interface RedemptionHistory {
  id: string;
  pointsAmount: number;
  tokenAmount: number;
  transactionHash?: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  createdAt: string;
  processedAt?: string;
  failureReason?: string;
}

export type RedemptionStatus = 'idle' | 'processing' | 'success' | 'error';

/**
 * Hook for managing redemption data and operations
 */
export function useRedemptionData() {
  const { wallet } = useWallet();
  const [redeemStatus, setRedeemStatus] = useState<RedemptionStatus>('idle');
  const [redemptionHistory, setRedemptionHistory] = useState<RedemptionHistory[]>([]);
  const [weeklyRedemptionTotal, setWeeklyRedemptionTotal] = useState<number>(0);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  /**
   * Fetch redemption history
   */
  const fetchHistory = useCallback(async (limit = 10) => {
    if (!wallet?.isConnected) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.get<ApiResponse<RedemptionHistory[]>>(
        `/api/points/redemption/history?limit=${limit}`
      );
      
      setRedemptionHistory(response.data.data);
    } catch (err) {
      setError(err);
      console.error('Failed to fetch redemption history:', err);
    } finally {
      setIsLoading(false);
    }
  }, [wallet?.isConnected]);
  
  /**
   * Fetch weekly redemption total
   */
  const fetchWeeklyTotal = useCallback(async () => {
    if (!wallet?.isConnected) return;
    
    try {
      const response = await apiClient.get<ApiResponse<{ weeklyTotal: number }>>(
        '/api/points/redemption/weekly-total'
      );
      
      setWeeklyRedemptionTotal(response.data.data.weeklyTotal);
    } catch (err) {
      console.error('Failed to fetch weekly redemption total:', err);
      // Don't set error here to avoid blocking the UI
    }
  }, [wallet?.isConnected]);
  
  /**
   * Redeem points for tokens
   */
  const redeem = useCallback(async (pointsAmount: number) => {
    if (!wallet?.isConnected) {
      throw new Error('Wallet not connected');
    }
    
    setRedeemStatus('processing');
    setError(null);
    
    try {
      const response = await apiClient.post<ApiResponse<RedemptionHistory>>(
        '/api/points/redemption',
        {
          data: {
            pointsAmount
          }
        }
      );
      
      // Update history with new redemption
      setRedemptionHistory(prev => [response.data.data, ...prev]);
      
      // Update weekly total
      setWeeklyRedemptionTotal(prev => prev + pointsAmount);
      
      // Set success status
      setRedeemStatus('success');
      
      return response.data.data;
    } catch (err) {
      setError(err);
      setRedeemStatus('error');
      console.error('Redemption failed:', err);
      throw err;
    }
  }, [wallet?.isConnected]);
  
  /**
   * Get redemption status by ID
   */
  const getRedemptionStatus = useCallback(async (redemptionId: string) => {
    try {
      const response = await apiClient.get<ApiResponse<RedemptionHistory>>(
        `/api/points/redemption/${redemptionId}`
      );
      
      return response.data.data;
    } catch (err) {
      console.error('Failed to get redemption status:', err);
      throw err;
    }
  }, []);
  
  /**
   * Reset redemption status
   */
  const resetStatus = useCallback(() => {
    setRedeemStatus('idle');
    setError(null);
  }, []);
  
  return {
    redeem,
    redeemStatus,
    redemptionHistory,
    weeklyRedemptionTotal,
    fetchHistory,
    fetchWeeklyTotal,
    getRedemptionStatus,
    resetStatus,
    error,
    isLoading
  };
}
