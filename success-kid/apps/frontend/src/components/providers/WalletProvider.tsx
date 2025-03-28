'use client';

import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { useWallet } from '@/hooks/useWallet';
import { apiClient } from '@/lib/api/api-client';
import { Wallet, WalletAccount, WalletBalance, WalletTransaction, WalletType } from '@/types/wallet';
import { useToast } from '@/components/ui/use-toast';
import { useWebSocketContext } from './WebSocketProvider';
import { cache } from '@/lib/cache';
import { useAuth } from '@/hooks/useAuth';

interface WalletContextType {
  // Wallet state
  wallet: Wallet | null;
  isConnecting: boolean;
  isVerifying: boolean;
  error: string | null;
  connectionStatus: 'connected' | 'disconnected' | 'connecting' | 'verified' | 'error';
  
  // Connection functions
  connectWallet: () => Promise<void>;
  disconnectWallet: () => Promise<void>;
  verifyWallet: () => Promise<boolean>;
  
  // Data functions
  refreshBalance: () => Promise<void>;
  fetchTransactions: (forceRefresh?: boolean) => Promise<void>;
  
  // Helper functions
  formatAddress: (address: string) => string;
  clearError: () => void;
  isWalletReady: () => boolean;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  const { 
    publicKey, 
    connected, 
    loading, 
    connect: phantomConnect, 
    disconnect: phantomDisconnect,
    signMessage, 
    isInstalled 
  } = useWallet();
  
  const { user } = useAuth();
  const { socket, connected: socketConnected } = useWebSocketContext();
  const { toast } = useToast();
  
  // Wallet state
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Cache control
  const [lastBalanceUpdate, setLastBalanceUpdate] = useState<Date | null>(null);
  const [lastTransactionsUpdate, setLastTransactionsUpdate] = useState<Date | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  
  // Compute connection status
  const connectionStatus = useMemo(() => {
    if (error) return 'error';
    if (isConnecting) return 'connecting';
    if (wallet?.isVerified) return 'verified';
    if (wallet?.isConnected) return 'connected';
    return 'disconnected';
  }, [wallet, isConnecting, error]);
  
  // Initialize wallet state from session if available
  useEffect(() => {
    const initializeWallet = async () => {
      try {
        // First check local storage
        const storedWallet = localStorage.getItem('wallet');
        if (storedWallet) {
          try {
            const parsedWallet = JSON.parse(storedWallet);
            
            // Validate the stored wallet
            if (parsedWallet && parsedWallet.account && parsedWallet.account.address) {
              setWallet(parsedWallet);
              
              // Get fresh data in the background
              fetchWalletData(parsedWallet.account.address);
            }
          } catch (error) {
            console.error('Error parsing stored wallet:', error);
            localStorage.removeItem('wallet');
          }
        }
        // If no wallet in storage, check if user is logged in and has a connected wallet
        else if (user?.id) {
          try {
            const response = await apiClient.get('/api/v1/wallet/connection');
            
            if (response.data.data && response.data.data.length > 0) {
              const connectedWallet = response.data.data[0];
              
              // Create wallet object from API data
              const newWallet: Wallet = {
                provider: connectedWallet.wallet_type || 'phantom',
                account: {
                  address: connectedWallet.wallet_address,
                  publicKey: connectedWallet.wallet_address,
                },
                balance: {
                  tokenAmount: 0,
                  lastUpdated: new Date()
                },
                isConnected: true,
                isVerified: connectedWallet.is_verified,
                isHolder: false,
                connectedAt: new Date(connectedWallet.connected_at)
              };
              
              setWallet(newWallet);
              localStorage.setItem('wallet', JSON.stringify(newWallet));
              
              // Get fresh data in the background
              fetchWalletData(connectedWallet.wallet_address);
            }
          } catch (error) {
            console.error('Error fetching wallet connection:', error);
          }
        }
      } catch (error) {
        console.error('Error initializing wallet:', error);
      }
    };
    
    initializeWallet();
  }, [user?.id]);
  
