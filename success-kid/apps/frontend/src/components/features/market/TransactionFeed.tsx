'use client';

import React from 'react';
import { GlassCard } from '@/components/ui/optimized/GlassCard';
import { 
  CardHeader, 
  CardTitle, 
  CardContent
} from '@/components/ui/optimized/glass/card-components';
import { MarketTransaction } from '@/types';
import { formatCurrency } from '@/lib/utils';

interface TransactionFeedProps {
  transactions: MarketTransaction[];
  isLoading: boolean;
  className?: string;
}

export function TransactionFeed({ transactions, isLoading, className = '' }: TransactionFeedProps) {
  // Format relative time
  const formatRelativeTime = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 60) {
      return `${diffMins} min${diffMins !== 1 ? 's' : ''} ago`;
    } else {
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) {
        return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
      } else {
        const diffDays = Math.floor(diffHours / 24);
        return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
      }
    }
  };

  // Format address for display
  const formatAddress = (address: string): string => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  // Determine transaction icon and color
  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'buy':
        return (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-success-100 text-success-500">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 19V5" />
              <path d="M5 12l7-7 7 7" />
            </svg>
          </div>
        );
      case 'sell':
        return (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-alert-100 text-alert-500">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14" />
              <path d="M19 12l-7 7-7-7" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-100 text-neutral-500">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 3L21 7L17 11" />
              <path d="M21 7H13" />
              <path d="M7 21L3 17L7 13" />
              <path d="M3 17H11" />
            </svg>
          </div>
        );
    }
  };

  return (
    <GlassCard
      className={className}
      gradientBackground={true}
      borderGlow={true}
      borderGlowIntensity="low"
      shadowStyle="standard"
    >
      <CardHeader className="pb-2">
        <CardTitle>Recent Transactions</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex animate-pulse items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-neutral-200"></div>
                <div className="flex-1">
                  <div className="h-5 w-full rounded bg-neutral-200"></div>
                  <div className="mt-1 h-4 w-2/3 rounded bg-neutral-200"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {transactions.map((tx) => (
              <div 
                key={tx.hash} 
                className={`flex items-center gap-3 rounded-lg p-3 transition-colors
                  ${tx.isSignificant ? 'bg-primary-50' : 'hover:bg-neutral-50'}`}
              >
                {getTransactionIcon(tx.type)}
                
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div className="font-medium capitalize">
                      {tx.type}
                    </div>
                    <div className="text-sm text-neutral-500">
                      {formatRelativeTime(tx.timestamp)}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm text-neutral-600">
                    <div>
                      {formatAddress(tx.fromAddress)} → {formatAddress(tx.toAddress)}
                    </div>
                    <div className="font-medium">
                      {formatCurrency(tx.value || 0)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </GlassCard>
  );
}
