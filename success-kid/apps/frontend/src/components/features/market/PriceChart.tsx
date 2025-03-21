'use client';

import { useState, useEffect } from 'react';
import { GlassCard } from '@/components/ui/optimized/GlassCard';
import { 
  CardHeader, 
  CardTitle, 
  CardContent,
  CardFooter,
  CardDescription
} from '@/components/ui/optimized/glass/card-components';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { motion } from 'framer-motion';
import { formatCurrency, formatCompactNumber } from '@/lib/utils';
import { PriceDataPoint } from '@/types';

// Since we haven't installed Recharts, we'll create a simplified chart component
// In a real implementation, you would use a proper charting library like Recharts

interface PriceChartProps {
  data: PriceDataPoint[];
  currentPrice: number;
  priceChange: number;
  priceChangePercent: number;
  isLoading?: boolean;
  onTimeRangeChange?: (range: string) => void;
  className?: string;
}

export function PriceChart({
  data,
  currentPrice,
  priceChange,
  priceChangePercent,
  isLoading = false,
  onTimeRangeChange,
  className = '',
}: PriceChartProps) {
  const [activeRange, setActiveRange] = useState('1d');
  
  useEffect(() => {
    if (onTimeRangeChange) {
      onTimeRangeChange(activeRange);
    }
  }, [activeRange, onTimeRangeChange]);
  
  // Handle tab change
  const handleRangeChange = (value: string) => {
    setActiveRange(value);
  };
  
  // Format price display
  const formattedPrice = currentPrice < 0.01 
    ? currentPrice.toFixed(8)
    : currentPrice.toFixed(4);
    
  // Determine price change color
  const isPriceUp = priceChange >= 0;
  const priceChangeColor = isPriceUp ? 'text-accent-500' : 'text-alert-500';
  
  // Simplified chart rendering
  const renderChart = () => {
    if (data.length === 0) {
      return (
        <div className="flex h-64 items-center justify-center">
          <p className="text-neutral-500">No data available</p>
        </div>
      );
    }
    
    // Find min and max values for scaling
    const prices = data.map(d => d.price);
    const maxPrice = Math.max(...prices);
    const minPrice = Math.min(...prices);
    const range = maxPrice - minPrice;
    const padding = range * 0.1; // 10% padding
    
    // Normalize price to chart height
    const normalizePrice = (price: number) => {
      return 100 - ((price - (minPrice - padding)) / ((maxPrice + padding) - (minPrice - padding)) * 100);
    };
    
    // Create path for the chart line
    const points = data.map((d, i) => {
      const x = (i / (data.length - 1)) * 100;
      const y = normalizePrice(d.price);
      return `${x},${y}`;
    });
    
    const pathData = `M${points.join(' L')}`;
    
    // Calculate gradient color based on price change
    const gradientColor = isPriceUp ? 'accent' : 'alert';
    
    return (
      <div className="relative h-64 w-full overflow-hidden">
        <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
          {/* Gradient background */}
          <defs>
            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={`var(--color-${gradientColor}-500)`} stopOpacity="0.2" />
              <stop offset="100%" stopColor={`var(--color-${gradientColor}-500)`} stopOpacity="0" />
            </linearGradient>
          </defs>
          
          {/* Area fill */}
          <path
            d={`${pathData} L100,100 L0,100 Z`}
            fill="url(#chartGradient)"
            stroke="none"
          />
          
          {/* Line */}
          <path
            d={pathData}
            fill="none"
            stroke={`var(--color-${gradientColor}-500)`}
            strokeWidth="1"
          />
          
          {/* Current price indicator */}
          <circle
            cx="100"
            cy={normalizePrice(currentPrice)}
            r="1.5"
            fill={`var(--color-${gradientColor}-500)`}
          />
        </svg>
      </div>
    );
  };
  
  return (
    <GlassCard 
      className={`overflow-hidden ${className}`}
      gradientBackground={true}
      gradientBorder={true}
      borderGlow={true}
      borderGlowIntensity="strong"
      hoverEffect={true}
      shadowStyle="premium"
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="mb-1 text-2xl font-bold text-primary">SKC Price Chart</CardTitle>
            <CardDescription>Current market price with historical data</CardDescription>
          </div>
          <Tabs defaultValue={activeRange} onValueChange={handleRangeChange}>
            <TabsList className="grid grid-cols-6 sm:w-[400px]">
              <TabsTrigger value="1h">1H</TabsTrigger>
              <TabsTrigger value="1d">1D</TabsTrigger>
              <TabsTrigger value="1w">1W</TabsTrigger>
              <TabsTrigger value="1m">1M</TabsTrigger>
              <TabsTrigger value="3m">3M</TabsTrigger>
              <TabsTrigger value="1y">1Y</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex h-64 animate-pulse items-center justify-center bg-neutral-100">
            <p className="text-neutral-400">Loading price data...</p>
          </div>
        ) : (
          renderChart()
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <div>
          <div className="text-sm font-medium text-neutral-500">Current Price</div>
          <div className="text-2xl font-bold">${formattedPrice}</div>
        </div>
        <div className="text-right">
          <div className="text-sm font-medium text-neutral-500">24h Change</div>
          <div className={`flex items-center text-xl font-bold ${priceChangeColor}`}>
            <span className="mr-1">
              {isPriceUp ? '↑' : '↓'}
            </span>
            {priceChange.toFixed(8)} ({priceChangePercent.toFixed(2)}%)
          </div>
        </div>
      </CardFooter>
    </GlassCard>
  );
}
