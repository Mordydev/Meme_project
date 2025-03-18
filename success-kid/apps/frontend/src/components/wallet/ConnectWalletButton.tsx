'use client';

import React, { useState } from 'react';
import { Button, ButtonProps } from '@/components/ui/button';
import { Loader2, ExternalLink, Wallet } from 'lucide-react';
import { useWalletContext } from '@/components/providers/WalletProvider';
import { WalletSelectorModal } from './WalletSelectorModal';
import { cn } from '@/lib/utils';

export interface ConnectWalletButtonProps extends Omit<ButtonProps, 'onClick' | 'onSuccess'> {
  onSuccess?: () => void;
  hideAddress?: boolean;
  showIcon?: boolean;
  label?: string;
  disconnectLabel?: string;
  className?: string;
}

export function ConnectWalletButton({
  onSuccess,
  hideAddress = false,
  showIcon = true,
  label = 'Connect Wallet',
  disconnectLabel = 'Disconnect',
  className,
  variant = 'default',
  size = 'default',
  ...props
}: ConnectWalletButtonProps) {
  const { wallet, isConnecting, connectWallet, disconnectWallet, formatAddress } = useWalletContext();
  const [showModal, setShowModal] = useState(false);
  
  const handleConnect = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (wallet?.isConnected) {
      await disconnectWallet();
    } else {
      setShowModal(true);
    }
  };
  
  const handleWalletSelected = async () => {
    setShowModal(false);
    
    try {
      await connectWallet();
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Wallet connection failed:', error);
    }
  };
  
  const handleCloseModal = () => {
    setShowModal(false);
  };
  
  // Connected state
  if (wallet?.isConnected) {
    return (
      <>
        <Button
          variant={variant}
          size={size}
          className={cn(className)}
          onClick={handleConnect}
          {...props}
        >
          {showIcon && (
            <Wallet className="mr-2 h-4 w-4" />
          )}
          
          {hideAddress ? disconnectLabel : formatAddress(wallet.account.address)}
        </Button>
      </>
    );
  }
  
  // Connecting state
  if (isConnecting) {
    return (
      <Button
        variant={variant}
        size={size}
        className={cn(className)}
        disabled
        {...props}
      >
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Connecting...
      </Button>
    );
  }
  
  // Default state
  return (
    <>
      <Button
        variant={variant}
        size={size}
        className={cn(className)}
        onClick={handleConnect}
        {...props}
      >
        {showIcon && (
          <Wallet className="mr-2 h-4 w-4" />
        )}
        {label}
      </Button>
      
      <WalletSelectorModal
        isOpen={showModal}
        onClose={handleCloseModal}
        onSelect={handleWalletSelected}
      />
    </>
  );
}
