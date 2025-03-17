/**
 * Points API Hooks
 * React Query hooks for points-related API operations
 */
import { useCallback } from 'react';
import { ApiRequests } from '@success-kid/types';
import { api } from '@/services/api';
import { 
  createQueryHook, 
  createMutationHook, 
  useTypedInvalidation
} from './use-query-factory';

// Query keys
const POINTS_KEYS = {
  all: ['points'] as const,
  balance: ['points', 'balance'] as const,
  history: ['points', 'history'] as const,
  transactions: (params: { page: number, pageSize: number }) => 
    ['points', 'transactions', params] as const,
};

// Query hooks
export const usePointsBalance = createQueryHook(
  POINTS_KEYS.balance,
  () => api.points.getPointsBalance()
);

export const usePointsHistory = createQueryHook(
  POINTS_KEYS.history,
  (page = 1, pageSize = 20) => api.points.getPointsHistory(page, pageSize)
);

// Mutation hooks
export const useAwardPointsMutation = createMutationHook(
  (data: ApiRequests.AwardPoints) => api.points.awardPoints(data)
);

export const useRedeemPointsMutation = createMutationHook(
  (data: ApiRequests.RedeemPoints) => api.points.redeemPoints(data)
);

/**
 * Combined hook with all points operations and automatic cache invalidation
 */
export function usePointsApi() {
  const { invalidateQueries } = useTypedInvalidation();
  
  const invalidatePointsData = useCallback(() => {
    invalidateQueries(POINTS_KEYS.all);
  }, [invalidateQueries]);
  
  const invalidateBalance = useCallback(() => {
    invalidateQueries(POINTS_KEYS.balance);
  }, [invalidateQueries]);
  
  const invalidateHistory = useCallback(() => {
    invalidateQueries(POINTS_KEYS.history);
  }, [invalidateQueries]);
  
  const awardPointsMutation = useAwardPointsMutation({
    onSuccess: () => {
      invalidateBalance();
    }
  });
  
  const redeemPointsMutation = useRedeemPointsMutation({
    onSuccess: () => {
      invalidatePointsData();
    }
  });
  
  return {
    // Queries
    usePointsBalance,
    usePointsHistory,
    
    // Mutations
    awardPoints: awardPointsMutation.mutate,
    awardPointsAsync: awardPointsMutation.mutateAsync,
    isAwardingPoints: awardPointsMutation.isPending,
    awardPointsError: awardPointsMutation.error,
    
    redeemPoints: redeemPointsMutation.mutate,
    redeemPointsAsync: redeemPointsMutation.mutateAsync,
    isRedeemingPoints: redeemPointsMutation.isPending,
    redeemPointsError: redeemPointsMutation.error,
    
    // Cache invalidation
    invalidatePointsData,
    invalidateBalance,
    invalidateHistory
  };
}
