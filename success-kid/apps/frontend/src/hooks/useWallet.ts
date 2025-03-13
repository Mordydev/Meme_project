'use client';

import { useCallback, useEffect, useState } from 'react';
import { useWalletStore, WalletType } from '@/store/useWalletStore';
import { getWalletErrorMessage, categorizeWalletError, isWalletAvailable } from '@/lib/wallet-utils';
import { createPhantomAdapter } from '@/lib/wallet-adapters/PhantomAdapter';
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
    connect: connectStore,
    disconnect: disconnectStore,
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
  const connect = useCallback(async (provider?: WalletType) => {
    try {
      // Reset any previous error state
      setConnectionError(null);
      setConnectionStep('connecting');
      
      const selectedWalletType = provider || availableProviders[0] || 'phantom';
      
      // Currently only support Phantom wallet
      // In a real implementation, this would check the provider and use the appropriate adapter
      if (selectedWalletType === 'phantom') {
        const phantomAdapter = createPhantomAdapter();
        
        // Check if wallet is available
        if (!phantomAdapter.isAvailable()) {
          const error = new AppError(
            'Phantom wallet is not installed',
            'WALLET_NOT_INSTALLED',
            { provider: selectedWalletType },
            400
          );
          setConnectionError(error);
          setConnectionStep('error');
          return false;
        }
        
        // Step 1: Connect to wallet
        setConnectionStep('connecting');
        await phantomAdapter.connect();
        
        // Step 2: Initialize connection and verify
        setConnectionStep('verification');
        const result = await phantomAdapter.completeConnection();
        
        // Step 3: Update wallet state
        const walletData = {
          address: result.address,
          isConnected: true,
          isVerified: true,
          balance: result.balance,
          usdValue: result.balance * 0.1,
          isHolder: result.isHolder,
          connectedAt: new Date().toISOString()
        };
        
        // Update store with wallet data
        await connectStore(selectedWalletType);
        
        // Signal success
        setConnectionStep('success');
        
        // Fetch transactions
        fetchTransactions();
        
        return true;
      } else {
        console.warn(`Wallet provider ${selectedWalletType} not yet implemented`);
        // Fall back to mock implementation
        const success = await connectStore(selectedWalletType);
        if (success) {
          fetchTransactions();
        }
        return success;
      }
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
  }, [availableProviders, connectStore, fetchTransactions, setConnectionError, setConnectionStep]);
  
  // Handle disconnection with error catching
  const disconnect = useCallback(async () => {
    try {
      // In a real implementation, would use the appropriate adapter
      if (selectedProvider === 'phantom') {
        const phantomAdapter = createPhantomAdapter();
        if (phantomAdapter.isAvailable() && phantomAdapter.isConnected()) {
          await phantomAdapter.disconnect();
        }
      }
      
      await disconnectStore();
      return true;
    } catch (error) {
      console.error('Wallet disconnection error:', error);
      return false;
    }
  }, [disconnectStore, selectedProvider]);
  
  // Handle retrying connection
  const retry = useCallback(() => {
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
    connect,
    disconnect,
    retry,
    copyAddress,
    fetchTransactions,
    refreshWallet: fetchWalletData
  };
}
