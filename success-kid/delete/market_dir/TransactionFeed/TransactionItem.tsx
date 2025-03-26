'use client';

import React from 'react';
import { MarketTransaction } from '@/types';
import { formatCurrency, formatWalletAddress, formatRelativeTime } from '@/lib/format';

interface TransactionItemProps {
  transaction: MarketTransaction;
  onClick: () => void;
  className?: string;
}

/**
 * TransactionItem Component
 * 
 * Displays a single transaction in the transaction list.
 */
export default function TransactionItem({ 
  transaction, 
  onClick,
  className 
}: TransactionItemProps) {
  // Determine transaction icon and color
  const getTransactionIcon = () => {
    switch (transaction.type) {
      case 'buy':
        return 'B';
      case 'sell':
        return 'S';
      case 'transfer':
        return 'T';
      default:
        return '?';
    }
  };
  
  const getTransactionColor = () => {
    switch (transaction.type) {
      case 'buy':
        return 'bg-accent-100 text-accent-800';
      case 'sell':
        return 'bg-alert-100 text-alert-800';
      case 'transfer':
        return 'bg-primary-100 text-primary-800';
      default:
        return 'bg-neutral-100 text-neutral-800';
    }
  };
  
  const getTransactionLabel = () => {
    switch (transaction.type) {
      case 'buy':
        return 'Buy';
      case 'sell':
        return 'Sell';
      case 'transfer':
        return 'Transfer';
      default:
        return 'Unknown';
    }
  };

  return (
    <tr 
      onClick={onClick} 
      className={`hover:bg-neutral-50 dark:hover:bg-neutral-700 cursor-pointer transition-colors ${className || ''}`}
    >
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${getTransactionColor()}`}>
            {getTransactionIcon()}
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-neutral-900 dark:text-white">
              {getTransactionLabel()}
            </div>
            <div className="text-xs text-neutral-500 dark:text-neutral-400">
              {formatWalletAddress(transaction.fromAddress)}
            </div>
          </div>
        </div>
      </td>
      
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-neutral-900 dark:text-white">
          {transaction.amount.toFixed(0)} SKC
        </div>
        {transaction.value && (
          <div className="text-xs text-neutral-500 dark:text-neutral-400">
            {formatCurrency(transaction.value)}
          </div>
        )}
      </td>
      
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-neutral-900 dark:text-white">
          {transaction.price ? formatCurrency(transaction.price) : '-'}
        </div>
      </td>
      
      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500 dark:text-neutral-400">
        {formatRelativeTime(transaction.timestamp)}
      </td>
    </tr>
  );
}
