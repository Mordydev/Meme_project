'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, RefreshCw, Wallet } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useWallet } from '@/hooks/useWallet';
import WalletSummary from './WalletSummary';
import PerformanceMetrics from './PerformanceMetrics';
import PurchaseAnalysis from './PurchaseAnalysis';
import { WalletTransactions } from '../WalletTransactions';

interface PortfolioAnalyticsProps {
  className?: string;
}

/**
 * PortfolioAnalytics Component
 * 
 * Provides personal wallet analytics and transaction history for connected wallets.
 */
export default function PortfolioAnalytics({ className }: PortfolioAnalyticsProps) {
  const { 
    isConnected, 
    connect, 
    address, 
    isConnecting,
    tokenBalance,
    tokenValue,
    profitLoss,
    profitLossPercentage
  } = useWallet();
  
  const [activeTab, setActiveTab] = useState('summary');
  
  const handleConnect = async () => {
    try {
      await connect();
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    }
  };

  // Render not connected state
  if (!isConnected) {
    return (
      <Card className={cn("overflow-hidden", className)}>
        <CardHeader className="pb-4">
          <CardTitle>Portfolio Analytics</CardTitle>
          <CardDescription>
            Connect your wallet to view your token holdings and performance metrics
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center py-8">
          <Wallet className="h-16 w-16 text-neutral-300 mb-4" />
          <h3 className="text-lg font-medium mb-2">No Wallet Connected</h3>
          <p className="text-neutral-500 text-center mb-6 max-w-md">
            Connect your wallet to see your token balance, transaction history, and performance metrics.
          </p>
          <Button 
            onClick={handleConnect}
            disabled={isConnecting}
            className="min-w-[180px]"
          >
            {isConnecting ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Connecting...
              </>
            ) : (
              'Connect Wallet'
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }
  
  // Render empty wallet state
  if (tokenBalance === 0) {
    return (
      <Card className={cn("overflow-hidden", className)}>
        <CardHeader className="pb-4">
          <CardTitle>Portfolio Analytics</CardTitle>
          <CardDescription>
            Connected: {address?.slice(0, 6)}...{address?.slice(-4)}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center py-8">
          <AlertTriangle className="h-16 w-16 text-neutral-300 mb-4" />
          <h3 className="text-lg font-medium mb-2">No Tokens Found</h3>
          <p className="text-neutral-500 text-center mb-6 max-w-md">
            Your wallet doesn't hold any Success Kid tokens yet. Purchase tokens or earn them by redeeming Success Points.
          </p>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => window.open('https://dexscreener.com', '_blank')}>
              View Market
            </Button>
            <Button onClick={() => window.location.href = '/rewards'}>
              Redeem Points
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Render portfolio analytics
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-4">
        <CardTitle>Portfolio Analytics</CardTitle>
        <CardDescription>
          Your personal token performance and transaction history
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>
          
          <TabsContent value="summary" className="space-y-6">
            <WalletSummary 
              balance={tokenBalance}
              value={tokenValue}
              profitLoss={profitLoss}
              profitLossPercentage={profitLossPercentage}
              walletAddress={address || ''}
            />
            <PerformanceMetrics />
          </TabsContent>
          
          <TabsContent value="transactions">
            <WalletTransactions />
          </TabsContent>
          
          <TabsContent value="analytics">
            <PurchaseAnalysis />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
