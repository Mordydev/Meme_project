'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { usePointsStore } from '@/store/usePointsStore';
import { timeAgo, formatDate } from '@/lib/utils';
import { motion } from 'framer-motion';

interface RecentTransactionsProps {
  limit?: number;
  showViewAll?: boolean;
  showFilters?: boolean;
}

type TransactionFilter = {
  type: 'all' | 'earned' | 'spent';
  dateRange: 'all' | 'today' | 'week' | 'month';
  source: string | null;
}

/**
 * Component to display recent points transactions with optional filtering
 */
export function RecentTransactions({ 
  limit = 10,
  showViewAll = false,
  showFilters = false
}: RecentTransactionsProps) {
  const { transactions } = usePointsStore();
  const [expanded, setExpanded] = useState(false);
  const [filter, setFilter] = useState<TransactionFilter>({
    type: 'all',
    dateRange: 'all',
    source: null
  });
  
  // Extract available transaction sources
  const sources = useMemo(() => {
    const sourceSet = new Set<string>();
    transactions.forEach(tx => sourceSet.add(tx.source));
    return Array.from(sourceSet);
  }, [transactions]);
  
  // Apply filters to transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      // Filter by type
      if (filter.type === 'earned' && tx.amount <= 0) return false;
      if (filter.type === 'spent' && tx.amount >= 0) return false;
      
      // Filter by source
      if (filter.source && tx.source !== filter.source) return false;
      
      // Filter by date range
      if (filter.dateRange !== 'all') {
        const txDate = new Date(tx.timestamp);
        const now = new Date();
        
        if (filter.dateRange === 'today') {
          return txDate.toDateString() === now.toDateString();
        }
        
        if (filter.dateRange === 'week') {
          const weekAgo = new Date();
          weekAgo.setDate(now.getDate() - 7);
          return txDate >= weekAgo;
        }
        
        if (filter.dateRange === 'month') {
          const monthAgo = new Date();
          monthAgo.setMonth(now.getMonth() - 1);
          return txDate >= monthAgo;
        }
      }
      
      return true;
    });
  }, [transactions, filter]);
  
  // Limit the number of transactions to display unless expanded
  const displayTransactions = useMemo(() => {
    return expanded 
      ? filteredTransactions 
      : filteredTransactions.slice(0, limit);
  }, [filteredTransactions, expanded, limit]);
  
  // Format category name for display
  const formatCategory = (category: string) => {
    return category
      .replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };
  
  // Get icon for transaction source
  const getTransactionIcon = (source: string) => {
    const icons: Record<string, React.ReactNode> = {
      content_creation: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      ),
      comment: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      ),
      daily_login: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      referral: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
      achievement: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
        </svg>
      ),
      redemption: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
      )
    };
    
    return icons[source] || (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    );
  };
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle>Recent Transactions</CardTitle>
          {showViewAll && displayTransactions.length < filteredTransactions.length && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-sm font-medium text-primary hover:underline"
            >
              {expanded ? 'Show Less' : 'View All'}
            </button>
          )}
        </div>
      </CardHeader>
      
      {showFilters && (
        <div className="border-b border-gray-100 px-6 py-3">
          <div className="flex flex-wrap gap-2">
            {/* Transaction type filter */}
            <div className="flex items-center rounded-lg border bg-background p-1 text-xs">
              <button
                onClick={() => setFilter(f => ({ ...f, type: 'all' }))}
                className={`rounded-md px-2 py-1 ${
                  filter.type === 'all' 
                    ? 'bg-primary text-white' 
                    : 'hover:bg-gray-100'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter(f => ({ ...f, type: 'earned' }))}
                className={`rounded-md px-2 py-1 ${
                  filter.type === 'earned' 
                    ? 'bg-primary text-white' 
                    : 'hover:bg-gray-100'
                }`}
              >
                Earned
              </button>
              <button
                onClick={() => setFilter(f => ({ ...f, type: 'spent' }))}
                className={`rounded-md px-2 py-1 ${
                  filter.type === 'spent' 
                    ? 'bg-primary text-white' 
                    : 'hover:bg-gray-100'
                }`}
              >
                Spent
              </button>
            </div>
            
            {/* Date range filter */}
            <div className="flex items-center rounded-lg border bg-background p-1 text-xs">
              <button
                onClick={() => setFilter(f => ({ ...f, dateRange: 'all' }))}
                className={`rounded-md px-2 py-1 ${
                  filter.dateRange === 'all' 
                    ? 'bg-primary text-white' 
                    : 'hover:bg-gray-100'
                }`}
              >
                All Time
              </button>
              <button
                onClick={() => setFilter(f => ({ ...f, dateRange: 'today' }))}
                className={`rounded-md px-2 py-1 ${
                  filter.dateRange === 'today' 
                    ? 'bg-primary text-white' 
                    : 'hover:bg-gray-100'
                }`}
              >
                Today
              </button>
              <button
                onClick={() => setFilter(f => ({ ...f, dateRange: 'week' }))}
                className={`rounded-md px-2 py-1 ${
                  filter.dateRange === 'week' 
                    ? 'bg-primary text-white' 
                    : 'hover:bg-gray-100'
                }`}
              >
                This Week
              </button>
              <button
                onClick={() => setFilter(f => ({ ...f, dateRange: 'month' }))}
                className={`rounded-md px-2 py-1 ${
                  filter.dateRange === 'month' 
                    ? 'bg-primary text-white' 
                    : 'hover:bg-gray-100'
                }`}
              >
                This Month
              </button>
            </div>
            
            {/* Source filter */}
            <select
              value={filter.source || ''}
              onChange={(e) => setFilter(f => ({ 
                ...f, 
                source: e.target.value === '' ? null : e.target.value 
              }))}
              className="h-8 rounded-lg border bg-background px-2 py-1 text-xs"
            >
              <option value="">All Sources</option>
              {sources.map(source => (
                <option key={source} value={source}>
                  {formatCategory(source)}
                </option>
              ))}
            </select>
            
            {/* Reset filters */}
            {(filter.type !== 'all' || filter.dateRange !== 'all' || filter.source !== null) && (
              <button
                onClick={() => setFilter({ type: 'all', dateRange: 'all', source: null })}
                className="ml-auto text-xs text-primary hover:underline"
              >
                Reset Filters
              </button>
            )}
          </div>
        </div>
      )}
      
      <CardContent className="p-0">
        {displayTransactions.length === 0 ? (
          <div className="flex h-40 items-center justify-center text-center text-muted-foreground">
            <div>
              <p>No transactions found.</p>
              {filter.type !== 'all' || filter.dateRange !== 'all' || filter.source !== null ? (
                <p className="text-sm">Try adjusting your filters.</p>
              ) : (
                <p className="text-sm">Start engaging with the platform to earn points!</p>
              )}
            </div>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {displayTransactions.map((transaction, index) => (
              <motion.li
                key={transaction.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05, duration: 0.2 }}
                className="flex items-center justify-between p-4 hover:bg-gray-50"
              >
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full ${
                    transaction.amount > 0 ? 'bg-primary/10 text-primary' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {getTransactionIcon(transaction.source)}
                  </div>
                  <div>
                    <div className="font-medium">
                      {formatCategory(transaction.source)}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{formatDate(transaction.timestamp)}</span>
                      <span className="text-gray-300">•</span>
                      <span>{timeAgo(transaction.timestamp)}</span>
                    </div>
                  </div>
                </div>
                <div className={`font-mono font-medium ${
                  transaction.amount > 0 ? 'text-primary' : 'text-gray-500'
                }`}>
                  {transaction.amount > 0 ? '+' : ''}{transaction.amount}
                </div>
              </motion.li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
