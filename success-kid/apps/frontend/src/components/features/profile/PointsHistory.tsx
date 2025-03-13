'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/Spinner';

interface PointsTransaction {
  id: string;
  amount: number;
  source: string;
  timestamp: Date;
  description?: string;
}

interface SourceCounts {
  [key: string]: {
    count: number;
    total: number;
  };
}

export interface PointsHistoryProps {
  userId: string;
  className?: string;
}

/**
 * PointsHistory - Display points transactions and analytics
 * 
 * @component
 * @param userId - User identifier for fetching points history
 * @param className - Additional CSS classes
 */
export function PointsHistory({
  userId,
  className
}: PointsHistoryProps) {
  const [transactions, setTransactions] = useState<PointsTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeView, setActiveView] = useState<'all' | 'analytics'>('all');
  const [hasMore, setHasMore] = useState(false);
  
  // Calculate statistics from transactions
  const calculateStats = (transactions: PointsTransaction[]) => {
    // Total earned
    const totalEarned = transactions
      .filter(t => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0);
    
    // By source
    const sourceCountsMap = transactions.reduce((acc, transaction) => {
      const source = formatSourceName(transaction.source);
      
      if (!acc[source]) {
        acc[source] = { count: 0, total: 0 };
      }
      
      acc[source].count += 1;
      acc[source].total += transaction.amount;
      
      return acc;
    }, {} as SourceCounts);
    
    // Convert to array and sort by total
    const sourceCounts = Object.entries(sourceCountsMap)
      .map(([name, data]) => ({
        name,
        count: data.count,
        total: data.total
      }))
      .sort((a, b) => b.total - a.total);
    
    return {
      totalEarned,
      sourceCounts
    };
  };
  
  // Format source names for display
  const formatSourceName = (source: string) => {
    return source
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };
  
  // Format relative time (e.g., "2 days ago")
  const formatRelativeTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffDays > 0) {
      return diffDays === 1 ? 'yesterday' : `${diffDays} days ago`;
    }
    if (diffHours > 0) {
      return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
    }
    if (diffMins > 0) {
      return `${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'} ago`;
    }
    return 'just now';
  };
  
  // Fetch transactions (simulated)
  const fetchTransactions = async () => {
    setIsLoading(true);
    
    try {
      // In a real implementation, this would be an API call
      // Simulating network request
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Mock data
      const mockTransactions: PointsTransaction[] = [
        {
          id: 'tx_1',
          amount: 100,
          source: 'daily_login',
          timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
          description: 'Daily login bonus'
        },
        {
          id: 'tx_2',
          amount: 250,
          source: 'content_creation',
          timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
          description: 'Created a new post'
        },
        {
          id: 'tx_3',
          amount: 50,
          source: 'comment',
          timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
          description: 'Comment on "Introduction to Success Points"'
        },
        {
          id: 'tx_4',
          amount: 500,
          source: 'achievement',
          timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
          description: 'Unlocked "Content Creator" achievement'
        },
        {
          id: 'tx_5',
          amount: 100,
          source: 'daily_login',
          timestamp: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), // 6 days ago
          description: 'Daily login bonus'
        },
        {
          id: 'tx_6',
          amount: 75,
          source: 'upvotes_received',
          timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
          description: 'Received 15 upvotes on your content'
        },
        {
          id: 'tx_7',
          amount: -500,
          source: 'token_redemption',
          timestamp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
          description: 'Redeemed 5 SKC tokens'
        }
      ];
      
      setTransactions(mockTransactions);
      setHasMore(mockTransactions.length >= 10); // Simulating pagination
    } catch (error) {
      console.error('Error fetching points history:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Load more transactions
  const handleLoadMore = () => {
    // In a real implementation, this would load the next page of transactions
    console.log('Load more transactions');
  };
  
  // Switch between views
  const handleViewChange = (view: 'all' | 'analytics') => {
    setActiveView(view);
  };
  
  // Load transactions on mount
  useEffect(() => {
    fetchTransactions();
  }, []);
  
  // Calculate statistics
  const stats = calculateStats(transactions);
  
  return (
    <div className={cn("space-y-6", className)}>
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Points History</h2>
        
        <div className="flex space-x-2">
          <Button
            variant={activeView === 'all' ? "default" : "outline"}
            size="sm"
            onClick={() => handleViewChange('all')}
          >
            All Transactions
          </Button>
          <Button
            variant={activeView === 'analytics' ? "default" : "outline"}
            size="sm"
            onClick={() => handleViewChange('analytics')}
          >
            Analytics
          </Button>
        </div>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : transactions.length === 0 ? (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium">No points history</h3>
          <p className="text-muted-foreground mt-2">
            No points transactions found for this user.
          </p>
        </div>
      ) : activeView === 'all' ? (
        // All transactions view
        <div className="space-y-4">
          {transactions.map(transaction => (
            <TransactionCard key={transaction.id} transaction={transaction} />
          ))}
          
          {hasMore && (
            <div className="flex justify-center mt-6">
              <Button
                variant="outline"
                onClick={handleLoadMore}
                disabled={isLoading}
              >
                {isLoading ? <Spinner size="sm" className="mr-2" /> : null}
                Load More
              </Button>
            </div>
          )}
        </div>
      ) : (
        // Analytics view
        <div className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold mb-4">Summary</h3>
              <div className="flex flex-wrap gap-8">
                <div>
                  <p className="text-2xl font-bold text-primary">
                    {stats.totalEarned.toLocaleString()}
                  </p>
                  <p className="text-sm text-muted-foreground">Total Points Earned</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-primary">
                    {transactions.length.toLocaleString()}
                  </p>
                  <p className="text-sm text-muted-foreground">Total Transactions</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-primary">
                    {stats.sourceCounts.length.toLocaleString()}
                  </p>
                  <p className="text-sm text-muted-foreground">Earning Sources</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold mb-4">Points by Source</h3>
              <div className="space-y-4">
                {stats.sourceCounts.map(source => (
                  <div key={source.name} className="flex items-center">
                    <div className="flex-1">
                      <p className="font-medium">{source.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {source.count} {source.count === 1 ? 'transaction' : 'transactions'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">
                        {source.total > 0 ? '+' : ''}{source.total.toLocaleString()}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {(source.total / stats.totalEarned * 100).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

interface TransactionCardProps {
  transaction: PointsTransaction;
  className?: string;
}

/**
 * TransactionCard - Individual transaction display
 * 
 * @component
 * @param transaction - Transaction data
 * @param className - Additional CSS classes
 */
function TransactionCard({ transaction, className }: TransactionCardProps) {
  // Format source for display
  const formattedSource = transaction.source
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
  
  // Determine color based on amount
  const amountColor = transaction.amount > 0 
    ? 'text-success' 
    : transaction.amount < 0 
      ? 'text-alert' 
      : 'text-foreground';
  
  // Format amount with sign
  const formattedAmount = transaction.amount > 0 
    ? `+${transaction.amount}` 
    : transaction.amount.toString();
  
  return (
    <Card className={cn("overflow-hidden transition-all", className)}>
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center">
              <h4 className="font-medium">{formattedSource}</h4>
              <span className="text-xs text-muted-foreground ml-2">
                {formatRelativeTime(new Date(transaction.timestamp))}
              </span>
            </div>
            
            {transaction.description && (
              <p className="text-sm text-muted-foreground mt-1">
                {transaction.description}
              </p>
            )}
          </div>
          
          <span className={cn("text-lg font-bold", amountColor)}>
            {formattedAmount}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

function formatRelativeTime(date: Date) {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffDays > 0) {
    return diffDays === 1 ? 'yesterday' : `${diffDays} days ago`;
  }
  if (diffHours > 0) {
    return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
  }
  if (diffMins > 0) {
    return `${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'} ago`;
  }
  return 'just now';
}
