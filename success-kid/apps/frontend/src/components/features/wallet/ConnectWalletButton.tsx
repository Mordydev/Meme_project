'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { WalletSelectorModal } from './WalletSelectorModal';
import { useWallet } from '@/hooks/useWallet';
import { WalletType } from '@/store/useWalletStore';

interface ConnectWalletButtonProps {
  onSuccess?: () => void;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  className?: string;
}

export function ConnectWalletButton({
  onSuccess,
  size = 'md',
  variant = 'primary',
  className = ''
}: ConnectWalletButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { wallet, connect, isConnecting, availableProviders } = useWallet();
  
  const handleOpenModal = () => {
    setIsModalOpen(true);
  };
  
  const handleCloseModal = () => {
    setIsModalOpen(false);
  };
  
  const handleSelectWallet = async (walletType: WalletType) => {
    const success = await connect(walletType);
    
    if (success) {
      setIsModalOpen(false);
      onSuccess?.();
    }
  };
  
  // If wallet is already connected, don't show the connect button
  if (wallet?.isConnected) {
    return null;
  }
  
  // If there's only one provider, we can connect directly without showing the selector
  const handleClick = async () => {
    if (availableProviders.length === 1) {
      await connect(availableProviders[0]);
      onSuccess?.();
    } else {
      handleOpenModal();
    }
  };
  
  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={handleClick}
        isLoading={isConnecting}
        className={className}
      >
        Connect Wallet
      </Button>
      
      <WalletSelectorModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSelect={handleSelectWallet}
        availableProviders={availableProviders}
      />
    </>
  );
}
