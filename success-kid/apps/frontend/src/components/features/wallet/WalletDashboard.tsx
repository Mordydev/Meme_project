'use client';

import { useEffect, useState } from 'react';
import { useWallet } from '@/hooks/useWallet';
import { formatWalletAddress, getExplorerUrl } from '@/lib/wallet-utils';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/Spinner';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { TransactionsList } from './TransactionsList';
import { EnhancedWalletConnector } from './EnhancedWalletConnector';
import { Skeleton } from '@/components/ui/skeleton';
import { motion, AnimatePresence } from 'framer-motion';

interface WalletDashboardProps {
  className?: string;
}

export function WalletDashboard({ className = '' }: WalletDashboardProps) {
  const { 
    wallet, 
    transactions, 
    isConnecting, 
    fetchTransactions, 
    refreshWallet,
    copyAddress 
  } = useWallet();
  
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [showCopied, setShowCopied] = useState(false);
  
  // Refresh data when wallet connects or tab changes
  useEffect(() => {
    if (wallet?.isConnected) {
      refreshWallet();
      
      if (activeTab === 'transactions') {
        fetchTransactions();
      }
      
      setLastRefresh(new Date());
    }
  }, [wallet?.isConnected, activeTab, refreshWallet, fetchTransactions]);
  
  // Handle manual refresh
  const handleRefresh = async () => {
    if (!wallet?.isConnected) return;
    
    setIsRefreshing(true);
    
    try {
      await refreshWallet();
      
      if (activeTab === 'transactions') {
        await fetchTransactions();
      }
      
      setLastRefresh(new Date());
    } finally {
      setIsRefreshing(false);
    }
  };
  
  // Handle address copy
  const handleCopyAddress = () => {
    if (copyAddress()) {
      setShowCopied(true);
      setTimeout(() => setShowCopied(false), 2000);
    }
  };
  
  // If no wallet is connected, show connector
  if (!wallet?.isConnected) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Wallet Dashboard</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center py-8 space-y-4">
          <div className="text-6xl">💰</div>
          <div className="max-w-sm text-center">
            <h3 className="text-lg font-semibold mb-2">Connect Your Wallet</h3>
            <p className="text-neutral-600 mb-4">
              Connect your Phantom wallet to view your token balance, transaction history, and enable redemption features.
            </p>
            <EnhancedWalletConnector />
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className={className}>
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle>Wallet Dashboard</CardTitle>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleRefresh}
          disabled={isRefreshing}
        >
          {isRefreshing ? (
            <Spinner className="h-4 w-4" />
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"></path>
            </svg>
          )}
          <span className="sr-only">Refresh</span>
        </Button>
      </CardHeader>
      
      <Tabs 
        value={activeTab} 
        onValueChange={setActiveTab}
        className="w-full"
      >
        <TabsList className="grid grid-cols-2 mx-4 mt-2">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="m-0">
          <CardContent className="p-4">
            <div className="space-y-4">
              {/* Wallet Address Section */}
              <div className="border rounded-lg p-4">
                <h3 className="text-sm font-medium text-neutral-500 mb-2">Wallet Address</h3>
                <div className="flex items-center justify-between">
                  <code className="bg-neutral-100 dark:bg-neutral-800 px-3 py-1 rounded text-sm font-mono break-all">
                    {formatWalletAddress(wallet.address, 12, 4)}
                  </code>
                  <div className="flex space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={handleCopyAddress}
                      aria-label="Copy address"
                    >
                      <AnimatePresence mode="wait">
                        {showCopied ? (
                          <motion.div
                            key="check"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                          </motion.div>
                        ) : (
                          <motion.div
                            key="copy"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                            </svg>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      aria-label="View on explorer"
                      asChild
                    >
                      <a
                        href={getExplorerUrl(wallet.address, 'address')}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                          <polyline points="15 3 21 3 21 9"></polyline>
                          <line x1="10" y1="14" x2="21" y2="3"></line>
                        </svg>
                      </a>
                    </Button>
                  </div>
                </div>
              </div>
              
              {/* Token Balance Section */}
              <div className="border rounded-lg p-4">
                <h3 className="text-sm font-medium text-neutral-500 mb-4">Token Balance</h3>
                <div className="flex items-end">
                  <span className="text-3xl font-bold mr-2">
                    {wallet.balance.toLocaleString()}
                  </span>
                  <span className="text-lg font-medium text-neutral-500 mb-1">SKC</span>
                </div>
                
                {wallet.usdValue !== undefined && (
                  <div className="text-sm text-neutral-500 mt-1">
                    ≈ ${wallet.usdValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
                  </div>
                )}
                
                <div className="mt-4 flex justify-between items-center">
                  <span className="text-xs text-neutral-400">
                    Last updated: {formatTimeAgo(lastRefresh)}
                  </span>
                  
                  {wallet.isHolder && (
                    <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full">
                      Verified Holder
                    </span>
                  )}
                </div>
              </div>
              
              {/* Quick Actions Section */}
              <div className="border rounded-lg p-4">
                <h3 className="text-sm font-medium text-neutral-500 mb-2">Quick Actions</h3>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <a href="/points/redeem">
                      Redeem Points
                    </a>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <a href="/market">
                      View Market
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </TabsContent>
        
        <TabsContent value="transactions" className="m-0">
          <CardContent className="p-0">
            <TransactionsList maxItems={10} showHeader={false} className="border-0 shadow-none" />
          </CardContent>
        </TabsContent>
      </Tabs>
      
      <CardFooter className="border-t px-4 py-3">
        <div className="w-full flex justify-end">
          <EnhancedWalletConnector variant="compact" />
        </div>
      </CardFooter>
    </Card>
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
