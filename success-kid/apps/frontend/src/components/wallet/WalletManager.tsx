'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@/hooks/useWallet';
import { ConnectWalletButton } from './ConnectWalletButton';
import { WalletCard } from './WalletCard';
import { VerificationPrompt } from './VerificationPrompt';
import { WalletErrorHandler } from './WalletErrorHandler';
import { MobileWalletConnect } from './MobileWalletConnect';
import { WalletType } from '@/types/wallet';

interface WalletManagerProps {
  showConnectButton?: boolean;
  showWalletCard?: boolean;
  onWalletConnected?: () => void;
  compact?: boolean;
}

export function WalletManager({
  showConnectButton = true,
  showWalletCard = true,
  onWalletConnected,
  compact = false,
}: WalletManagerProps) {
  const { 
    wallet, 
    isConnected, 
    isVerified, 
    error, 
    isMobile, 
    isInitialized,
    connect, 
    clearError 
  } = useWallet();
  
  const [showVerification, setShowVerification] = useState(false);
  const [showMobileConnect, setShowMobileConnect] = useState(false);
  const [selectedWalletType, setSelectedWalletType] = useState<WalletType>('phantom');
  
  // Handle connection success
  useEffect(() => {
    if (isConnected && !isVerified) {
      setShowVerification(true);
    }
  }, [isConnected, isVerified]);
  
  // Handle newly detected mobile device
  useEffect(() => {
    if (isMobile && !isConnected && !wallet) {
      setShowMobileConnect(true);
    }
  }, [isMobile, isConnected, wallet]);
  
  const handleConnectSuccess = () => {
    if (isConnected && isVerified) {
      onWalletConnected?.();
    }
  };
  
  const handleVerificationComplete = () => {
    setShowVerification(false);
    onWalletConnected?.();
  };
  
  const handleMobileConnectComplete = () => {
    setShowMobileConnect(false);
    onWalletConnected?.();
  };
  
  const handleSelectWallet = (walletType: string) => {
    setSelectedWalletType(walletType as WalletType);
    
    if (isMobile) {
      setShowMobileConnect(true);
    } else {
      connect(walletType as WalletType);
    }
  };
  
  const handleRetryConnection = () => {
    clearError();
    connect(selectedWalletType);
  };
  
  // Don't render until wallet state is initialized
  if (!isInitialized) {
    return null;
  }
  
  return (
    <div>
      {showConnectButton && !isConnected && (
        <ConnectWalletButton 
          onSuccess={handleConnectSuccess}
          size={compact ? "sm" : "md"}
          fullWidth={!compact}
        />
      )}
      
      {showWalletCard && isConnected && (
        <WalletCard 
          showBalance={!compact}
          showActions={!compact}
          showTransactions={!compact}
          maxTransactions={compact ? 2 : 3}
        />
      )}
      
      {/* Verification Modal */}
      <VerificationPrompt
        isOpen={showVerification}
        onComplete={handleVerificationComplete}
        onCancel={() => setShowVerification(false)}
      />
      
      {/* Mobile Connect Modal */}
      <MobileWalletConnect
        isOpen={showMobileConnect}
        onComplete={handleMobileConnectComplete}
        onClose={() => setShowMobileConnect(false)}
        walletType={selectedWalletType}
      />
      
      {/* Error Handler */}
      <WalletErrorHandler
        isOpen={!!error}
        onClose={clearError}
        onRetry={handleRetryConnection}
        error={error}
      />
    </div>
  );
}
