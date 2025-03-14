import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { redemptionService } from '@/lib/redemption-service';

/**
 * Hook to check redemption eligibility
 */
export function useRedemptionEligibility(userId: string, initialData?: any) {
  return useQuery({
    queryKey: ['redemption', 'eligibility', userId],
    queryFn: () => {
      // In development or when simulating API calls, use mock service
      if (process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_USE_MOCK_API === 'true') {
        return redemptionService.mock.checkEligibility();
      }
      return redemptionService.checkEligibility();
    },
    initialData,
    staleTime: 60 * 1000, // 1 minute
  });
}

/**
 * Hook to create redemption transaction
 */
export function useCreateRedemption() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ pointsAmount, recipientAddress }: { pointsAmount: number, recipientAddress?: string }) => {
      // In development or when simulating API calls, use mock service
      if (process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_USE_MOCK_API === 'true') {
        return redemptionService.mock.createRedemptionTransaction(pointsAmount, recipientAddress);
      }
      return redemptionService.createRedemptionTransaction(pointsAmount, recipientAddress);
    },
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['redemption', 'history'] });
      queryClient.invalidateQueries({ queryKey: ['points', 'dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['redemption', 'eligibility'] });
    },
  });
}

/**
 * Hook to get transaction status
 */
export function useTransactionStatus(transactionId: string, options?: { enabled?: boolean, refetchInterval?: number }) {
  return useQuery({
    queryKey: ['redemption', 'transaction', transactionId],
    queryFn: () => {
      // In development or when simulating API calls, use mock service
      if (process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_USE_MOCK_API === 'true') {
        return redemptionService.mock.getTransactionStatus(transactionId);
      }
      return redemptionService.getTransactionStatus(transactionId);
    },
    enabled: options?.enabled !== false && !!transactionId,
    refetchInterval: options?.refetchInterval || 5000, // Default to 5 seconds
  });
}

/**
 * Hook to get redemption history
 */
export function useRedemptionHistory(options?: {
  status?: 'pending' | 'processing' | 'completed' | 'failed' | 'all';
  limit?: number;
  offset?: number;
  enabled?: boolean;
}) {
  const queryKey = ['redemption', 'history', options?.status, options?.limit, options?.offset];
  
  return useQuery({
    queryKey,
    queryFn: () => {
      // In development or when simulating API calls, use mock service
      if (process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_USE_MOCK_API === 'true') {
        return redemptionService.mock.getRedemptionHistory(options);
      }
      return redemptionService.getRedemptionHistory(options);
    },
    enabled: options?.enabled !== false,
    staleTime: 60 * 1000, // 1 minute
  });
}
