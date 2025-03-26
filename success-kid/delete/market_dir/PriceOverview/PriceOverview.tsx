'use client';

import React from 'react';
import { usePriceData, useMarketStats } from '@/hooks/useMarketData';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency, formatPercentage, formatNumber, getValueColorClass } from '@/lib/format';
import CurrentPrice from './CurrentPrice';
import PriceChange from './PriceChange';
import KeyMetrics from './KeyMetrics';
import UpdateIndicator from './UpdateIndicator';

interface PriceOverviewProps {
  className?: string;
}

/**
 * PriceOverview Component
 * 
 * Displays current token price and key market metrics in a summary format.
 */
export default function PriceOverview({ className }: PriceOverviewProps) {
  const { 
    currentPrice, 
    priceChange, 
    priceChangePercent, 
    isLoading: priceLoading 
  } = usePriceData();
  
  const { 
    stats, 
    isLoading: statsLoading, 
    lastUpdated 
  } = useMarketStats();
  
  const isLoading = priceLoading || statsLoading;

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 ${className || ''}`}>
      {/* Current Price Card */}
      <Card className="p-4">
        <h3 className="text-sm font-medium text-neutral-500">Current Price</h3>
        {isLoading ? (
          <Skeleton className="h-8 w-32 mt-2" />
        ) : (
          <CurrentPrice 
            price={currentPrice} 
            className="mt-2 text-2xl font-bold text-neutral-900 dark:text-white" 
          />
        )}
        {isLoading ? (
          <Skeleton className="h-4 w-20 mt-1" />
        ) : (
          <PriceChange 
            change={priceChange} 
            changePercent={priceChangePercent} 
            className="mt-1 text-sm" 
          />
        )}
        {!isLoading && lastUpdated && <UpdateIndicator timestamp={lastUpdated} className="mt-2" />}
      </Card>
      
      {/* Market Cap Card */}
      <Card className="p-4">
        <h3 className="text-sm font-medium text-neutral-500">Market Cap</h3>
        {isLoading ? (
          <Skeleton className="h-8 w-32 mt-2" />
        ) : (
          <div className="mt-2 text-2xl font-bold text-neutral-900 dark:text-white">
            {formatCurrency(stats?.marketCap || 0, 0)}
          </div>
        )}
        {isLoading ? (
          <Skeleton className="h-4 w-20 mt-1" />
        ) : stats?.priceChangePercent24h !== undefined && (
          <div className={`mt-1 text-sm ${getValueColorClass(stats.priceChangePercent24h)}`}>
            {formatPercentage(stats.priceChangePercent24h)} (24h)
          </div>
        )}
      </Card>
      
      {/* 24h Volume Card */}
      <Card className="p-4">
        <h3 className="text-sm font-medium text-neutral-500">24h Volume</h3>
        {isLoading ? (
          <Skeleton className="h-8 w-32 mt-2" />
        ) : (
          <div className="mt-2 text-2xl font-bold text-neutral-900 dark:text-white">
            {formatCurrency(stats?.volume24h || 0, 0)}
          </div>
        )}
        {isLoading ? (
          <Skeleton className="h-4 w-20 mt-1" />
        ) : (
          <div className="mt-1 text-sm text-neutral-500">
            {formatNumber(stats?.trades24h || 0)} transactions
          </div>
        )}
      </Card>
      
      {/* Holders Card */}
      <Card className="p-4">
        <h3 className="text-sm font-medium text-neutral-500">Holders</h3>
        {isLoading ? (
          <Skeleton className="h-8 w-32 mt-2" />
        ) : (
          <div className="mt-2 text-2xl font-bold text-neutral-900 dark:text-white">
            {formatNumber(stats?.holders || 0)}
          </div>
        )}
        {isLoading ? (
          <Skeleton className="h-4 w-20 mt-1" />
        ) : (
          <div className="mt-1 text-sm text-accent-500">
            +12 today
          </div>
        )}
      </Card>
    </div>
  );
}
