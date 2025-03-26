'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { RefreshCw, TrendingUp, Clock, AlertTriangle, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate } from '@/lib/format';
import { useMarketStats, useTokenSupply } from '@/hooks/useMarketData';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import StatsGrid from './StatsGrid';
import TokenSupply from './TokenSupply';

interface MarketStatsProps {
  className?: string;
}

/**
 * MarketStats Component
 * 
 * Displays comprehensive market statistics and token information.
 */
export default function MarketStats({ className }: MarketStatsProps) {
  const { 
    stats, 
    isLoading: statsLoading, 
    lastUpdated, 
    refresh: refreshStats 
  } = useMarketStats();
  
  const {
    totalSupply,
    circulatingSupply,
    burned,
    allocations,
    isLoading: supplyLoading
  } = useTokenSupply();
  
  const isLoading = statsLoading || supplyLoading;
  
  // Handle refresh
  const handleRefresh = () => {
    refreshStats();
  };

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>Market Statistics</CardTitle>
            <CardDescription>
              Token metrics, supply information, and market activity
            </CardDescription>
          </div>
          
          <div className="flex items-center gap-2">
            {lastUpdated && !isLoading && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center text-xs text-neutral-500">
                      <Clock className="h-3 w-3 mr-1" />
                      Updated {formatDate(lastUpdated, 'relative')}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Last updated: {formatDate(lastUpdated, 'full')}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleRefresh}
              disabled={isLoading}
              className="h-8 px-2"
            >
              <RefreshCw className={cn("h-3 w-3 mr-1", isLoading && "animate-spin")} />
              Refresh
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="overview">
          <TabsList className="mb-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="supply">Token Supply</TabsTrigger>
            <TabsTrigger value="details">Detailed Metrics</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-6">
            {isLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : stats ? (
              <StatsGrid stats={stats} />
            ) : (
              <div className="flex flex-col items-center justify-center py-12">
                <AlertTriangle className="h-12 w-12 text-neutral-300 mb-4" />
                <h3 className="text-lg font-medium mb-2">Statistics Unavailable</h3>
                <p className="text-neutral-500 text-center mb-6 max-w-md">
                  We're unable to load market statistics at this time. Please try again later.
                </p>
                <Button onClick={handleRefresh}>
                  Try Again
                </Button>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="supply">
            {isLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <TokenSupply
                totalSupply={totalSupply}
                circulatingSupply={circulatingSupply}
                burned={burned}
                allocations={allocations}
              />
            )}
          </TabsContent>
          
          <TabsContent value="details">
            {isLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : stats ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Market Metrics */}
                  <Card className="p-4">
                    <h3 className="text-sm font-medium text-neutral-500 mb-3">Market Metrics</h3>
                    <dl className="space-y-2">
                      <div className="flex justify-between">
                        <dt className="text-sm">Fully Diluted Valuation</dt>
                        <dd className="text-sm font-medium">${stats.fullyDilutedValuation?.toLocaleString() || 'N/A'}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-sm">ATH</dt>
                        <dd className="text-sm font-medium">${stats.allTimeHigh?.toLocaleString() || 'N/A'}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-sm">ATL</dt>
                        <dd className="text-sm font-medium">${stats.allTimeLow?.toLocaleString() || 'N/A'}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-sm">24h High</dt>
                        <dd className="text-sm font-medium">${stats.high24h?.toLocaleString() || 'N/A'}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-sm">24h Low</dt>
                        <dd className="text-sm font-medium">${stats.low24h?.toLocaleString() || 'N/A'}</dd>
                      </div>
                    </dl>
                  </Card>
                  
                  {/* Liquidity Metrics */}
                  <Card className="p-4">
                    <h3 className="text-sm font-medium text-neutral-500 mb-3">Liquidity Metrics</h3>
                    <dl className="space-y-2">
                      <div className="flex justify-between">
                        <dt className="text-sm">Total Liquidity</dt>
                        <dd className="text-sm font-medium">${stats.totalLiquidity?.toLocaleString() || 'N/A'}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-sm">
                          <span className="flex items-center">
                            Liquidity Ratio
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Info className="h-3 w-3 ml-1 text-neutral-400 cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Ratio of liquidity to market cap. Higher ratios indicate less price impact from large trades.</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </span>
                        </dt>
                        <dd className="text-sm font-medium">{(stats.liquidityRatio || 0).toFixed(2)}%</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-sm">Liquidity Pools</dt>
                        <dd className="text-sm font-medium">{stats.liquidityPools || 'N/A'}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-sm">Locked Liquidity</dt>
                        <dd className="text-sm font-medium">{(stats.lockedLiquidity || 0).toFixed(2)}%</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-sm">Lock Expiration</dt>
                        <dd className="text-sm font-medium">{stats.lockExpiration ? formatDate(stats.lockExpiration, 'short') : 'N/A'}</dd>
                      </div>
                    </dl>
                  </Card>
                </div>
                
                {/* Trading Metrics */}
                <Card className="p-4">
                  <h3 className="text-sm font-medium text-neutral-500 mb-3">Trading Metrics</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <dl className="space-y-2">
                      <div className="flex justify-between">
                        <dt className="text-sm">24h Volume</dt>
                        <dd className="text-sm font-medium">${stats.volume24h?.toLocaleString() || 'N/A'}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-sm">7d Volume</dt>
                        <dd className="text-sm font-medium">${stats.volume7d?.toLocaleString() || 'N/A'}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-sm">24h Transactions</dt>
                        <dd className="text-sm font-medium">{stats.trades24h?.toLocaleString() || 'N/A'}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-sm">7d Transactions</dt>
                        <dd className="text-sm font-medium">{stats.trades7d?.toLocaleString() || 'N/A'}</dd>
                      </div>
                    </dl>
                    
                    <dl className="space-y-2">
                      <div className="flex justify-between">
                        <dt className="text-sm">
                          <span className="flex items-center">
                            Volume/MC Ratio (24h)
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Info className="h-3 w-3 ml-1 text-neutral-400 cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Ratio of 24h trading volume to market cap. Higher values indicate higher trading activity relative to market size.</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </span>
                        </dt>
                        <dd className="text-sm font-medium">{(stats.volumeMcRatio24h || 0).toFixed(2)}%</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-sm">Buy Transactions (24h)</dt>
                        <dd className="text-sm font-medium">{stats.buyTrades24h?.toLocaleString() || 'N/A'}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-sm">Sell Transactions (24h)</dt>
                        <dd className="text-sm font-medium">{stats.sellTrades24h?.toLocaleString() || 'N/A'}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-sm">Buy/Sell Ratio (24h)</dt>
                        <dd className="text-sm font-medium">{(stats.buySellRatio24h || 0).toFixed(2)}</dd>
                      </div>
                    </dl>
                  </div>
                </Card>
                
                {/* Holders Statistics */}
                <Card className="p-4">
                  <h3 className="text-sm font-medium text-neutral-500 mb-3">Holders Statistics</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <dl className="space-y-2">
                      <div className="flex justify-between">
                        <dt className="text-sm">Total Holders</dt>
                        <dd className="text-sm font-medium">{stats.holders?.toLocaleString() || 'N/A'}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-sm">New Holders (24h)</dt>
                        <dd className="text-sm font-medium">{stats.newHolders24h?.toLocaleString() || 'N/A'}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-sm">Active Holders (7d)</dt>
                        <dd className="text-sm font-medium">{stats.activeHolders7d?.toLocaleString() || 'N/A'}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-sm">Average Hold Time</dt>
                        <dd className="text-sm font-medium">{stats.averageHoldTime || 'N/A'}</dd>
                      </div>
                    </dl>
                    
                    <dl className="space-y-2">
                      <div className="flex justify-between">
                        <dt className="text-sm">Top 10 Holders %</dt>
                        <dd className="text-sm font-medium">{(stats.top10HoldersPercentage || 0).toFixed(2)}%</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-sm">Top 50 Holders %</dt>
                        <dd className="text-sm font-medium">{(stats.top50HoldersPercentage || 0).toFixed(2)}%</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-sm">Top 100 Holders %</dt>
                        <dd className="text-sm font-medium">{(stats.top100HoldersPercentage || 0).toFixed(2)}%</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-sm">Holder Retention Rate</dt>
                        <dd className="text-sm font-medium">{(stats.holderRetentionRate || 0).toFixed(2)}%</dd>
                      </div>
                    </dl>
                  </div>
                </Card>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12">
                <AlertTriangle className="h-12 w-12 text-neutral-300 mb-4" />
                <h3 className="text-lg font-medium mb-2">Detailed Metrics Unavailable</h3>
                <p className="text-neutral-500 text-center mb-6 max-w-md">
                  Detailed market metrics are currently unavailable. Please try again later.
                </p>
                <Button onClick={handleRefresh}>
                  Try Again
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
