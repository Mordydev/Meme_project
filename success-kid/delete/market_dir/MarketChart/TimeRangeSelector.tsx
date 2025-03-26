'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface TimeRangeSelectorProps {
  timeRanges: string[];
  activeRange: string;
  onChange: (range: string) => void;
  className?: string;
}

/**
 * TimeRangeSelector Component
 * 
 * Allows users to select different time periods for the price chart.
 */
export default function TimeRangeSelector({ 
  timeRanges, 
  activeRange, 
  onChange,
  className 
}: TimeRangeSelectorProps) {
  // Format time range for display
  const formatTimeRange = (range: string): string => {
    switch (range) {
      case '1h': return '1H';
      case '24h': return '24H';
      case '7d': return '7D';
      case '30d': return '30D';
      case '90d': return '90D';
      case '1y': return '1Y';
      case 'all': return 'ALL';
      default: return range.toUpperCase();
    }
  };

  return (
    <div 
      className={cn(
        "inline-flex items-center rounded-md border border-neutral-200 p-1 dark:border-neutral-800",
        className
      )}
    >
      {timeRanges.map((range) => (
        <button
          key={range}
          className={cn(
            "px-2 py-1 text-xs font-medium rounded-sm transition-colors",
            activeRange === range
              ? "bg-primary text-white"
              : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:text-white dark:hover:bg-neutral-800"
          )}
          onClick={() => onChange(range)}
        >
          {formatTimeRange(range)}
        </button>
      ))}
    </div>
  );
}