  // Listen for real-time balance updates
  useEffect(() => {
    if (!socket || !socketConnected || !wallet) return;
    
    const handleBalanceUpdate = (data: { 
      walletAddress: string, 
      balance: number,
      usdValue: number 
    }) => {
      if (wallet.account.address.toLowerCase() === data.walletAddress.toLowerCase()) {
        setWallet(prev => {
          if (!prev) return null;
          
          return {
            ...prev,
            balance: {
              ...prev.balance,
              tokenAmount: data.balance,
              usdValue: data.usdValue,
              lastUpdated: new Date()
            },
            isHolder: data.balance > 0
          };
        });
        
        setLastBalanceUpdate(new Date());
        
        // Update cache
        cache.set(`wallet:balance:${wallet.account.address}`, {
          tokenAmount: data.balance,
          usdValue: data.usdValue,
          lastUpdated: new Date()
        }, 60000); // 1 minute cache
      }
    };
    
    const handleTransactionUpdate = (data: {
      walletAddress: string,
      transaction: WalletTransaction
    }) => {
      if (wallet.account.address.toLowerCase() === data.walletAddress.toLowerCase()) {
        setWallet(prev => {
          if (!prev) return null;
          
          // Add transaction to list and sort by timestamp (newest first)
          const transactions = prev.transactions ? 
            [data.transaction, ...prev.transactions] : 
            [data.transaction];
            
          return {
            ...prev,
            transactions: transactions.sort((a, b) => 
              new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
            ).slice(0, 50) // Limit to 50 transactions
          };
        });
        
        // Update cache
        const cachedTransactions = cache.get<WalletTransaction[]>(`wallet:transactions:${wallet.account.address}`);
        if (cachedTransactions) {
          cache.set(`wallet:transactions:${wallet.account.address}`, 
            [data.transaction, ...cachedTransactions].sort((a, b) => 
              new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
            ).slice(0, 50),
            300000 // 5 minute cache
          );
        }
        
        // Show toast notification for the transaction
        toast({
          title: data.transaction.type === 'in' ? "Tokens Received" : "Tokens Sent",
          description: `${data.transaction.type === 'in' ? '+' : '-'}${data.transaction.amount.toLocaleString()} SKC`,
          variant: "default",
        });
      }
    };
    
    // Subscribe to wallet updates
    socket.on('wallet:balance_update', handleBalanceUpdate);
    socket.on('wallet:transaction', handleTransactionUpdate);
    
    // Cleanup subscription
    return () => {
      socket.off('wallet:balance_update', handleBalanceUpdate);
      socket.off('wallet:transaction', handleTransactionUpdate);
    };
  }, [socket, socketConnected, wallet]);
  
  // Fetch wallet data (balance and transactions)
  const fetchWalletData = async (walletAddress: string) => {
    try {
      // Fetch balance
      const balanceResponse = await apiClient.get(`/api/v1/wallet/balance/${walletAddress}`);
      const { tokenAmount, usdValue } = balanceResponse.data.data;
      
      // Fetch transactions
      const transactionsResponse = await apiClient.get(`/api/v1/wallet/transactions/${walletAddress}`);
      const transactions: WalletTransaction[] = transactionsResponse.data.data;
      
      // Update wallet state
      setWallet(prev => {
        if (!prev) return null;
        
        return {
          ...prev,
          balance: {
            tokenAmount,
            usdValue,
            lastUpdated: new Date()
          },
          isHolder: tokenAmount > 0,
          transactions
        };
      });
      
      // Update localStorage
      const storedWallet = localStorage.getItem('wallet');
      if (storedWallet) {
        try {
          const parsedWallet = JSON.parse(storedWallet);
          localStorage.setItem('wallet', JSON.stringify({
            ...parsedWallet,
            balance: {
              tokenAmount,
              usdValue,
              lastUpdated: new Date()
            },
            isHolder: tokenAmount > 0,
            // Don't store transactions in localStorage to keep it lightweight
          }));
        } catch (error) {
          console.error('Error updating stored wallet:', error);
        }
      }
      
      // Update cache
      cache.set(`wallet:balance:${walletAddress}`, {
        tokenAmount,
        usdValue,
        lastUpdated: new Date()
      }, 60000); // 1 minute cache
      
      cache.set(`wallet:transactions:${walletAddress}`, transactions, 300000); // 5 minute cache
      
      setLastBalanceUpdate(new Date());
      setLastTransactionsUpdate(new Date());
    } catch (error) {
      console.error('Error fetching wallet data:', error);
    }
  };
  
  // Periodically refresh balance
  useEffect(() => {
    if (!wallet || !wallet.isConnected) return;
    
    const refreshInterval = setInterval(() => {
      refreshBalance();
    }, 60000); // Refresh every minute
    
    return () => clearInterval(refreshInterval);
  }, [wallet]);
  
