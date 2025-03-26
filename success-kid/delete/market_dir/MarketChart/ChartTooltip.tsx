'use client';

import React from 'react';
import { formatCurrency, formatDate } from '@/lib/format';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface ChartTooltipProps {
  price: number;
  timestamp: number;
  className?: string;
}

/**
 * ChartTooltip Component
 * 
 * Custom tooltip for the chart that shows price and time information.
 */
export default function ChartTooltip({ price, timestamp, className }: ChartTooltipProps) {
  return (
    <Card 
      className={cn(
        "p-2 shadow-md text-sm flex flex-col",
        className
      )}
    >
      <div className="font-semibold">{formatCurrency(price)}</div>
      <div className="text-xs text-neutral-500">
        {formatDate(new Date(timestamp), {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })}
      </div>
    </Card>
  );
}
