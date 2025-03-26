'use client';

import React, { useState } from 'react';
import { Button, ButtonProps } from '@/components/ui/button';
import { Wallet, WalletProvider } from '@/types/wallet';
import { WalletConnectionModal } from './WalletConnectionModal';
import { useWalletContext } from '@/components/providers/WalletProvider';
import { Loader2, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConnectWalletButtonProps extends ButtonProps {
  size?: 'default' | 'sm' | 'lg' | 'icon';
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  fullWidth?: boolean;
  showAddress?: boolean;
  showStatus?: boolean;
  onConnect?: (wallet: Wallet) => void;
  className?: string;
}

export function ConnectWalletButton({
  size = 'default',
  variant = 'default',
  fullWidth = false,
  showAddress = false,
  showStatus = false,
  onConnect,
  className,
  children,
  ...props
}: ConnectWalletButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { wallet, isConnecting, isVerifying, disconnectWallet } = useWalletContext();
  
  const handleOpenModal = () => {
    setIsModalOpen(true);
  };
  
  const handleCloseModal = () => {
    setIsModalOpen(false);
  };
  
  const formatAddress = (address: string) => {
    if (!address) return '';
    return `${address.substring(0, 4)}...${address.substring(address.length - 4)}`;
  };
  
  // Handle successful connection
  const handleSuccessfulConnect = (connectedWallet: Wallet) => {
    if (onConnect) {
      onConnect(connectedWallet);
    }
  };
  
  // Determine button content based on connection state
  const buttonContent = () => {
    if (isConnecting || isVerifying) {
      return (
        <div className="flex items-center">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {isConnecting ? 'Connecting...' : 'Verifying...'}
        </div>
      );
    }
    
    if (wallet?.isConnected) {
      return (
        <div className="flex items-center">
          {showStatus && (
            <div className="relative mr-2">
              <div className="h-2 w-2 rounded-full bg-green-500" />
            </div>
          )}
          
          {showAddress && wallet.account.address ? (
            <span className="font-mono">{formatAddress(wallet.account.address)}</span>
          ) : (
            <span>{wallet.isVerified ? 'Wallet Connected' : 'Wallet Linked'}</span>
          )}
        </div>
      );
    }
    
    return (
      <div className="flex items-center">
        {children || 'Connect Wallet'}
        <ChevronRight className="ml-2 h-4 w-4" />
      </div>
    );
  };
  
  return (
    <>
      <Button
        variant={wallet?.isConnected ? 'outline' : variant}
        size={size}
        className={cn(
          fullWidth && 'w-full',
          className
        )}
        onClick={wallet?.isConnected ? undefined : handleOpenModal}
        disabled={isConnecting || isVerifying}
        {...props}
      >
        {buttonContent()}
      </Button>
      
      <WalletConnectionModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </>
  );
}