  // Clear error
  const clearError = () => {
    setError(null);
    setRetryCount(0);
  };
  
  // Check if wallet is ready for operations
  const isWalletReady = () => {
    return wallet?.isConnected && wallet?.isVerified;
  };
  
  // Connect wallet
  const connectWallet = async () => {
    try {
      setIsConnecting(true);
      clearError();
      
      // Check if Phantom is installed
      if (!isInstalled) {
        window.open('https://phantom.app/', '_blank');
        setError('Please install Phantom wallet to continue');
        return;
      }
      
      // Connect to Phantom
      await phantomConnect();
      
      if (!publicKey) {
        throw new Error('Failed to connect wallet');
      }
      
      // Create wallet account object
      const account: WalletAccount = {
        address: publicKey.toString(),
        publicKey: publicKey.toString(),
      };
      
      // Connect wallet with backend
      const response = await apiClient.post('/api/v1/wallet/connection/connect', {
        data: {
          walletAddress: account.address,
          walletType: 'phantom'
        }
      });
      
      // Create initial wallet object
      const newWallet: Wallet = {
        provider: 'phantom',
        account,
        balance: {
          tokenAmount: 0,
          lastUpdated: new Date()
        },
        isConnected: true,
        isVerified: false,
        isHolder: false,
        connectedAt: new Date()
      };
      
      setWallet(newWallet);
      
      // Store in local storage
      localStorage.setItem('wallet', JSON.stringify(newWallet));
      
      // Fetch initial balance and transactions
      await fetchWalletData(account.address);
      
      toast({
        title: "Wallet Connected",
        description: "Your wallet has been successfully connected.",
      });
      
      // Trigger verification (but don't await it)
      verifyWallet();
      
      return;
    } catch (error) {
      console.error('Error connecting wallet:', error);
      const errorMessage = error instanceof Error ? 
        error.message : 
        'Failed to connect wallet. Please try again.';
      
      setError(errorMessage);
      
      const newRetryCount = retryCount + 1;
      setRetryCount(newRetryCount);
      
      if (newRetryCount <= 3) {
        toast({
          title: "Connection Failed",
          description: `${errorMessage} (Attempt ${newRetryCount}/3)`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Connection Failed",
          description: "Multiple connection attempts failed. Please check your wallet and try again later.",
          variant: "destructive",
        });
      }
    } finally {
      setIsConnecting(false);
    }
  };
  
