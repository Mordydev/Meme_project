'use client';

import { useCallback, useEffect, useState } from 'react';
import { useWalletStore } from '@/store/useWalletStore';
import { WalletType, WalletConnectionSession } from '@/types/wallet';

export const useWallet = () => {
  const {
    wallet,
    isConnecting,
    error,
    isMobile,
    transactions,
    isLoadingTransactions,
    connectionSession,
    connect,
    disconnect,
    verify,
    getTransactions,
    clearError,
    checkConnection,
    createConnectionSession,
    checkMobileWallet,
  } = useWalletStore();
  
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Check connection status on mount
  useEffect(() => {
    const initialize = async () => {
      await checkConnection();
      checkMobileWallet();
      setIsInitialized(true);
    };
    
    initialize();
  }, [checkConnection, checkMobileWallet]);
  
  // Enhanced connect function that handles mobile differently
  const handleConnect = useCallback(async (provider: WalletType = 'phantom') => {
    try {
      // If mobile, we create a connection session first
      if (isMobile) {
        await createConnectionSession();
      }
      
      return await connect(provider);
    } catch (error) {
      console.error('Error connecting wallet:', error);
      return false;
    }
  }, [connect, createConnectionSession, isMobile]);
  
  // Function to check if the wallet provider is installed
  const isProviderInstalled = useCallback((provider: WalletType = 'phantom'): boolean => {
    if (typeof window === 'undefined') return false;
    
    switch (provider) {
      case 'phantom':
        return window.phantom !== undefined;
      case 'solflare':
        return window.solflare !== undefined;
      default:
        return false;
    }
  }, []);
  
  // Function to get installation links
  const getProviderInstallLink = useCallback((provider: WalletType = 'phantom'): string => {
    switch (provider) {
      case 'phantom':
        return 'https://phantom.app/download';
      case 'solflare':
        return 'https://solflare.com/download';
      default:
        return '';
    }
  }, []);
  
  return {
    wallet,
    isConnecting,
    isConnected: wallet?.isConnected ?? false,
    isVerified: wallet?.isVerified ?? false,
    isHolder: wallet?.isHolder ?? false,
    error,
    transactions,
    isLoadingTransactions,
    isMobile,
    isInitialized,
    connectionSession,
    connect: handleConnect,
    disconnect,
    verify,
    getTransactions,
    clearError,
    isProviderInstalled,
    getProviderInstallLink,
  };
};
