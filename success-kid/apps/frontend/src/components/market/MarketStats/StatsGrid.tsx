'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { formatCurrency, formatNumber, formatPercentage, getValueColorClass } from '@/lib/format';
import { MarketStats } from '@/types';
import { ArrowUpRight, ArrowDownRight, TrendingUp, Users, BarChart3, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import StatCard from './StatCard';

interface StatsGridProps {
  stats: MarketStats;
  className?: string;
}

/**
 * StatsGrid Component
 * 
 * Displays a grid of key market statistics cards.
 */
export default function StatsGrid({ stats, className }: StatsGridProps) {
  return (
    <div className={cn("grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4", className)}>
      {/* Market Cap */}
      <StatCard
        title="Market Cap"
        value={formatCurrency(stats.marketCap || 0, 0)}
        change={stats.marketCapChangePercentage24h}
        changeLabel="24h"
        icon={<TrendingUp className="text-primary" />}
        tooltip="Total market value of circulating token supply"
      />
      
      {/* Price */}
      <StatCard
        title="Current Price"
        value={formatCurrency(stats.currentPrice || 0)}
        change={stats.priceChangePercent24h}
        changeLabel="24h"
        icon={<BarChart3 className="text-primary" />}
        tooltip="Current trading price of the token"
      />
      
      {/* 24h Volume */}
      <StatCard
        title="24h Volume"
        value={formatCurrency(stats.volume24h || 0, 0)}
        secondaryValue={`${formatNumber(stats.trades24h || 0)} trades`}
        icon={<BarChart3 className="text-primary" />}
        tooltip="Trading volume in the last 24 hours"
      />
      
      {/* Holders */}
      <StatCard
        title="Total Holders"
        value={formatNumber(stats.holders || 0)}
        change={stats.holdersChangePercentage24h}
        changeLabel="24h"
        secondaryValue={`+${formatNumber(stats.newHolders24h || 0)} today`}
        icon={<Users className="text-primary" />}
        tooltip="Total number of unique wallet addresses holding tokens"
      />
      
      {/* Circulating Supply */}
      <StatCard
        title="Circulating Supply"
        value={formatNumber(stats.circulatingSupply || 0, 0)}
        secondaryValue={`${((stats.circulatingSupply || 0) / (stats.totalSupply || 1) * 100).toFixed(1)}% of total`}
        icon={<BarChart3 className="text-primary" />}
        tooltip="Number of tokens in circulation and available for trading"
      />
      
      {/* Fully Diluted Valuation */}
      <StatCard
        title="Fully Diluted Valuation"
        value={formatCurrency(stats.fullyDilutedValuation || 0, 0)}
        secondaryValue={`${formatNumber(stats.totalSupply || 0, 0)} total supply`}
        icon={<TrendingUp className="text-primary" />}
        tooltip="Market cap if all tokens were in circulation"
      />
      
      {/* Liquidity */}
      <StatCard
        title="Total Liquidity"
        value={formatCurrency(stats.totalLiquidity || 0, 0)}
        secondaryValue={`${(stats.liquidityRatio || 0).toFixed(1)}% of market cap`}
        icon={<BarChart3 className="text-primary" />}
        tooltip="Total value locked in liquidity pools"
      />
      
      {/* Buy/Sell Ratio */}
      <StatCard
        title="Buy/Sell Ratio (24h)"
        value={(stats.buySellRatio24h || 0).toFixed(2)}
        secondaryValue={`${stats.buyTrades24h || 0} buys, ${stats.sellTrades24h || 0} sells`}
        icon={<BarChart3 className="text-primary" />}
        tooltip="Ratio of buy to sell transactions in the last 24 hours"
      />
      
      {/* All Time High */}
      <StatCard
        title="All-Time High"
        value={formatCurrency(stats.allTimeHigh || 0)}
        secondaryValue={stats.allTimeHighDate ? `on ${new Date(stats.allTimeHighDate).toLocaleDateString()}` : ''}
        change={stats.currentPrice && stats.allTimeHigh ? ((stats.currentPrice - stats.allTimeHigh) / stats.allTimeHigh) * 100 : undefined}
        changeLabel="from ATH"
        icon={<TrendingUp className="text-primary" />}
        tooltip="Highest price ever reached by the token"
      />
    </div>
  );
}
