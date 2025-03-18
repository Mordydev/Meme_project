'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@/hooks/useWallet';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/Spinner';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { formatWalletAddress } from '@/lib/wallet-utils';
import { WalletConnectionFlow } from './WalletConnectionFlow';
import { AnimatePresence, motion } from 'framer-motion';

const KNOWN_PHANTOM_ERRORS = {
  'user rejected': 'You rejected the connection request in your wallet.',
  'timeout': 'The connection request timed out. Please try again.',
  'wallet adapter not found': 'Phantom wallet extension was not detected.',
  'not supported': 'This browser does not support wallet connections.',
  'already processing': 'A wallet connection is already in progress.',
};

interface EnhancedWalletConnectorProps {
  onSuccess?: () => void;
  variant?: 'default' | 'compact' | 'full';
  className?: string;
}

export function EnhancedWalletConnector({
  onSuccess,
  variant = 'default',
  className = '',
}: EnhancedWalletConnectorProps) {
  const {
    wallet,
    connect,
    disconnect,
    isConnecting,
    connectionStep,
    connectionError,
    availableProviders,
    retry,
    refreshWallet,
  } = useWallet();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Handle connection success
  useEffect(() => {
    if (wallet?.isConnected && isDialogOpen) {
      setIsDialogOpen(false);
      onSuccess?.();
    }
  }, [wallet?.isConnected, isDialogOpen, onSuccess]);

  // Handle connection errors
  useEffect(() => {
    if (connectionError) {
      // Check for known error messages
      const errorMessage = connectionError.message.toLowerCase();
      let friendlyMessage = connectionError.message;

      // Replace with friendly message if known
      for (const [key, message] of Object.entries(KNOWN_PHANTOM_ERRORS)) {
        if (errorMessage.includes(key)) {
          friendlyMessage = message;
          break;
        }
      }

      setConnectError(friendlyMessage);
    } else {
      setConnectError(null);
    }
  }, [connectionError]);

  // Periodically refresh wallet data
  useEffect(() => {
    if (!wallet?.isConnected) return;

    const refreshInterval = setInterval(() => {
      refreshWallet();
      setLastRefresh(new Date());
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(refreshInterval);
  }, [wallet?.isConnected, refreshWallet]);

  // Handle connection dialog
  const handleOpenConnectDialog = () => {
    setIsDialogOpen(true);
    setConnectError(null);
  };

  const handleCloseConnectDialog = () => {
    setIsDialogOpen(false);
  };

  const handleDisconnect = async () => {
    await disconnect();
  };

  const handleManualRefresh = () => {
    refreshWallet();
    setLastRefresh(new Date());
  };

  // Render compact variant (just connect/disconnect button)
  if (variant === 'compact') {
    return (
      <>
        {wallet?.isConnected ? (
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="px-2 py-1 text-xs">
              {formatWalletAddress(wallet.address)}
            </Badge>
            <Button variant="ghost" size="sm" onClick={handleDisconnect}>
              Disconnect
            </Button>
          </div>
        ) : (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleOpenConnectDialog}
            disabled={isConnecting}
          >
            {isConnecting ? <Spinner className="mr-2 h-4 w-4" /> : null}
            Connect Wallet
          </Button>
        )}

        <WalletConnectionFlow
          isOpen={isDialogOpen}
          onClose={handleCloseConnectDialog}
          onSuccess={onSuccess}
        />
      </>
    );
  }

  // Render full variant (card with balance, connection status, etc.)
  if (variant === 'full') {
    return (
      <Card className={className}>
        <CardHeader className="pb-2">
          <CardTitle className="text-xl">Wallet Connection</CardTitle>
        </CardHeader>

        <CardContent>
          {wallet?.isConnected ? (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-neutral-600">Status</span>
                <Badge variant="success" className="px-2">Connected</Badge>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-neutral-600">Address</span>
                <div className="flex items-center space-x-2">
                  <code className="bg-neutral-100 px-2 py-1 rounded text-xs">
                    {formatWalletAddress(wallet.address, 6, 4)}
                  </code>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-7 w-7 p-0"
                    onClick={() => {
                      navigator.clipboard.writeText(wallet.address);
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                    </svg>
                    <span className="sr-only">Copy address</span>
                  </Button>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-neutral-600">Balance</span>
                <div className="flex items-center space-x-1">
                  <span className="font-bold">{wallet.balance.toLocaleString()}</span>
                  <span className="text-sm">SKC</span>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-7 w-7 p-0 ml-1"
                    onClick={handleManualRefresh}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"></path>
                    </svg>
                    <span className="sr-only">Refresh balance</span>
                  </Button>
                </div>
              </div>

              {wallet.usdValue && (
                <div className="flex justify-between items-center">
                  <span className="text-neutral-600">USD Value</span>
                  <span>${wallet.usdValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              )}

              <div className="text-xs text-neutral-500 text-right mt-2">
                Last updated {formatTimeAgo(lastRefresh)}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-6 space-y-4">
              <div className="text-neutral-400 text-5xl">👛</div>
              <div className="text-center space-y-1">
                <h3 className="font-semibold">No wallet connected</h3>
                <p className="text-sm text-neutral-500">
                  Connect your wallet to view your balance and transaction history.
                </p>
              </div>

              {connectError && (
                <Alert variant="destructive" className="mt-3">
                  <AlertTitle>Connection error</AlertTitle>
                  <AlertDescription className="text-sm">{connectError}</AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </CardContent>

        <CardFooter>
          {wallet?.isConnected ? (
            <div className="flex w-full space-x-2">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={handleDisconnect}
              >
                Disconnect
              </Button>
              <Button 
                variant="secondary" 
                className="flex-1"
                asChild
              >
                <a 
                  href={`https://explorer.solana.com/address/${wallet.address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View on Explorer
                </a>
              </Button>
            </div>
          ) : (
            <Button 
              className="w-full" 
              onClick={handleOpenConnectDialog}
              disabled={isConnecting}
            >
              {isConnecting ? <Spinner className="mr-2 h-4 w-4" /> : null}
              Connect Wallet
            </Button>
          )}
        </CardFooter>

        <WalletConnectionFlow
          isOpen={isDialogOpen}
          onClose={handleCloseConnectDialog}
          onSuccess={onSuccess}
        />
      </Card>
    );
  }

  // Default variant (button with state)
  return (
    <>
      {wallet?.isConnected ? (
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="flex items-center gap-2 px-2 py-1">
            <div className="h-2 w-2 rounded-full bg-green-500" />
            <span>{formatWalletAddress(wallet.address)}</span>
          </Badge>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleDisconnect}
            className="h-9"
          >
            Disconnect
          </Button>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key="connect-button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Button 
              onClick={handleOpenConnectDialog}
              disabled={isConnecting}
              className={className}
            >
              {isConnecting ? <Spinner className="mr-2 h-4 w-4" /> : null}
              Connect Wallet
            </Button>
          </motion.div>
        </AnimatePresence>
      )}

      <WalletConnectionFlow
        isOpen={isDialogOpen}
        onClose={handleCloseConnectDialog}
        onSuccess={onSuccess}
      />
    </>
  );
}

// Helper function to format time ago
function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
