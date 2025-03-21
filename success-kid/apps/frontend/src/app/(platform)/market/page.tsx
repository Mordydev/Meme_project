'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ClientParticles } from '@/components/ui/ClientParticles';
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
    <ClientParticles count={20} className="relative overflow-hidden min-h-screen">
      {/* Market background with rays */}
      <div className="absolute inset-0 overflow-hidden -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-400 via-purple-100 to-pink-300 dark:from-indigo-900 dark:via-purple-900 dark:to-pink-800"></div>
        
        {/* Vibrant orbs */}
        {Array.from({ length: 6 }).map((_, i) => (
          <motion.div 
            key={`orb-${i}`}
            className={`absolute rounded-full bg-gradient-to-br ${i % 2 === 0 ? 'from-primary/30 to-secondary/10' : 'from-secondary/20 to-primary/10'}`}
            style={{
              width: `${150 + i * 40}px`,
              height: `${150 + i * 40}px`,
              top: `${5 + (i * 12)}%`,
              left: `${10 + (i * 15)}%`,
              filter: 'blur(60px)'
            }}
            animate={{
              x: [0, 20, 0, -20, 0],
              y: [0, 15, 0, -15, 0],
              opacity: [0.4, 0.6, 0.4]
            }}
            transition={{
              duration: 15 + i * 2,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
          />
        ))}
        
        {/* Sun rays */}
        <div className="absolute -top-[30%] -right-[20%] w-[800px] h-[800px]">
          {Array.from({ length: 12 }).map((_, i) => (
            <motion.div
              key={`ray-${i}`}
              className="absolute top-1/2 left-1/2 h-full w-[1px] bg-gradient-to-b from-primary/40 via-secondary/30 to-transparent"
              style={{ 
                transformOrigin: 'top',
                rotate: `${i * 30}deg`
              }}
              animate={{
                opacity: [0.4, 0.7, 0.4],
                scale: [1, 1.05, 1],
              }}
              transition={{
                duration: 4 + i % 3,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: i * 0.1
              }}
            />
          ))}
        </div>
        
        {/* Floating particles */}
        {Array.from({ length: 15 }).map((_, i) => (
          <motion.div
            key={`particle-${i}`}
            className={`absolute rounded-full ${i % 3 === 0 ? 'bg-primary/30' : i % 3 === 1 ? 'bg-secondary/30' : 'bg-white/50'}`}
            style={{
              width: `${3 + i % 5}px`,
              height: `${3 + i % 5}px`,
              top: `${10 + (i * 5)}%`,
              left: `${5 + (i * 6)}%`,
            }}
            animate={{
              y: [0, -100, 0],
              x: [0, i % 2 === 0 ? 50 : -50, 0],
              opacity: [0, 0.8, 0],
            }}
            transition={{
              duration: 10 + i * 2,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: i * 0.5
            }}
          />
        ))}
      </div>
      
      <div className="container max-w-screen-xl px-4 py-8 relative z-10">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-primary">Market Dashboard</h1>
        <p className="text-neutral-600">Track token performance and market metrics - Updated UI</p>
        <div className="mt-3 px-4 py-2 bg-indigo-100 text-indigo-800 rounded-md inline-block">
          UI Updates Applied - v2.0
        </div>
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
    </ClientParticles>
  );
}
