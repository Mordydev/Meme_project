import { WalletProvider, WalletType } from '@/types/wallet';

export const WALLET_PROVIDERS: Record<WalletType, WalletProvider> = {
  phantom: {
    name: 'Phantom',
    type: 'phantom',
    icon: '/images/wallets/phantom.svg', // You'll need to add this SVG to your public folder
    url: 'https://phantom.app/download',
    mobile: 'phantom://'
  },
  solflare: {
    name: 'Solflare',
    type: 'solflare',
    icon: '/images/wallets/solflare.svg', // You'll need to add this SVG to your public folder
    url: 'https://solflare.com/download',
    mobile: 'solflare://'
  },
  other: {
    name: 'Other',
    type: 'other',
    icon: '/images/wallets/generic.svg', // You'll need to add this SVG to your public folder
    url: 'https://docs.solana.com/wallet-guide',
  }
};

// Helper to check if wallet extension is installed
export const isWalletInstalled = (type: WalletType): boolean => {
  if (typeof window === 'undefined') return false;
  
  switch (type) {
    case 'phantom':
      return window.phantom !== undefined;
    case 'solflare':
      return window.solflare !== undefined;
    default:
      return false;
  }
};

// Get installation URL for a wallet provider
export const getWalletInstallUrl = (type: WalletType): string => {
  return WALLET_PROVIDERS[type]?.url || '';
};

// For TypeScript - add phantom to window type
declare global {
  interface Window {
    phantom?: any;
    solflare?: any;
  }
}
