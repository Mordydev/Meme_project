'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@/hooks/useWallet';
import { formatWalletAddress, getExplorerUrl } from '@/lib/wallet-utils';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/Spinner';
import { formatCompactNumber } from '@/lib/utils';
import { HolderBadge } from './HolderBadge';
import Link from 'next/link';

interface WalletDisplayProps {
  showBalance?: boolean;
  showDisconnect?: boolean;
  className?: string;
}

export function WalletDisplay({
  showBalance = true,
  showDisconnect = true,
  className = ''
}: WalletDisplayProps) {
  const { wallet, disconnect, copyAddress, refreshWallet } = useWallet();
  const [copied, setCopied] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Reset the copied state after 2 seconds
  useEffect(() => {
    if (copied) {
      const timeout = setTimeout(() => setCopied(false), 2000);
      return () => clearTimeout(timeout);
    }
  }, [copied]);
  
  // Handle wallet refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshWallet();
    setIsRefreshing(false);
  };
  
  // Handle copy address
  const handleCopyAddress = () => {
    const success = copyAddress();
    setCopied(success);
  };
  
  if (!wallet) {
    return null;
  }
  
  return (
    <Card className={className}>
      <CardHeader className="pb-2 flex flex-row items-center space-y-0 justify-between">
        <CardTitle className="text-base">Wallet Connected</CardTitle>
        {wallet.isHolder && <HolderBadge />}
      </CardHeader>
      
      <CardContent className="pb-2">
        <div className="flex items-center justify-between mb-2">
          <div className="font-mono text-sm bg-neutral-100 rounded-md px-2 py-1">
            {formatWalletAddress(wallet.address)}
          </div>
          <div className="flex space-x-1">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleCopyAddress}
              className="text-xs h-7 px-2"
            >
              {copied ? 'Copied!' : 'Copy'}
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => window.open(getExplorerUrl(wallet.address), '_blank')}
              className="text-xs h-7 px-2"
            >
              View
            </Button>
          </div>
        </div>
        
        {showBalance && (
          <div className="bg-neutral-50 rounded-md p-3 flex justify-between items-center">
            <div>
              <div className="text-sm text-neutral-500">Balance</div>
              <div className="font-bold text-lg">{formatCompactNumber(wallet.balance)} SKC</div>
              {wallet.usdValue !== undefined && (
                <div className="text-xs text-neutral-500">
                  ≈ ${formatCompactNumber(wallet.usdValue)} USD
                </div>
              )}
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="h-8 w-8 p-0 rounded-full"
            >
              {isRefreshing ? (
                <Spinner className="h-4 w-4" />
              ) : (
                <span className="text-lg">↻</span>
              )}
            </Button>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <Link href="/wallet" passHref>
          <Button variant="outline" size="sm">View Details</Button>
        </Link>
        
        {showDisconnect && (
          <Button variant="ghost" size="sm" onClick={() => disconnect()}>
            Disconnect
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
