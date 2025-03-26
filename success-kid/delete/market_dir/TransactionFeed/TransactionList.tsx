'use client';

import React, { useRef, useEffect } from 'react';
import { MarketTransaction } from '@/types';
import TransactionItem from './TransactionItem';
import { Button } from '@/components/ui/button';
import { Loader } from 'lucide-react';

interface TransactionListProps {
  transactions: MarketTransaction[];
  isLoading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  onTransactionClick: (transaction: MarketTransaction) => void;
  className?: string;
}

/**
 * TransactionList Component
 * 
 * Displays the list of transactions with virtual rendering for performance.
 */
export default function TransactionList({ 
  transactions, 
  isLoading, 
  hasMore, 
  onLoadMore,
  onTransactionClick,
  className 
}: TransactionListProps) {
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  
  // Set up intersection observer for infinite scrolling
  useEffect(() => {
    if (isLoading) return;
    
    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore) {
          onLoadMore();
        }
      },
      { threshold: 0.5 }
    );
    
    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }
    
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [isLoading, hasMore, onLoadMore]);
  
  // No transactions case
  if (transactions.length === 0 && !isLoading) {
    return (
      <div className="p-8 text-center text-neutral-500">
        <p>No transactions found for the selected filter.</p>
      </div>
    );
  }

  return (
    <div className={`overflow-x-auto ${className || ''}`}>
      <table className="min-w-full divide-y divide-neutral-200 dark:divide-neutral-700">
        <thead className="bg-neutral-50 dark:bg-neutral-900">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
              Transaction
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
              Amount
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
              Price
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
              Time
            </th>
          </tr>
        </thead>
        
        <tbody className="bg-white dark:bg-neutral-800 divide-y divide-neutral-200 dark:divide-neutral-700">
          {transactions.map((transaction) => (
            <TransactionItem
              key={transaction.hash}
              transaction={transaction}
              onClick={() => onTransactionClick(transaction)}
            />
          ))}
        </tbody>
      </table>
      
      {/* Load more indicator */}
      {hasMore && (
        <div 
          ref={loadMoreRef} 
          className="p-4 flex justify-center"
        >
          {isLoading ? (
            <div className="flex items-center text-neutral-500">
              <Loader className="w-4 h-4 mr-2 animate-spin" />
              <span>Loading more transactions...</span>
            </div>
          ) : (
            <Button 
              variant="outline" 
              onClick={onLoadMore}
              className="text-sm"
            >
              Load More
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
