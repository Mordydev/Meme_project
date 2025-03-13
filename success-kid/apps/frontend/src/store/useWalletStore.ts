import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { AppError } from '@/lib/api-client';

export type WalletType = 'phantom' | 'solflare' | 'slope';

export interface Transaction {
  hash: string;
  type: 'in' | 'out';
  amount: number;
  timestamp: string;
  fromAddress?: string;
  toAddress?: string;
  status: 'confirmed' | 'pending';
}

export interface Wallet {
  address: string;
  isConnected: boolean;
  isVerified: boolean;
  balance: number;
  usdValue?: number;
  isHolder: boolean;
  connectedAt: string;
}

export type WalletConnectionStep = 
  | 'initial' 
  | 'connecting' 
  | 'verification' 
  | 'success'
  | 'error';

export type WalletErrorType = 
  | 'not_installed'
  | 'connection_rejected'
  | 'verification_failed'
  | 'wrong_network'
  | 'timeout'
  | 'unknown';

interface WalletState {
  wallet: Wallet | null;
  transactions: Transaction[];
  isConnecting: boolean;
  connectionStep: WalletConnectionStep;
  selectedProvider: WalletType | null;
  connectionError: AppError | null;
  
  // Actions
  connect: (provider?: WalletType) => Promise<boolean>;
  disconnect: () => Promise<void>;
  fetchWalletData: () => Promise<void>;
  fetchTransactions: () => Promise<void>;
  setConnectionStep: (step: WalletConnectionStep) => void;
  setConnectionError: (error: AppError | null) => void;
  resetConnectionState: () => void;
}

export const useWalletStore = create<WalletState>()(
  devtools(
    persist(
      (set, get) => ({
        wallet: null,
        transactions: [],
        isConnecting: false,
        connectionStep: 'initial',
        selectedProvider: null,
        connectionError: null,
        
        connect: async (provider = 'phantom') => {
          set({ 
            isConnecting: true, 
            connectionStep: 'connecting', 
            connectionError: null,
            selectedProvider: provider 
          });
          
          try {
            // TODO: This will be replaced with actual wallet connection logic
            // For now, simulate connection with a mock wallet
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            const mockWallet = {
              address: '8YLKoCZcWk79yVMfnD8VnYNd5KwJRPGUTZiJTTCBYbAp',
              isConnected: true,
              isVerified: true,
              balance: 1250.75,
              usdValue: 125.07,
              isHolder: true,
              connectedAt: new Date().toISOString()
            };
            
            set({ 
              wallet: mockWallet, 
              isConnecting: false, 
              connectionStep: 'success'
            });
            
            return true;
          } catch (error) {
            const appError = new AppError(
              'Failed to connect wallet',
              'WALLET_CONNECTION_ERROR',
              { provider },
              400
            );
            
            set({ 
              isConnecting: false, 
              connectionStep: 'error',
              connectionError: appError
            });
            
            return false;
          }
        },
        
        disconnect: async () => {
          try {
            // Simulate disconnection
            await new Promise(resolve => setTimeout(resolve, 500));
            
            set({
              wallet: null,
              transactions: [],
              connectionStep: 'initial',
              connectionError: null,
              selectedProvider: null
            });
          } catch (error) {
            console.error('Failed to disconnect wallet:', error);
          }
        },
        
        fetchWalletData: async () => {
          try {
            // This would be an actual API call in production
            await new Promise(resolve => setTimeout(resolve, 800));
            
            const { wallet } = get();
            if (!wallet) return;
            
            // Update wallet data (in real implementation, this would be from API)
            // Just update the balance for the mock
            set({
              wallet: {
                ...wallet,
                balance: wallet.balance + 10, // Simulate balance update
                usdValue: (wallet.balance + 10) * 0.1 // Simulate USD value update
              }
            });
          } catch (error) {
            console.error('Failed to fetch wallet data:', error);
          }
        },
        
        fetchTransactions: async () => {
          try {
            // This would be an actual API call in production
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Mock transactions data
            const transactions = [
              {
                hash: '3xR7vKpC4WjXKDBSEedrGQNaqzQXfZJnRGpSKQLxmLPGbpQ4AZ8QJTkVMBQpnqoK1bHUGEWjvYKGNMoFRZtPrw5d',
                type: 'in' as const,
                amount: 250.5,
                timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
                fromAddress: 'marketplace.solana',
                status: 'confirmed' as const
              },
              {
                hash: '4qL9pWzD6RbJKFGvTfQnAZ5uXr3vNP5BnmKRwxJVdYtP8DgSJs2ZARXLKJe1RYqHnVhymgrD76iucN2N6xFUymAP',
                type: 'out' as const,
                amount: 100,
                timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
                toAddress: 'DEXaddr.solana',
                status: 'confirmed' as const
              }
            ];
            
            set({ transactions });
          } catch (error) {
            console.error('Failed to fetch transactions:', error);
          }
        },
        
        setConnectionStep: (step) => {
          set({ connectionStep: step });
        },
        
        setConnectionError: (error) => {
          set({ connectionError: error });
        },
        
        resetConnectionState: () => {
          set({
            isConnecting: false,
            connectionStep: 'initial',
            connectionError: null,
            selectedProvider: null
          });
        }
      }),
      {
        name: 'wallet-storage',
        // Only persist non-sensitive data
        partialize: (state) => ({ 
          wallet: state.wallet ? {
            address: state.wallet.address,
            isConnected: state.wallet.isConnected,
            isVerified: state.wallet.isVerified,
            isHolder: state.wallet.isHolder,
            connectedAt: state.wallet.connectedAt
          } : null
        }),
      }
    )
  )
);
