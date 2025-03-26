'use client';

import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { formatCurrency, formatPercentage } from '@/lib/format';
import { cn } from '@/lib/utils';
import { MarketTransaction } from '@/types';

interface PerformanceCellProps {
  transaction: MarketTransaction;
}

/**
 * PerformanceCell Component
 * 
 * Displays transaction performance metrics in the transaction table.
 */
export default function PerformanceCell({ transaction }: PerformanceCellProps) {
  // Skip for certain transaction types
  if (['transfer', 'redemption'].includes(transaction.type)) {
    return (
      <div className="flex items-center text-neutral-500">
        <Minus className="mr-1 h-4 w-4" />
        <span className="text-sm">N/A</span>
      </div>
    );
  }
  
  // Calculate performance values
  const calculatePerformance = () => {
    // For buys: (current value - purchase value) / purchase value * 100
    // For sells: (sell value - purchase value) / purchase value * 100
    const purchaseValue = transaction.amount * transaction.price;
    
    if (transaction.type === 'buy' && transaction.currentValue) {
      const performanceValue = transaction.currentValue - purchaseValue;
      const performancePercent = (performanceValue / purchaseValue) * 100;
      
      return {
        value: performanceValue,
        percent: performancePercent
      };
    } else if (transaction.type === 'sell' && transaction.purchaseValue) {
      const performanceValue = purchaseValue - transaction.purchaseValue;
      const performancePercent = (performanceValue / transaction.purchaseValue) * 100;
      
      return {
        value: performanceValue,
        percent: performancePercent
      };
    }
    
    // If we don't have the data needed
    return null;
  };
  
  const performance = calculatePerformance();
  
  // If we don't have performance data
  if (!performance) {
    return (
      <div className="flex items-center text-neutral-500">
        <Minus className="mr-1 h-4 w-4" />
        <span className="text-sm">Unknown</span>
      </div>
    );
  }
  
  // Determine color based on performance
  const isPositive = performance.value >= 0;
  const colorClass = isPositive ? 'text-accent' : 'text-destructive';
  const Icon = isPositive ? ArrowUpRight : ArrowDownRight;

  return (
    <div className={cn("flex items-center", colorClass)}>
      <Icon className="mr-1 h-4 w-4" />
      <div className="flex flex-col">
        <span className="text-sm font-medium">
          {formatCurrency(Math.abs(performance.value))}
        </span>
        <span className="text-xs">
          {isPositive ? '+' : '-'}{formatPercentage(Math.abs(performance.percent))}
        </span>
      </div>
    </div>
  );
}
