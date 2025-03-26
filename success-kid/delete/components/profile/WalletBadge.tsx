'use client';

import { useWallet } from '@/hooks/useWallet';
import { formatWalletAddress } from '@/lib/walletService';
import { ConnectWalletButton } from '@/components/wallet';

interface WalletBadgeProps {
  showConnectButton?: boolean;
}

export function WalletBadge({ showConnectButton = true }: WalletBadgeProps) {
  const { wallet, isConnected, isVerified, isHolder } = useWallet();
  
  if (!isConnected || !wallet) {
    return showConnectButton ? (
      <div className="mt-2">
        <ConnectWalletButton size="sm" variant="outline" />
      </div>
    ) : null;
  }
  
  return (
    <div className="mt-2 flex items-center">
      <div className="mr-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary-100">
        <svg className="h-3 w-3 text-primary-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      </div>
      
      <div className="flex items-center">
        <span className="mr-1 font-mono text-xs text-gray-600">
          {formatWalletAddress(wallet.account.address, 3)}
        </span>
        
        {isVerified && (
          <svg className="h-3 w-3 text-success-500" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        )}
        
        {isHolder && (
          <span className="ml-2 rounded-full bg-success-50 px-2 py-0.5 text-xs font-medium text-success-700">
            Holder
          </span>
        )}
      </div>
    </div>
  );
}
