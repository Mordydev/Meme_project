import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { 
  Wallet, 
  WalletType, 
  WalletError, 
  WalletTransaction,
  WalletConnectionSession,
  WalletErrorType
} from '@/types/wallet';

export interface WalletState {
  // State
  wallet: Wallet | null;
  isConnecting: boolean;
  connectionSession: WalletConnectionSession | null;
  error: WalletError | null;
  isMobile: boolean;
  transactions: WalletTransaction[];
  isLoadingTransactions: boolean;
  
  // Actions
  connect: (provider?: WalletType) => Promise<boolean>;
  verify: (address: string, signature: string) => Promise<boolean>;
  disconnect: () => Promise<void>;
  getTransactions: (limit?: number) => Promise<WalletTransaction[]>;
  clearError: () => void;
  checkConnection: () => Promise<boolean>;
  createConnectionSession: () => Promise<WalletConnectionSession>;
  checkMobileWallet: () => boolean;
}

export const useWalletStore = create<WalletState>()(
  devtools(
    persist(
      (set, get) => ({
        wallet: null,
        isConnecting: false,
        connectionSession: null,
        error: null,
        isMobile: false,
        transactions: [],
        isLoadingTransactions: false,
        
        connect: async (provider = 'phantom') => {
          set({ isConnecting: true, error: null });
          
          try {
            // Check if browser is mobile
            const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
              navigator.userAgent
            );
            set({ isMobile });
            
            // Check if wallet exists in window
            if (provider === 'phantom' && !window.phantom) {
              throw {
                code: WalletErrorType.WALLET_NOT_FOUND,
                message: 'Phantom wallet not found. Please install the Phantom extension or app.'
              };
            }
            
            // For demo purposes, simulate successful connection
            // In a real implementation, we would connect to the actual wallet here
            await new Promise(resolve => setTimeout(resolve, 800)); // Simulate delay
            
            // Create mock data for demo
            const mockWallet: Wallet = {
              provider,
              account: {
                address: '8YLKoCZcWk79yVMfnD8VnYNd5KwJRPGUTZiJTTCBYbAp',
                publicKey: '8YLKoCZcWk79yVMfnD8VnYNd5KwJRPGUTZiJTTCBYbAp',
              },
              balance: {
                tokenAmount: 1250.75,
                usdValue: 125.07,
                lastUpdated: new Date(),
              },
              isConnected: true,
              isVerified: true,
              isHolder: true,
              connectedAt: new Date(),
            };
            
            set({ 
              wallet: mockWallet, 
              isConnecting: false 
            });
            
            return true;
          } catch (error: any) {
            set({
              isConnecting: false,
              error: {
                code: error.code || WalletErrorType.UNKNOWN,
                message: error.message || 'Failed to connect wallet',
                details: error,
              },
            });
            
            return false;
          }
        },
        
        verify: async (address: string, signature: string) => {
          try {
            // For demo purposes, simulate successful verification
            // In a real implementation, we would verify the signature with the backend here
            await new Promise(resolve => setTimeout(resolve, 500)); // Simulate delay
            
            const { wallet } = get();
            
            if (wallet) {
              set({
                wallet: {
                  ...wallet,
                  isVerified: true,
                },
              });
            }
            
            return true;
          } catch (error: any) {
            set({
              error: {
                code: error.code || WalletErrorType.UNKNOWN,
                message: error.message || 'Failed to verify wallet ownership',
                details: error,
              },
            });
            
            return false;
          }
        },
        
        disconnect: async () => {
          try {
            // For demo purposes, simulate successful disconnection
            // In a real implementation, we would disconnect from the wallet and update the backend
            await new Promise(resolve => setTimeout(resolve, 300)); // Simulate delay
            
            set({ wallet: null });
          } catch (error: any) {
            set({
              error: {
                code: error.code || WalletErrorType.UNKNOWN,
                message: error.message || 'Failed to disconnect wallet',
                details: error,
              },
            });
          }
        },
        
        getTransactions: async (limit = 10) => {
          set({ isLoadingTransactions: true });
          
          try {
            // For demo purposes, simulate fetching transactions
            // In a real implementation, we would fetch from the backend or blockchain
            await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate delay
            
            const mockTransactions: WalletTransaction[] = [
              {
                id: '1',
                hash: '3xR7vKpC4WjXKDBSEedrGQNaqzQXfZJnRGpSKQLxmLPGbpQ4AZ8QJTkVMBQpnqoK1bHUGEWjvYKGNMoFRZtPrw5d',
                type: 'in',
                amount: 250.5,
                timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
                fromAddress: 'marketplace.solana',
                status: 'confirmed',
              },
              {
                id: '2',
                hash: '4qL9pWzD6RbJKFGvTfQnAZ5uXr3vNP5BnmKRwxJVdYtP8DgSJs2ZARXLKJe1RYqHnVhymgrD76iucN2N6xFUymAP',
                type: 'out',
                amount: 100,
                timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
                toAddress: 'DEXaddr.solana',
                status: 'confirmed',
              },
              {
                id: '3',
                hash: '5mB2kWjX1rYpTfQnPQ5c3s7vNP5BnmKRwxJVdY6iucN2N6xFUyDP8DgSJs2ZARXLKJe1RYqHnVhymgrD7tPrw5d',
                type: 'in',
                amount: 500,
                timestamp: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 14 days ago
                fromAddress: 'airdrop.solana',
                status: 'confirmed',
              },
            ];
            
            set({ 
              transactions: mockTransactions, 
              isLoadingTransactions: false 
            });
            
            return mockTransactions;
          } catch (error: any) {
            set({
              isLoadingTransactions: false,
              error: {
                code: error.code || WalletErrorType.UNKNOWN,
                message: error.message || 'Failed to fetch transactions',
                details: error,
              },
            });
            
            return [];
          }
        },
        
        clearError: () => {
          set({ error: null });
        },
        
        checkConnection: async () => {
          // Check if wallet is already connected in current session
          const { wallet } = get();
          
          if (wallet?.isConnected) {
            return true;
          }
          
          // In a real implementation, we would check if the wallet is still connected
          // and fetch updated data from the blockchain
          return false;
        },
        
        createConnectionSession: async () => {
          try {
            // For demo purposes, simulate creating a connection session
            // In a real implementation, we would create a session with the backend
            await new Promise(resolve => setTimeout(resolve, 500)); // Simulate delay
            
            const mockSession: WalletConnectionSession = {
              id: 'session-' + Date.now(),
              message: 'Sign this message to prove ownership of your wallet address',
              expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
              qrCodeData: 'https://successKid.io/connect?session=123456',
              deepLink: 'phantom://connect?session=123456',
            };
            
            set({ connectionSession: mockSession });
            
            return mockSession;
          } catch (error: any) {
            set({
              error: {
                code: error.code || WalletErrorType.UNKNOWN,
                message: error.message || 'Failed to create connection session',
                details: error,
              },
            });
            
            throw error;
          }
        },
        
        checkMobileWallet: () => {
          // Check if browser is mobile
          const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
            navigator.userAgent
          );
          set({ isMobile });
          
          return isMobile;
        },
      }),
      {
        name: 'wallet-storage',
        // Only persist minimal wallet info, not the full wallet data for security
        partialize: (state) => state.wallet ? { 
          wallet: {
            provider: state.wallet.provider,
            account: {
              address: state.wallet.account.address,
            },
            isConnected: state.wallet.isConnected,
            isVerified: state.wallet.isVerified,
            isHolder: state.wallet.isHolder,
            connectedAt: state.wallet.connectedAt,
          }
        } : {},
      }
    )
  )
);
