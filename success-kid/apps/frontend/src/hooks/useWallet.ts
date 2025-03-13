'use client';

import { useCallback, useEffect, useState } from 'react';
import { useWalletStore, WalletType } from '@/store/useWalletStore';
import { getWalletErrorMessage, categorizeWalletError, isWalletAvailable } from '@/lib/wallet-utils';
import { AppError } from '@/lib/api-client';

/**
 * Hook to interact with wallet functionality
 */
export function useWallet() {
  const {
    wallet,
    transactions,
    isConnecting,
    connectionStep,
    selectedProvider,
    connectionError,
    connect,
    disconnect,
    fetchWalletData,
    fetchTransactions,
    setConnectionStep,
    setConnectionError,
    resetConnectionState
  } = useWalletStore();
  
  const [availableProviders, setAvailableProviders] = useState<WalletType[]>([]);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  
  // Detect available wallet providers
  useEffect(() => {
    const detectProviders = async () => {
      const detected: WalletType[] = [];
      
      // In a real implementation, this would detect actual providers
      // For now, simulate provider detection
      for (const provider of ['phantom', 'solflare', 'slope'] as WalletType[]) {
        if (await isWalletAvailable(provider)) {
          detected.push(provider);
        }
      }
      
      setAvailableProviders(detected.length ? detected : ['phantom']);
    };
    
    // Detect if the user is on a mobile device
    const detectMobile = () => {
      setIsMobile(
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          navigator.userAgent
        )
      );
    };
    
    detectProviders();
    detectMobile();
  }, []);
  
  // Refresh wallet data periodically when connected
  useEffect(() => {
    if (!wallet?.isConnected) return;
    
    // Initial fetch
    fetchWalletData();
    fetchTransactions();
    
    // Set up periodic refresh
    const refreshInterval = setInterval(() => {
      fetchWalletData();
    }, 60000); // Refresh every minute
    
    return () => clearInterval(refreshInterval);
  }, [wallet?.isConnected, fetchWalletData, fetchTransactions]);
  
  // Handle connection with error catching
  const handleConnect = useCallback(async (provider?: WalletType) => {
    try {
      // Reset any previous error state
      setConnectionError(null);
      
      // Attempt wallet connection
      const success = await connect(provider);
      
      if (success) {
        // Fetch transactions after successful connection
        fetchTransactions();
      }
      
      return success;
    } catch (error) {
      console.error('Wallet connection error:', error);
      
      // Categorize and handle the error
      const errorType = categorizeWalletError(error);
      const message = getWalletErrorMessage(errorType);
      
      const appError = new AppError(
        message,
        `WALLET_${errorType.toUpperCase()}`,
        { provider, originalError: error },
        400
      );
      
      setConnectionError(appError);
      setConnectionStep('error');
      return false;
    }
  }, [connect, fetchTransactions, setConnectionError, setConnectionStep]);
  
  // Handle disconnection with error catching
  const handleDisconnect = useCallback(async () => {
    try {
      await disconnect();
      return true;
    } catch (error) {
      console.error('Wallet disconnection error:', error);
      return false;
    }
  }, [disconnect]);
  
  // Handle retrying connection
  const retryConnection = useCallback(() => {
    resetConnectionState();
  }, [resetConnectionState]);
  
  // Copy wallet address to clipboard
  const copyAddress = useCallback(() => {
    if (!wallet?.address) return false;
    
    try {
      navigator.clipboard.writeText(wallet.address);
      return true;
    } catch (error) {
      console.error('Failed to copy address:', error);
      return false;
    }
  }, [wallet?.address]);
  
  return {
    wallet,
    transactions,
    isConnecting,
    connectionStep,
    connectionError,
    selectedProvider,
    availableProviders,
    isMobile,
    connect: handleConnect,
    disconnect: handleDisconnect,
    retry: retryConnection,
    copyAddress,
    fetchTransactions,
    refreshWallet: fetchWalletData
  };
}
