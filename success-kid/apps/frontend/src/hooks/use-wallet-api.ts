/**
 * Wallet API Hooks
 * React Query hooks for wallet-related API operations
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
const WALLET_KEYS = {
  all: ['wallet'] as const,
  status: ['wallet', 'status'] as const,
};

// Query hooks
export const useWalletStatus = createQueryHook(
  WALLET_KEYS.status,
  () => api.wallet.getWalletStatus()
);

// Mutation hooks
export const useConnectWalletMutation = createMutationHook(
  (data: ApiRequests.ConnectWallet) => api.wallet.connectWallet(data)
);

export const useVerifyWalletMutation = createMutationHook(
  (data: ApiRequests.ConnectWallet) => api.wallet.verifyWallet(data)
);

/**
 * Combined hook with all wallet operations and automatic cache invalidation
 */
export function useWalletApi() {
  const { invalidateQueries } = useTypedInvalidation();
  
  const invalidateWalletData = useCallback(() => {
    invalidateQueries(WALLET_KEYS.all);
  }, [invalidateQueries]);
  
  const connectWalletMutation = useConnectWalletMutation({
    onSuccess: () => {
      invalidateWalletData();
    }
  });
  
  const verifyWalletMutation = useVerifyWalletMutation({
    onSuccess: () => {
      invalidateWalletData();
    }
  });
  
  return {
    // Queries
    useWalletStatus,
    
    // Mutations
    connectWallet: connectWalletMutation.mutate,
    connectWalletAsync: connectWalletMutation.mutateAsync,
    isConnectingWallet: connectWalletMutation.isPending,
    connectWalletError: connectWalletMutation.error,
    
    verifyWallet: verifyWalletMutation.mutate,
    verifyWalletAsync: verifyWalletMutation.mutateAsync,
    isVerifyingWallet: verifyWalletMutation.isPending,
    verifyWalletError: verifyWalletMutation.error,
    
    // Cache invalidation
    invalidateWalletData
  };
}
