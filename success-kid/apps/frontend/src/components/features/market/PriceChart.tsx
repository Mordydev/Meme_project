'use client';

import { useState, useCallback, useEffect } from 'react';
import { useMarketData } from '@/components/providers/market';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { Card } from '@/components/ui/card';
import { format } from 'date-fns';
import { usePriceData, PriceDataPoint } from '@/hooks/useMarketData';

// Time range options for the chart
const TIME_RANGES = [
  { value: '1h', label: '1H' },
  { value: '1d', label: '1D' },
  { value: '1w', label: '1W' },
  { value: '1m', label: '1M' },
  { value: '3m', label: '3M' },
  { value: '1y', label: '1Y' },
  { value: 'all', label: 'All' }
];

interface PriceChartProps {
  initialTimeRange?: string;
  showControls?: boolean;
  height?: number | string;
  className?: string;
}

export default function PriceChart({
  initialTimeRange = '1d',
  showControls = true,
  height = 400,
  className = ''
}: PriceChartProps) {
  const [timeRange, setTimeRange] = useState<string>(initialTimeRange);
  const { data, isLoading, error } = usePriceData(timeRange);
  const { formatPrice } = useMarketData();
  
  // Format date based on time range
  const formatDate = useCallback((timestamp: number) => {
    switch (timeRange) {
      case '1h':
        return format(new Date(timestamp), 'HH:mm');
      case '1d':
        return format(new Date(timestamp), 'HH:mm');
      case '1w':
        return format(new Date(timestamp), 'E');
      case '1m':
      case '3m':
        return format(new Date(timestamp), 'MMM d');
      case '1y':
      case 'all':
        return format(new Date(timestamp), 'MMM yyyy');
      default:
        return format(new Date(timestamp), 'MMM d');
    }
  }, [timeRange]);
  
  // Custom tooltip component for the chart
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded shadow-lg">
          <p className="text-gray-600 dark:text-gray-300 text-sm">
            {format(new Date(label), 'PPp')}
          </p>
          <p className="font-medium text-primary">
            Price: ${formatPrice(payload[0].value)}
          </p>
          {payload[1] && (
            <p className="text-gray-600 dark:text-gray-300">
              Volume: {new Intl.NumberFormat('en-US').format(payload[1].value)}
            </p>
          )}
        </div>
      );
    }
    return null;
  };
  
  if (error) {
    return (
      <Card className={`p-4 ${className}`}>
        <div className="flex items-center justify-center h-64">
          <p className="text-red-500">Error loading price data. Please try again later.</p>
        </div>
      </Card>
    );
  }
  
  return (
    <Card className={`p-4 ${className}`}>
      <div className="flex flex-col h-full">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-xl font-bold">SKC Price Chart</h2>
            {data?.data && (
              <div className="flex items-center mt-1">
                <span className="text-2xl font-bold mr-2">
                  ${formatPrice(data.data.basePrice)}
                </span>
                <span className={`text-sm font-medium ${data.data.priceChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {data.data.priceChange >= 0 ? '+' : ''}{formatPrice(data.data.priceChange)} ({data.data.priceChangePercent.toFixed(2)}%)
                </span>
              </div>
            )}
          </div>
          
          {showControls && (
            <div className="flex space-x-1">
              {TIME_RANGES.map((range) => (
                <button
                  key={range.value}
                  onClick={() => setTimeRange(range.value)}
                  className={`px-3 py-1 text-sm rounded ${
                    timeRange === range.value
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  {range.label}
                </button>
              ))}
            </div>
          )}
        </div>
        
        <div className="flex-grow" style={{ minHeight: typeof height === 'number' ? `${height}px` : height }}>
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : data?.data ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={data.data.prices}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1E88E5" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#1E88E5" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4CAF50" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#4CAF50" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="timestamp"
                  tickFormatter={formatDate}
                  minTickGap={30}
                  tick={{ fontSize: 12 }}
                />
                <YAxis
                  domain={['auto', 'auto']}
                  tickFormatter={(value) => `$${formatPrice(value)}`}
                  tick={{ fontSize: 12 }}
                  width={60}
                  orientation="right"
                  yAxisId="price"
                />
                <YAxis
                  dataKey="volume"
                  domain={[0, 'auto']}
                  yAxisId="volume"
                  orientation="left"
                  tickFormatter={(value) => `${value / 1000}K`}
                  tick={{ fontSize: 12 }}
                  width={50}
                  hide={timeRange === '1h'} // Hide volume for 1h chart
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="price"
                  stroke="#1E88E5"
                  fillOpacity={1}
                  fill="url(#colorPrice)"
                  yAxisId="price"
                  name="Price"
                />
                {timeRange !== '1h' && (
                  <Area
                    type="monotone"
                    dataKey="volume"
                    stroke="#4CAF50"
                    fillOpacity={1}
                    fill="url(#colorVolume)"
                    yAxisId="volume"
                    name="Volume"
                  />
                )}
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p>No price data available</p>
            </div>
          )}
        </div>
        
        <div className="mt-2 text-xs text-gray-500 text-right">
          Last updated: {data?.data?.lastUpdated ? format(new Date(data.data.lastUpdated), 'PPp') : 'Loading...'}
        </div>
      </div>
    </Card>
  );
}
