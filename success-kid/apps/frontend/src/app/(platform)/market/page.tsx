'use client';

import { Suspense } from 'react';
import { MarketDataProvider } from '@/components/providers/market';
import { 
  PriceChart, 
  MilestoneTracker, 
  TransactionFeed, 
  MarketStats,
  TokenSupply 
} from '@/components/features/market';

export default function MarketPage() {
  return (
    <div className="container mx-auto py-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold">Market Overview</h1>
        <p className="text-gray-600">Track Success Kid token performance and market activity</p>
      </header>
      
      {/* Market Stats */}
      <Suspense fallback={<div className="mb-8 flex items-center justify-center h-24"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}>
        <MarketStats className="mb-8" />
      </Suspense>
      
      {/* Price Chart */}
      <div className="mb-8">
        <Suspense fallback={<div className="flex items-center justify-center h-96"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}>
          <PriceChart height={400} />
        </Suspense>
      </div>
      
      {/* Milestone Tracker */}
      <div className="mb-8">
        <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}>
          <MilestoneTracker />
        </Suspense>
      </div>
      
      {/* Token Supply */}
      <div className="mb-8">
        <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}>
          <TokenSupply />
        </Suspense>
      </div>
      
      {/* Recent Transactions */}
      <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}>
        <TransactionFeed />
      </Suspense>
    </div>
  );
}
