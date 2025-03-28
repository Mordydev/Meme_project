'use client';

import React, { useState, useEffect } from 'react';
import { useWalletContext } from '@/components/providers/WalletProvider';
import { ConnectWalletButton } from './ConnectWalletButton';
import { WalletCard } from './WalletCard';
import { TransactionHistory } from './TransactionHistory';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { motion } from 'framer-motion';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { cn } from '@/lib/utils';

export interface WalletManagerProps {
  className?: string;
  showBalance?: boolean;
  showHistory?: boolean;
  showTabs?: boolean;
  limit?: number;
}

export function WalletManager({ 
  className,
  showBalance = true,
  showHistory = true,
  showTabs = true,
  limit = 5
}: WalletManagerProps) {
  const { wallet } = useWalletContext();
  const [activeTab, setActiveTab] = useState<string>('wallet');
  const prefersReducedMotion = useReducedMotion();
  
  // If user connects wallet, switch to history tab automatically
  useEffect(() => {
    if (wallet?.isConnected && showTabs && showHistory) {
      // Wait a moment to give the connection animation time to complete
      const timer = setTimeout(() => {
        setActiveTab('history');
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [wallet?.isConnected, showTabs, showHistory]);
  
  // If tabs are disabled, just show card stacking
  if (!showTabs) {
    return (
      <div className={cn("space-y-6", className)}>
        <WalletCard 
          showBalance={showBalance}
        />
        
        {showHistory && wallet?.isConnected && (
          <TransactionHistory limit={limit} />
        )}
      </div>
    );
  }
  
  // With tabs for wallet and history
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Wallet</CardTitle>
        <CardDescription>
          Connect your wallet to track tokens and redeem points
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="wallet">Wallet</TabsTrigger>
            <TabsTrigger value="history" disabled={!wallet?.isConnected}>History</TabsTrigger>
          </TabsList>
          
          <TabsContent value="wallet">
            <div className="-m-6 border-0 rounded-none">
              <WalletCard 
                showBalance={showBalance}
                className="border-0 rounded-none shadow-none"
              />
            </div>
          </TabsContent>
          
          <TabsContent value="history">
            <div className="-m-6 border-0 rounded-none">
              <TransactionHistory 
                limit={limit}
                className="border-0 rounded-none shadow-none"
              />
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