  // Disconnect wallet
  const disconnectWallet = async () => {
    try {
      if (!wallet) return;
      
      // Disconnect from Phantom
      await phantomDisconnect();
      
      // Disconnect from backend
      await apiClient.post('/api/v1/wallet/connection/disconnect', {
        data: {
          walletAddress: wallet.account.address
        }
      });
      
      // Clear wallet state
      setWallet(null);
      localStorage.removeItem('wallet');
      clearError();
      
      // Clear cache
      cache.remove(`wallet:balance:${wallet.account.address}`);
      cache.remove(`wallet:transactions:${wallet.account.address}`);
      
      toast({
        title: "Wallet Disconnected",
        description: "Your wallet has been disconnected.",
      });
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
      const errorMessage = error instanceof Error ? 
        error.message : 
        'Failed to disconnect wallet';
      
      setError(errorMessage);
      
      toast({
        title: "Disconnection Failed",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };
  
  // Verify wallet ownership
  const verifyWallet = async (): Promise<boolean> => {
    if (!wallet || !signMessage) {
      setError('Wallet not connected');
      return false;
    }
    
    try {
      setIsVerifying(true);
      clearError();
      
      // Get message to sign
      const messageResponse = await apiClient.post('/api/v1/wallet/verification/message', {
        data: {
          walletAddress: wallet.account.address
        }
      });
      
      const { message, expiresAt } = messageResponse.data.data;
      
      // Sign the message
      const signature = await signMessage(message);
      
      // Verify the signature
      const verificationResponse = await apiClient.post('/api/v1/wallet/verification/verify', {
        data: {
          walletAddress: wallet.account.address,
          signature,
          message
        }
      });
      
      const { isVerified, lastVerified } = verificationResponse.data.data;
      
      // Update wallet state
      setWallet(prev => {
        if (!prev) return null;
        
        const updatedWallet = {
          ...prev,
          isVerified,
          lastVerified: lastVerified ? new Date(lastVerified) : null
        };
        
        // Update local storage
        localStorage.setItem('wallet', JSON.stringify(updatedWallet));
        
        return updatedWallet;
      });
      
      if (isVerified) {
        toast({
          title: "Wallet Verified",
          description: "Your wallet has been successfully verified.",
        });
      }
      
      return isVerified;
    } catch (error) {
      console.error('Error verifying wallet:', error);
      const errorMessage = error instanceof Error ? 
        error.message : 
        'Failed to verify wallet ownership';
      
      setError(errorMessage);
      
      toast({
        title: "Verification Failed",
        description: errorMessage,
        variant: "destructive",
      });
      
      return false;
    } finally {
      setIsVerifying(false);
    }
  };
  
  // Refresh wallet balance
  const refreshBalance = async () => {
    if (!wallet || !wallet.isConnected) return;
    
    try {
      // Check cache first
      const cachedBalance = cache.get<WalletBalance>(`wallet:balance:${wallet.account.address}`);
      
      // If we have fresh cache (< 30 seconds), use it
      if (cachedBalance && 
          cachedBalance.lastUpdated && 
          (new Date().getTime() - new Date(cachedBalance.lastUpdated).getTime() < 30000)) {
        
        setWallet(prev => {
          if (!prev) return null;
          
          return {
            ...prev,
            balance: cachedBalance,
            isHolder: cachedBalance.tokenAmount > 0
          };
        });
        
        return;
      }
      
      // Fetch fresh data
      const response = await apiClient.get(`/api/v1/wallet/balance/${wallet.account.address}`);
      
      const { tokenAmount, usdValue } = response.data.data;
      
      // Update wallet state
      setWallet(prev => {
        if (!prev) return null;
        
        return {
          ...prev,
          balance: {
            tokenAmount,
            usdValue,
            lastUpdated: new Date()
          },
          isHolder: tokenAmount > 0
        };
      });
      
      // Update cache
      cache.set(`wallet:balance:${wallet.account.address}`, {
        tokenAmount,
        usdValue,
        lastUpdated: new Date()
      }, 60000); // 1 minute cache
      
      setLastBalanceUpdate(new Date());
    } catch (error) {
      console.error('Error fetching wallet balance:', error);
    }
  };
  
  // Fetch wallet transactions
  const fetchTransactions = async (forceRefresh: boolean = false) => {
    if (!wallet || !wallet.isConnected) return;
    
    try {
      // Check cache first, unless force refresh is requested
      if (!forceRefresh) {
        const cachedTransactions = cache.get<WalletTransaction[]>(`wallet:transactions:${wallet.account.address}`);
        
        // If we have fresh cache (< 2 minutes), use it
        if (cachedTransactions && 
            lastTransactionsUpdate && 
            (new Date().getTime() - lastTransactionsUpdate.getTime() < 120000)) {
          
          setWallet(prev => {
            if (!prev) return null;
            
            return {
              ...prev,
              transactions: cachedTransactions
            };
          });
          
          return;
        }
      }
      
      // Fetch fresh data
      const response = await apiClient.get(`/api/v1/wallet/transactions/${wallet.account.address}`);
      
      const transactions: WalletTransaction[] = response.data.data;
      
      // Update wallet state
      setWallet(prev => {
        if (!prev) return null;
        
        return {
          ...prev,
          transactions
        };
      });
      
      // Update cache
      cache.set(`wallet:transactions:${wallet.account.address}`, transactions, 300000); // 5 minute cache
      
      setLastTransactionsUpdate(new Date());
    } catch (error) {
      console.error('Error fetching wallet transactions:', error);
    }
  };
  
  // Format address for display
  const formatAddress = (address: string): string => {
    if (!address) return '';
    
    // Format as first 4 + ... + last 4 characters
    return `${address.substring(0, 4)}...${address.substring(address.length - 4)}`;
  };
  
  // Create memoized context value
  const contextValue = useMemo(() => ({
    wallet,
    isConnecting,
    isVerifying,
    error,
    connectionStatus,
    connectWallet,
    disconnectWallet,
    verifyWallet,
    refreshBalance,
    fetchTransactions,
    formatAddress,
    clearError,
    isWalletReady
  }), [
    wallet, 
    isConnecting, 
    isVerifying, 
    error,
    connectionStatus,
    retryCount
  ]);
  
  return (
    <WalletContext.Provider value={contextValue}>
      {children}
    </WalletContext.Provider>
  );
}

export const useWalletContext = () => {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWalletContext must be used within a WalletProvider');
  }
  return context;
};
