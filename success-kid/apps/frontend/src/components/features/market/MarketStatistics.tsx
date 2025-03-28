'use client';

import React from 'react';
import { GlassCard } from '@/components/ui/optimized/GlassCard';
import { 
  CardHeader, 
  CardTitle, 
  CardContent
} from '@/components/ui/optimized/glass/card-components';
import { MarketStats } from '@/types';
import { formatCurrency, formatCompactNumber } from '@/lib/utils';

interface MarketStatisticsProps {
  data: MarketStats;
  isLoading: boolean;
  className?: string;
}

export function MarketStatistics({ data, isLoading, className = '' }: MarketStatisticsProps) {
  // Format values for display
  const formatValue = (value: number, isCurrency = true, compact = false): string => {
    if (isCurrency) {
      return formatCurrency(value);
    }
    return compact ? formatCompactNumber(value) : value.toLocaleString();
  };

  // Calculate price change color
  const priceChangeColor = data?.priceChangePercent24h >= 0 
    ? 'text-success-500' 
    : 'text-alert-500';

  // Create stat item
  const StatItem = ({ label, value, isCurrency = true, colored = false, compact = false }) => (
    <div className="flex flex-col">
      <div className="text-sm text-neutral-500">{label}</div>
      <div className={`font-bold ${colored ? priceChangeColor : ''}`}>
        {isLoading ? (
          <div className="h-6 w-20 animate-pulse rounded bg-neutral-200"></div>
        ) : (
          formatValue(value, isCurrency, compact)
        )}
      </div>
    </div>
  );

  return (
    <GlassCard 
      className={className}
      gradientBackground={true}
      borderGlow={true}
      borderGlowIntensity="medium"
      shadowStyle="standard"
    >
      <CardHeader className="pb-2">
        <CardTitle>Market Statistics</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          <StatItem label="Current Price" value={data?.price || 0} />
          <StatItem 
            label="24h Change" 
            value={data?.priceChangePercent24h || 0} 
            isCurrency={false} 
            colored={true}
          />
          <StatItem label="Market Cap" value={data?.marketCap || 0} compact={true} />
          <StatItem label="24h Volume" value={data?.volume24h || 0} compact={true} />
          <StatItem label="Holders" value={data?.holders || 0} isCurrency={false} />
          <StatItem label="Trades (24h)" value={data?.trades24h || 0} isCurrency={false} />
          <StatItem label="Liquidity" value={data?.liquidity || 0} compact={true} />
          <StatItem 
            label="All-Time High" 
            value={data?.allTimeHigh?.price || 0}
          />
        </div>
      </CardContent>
    </GlassCard>
  );
}
