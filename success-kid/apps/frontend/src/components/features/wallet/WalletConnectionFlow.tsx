'use client';

import { useEffect, useState } from 'react';
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { WalletErrorRecovery } from './WalletErrorRecovery';
import { MobileWalletConnection } from './MobileWalletConnection';
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
    retry,
    isMobile
  } = useWallet();
  
  const [connectionTab, setConnectionTab] = useState<'desktop' | 'mobile'>(
    isMobile ? 'mobile' : 'desktop'
  );
  
  // Handle success case
  useEffect(() => {
    if (connectionStep === 'success' && wallet?.isConnected) {
      onSuccess?.();
      onClose();
    }
  }, [connectionStep, wallet?.isConnected, onSuccess, onClose]);
  
  // Handle desktop connection
  const handleDesktopConnect = (provider) => {
    connect(provider);
  };
  
  // Handle mobile connection success
  const handleMobileConnectSuccess = () => {
    onSuccess?.();
    onClose();
  };
  
  // Render appropriate content based on connection step
  const renderDesktopContent = () => {
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
                  onClick={() => handleDesktopConnect(provider)}
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
        
        return (
          <>
            <DialogHeader>
              <DialogTitle>Connection Error</DialogTitle>
              <DialogDescription>
                {connectionError?.message || 'There was an error connecting to your wallet.'}
              </DialogDescription>
            </DialogHeader>
            
            <WalletErrorRecovery
              errorType={errorType}
              onRetry={retry}
              className="my-4"
            />
            
            <DialogFooter className="space-x-3">
              <Button
                variant="outline"
                onClick={onClose}
              >
                Cancel
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
        {/* Show tabs if in initial state, otherwise show content based on step */}
        {connectionStep === 'initial' ? (
          <Tabs 
            value={connectionTab} 
            onValueChange={(value) => setConnectionTab(value as 'desktop' | 'mobile')}
            className="w-full"
          >
            <TabsList className="grid grid-cols-2 mb-4">
              <TabsTrigger value="desktop">Desktop</TabsTrigger>
              <TabsTrigger value="mobile">Mobile</TabsTrigger>
            </TabsList>
            
            <TabsContent value="desktop">
              {renderDesktopContent()}
            </TabsContent>
            
            <TabsContent value="mobile">
              <MobileWalletConnection
                onConnect={handleMobileConnectSuccess}
                onCancel={onClose}
              />
            </TabsContent>
          </Tabs>
        ) : (
          renderDesktopContent()
        )}
      </DialogContent>
    </Dialog>
  );
}
