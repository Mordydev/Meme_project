'use client';

import React from 'react';
import { formatCurrency, formatPercentage } from '@/lib/format';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface PriceChangeProps {
  change: number;
  changePercent: number;
  className?: string;
}

/**
 * PriceChange Component
 * 
 * Displays price change information with appropriate formatting and visual indicators.
 */
export default function PriceChange({ change, changePercent, className }: PriceChangeProps) {
  const isPositive = changePercent >= 0;
  const colorClass = isPositive ? 'text-accent-500' : 'text-alert-500';
  const Icon = isPositive ? TrendingUp : TrendingDown;
  
  return (
    <div className={`flex items-center ${colorClass} ${className || ''}`}>
      <Icon className="w-3 h-3 mr-1" />
      <span>
        {formatPercentage(changePercent)} ({formatCurrency(change)})
      </span>
    </div>
  );
}
