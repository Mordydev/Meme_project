'use client';

import { 
  WalletError, 
  WalletType, 
  WalletErrorType,
  WalletTransaction,
  WalletConnectionSession
} from '@/types/wallet';
import { WALLET_PROVIDERS } from './walletProviders';

// Mock API service
const mockApiRequest = async <T>(
  endpoint: string, 
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET', 
  body?: any
): Promise<T> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Mock responses based on endpoint
  switch (endpoint) {
    case '/api/v1/wallet/initialize':
      return {
        data: {
          message: 'Sign this message to prove ownership of your wallet address',
          sessionId: 'session-' + Date.now(),
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: 'req_' + Date.now(),
        }
      } as T;
      
    case '/api/v1/wallet/verify':
      return {
        data: {
          verified: true,
          address: body?.address || '',
          isHolder: true,
          balance: 1250.75,
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: 'req_' + Date.now(),
        }
      } as T;
      
    case '/api/v1/wallet':
      return {
        data: {
          address: '8YLKoCZcWk79yVMfnD8VnYNd5KwJRPGUTZiJTTCBYbAp',
          isConnected: true,
          isVerified: true,
          balance: 1250.75,
          usdValue: 125.07,
          isHolder: true,
          connectedAt: new Date().toISOString(),
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: 'req_' + Date.now(),
        }
      } as T;
      
    case '/api/v1/wallet/transactions':
      return {
        data: {
          transactions: [
            {
              hash: '3xR7vKpC4WjXKDBSEedrGQNaqzQXfZJnRGpSKQLxmLPGbpQ4AZ8QJTkVMBQpnqoK1bHUGEWjvYKGNMoFRZtPrw5d',
              type: 'in',
              amount: 250.5,
              timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
              fromAddress: 'marketplace.solana',
              status: 'confirmed',
            },
            {
              hash: '4qL9pWzD6RbJKFGvTfQnAZ5uXr3vNP5BnmKRwxJVdYtP8DgSJs2ZARXLKJe1RYqHnVhymgrD76iucN2N6xFUymAP',
              type: 'out',
              amount: 100,
              timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
              toAddress: 'DEXaddr.solana',
              status: 'confirmed',
            },
          ],
          pagination: {
            total: 12,
            limit: 10,
            offset: 0,
          }
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: 'req_' + Date.now(),
        }
      } as T;
      
    case '/api/v1/wallet/mobile/session':
      return {
        data: {
          sessionId: 'session-' + Date.now(),
          qrCodeData: 'https://successKid.io/connect?session=123456',
          deepLink: 'phantom://connect?session=123456',
          expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: 'req_' + Date.now(),
        }
      } as T;
      
    default:
      throw new Error(`Unhandled mock endpoint: ${endpoint}`);
  }
};

// Initialize a wallet connection
export const initializeWalletConnection = async (provider: WalletType = 'phantom') => {
  try {
    const response = await mockApiRequest<any>('/api/v1/wallet/initialize', 'POST', { 
      walletType: provider 
    });
    
    return {
      message: response.data.message,
      sessionId: response.data.sessionId,
    };
  } catch (error: any) {
    throw {
      code: WalletErrorType.UNKNOWN,
      message: error.message || 'Failed to initialize wallet connection',
      details: error,
    };
  }
};

// Verify wallet signature
export const verifyWalletSignature = async (
  sessionId: string,
  address: string,
  signature: string
) => {
  try {
    const response = await mockApiRequest<any>('/api/v1/wallet/verify', 'POST', {
      sessionId,
      address,
      signature,
    });
    
    return {
      verified: response.data.verified,
      address: response.data.address,
      isHolder: response.data.isHolder,
      balance: response.data.balance,
    };
  } catch (error: any) {
    throw {
      code: WalletErrorType.UNKNOWN,
      message: error.message || 'Failed to verify wallet signature',
      details: error,
    };
  }
};

// Get wallet data
export const getWalletData = async () => {
  try {
    const response = await mockApiRequest<any>('/api/v1/wallet');
    
    return response.data;
  } catch (error: any) {
    throw {
      code: WalletErrorType.UNKNOWN,
      message: error.message || 'Failed to fetch wallet data',
      details: error,
    };
  }
};

