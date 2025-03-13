'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useWallet } from '@/hooks/useWallet';
import { WalletSelectorModal } from './WalletSelectorModal';

interface ConnectWalletButtonProps {
  onSuccess?: () => void;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary' | 'outline';
  fullWidth?: boolean;
  showConnectedState?: boolean;
}

export function ConnectWalletButton({
  onSuccess,
  size = 'md',
  variant = 'primary',
  fullWidth = false,
  showConnectedState = false,
}: ConnectWalletButtonProps) {
  const { wallet, isConnecting, isConnected, connect, disconnect } = useWallet();
  const [showSelector, setShowSelector] = useState(false);
  
  const handleOpenSelector = () => {
    setShowSelector(true);
  };
  
  const handleCloseSelector = () => {
    setShowSelector(false);
  };
  
  const handleSelectWallet = async (walletType: string) => {
    const success = await connect(walletType as any);
    if (success) {
      setShowSelector(false);
      onSuccess?.();
    }
  };
  
  const handleDisconnect = async () => {
    await disconnect();
  };
  
  if (isConnected && showConnectedState) {
    return (
      <Button
        variant="outline"
        size={size}
        onClick={handleDisconnect}
        className={fullWidth ? 'w-full' : ''}
      >
        <svg 
          className="mr-2 h-4 w-4 text-success-500" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2"
          strokeLinecap="round" 
          strokeLinejoin="round"
        >
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
          <polyline points="22 4 12 14.01 9 11.01"></polyline>
        </svg>
        Wallet Connected
      </Button>
    );
  }
  
  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={handleOpenSelector}
        isLoading={isConnecting}
        className={fullWidth ? 'w-full' : ''}
      >
        {isConnecting ? 'Connecting...' : 'Connect Wallet'}
      </Button>
      
      <WalletSelectorModal 
        isOpen={showSelector} 
        onClose={handleCloseSelector} 
        onSelect={handleSelectWallet} 
      />
    </>
  );
}
