'use client';

import { Card } from '@/components/ui/card';
import { useMarketStats } from '@/hooks/useMarketData';
import { useMarketData } from '@/components/providers/market';
import { LineChart, Line, ResponsiveContainer, Tooltip } from 'recharts';
import { format } from 'date-fns';

interface MarketStatCardProps {
  label: string;
  value: string | number | JSX.Element;
  trend?: number;
  miniChart?: any[];
  tooltip?: string;
}

// Small stat card component
function MarketStatCard({
  label,
  value,
  trend,
  miniChart,
  tooltip
}: MarketStatCardProps) {
  return (
    <Card className="p-4 relative overflow-hidden">
      <div className="z-10 relative">
        <h3 className="text-sm font-medium text-gray-500" title={tooltip}>
          {label}
        </h3>
        <div className="mt-1 flex items-end justify-between">
          <p className="text-2xl font-bold">{value}</p>
          {trend !== undefined && (
            <span
              className={`text-sm font-medium ml-2 ${
                trend >= 0 ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {trend >= 0 ? '+' : ''}
              {typeof trend === 'number' ? `${trend.toFixed(2)}%` : trend}
            </span>
          )}
        </div>
      </div>
      
      {/* Mini chart in background if provided */}
      {miniChart && (
        <div className="absolute inset-0 opacity-10 z-0">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={miniChart}>
              <Line
                type="monotone"
                dataKey="value"
                stroke={trend !== undefined && trend < 0 ? '#ef4444' : '#10b981'}
                strokeWidth={2}
                dot={false}
              />
              <Tooltip content={() => null} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
}

interface MarketStatsProps {
  className?: string;
}

export default function MarketStats({ className = '' }: MarketStatsProps) {
  const { data, isLoading, error } = useMarketStats();
  const { formatNumber, formatPrice, formatPercentage } = useMarketData();
  
  // Mock chart data for stats cards
  const mockChartData = [
    { value: 100 },
    { value: 120 },
    { value: 110 },
    { value: 140 },
    { value: 130 },
    { value: 160 },
    { value: 170 },
  ];
  
  const mockChartDataNegative = [
    { value: 170 },
    { value: 160 },
    { value: 140 },
    { value: 150 },
    { value: 130 },
    { value: 120 },
    { value: 100 },
  ];
  
  if (error) {
    return (
      <div className={`grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4 ${className}`}>
        <Card className="p-4 col-span-full">
          <p className="text-red-500">Error loading market statistics. Please try again later.</p>
        </Card>
      </div>
    );
  }
  
  if (isLoading) {
    return (
      <div className={`grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4 ${className}`}>
        {[...Array(8)].map((_, i) => (
          <Card key={i} className="p-4">
            <div className="animate-pulse">
              <div className="h-2 w-16 bg-gray-200 rounded mb-2"></div>
              <div className="h-6 w-24 bg-gray-200 rounded"></div>
            </div>
          </Card>
        ))}
      </div>
    );
  }
  
  return (
    <div className={`grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4 ${className}`}>
      {data?.data && (
        <>
          <MarketStatCard
            label="Current Price"
            value={`$${formatPrice(data.data.price)}`}
            trend={data.data.priceChangePercent24h}
            miniChart={data.data.priceChangePercent24h >= 0 ? mockChartData : mockChartDataNegative}
          />
          <MarketStatCard
            label="24h Volume"
            value={`$${formatNumber(data.data.volume24h)}`}
            tooltip={`${formatNumber(data.data.volume24h / data.data.price)} SKC`}
          />
          <MarketStatCard
            label="Market Cap"
            value={`$${formatNumber(data.data.marketCap)}`}
          />
          <MarketStatCard
            label="Liquidity"
            value={`$${formatNumber(data.data.liquidity)}`}
          />
          <MarketStatCard
            label="Total Holders"
            value={formatNumber(data.data.holders)}
          />
          <MarketStatCard
            label="7d Volume"
            value={`$${formatNumber(data.data.volume7d)}`}
          />
          <MarketStatCard
            label="24h Transactions"
            value={formatNumber(data.data.trades24h)}
          />
          <MarketStatCard
            label="All-Time High"
            value={`$${formatPrice(data.data.allTimeHigh.price)}`}
            tooltip={`Reached on ${format(new Date(data.data.allTimeHigh.date), 'PPP')}`}
          />
        </>
      )}
    </div>
  );
}
