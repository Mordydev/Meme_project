'use client';

import React from 'react';
import { ChevronRight, ArrowDownRight, ArrowUpRight, ArrowRight, RotateCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatNumber, formatDate, getValueColorClass } from '@/lib/format';
import { cn } from '@/lib/utils';
import { MarketTransaction } from '@/types';
import PerformanceCell from './PerformanceCell';

interface TransactionRowProps {
  transaction: MarketTransaction;
}

/**
 * TransactionRow Component
 * 
 * Individual transaction row in the wallet transaction table.
 */
export default function TransactionRow({ transaction }: TransactionRowProps) {
  // Get transaction icon based on type
  const getTransactionIcon = () => {
    switch (transaction.type) {
      case 'buy':
        return <ArrowDownRight className="mr-2 h-4 w-4 text-accent" />;
      case 'sell':
        return <ArrowUpRight className="mr-2 h-4 w-4 text-destructive" />;
      case 'transfer':
        return <ArrowRight className="mr-2 h-4 w-4 text-primary" />;
      case 'redemption':
        return <RotateCw className="mr-2 h-4 w-4 text-secondary" />;
      default:
        return null;
    }
  };
  
  // Get transaction badge
  const getTransactionBadge = () => {
    let variant;
    let className;
    
    switch (transaction.type) {
      case 'buy':
        variant = 'outline';
        className = 'border-accent text-accent dark:text-accent';
        break;
      case 'sell':
        variant = 'outline';
        className = 'border-destructive text-destructive dark:text-destructive';
        break;
      case 'transfer':
        variant = 'outline';
        className = 'border-primary text-primary dark:text-primary';
        break;
      case 'redemption':
        variant = 'outline';
        className = 'border-secondary text-secondary dark:text-secondary';
        break;
      default:
        variant = 'outline';
        className = '';
    }
    
    return (
      <Badge variant={variant as any} className={cn("capitalize", className)}>
        {getTransactionIcon()}
        {transaction.type}
      </Badge>
    );
  };
  
  // Calculate transaction value
  const calculateValue = () => {
    return transaction.amount * transaction.price;
  };

  return (
    <>
      {/* Date */}
      <td className="px-4 py-3">
        <div className="flex flex-col">
          <span className="text-sm font-medium">
            {formatDate(transaction.timestamp, 'short')}
          </span>
          <span className="text-xs text-neutral-500">
            {formatDate(transaction.timestamp, 'time')}
          </span>
        </div>
      </td>
      
      {/* Type */}
      <td className="px-4 py-3">
        {getTransactionBadge()}
      </td>
      
      {/* Amount */}
      <td className="px-4 py-3">
        <span className="text-sm font-medium">
          {formatNumber(transaction.amount)} SKC
        </span>
      </td>
      
      {/* Price */}
      <td className="px-4 py-3">
        <span className="text-sm font-medium">
          {formatCurrency(transaction.price)}
        </span>
      </td>
      
      {/* Value */}
      <td className="px-4 py-3">
        <span className="text-sm font-medium">
          {formatCurrency(calculateValue())}
        </span>
      </td>
      
      {/* Performance */}
      <td className="px-4 py-3">
        <PerformanceCell transaction={transaction} />
      </td>
      
      {/* View Details */}
      <td className="px-4 py-3 text-right">
        <ChevronRight className="h-4 w-4 ml-auto text-neutral-400" />
      </td>
    </>
  );
}
