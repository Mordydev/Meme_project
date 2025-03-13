'use client';

import { useEffect } from 'react';
import { useWallet } from '@/hooks/useWallet';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/Spinner';
import { WalletSelectorModal } from './WalletSelectorModal';
import { getRecoverySteps } from '@/lib/wallet-utils';
import { categorizeWalletError } from '@/lib/wallet-utils';

interface WalletConnectionFlowProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function WalletConnectionFlow({
  isOpen,
  onClose,
  onSuccess
}: WalletConnectionFlowProps) {
  const { 
    connectionStep, 
    selectedProvider,
    connectionError,
    connect,
    availableProviders,
    wallet,
    retry
  } = useWallet();
  
  // Handle success case
  useEffect(() => {
    if (connectionStep === 'success' && wallet?.isConnected) {
      onSuccess?.();
      onClose();
    }
  }, [connectionStep, wallet?.isConnected, onSuccess, onClose]);
  
  // Render appropriate content based on connection step
  const renderContent = () => {
    switch (connectionStep) {
      case 'initial':
        return (
          <>
            <DialogHeader>
              <DialogTitle>Connect Your Wallet</DialogTitle>
              <DialogDescription>
                Select a wallet to connect to the Success Kid platform.
              </DialogDescription>
            </DialogHeader>
            
            <div className="flex flex-col space-y-3 pt-4">
              {availableProviders.map((provider) => (
                <button
                  key={provider}
                  onClick={() => connect(provider)}
                  className="flex items-center rounded-lg border p-4 hover:bg-neutral-50 transition-colors"
                >
                  <div className="h-10 w-10 flex-shrink-0 mr-4 bg-neutral-100 rounded-full flex items-center justify-center">
                    {/* Placeholder for wallet icon */}
                    <div className="text-xl font-bold">
                      {provider.charAt(0).toUpperCase()}
                    </div>
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-medium">{provider.charAt(0).toUpperCase() + provider.slice(1)}</div>
                    <div className="text-sm text-neutral-500">
                      Connect to {provider.charAt(0).toUpperCase() + provider.slice(1)} Wallet
                    </div>
                  </div>
                </button>
              ))}
            </div>
            
            <DialogFooter className="pt-4">
              <Button
                variant="outline"
                onClick={onClose}
              >
                Cancel
              </Button>
            </DialogFooter>
          </>
        );
        
      case 'connecting':
        return (
          <>
            <DialogHeader>
              <DialogTitle>Connecting to Wallet</DialogTitle>
              <DialogDescription>
                Please approve the connection request in your wallet.
              </DialogDescription>
            </DialogHeader>
            
            <div className="flex flex-col items-center justify-center py-10">
              <Spinner className="h-12 w-12 mb-6" />
              <p className="text-neutral-600">
                Waiting for approval in {selectedProvider?.charAt(0).toUpperCase()}{selectedProvider?.slice(1)}...
              </p>
            </div>
            
            <DialogFooter>
              <Button
                variant="outline"
                onClick={onClose}
              >
                Cancel
              </Button>
            </DialogFooter>
          </>
        );
        
      case 'verification':
        return (
          <>
            <DialogHeader>
              <DialogTitle>Verify Wallet Ownership</DialogTitle>
              <DialogDescription>
                Please sign the message in your wallet to verify ownership.
              </DialogDescription>
            </DialogHeader>
            
            <div className="flex flex-col items-center justify-center py-10">
              <Spinner className="h-12 w-12 mb-6" />
              <p className="text-neutral-600">
                Waiting for signature in {selectedProvider?.charAt(0).toUpperCase()}{selectedProvider?.slice(1)}...
              </p>
            </div>
            
            <DialogFooter>
              <Button
                variant="outline"
                onClick={onClose}
              >
                Cancel
              </Button>
            </DialogFooter>
          </>
        );
        
      case 'error':
        const errorType = connectionError ? 
          categorizeWalletError(connectionError) : 
          'unknown';
        
        const recoverySteps = getRecoverySteps(errorType);
        
        return (
          <>
            <DialogHeader>
              <DialogTitle>Connection Error</DialogTitle>
              <DialogDescription>
                {connectionError?.message || 'There was an error connecting to your wallet.'}
              </DialogDescription>
            </DialogHeader>
            
            <div className="py-4">
              <h4 className="font-medium mb-2">Try these steps:</h4>
              <ol className="list-decimal pl-5 space-y-1 text-sm">
                {recoverySteps.map((step, index) => (
                  <li key={index}>{step}</li>
                ))}
              </ol>
            </div>
            
            <DialogFooter className="space-x-3">
              <Button
                variant="outline"
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={retry}
              >
                Try Again
              </Button>
            </DialogFooter>
          </>
        );
        
      case 'success':
        return (
          <>
            <DialogHeader>
              <DialogTitle>Wallet Connected</DialogTitle>
              <DialogDescription>
                Your wallet has been successfully connected.
              </DialogDescription>
            </DialogHeader>
            
            <div className="py-10 flex flex-col items-center">
              <div className="bg-primary-50 rounded-full p-4 mb-4">
                <div className="text-primary-500 text-2xl">✓</div>
              </div>
              <p className="text-center">
                You can now use all holder features and track your token balance.
              </p>
            </div>
            
            <DialogFooter>
              <Button
                variant="primary"
                onClick={onClose}
              >
                Continue
              </Button>
            </DialogFooter>
          </>
        );
        
      default:
        return null;
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        {renderContent()}
      </DialogContent>
    </Dialog>
  );
}
