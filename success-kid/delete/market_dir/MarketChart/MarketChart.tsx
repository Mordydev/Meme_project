'use client';

import React, { useState, useCallback } from 'react';
import { usePriceData } from '@/hooks/useMarketData';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import ChartArea from './ChartArea';
import TimeRangeSelector from './TimeRangeSelector';
import ChartTooltip from './ChartTooltip';

interface MarketChartProps {
  className?: string;
}

/**
 * MarketChart Component
 * 
 * Interactive price chart with time range selection and hover/touch tooltips.
 */
export default function MarketChart({ className }: MarketChartProps) {
  const timeRanges = ['1h', '24h', '7d', '30d', '90d', '1y', 'all'];
  const [activeTooltip, setActiveTooltip] = useState<{ price: number; timestamp: number } | null>(null);
  
  const { 
    data: priceData, 
    timeRange, 
    setTimeRange, 
    isLoading
  } = usePriceData('24h');
  
  const handleMouseMove = useCallback((dataPoint: { price: number; timestamp: number } | null) => {
    setActiveTooltip(dataPoint);
  }, []);
  
  const handleMouseLeave = useCallback(() => {
    setActiveTooltip(null);
  }, []);

  return (
    <Card className={cn("p-4", className)}>
      <div className="flex flex-col space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium">Price Chart</h3>
          <TimeRangeSelector 
            timeRanges={timeRanges}
            activeRange={timeRange}
            onChange={setTimeRange}
          />
        </div>
        
        <div className="relative h-64">
          {isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <Skeleton className="h-full w-full" />
            </div>
          ) : (
            <ChartArea 
              data={priceData} 
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
            />
          )}
          
          {activeTooltip && (
            <ChartTooltip 
              price={activeTooltip.price}
              timestamp={activeTooltip.timestamp}
              className="absolute top-0 right-0"
            />
          )}
        </div>
      </div>
    </Card>
  );
}
