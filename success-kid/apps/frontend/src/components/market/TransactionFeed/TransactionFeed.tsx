'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useTransactionFeed } from '@/hooks/useMarketData';
import { cn } from '@/lib/utils';
import TransactionList from './TransactionList';
import FilterControls from './FilterControls';
import TransactionModal from '../TransactionModal/TransactionModal';
import { MarketTransaction } from '@/types';

interface TransactionFeedProps {
  className?: string;
}

/**
 * TransactionFeed Component
 * 
 * Displays a list of recent market transactions with filtering capabilities.
 */
export default function TransactionFeed({ className }: TransactionFeedProps) {
  const [selectedTransaction, setSelectedTransaction] = useState<MarketTransaction | null>(null);
  
  const { 
    transactions, 
    isLoading, 
    filter, 
    setFilter, 
    hasMore, 
    loadMore 
  } = useTransactionFeed();
  
  const handleTransactionClick = (transaction: MarketTransaction) => {
    setSelectedTransaction(transaction);
  };
  
  const handleCloseModal = () => {
    setSelectedTransaction(null);
  };

  return (
    <>
      <Card className={cn("overflow-hidden", className)}>
        <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-medium">Recent Transactions</h3>
            <p className="text-sm text-neutral-500">Latest token transfers and market activity</p>
          </div>
          
          <FilterControls 
            activeFilter={filter} 
            onFilterChange={setFilter} 
          />
        </div>
        
        {isLoading && transactions.length === 0 ? (
          <div className="p-4">
            <Skeleton className="h-16 w-full mb-4" />
            <Skeleton className="h-16 w-full mb-4" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : (
          <TransactionList 
            transactions={transactions}
            isLoading={isLoading}
            hasMore={hasMore}
            onLoadMore={loadMore}
            onTransactionClick={handleTransactionClick}
          />
        )}
      </Card>
      
      {/* Transaction Details Modal */}
      <TransactionModal 
        transaction={selectedTransaction}
        isOpen={!!selectedTransaction}
        onClose={handleCloseModal}
      />
    </>
  );
}
