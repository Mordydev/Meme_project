'use client';

import { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { PriceChart, MilestoneTracker, MarketStatistics, TransactionFeed, TokenSupplyChart, MarketAlertSystem } from '@/components/features/market';
import { usePriceData, useMilestoneData, useMarketStats, useTransactionFeed, useTokenSupply } from '@/hooks/useMarketData';
import { Milestone } from '@/types';

export default function MarketDashboardPage() {
  const [activeTab, setActiveTab] = useState('overview');
  
  // Fetch market data
  const { 
    data: priceData, 
    currentPrice, 
    priceChange, 
    priceChangePercent, 
    isLoading: isPriceLoading, 
    setTimeRange 
  } = usePriceData();
  
  const { 
    currentMarketCap, 
    milestones, 
    nextMilestone, 
    isLoading: isMilestoneLoading,
    isCelebrating,
    celebratedMilestone,
    dismissCelebration
  } = useMilestoneData();
  
  const { 
    stats, 
    isLoading: isStatsLoading, 
    lastUpdated 
  } = useMarketStats();
  
  const { 
    transactions, 
    isLoading: isTransactionsLoading, 
    filter: transactionFilter,
    hasMore,
    setFilter,
    loadMore
  } = useTransactionFeed();
  
  const {
    totalSupply,
    circulatingSupply,
    burned,
    allocations,
    isLoading: isSupplyLoading
  } = useTokenSupply();
  
  // Render milestone celebration
  const renderMilestoneCelebration = () => {
    if (!isCelebrating || !celebratedMilestone) return null;
    
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="bg-white rounded-lg shadow-xl max-w-md p-6 w-full mx-4 relative">
          <button 
            className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-600"
            onClick={dismissCelebration}
          >
            ×
          </button>
          
          <div className="text-center">
            <div className="mb-4 text-4xl">🚀</div>
            <h2 className="text-2xl font-bold mb-2">Market Cap Milestone Achieved!</h2>
            <div className="text-4xl font-bold text-primary-600 mb-4">
              {celebratedMilestone.label}
            </div>
            <p className="text-neutral-600 mb-6">
              {celebratedMilestone.description}
            </p>
            <button
              className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-600 transition-colors"
              onClick={dismissCelebration}
            >
              Awesome!
            </button>
          </div>
        </div>
      </div>
    );
  };
  
  return (
    <div className="container max-w-screen-xl px-4 py-8">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Market Dashboard</h1>
        <p className="text-neutral-600">Track token performance and market metrics</p>
      </div>
      
      {/* Main content */}
      <div className="mb-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="supply">Token Supply</TabsTrigger>
            <TabsTrigger value="alerts">Alerts</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <PriceChart
                  data={priceData}
                  currentPrice={currentPrice}
                  priceChange={priceChange}
                  priceChangePercent={priceChangePercent}
                  isLoading={isPriceLoading}
                  onTimeRangeChange={setTimeRange}
                />
              </div>
              
              <div>
                <MilestoneTracker
                  currentMarketCap={currentMarketCap}
                  milestones={milestones}
                  nextMilestone={nextMilestone as any} // Type assertion needed due to possible null
                  isLoading={isMilestoneLoading}
                />
              </div>
            </div>
            
            <MarketStatistics
              stats={stats || {
                marketCap: 0,
                volume24h: 0,
                volume7d: 0,
                liquidity: 0,
                holders: 0,
                trades24h: 0,
                price: 0,
                priceChange24h: 0,
                priceChangePercent24h: 0,
                allTimeHigh: {
                  price: 0,
                  date: new Date().toISOString()
                }
              }}
              isLoading={isStatsLoading}
              lastUpdated={lastUpdated}
            />
          </TabsContent>
          
          <TabsContent value="transactions">
            <TransactionFeed
              transactions={transactions}
              isLoading={isTransactionsLoading}
              onTypeChange={setFilter}
              onLoadMore={loadMore}
              hasMore={hasMore}
            />
          </TabsContent>
          
          <TabsContent value="supply">
            <TokenSupplyChart
              totalSupply={totalSupply}
              circulatingSupply={circulatingSupply}
              burned={burned}
              allocations={allocations}
              isLoading={isSupplyLoading}
            />
          </TabsContent>
          
          <TabsContent value="alerts">
            <MarketAlertSystem />
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Render milestone celebration overlay */}
      {renderMilestoneCelebration()}
    </div>
  );
}
