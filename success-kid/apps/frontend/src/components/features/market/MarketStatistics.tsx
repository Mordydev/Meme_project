'use client';

import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent,
  CardFooter
} from '@/components/ui/card';
import { formatCurrency, formatCompactNumber, timeAgo } from '@/lib/utils';
import { MarketStats } from '@/types';

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  trend?: 'up' | 'down' | 'neutral';
  className?: string;
}

function StatCard({ title, value, description, trend, className = '' }: StatCardProps) {
  const trendColor = trend === 'up' 
    ? 'text-accent-500' 
    : trend === 'down' 
      ? 'text-alert-500' 
      : 'text-neutral-500';
      
  const trendIcon = trend === 'up' 
    ? '↑' 
    : trend === 'down' 
      ? '↓' 
      : '•';
  
  return (
    <div className={`rounded-lg border bg-card p-4 shadow-sm ${className}`}>
      <div className="text-sm font-medium text-muted-foreground">{title}</div>
      <div className="mt-1 flex items-baseline">
        <div className="text-2xl font-bold">{value}</div>
        {trend && (
          <div className={`ml-2 text-sm ${trendColor}`}>{trendIcon}</div>
        )}
      </div>
      {description && <div className="mt-1 text-xs text-neutral-500">{description}</div>}
    </div>
  );
}

interface MarketStatisticsProps {
  stats: MarketStats;
  isLoading?: boolean;
  lastUpdated?: string | null;
  className?: string;
}

export function MarketStatistics({
  stats,
  isLoading = false,
  lastUpdated = null,
  className = '',
}: MarketStatisticsProps) {
  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Market Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-24 animate-pulse rounded-lg bg-neutral-100"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }
  
  const {
    volume24h,
    volume7d,
    liquidity,
    holders,
    trades24h,
    price,
    priceChange24h,
    priceChangePercent24h,
    allTimeHigh
  } = stats;
  
  const isPriceUp = priceChangePercent24h >= 0;
  
  const formattedStats = [
    {
      title: '24h Volume',
      value: formatCurrency(volume24h),
      trend: 'neutral'
    },
    {
      title: '7d Volume',
      value: formatCurrency(volume7d),
      trend: 'neutral'
    },
    {
      title: 'Liquidity',
      value: formatCurrency(liquidity),
      trend: 'neutral'
    },
    {
      title: 'Holders',
      value: formatCompactNumber(holders),
      trend: 'up'
    },
    {
      title: '24h Trades',
      value: formatCompactNumber(trades24h),
      trend: 'neutral'
    },
    {
      title: 'All-Time High',
      value: `$${allTimeHigh.price.toFixed(6)}`,
      description: new Date(allTimeHigh.date).toLocaleDateString()
    }
  ];
  
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Market Statistics</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {formattedStats.map((stat, index) => (
            <StatCard
              key={index}
              title={stat.title}
              value={stat.value}
              description={stat.description}
              trend={stat.trend}
            />
          ))}
        </div>
      </CardContent>
      {lastUpdated && (
        <CardFooter className="text-xs text-neutral-500">
          Last updated: {timeAgo(new Date(lastUpdated))}
        </CardFooter>
      )}
    </Card>
  );
}
