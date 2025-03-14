'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TransactionStatus } from './TransactionStatus';

interface Transaction {
  transactionId: string;
  pointsAmount: number;
  tokenAmount: number;
  recipientAddress: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: string;
  completedAt?: string;
  transactionHash?: string;
}

interface RedemptionHistoryProps {
  userId: string;
  limit?: number;
  onItemClick?: (id: string) => void;
  className?: string;
}

export const RedemptionHistory: React.FC<RedemptionHistoryProps> = ({
  userId,
  limit = 5,
  onItemClick,
  className,
}) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const [transactions, setTransactions] = useState<Transaction[]>([
    // Mock transactions for demonstration
    {
      transactionId: 'tx_1',
      pointsAmount: 5000,
      tokenAmount: 50,
      recipientAddress: '8YLKoCZcWk79yVMfnD8VnYNd5KwJRPGUTZiJTTCBYbAp',
      status: 'completed',
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      completedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000 + 15 * 60 * 1000).toISOString(),
      transactionHash: '4qL9pWzD6RbJKFGvTfQnAZ5uXr3vNP5BnmKRwxJVdYtP8DgSJs2ZARXLKJe1RYqHnVhymgrD76iucN2N6xFUymAP',
    },
    {
      transactionId: 'tx_2',
      pointsAmount: 2500,
      tokenAmount: 25,
      recipientAddress: '8YLKoCZcWk79yVMfnD8VnYNd5KwJRPGUTZiJTTCBYbAp',
      status: 'completed',
      createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
      completedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000 + 20 * 60 * 1000).toISOString(),
      transactionHash: '3xR7vKpC4WjXKDBSEedrGQNaqzQXfZJnRGpSKQLxmLPGbpQ4AZ8QJTkVMBQpnqoK1bHUGEWjvYKGNMoFRZtPrw5d',
    },
    {
      transactionId: 'tx_3',
      pointsAmount: 1000,
      tokenAmount: 10,
      recipientAddress: '8YLKoCZcWk79yVMfnD8VnYNd5KwJRPGUTZiJTTCBYbAp',
      status: 'processing',
      createdAt: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
    },
  ]);
  
  // Toggle transaction details expansion
  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
    if (onItemClick) onItemClick(id);
  };
  
  // Format wallet address for display
  const formatWalletAddress = (address: string): string => {
    if (address.length <= 12) return address;
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };
  
  // Format date for display
  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };
  
  // Get status badge styling
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-success-100 text-success-700';
      case 'processing':
        return 'bg-primary-100 text-primary-700';
      case 'pending':
        return 'bg-neutral-100 text-neutral-700';
      case 'failed':
        return 'bg-alert-100 text-alert-700';
      default:
        return 'bg-neutral-100 text-neutral-700';
    }
  };
  
  // Apply filter to transactions
  const filteredTransactions = filter === 'all'
    ? transactions
    : transactions.filter(t => t.status === filter);
  
  // Load more transactions
  const handleLoadMore = () => {
    setIsLoading(true);
    
    // This would be a real API call in production
    // Simulate API call with timeout
    setTimeout(() => {
      // Add more mock transactions
      setTransactions([
        ...transactions,
        {
          transactionId: `tx_${transactions.length + 1}`,
          pointsAmount: 3000,
          tokenAmount: 30,
          recipientAddress: '8YLKoCZcWk79yVMfnD8VnYNd5KwJRPGUTZiJTTCBYbAp',
          status: 'completed',
          createdAt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
          completedAt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000 + 10 * 60 * 1000).toISOString(),
          transactionHash: '2xR7vKpC4WjXKDBSEedrGQNaqzQXfZJnRGpSKQLxmLPGbpQ4AZ8QJTkVMBQpnqoK1bHUGEWjvYKGNMoFRZtPrw5d',
        },
        {
          transactionId: `tx_${transactions.length + 2}`,
          pointsAmount: 1500,
          tokenAmount: 15,
          recipientAddress: '8YLKoCZcWk79yVMfnD8VnYNd5KwJRPGUTZiJTTCBYbAp',
          status: 'failed',
          createdAt: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString(),
        },
      ]);
      
      setIsLoading(false);
    }, 1000);
  };
  
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Redemption History</CardTitle>
        <CardDescription>
          Track your past and pending token redemptions
        </CardDescription>
      </CardHeader>
      
      <CardContent className="p-0">
        {/* Filter tabs */}
        <div className="flex border-b border-neutral-200">
          {['all', 'pending', 'processing', 'completed', 'failed'].map((status) => (
            <button
              key={status}
              className={`px-4 py-3 text-sm font-medium ${
                filter === status
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
              onClick={() => setFilter(status)}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
        
        {/* Transactions list */}
        {filteredTransactions.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-neutral-500">No transactions found</p>
          </div>
        ) : (
          <div className="divide-y divide-neutral-200">
            {filteredTransactions.map((transaction) => (
              <div key={transaction.transactionId} className="px-6 py-4">
                <div 
                  className="flex justify-between items-start cursor-pointer"
                  onClick={() => toggleExpand(transaction.transactionId)}
                >
                  <div className="flex items-start space-x-3">
                    <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                      transaction.status === 'completed'
                        ? 'bg-success-100 text-success-500'
                        : transaction.status === 'failed'
                        ? 'bg-alert-100 text-alert-500'
                        : transaction.status === 'processing'
                        ? 'bg-primary-100 text-primary-500'
                        : 'bg-neutral-100 text-neutral-500'
                    }`}>
                      {transaction.status === 'completed' ? (
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                      ) : transaction.status === 'failed' ? (
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="18" y1="6" x2="6" y2="18"></line>
                          <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                      ) : (
                        <div className="w-5 h-5 border-3 border-current border-t-transparent rounded-full animate-spin"></div>
                      )}
                    </div>
                    
                    <div>
                      <div className="font-medium">{transaction.pointsAmount} SP → {transaction.tokenAmount} SKC</div>
                      <div className="flex mt-1 text-sm text-neutral-500">
                        <span className="mr-2">{formatDate(transaction.createdAt)}</span>
                        <span className={`px-1.5 py-0.5 text-xs rounded-full ${getStatusBadge(transaction.status)}`}>
                          {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <button 
                      className="text-neutral-400 hover:text-neutral-600"
                      aria-label="Toggle details"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className={`transform transition-transform ${expandedId === transaction.transactionId ? 'rotate-180' : ''}`}
                      >
                        <polyline points="6 9 12 15 18 9"></polyline>
                      </svg>
                    </button>
                  </div>
                </div>
                
                {/* Expanded details */}
                {expandedId === transaction.transactionId && (
                  <div className="mt-4 pt-4 border-t border-neutral-100">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-neutral-500">Transaction ID:</span>
                          <span className="font-medium">{transaction.transactionId}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-neutral-500">Wallet Address:</span>
                          <span className="font-medium">{formatWalletAddress(transaction.recipientAddress)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-neutral-500">Created At:</span>
                          <span className="font-medium">{formatDate(transaction.createdAt)}</span>
                        </div>
                        {transaction.completedAt && (
                          <div className="flex justify-between text-sm">
                            <span className="text-neutral-500">Completed At:</span>
                            <span className="font-medium">{formatDate(transaction.completedAt)}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-neutral-500">Points Amount:</span>
                          <span className="font-medium">{transaction.pointsAmount} SP</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-neutral-500">Token Amount:</span>
                          <span className="font-medium">{transaction.tokenAmount} SKC</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-neutral-500">Status:</span>
                          <span className={`font-medium ${
                            transaction.status === 'completed'
                              ? 'text-success-700'
                              : transaction.status === 'failed'
                              ? 'text-alert-700'
                              : transaction.status === 'processing'
                              ? 'text-primary-700'
                              : 'text-neutral-700'
                          }`}>
                            {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                          </span>
                        </div>
                        {transaction.transactionHash && (
                          <div className="flex justify-between text-sm">
                            <span className="text-neutral-500">Transaction Hash:</span>
                            <a
                              href={`https://solscan.io/tx/${transaction.transactionHash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-medium text-primary hover:underline"
                            >
                              View on Explorer
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        
        {/* Load more button */}
        {filteredTransactions.length >= limit && (
          <div className="p-4 text-center">
            <Button
              variant="outline"
              isLoading={isLoading}
              onClick={handleLoadMore}
            >
              Load More
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