// Get wallet transactions
export const getWalletTransactions = async (limit = 10, offset = 0): Promise<WalletTransaction[]> => {
  try {
    const response = await mockApiRequest<any>('/api/v1/wallet/transactions');
    
    return response.data.transactions.map((tx: any) => ({
      ...tx,
      timestamp: new Date(tx.timestamp),
    }));
  } catch (error: any) {
    throw {
      code: WalletErrorType.UNKNOWN,
      message: error.message || 'Failed to fetch wallet transactions',
      details: error,
    };
  }
};

// Create mobile connection session
export const createMobileConnectionSession = async (deviceType: 'ios' | 'android'): Promise<WalletConnectionSession> => {
  try {
    const response = await mockApiRequest<any>('/api/v1/wallet/mobile/session', 'POST', {
      deviceType,
    });
    
    return {
      id: response.data.sessionId,
      message: response.data.message || 'Sign this message to prove ownership of your wallet address',
      expiresAt: new Date(response.data.expiresAt),
      qrCodeData: response.data.qrCodeData,
      deepLink: response.data.deepLink,
    };
  } catch (error: any) {
    throw {
      code: WalletErrorType.UNKNOWN,
      message: error.message || 'Failed to create mobile connection session',
      details: error,
    };
  }
};

// Categorize wallet errors for user-friendly messages
export const categorizeWalletError = (error: any): WalletError => {
  // Already a WalletError
  if (error && error.code && error.message) {
    return error as WalletError;
  }
  
  // Try to determine error type
  let code = WalletErrorType.UNKNOWN;
  let message = 'An unknown error occurred while connecting to your wallet.';
  
  if (error) {
    if (error.message) {
      if (error.message.includes('not installed') || error.message.includes('not found')) {
        code = WalletErrorType.WALLET_NOT_FOUND;
        message = `Wallet not found. Please install the wallet extension or app.`;
      } else if (error.message.includes('User rejected')) {
        code = WalletErrorType.CONNECTION_REFUSED;
        message = 'Connection request was declined. Please try again.';
      } else if (error.message.includes('timeout') || error.message.includes('timed out')) {
        code = WalletErrorType.TIMEOUT;
        message = 'Connection request timed out. Please try again.';
      } else if (error.message.includes('network') || error.message.includes('Network')) {
        code = WalletErrorType.NETWORK_ERROR;
        message = 'Network error. Please check your connection and try again.';
      } else if (error.message.includes('signature') || error.message.includes('declined')) {
        code = WalletErrorType.SIGNATURE_DECLINED;
        message = 'Signature request was declined. Please try again.';
      } else if (error.message.includes('network') || error.message.includes('chainId')) {
        code = WalletErrorType.WRONG_NETWORK;
        message = 'Please switch to the Solana network in your wallet.';
      } else {
        message = error.message;
      }
    }
  }
  
  return {
    code,
    message,
    details: error,
  };
};

// Format wallet address for display
export const formatWalletAddress = (address: string, length = 4): string => {
  if (!address) return '';
  if (address.length <= length * 2) return address;
  
  return `${address.substring(0, length)}...${address.substring(address.length - length)}`;
};

// Format token amount for display
export const formatTokenAmount = (amount: number, decimals = 2): string => {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  }).format(amount);
};

// Format USD amount for display
export const formatUSDAmount = (amount: number | undefined): string => {
  if (amount === undefined) return '$0.00';
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

// Get transaction explorer URL
export const getTransactionExplorerUrl = (hash: string): string => {
  return `https://explorer.solana.com/tx/${hash}`;
};

// Get address explorer URL
export const getAddressExplorerUrl = (address: string): string => {
  return `https://explorer.solana.com/address/${address}`;
};

// Get time ago string from date
export const getTimeAgo = (date: Date): string => {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  
  let interval = seconds / 31536000;
  if (interval > 1) {
    return Math.floor(interval) + " years ago";
  }
  
  interval = seconds / 2592000;
  if (interval > 1) {
    return Math.floor(interval) + " months ago";
  }
  
  interval = seconds / 86400;
  if (interval > 1) {
    return Math.floor(interval) + " days ago";
  }
  
  interval = seconds / 3600;
  if (interval > 1) {
    return Math.floor(interval) + " hours ago";
  }
  
  interval = seconds / 60;
  if (interval > 1) {
    return Math.floor(interval) + " minutes ago";
  }
  
  return Math.floor(seconds) + " seconds ago";
};
