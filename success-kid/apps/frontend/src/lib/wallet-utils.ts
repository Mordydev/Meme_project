import { WalletErrorType, WalletType } from '@/store/useWalletStore';
import { AppError } from './api-client';

/**
 * Check if a wallet provider is available
 */
export const isWalletAvailable = async (type: WalletType): Promise<boolean> => {
  // In a real implementation, this would check for the provider in window
  switch (type) {
    case 'phantom':
      return !!window.phantom;
    case 'solflare':
      return !!window.solflare;
    case 'slope':
      return !!window.slope;
    default:
      return false;
  }
};

/**
 * Generate a wallet connection deep link for mobile
 */
export const getWalletDeepLink = (provider: WalletType, params: Record<string, string>): string => {
  const baseUrls: Record<WalletType, string> = {
    phantom: 'https://phantom.app/ul/browse',
    solflare: 'https://solflare.com/ul/browse',
    slope: 'https://slope.finance/ul/browse'
  };
  
  const url = new URL(baseUrls[provider]);
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, value);
  });
  
  return url.toString();
};

/**
 * Format a wallet address for display (e.g., SK...xyz)
 */
export const formatWalletAddress = (address: string, prefixLength = 4, suffixLength = 4): string => {
  if (!address) return '';
  if (address.length <= prefixLength + suffixLength) return address;
  
  const prefix = address.slice(0, prefixLength);
  const suffix = address.slice(-suffixLength);
  
  return `${prefix}...${suffix}`;
};

/**
 * Get the block explorer URL for a given address or transaction
 */
export const getExplorerUrl = (
  value: string, 
  type: 'address' | 'transaction' = 'address',
  network: 'mainnet' | 'devnet' = 'mainnet'
): string => {
  const baseUrl = network === 'mainnet' 
    ? 'https://explorer.solana.com' 
    : 'https://explorer.solana.com/?cluster=devnet';
    
  return `${baseUrl}/${type}/${value}`;
};

/**
 * Categorize wallet connection errors for better user experience
 */
export const categorizeWalletError = (error: any): WalletErrorType => {
  const errorMessage = error?.message?.toLowerCase() || '';
  
  if (errorMessage.includes('not installed') || errorMessage.includes('provider not found')) {
    return 'not_installed';
  }
  
  if (errorMessage.includes('user rejected') || errorMessage.includes('cancelled')) {
    return 'connection_rejected';
  }
  
  if (errorMessage.includes('verification failed') || errorMessage.includes('signature')) {
    return 'verification_failed';
  }
  
  if (errorMessage.includes('network') || errorMessage.includes('chain id')) {
    return 'wrong_network';
  }
  
  if (errorMessage.includes('timeout') || errorMessage.includes('timed out')) {
    return 'timeout';
  }
  
  return 'unknown';
};

/**
 * Get a user-friendly message for wallet errors
 */
export const getWalletErrorMessage = (errorType: WalletErrorType): string => {
  switch (errorType) {
    case 'not_installed':
      return 'Wallet extension not detected. Please install it and try again.';
    case 'connection_rejected':
      return 'Connection request was declined in your wallet.';
    case 'verification_failed':
      return 'Wallet ownership verification failed. Please try again.';
    case 'wrong_network':
      return 'Please connect to the Solana mainnet network in your wallet.';
    case 'timeout':
      return 'Connection attempt timed out. Please check your wallet and try again.';
    case 'unknown':
    default:
      return 'An unexpected error occurred while connecting to your wallet.';
  }
};

/**
 * Get recovery steps for a specific wallet error
 */
export const getRecoverySteps = (errorType: WalletErrorType): string[] => {
  switch (errorType) {
    case 'not_installed':
      return [
        'Install the wallet extension from the official website',
        'Refresh this page after installation',
        'Click "Connect Wallet" to try again'
      ];
    case 'connection_rejected':
      return [
        'Open your wallet extension',
        'Try connecting again and approve the connection request'
      ];
    case 'verification_failed':
      return [
        'Make sure you have the correct wallet selected',
        'Verify that you're using the account you intended',
        'Try connecting again and follow the signature steps'
      ];
    case 'wrong_network':
      return [
        'Open your wallet extension',
        'Go to settings and select "Solana Mainnet"',
        'Try connecting again'
      ];
    case 'timeout':
      return [
        'Check that your wallet extension is responsive',
        'Try connecting again',
        'If the problem persists, try restarting your browser'
      ];
    case 'unknown':
    default:
      return [
        'Refresh the page and try again',
        'Make sure your wallet is unlocked',
        'If the problem persists, contact support'
      ];
  }
};

/**
 * Create a signature verification message
 */
export const createVerificationMessage = (walletAddress: string, timestamp: number): string => {
  return `Sign this message to verify you own the wallet: ${walletAddress}\nTimestamp: ${timestamp}`;
};

/**
 * Determine if the user is a token holder (has a minimum balance)
 */
export const isTokenHolder = (balance: number, minimumBalance = 1): boolean => {
  return balance >= minimumBalance;
};
