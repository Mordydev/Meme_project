'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { formatWalletAddress, getExplorerUrl } from '@/lib/wallet-utils';
import { useTransactionFeed } from '@/hooks/useMarketData';
import { format, formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

interface TransactionCardProps {
  hash: string;
  type: 'in' | 'out' | 'swap';
  amount: number;
  timestamp: string;
  fromAddress?: string;
  toAddress?: string;
  status: 'confirmed' | 'pending';
  usdValue?: number;
  isNew?: boolean;
}

// Individual transaction card component
function TransactionCard({
  hash,
  type,
  amount,
  timestamp,
  fromAddress,
  toAddress,
  status,
  usdValue,
  isNew = false
}: TransactionCardProps) {
  const [expanded, setExpanded] = useState(false);
  
  const formatAddress = useCallback((address?: string) => {
    if (!address) return 'Unknown Address';
    return formatWalletAddress(address);
  }, []);
  
  return (
    <motion.div
      initial={isNew ? { opacity: 0, y: -20 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className={`
        p-4 border rounded-lg mb-3 
        ${isNew ? 'border-primary' : 'border-gray-200'}
        ${status === 'pending' ? 'bg-neutral-50' : ''}
      `}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
          <div className={`
            mt-1 w-3 h-3 rounded-full flex-shrink-0
            ${type === 'in' ? 'bg-success' : type === 'out' ? 'bg-neutral-500' : 'bg-primary'}
          `}></div>
          
          <div>
            <div className="flex items-center">
              <h3 className="font-medium">
                {type === 'in' ? 'Received' : type === 'out' ? 'Sent' : 'Swapped'}
              </h3>
              {status === 'pending' && (
                <Badge variant="outline" className="ml-2 text-xs">Pending</Badge>
              )}
              {isNew && (
                <Badge variant="default" className="ml-2 text-xs bg-primary">New</Badge>
              )}
            </div>
            
            <div className="text-sm text-neutral-500 mt-1">
              {new Date(timestamp).toLocaleString()}
            </div>
            
            <div className="mt-1 text-sm">
              {fromAddress && (
                <div>From: {formatAddress(fromAddress)}</div>
              )}
              {toAddress && (
                <div>To: {formatAddress(toAddress)}</div>
              )}
            </div>
            
            {expanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-3 text-xs"
              >
                <div className="flex items-center mb-1">
                  <span className="text-neutral-500 mr-1">Transaction ID:</span>
                  <a
                    href={getExplorerUrl(hash, 'transaction')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline truncate max-w-[200px]"
                    title={hash}
                  >
                    {hash.slice(0, 10)}...{hash.slice(-8)}
                  </a>
                </div>
                
                <div className="text-neutral-500">
                  {formatDistanceToNow(new Date(timestamp), { addSuffix: true })}
                </div>
              </motion.div>
            )}
          </div>
        </div>
        
        <div className="text-right">
          <div className={`font-medium ${type === 'in' ? 'text-success' : ''}`}>
            {type === 'in' ? '+' : '-'}{amount.toLocaleString()} SKC
          </div>
          
          {usdValue !== undefined && (
            <div className="text-sm text-neutral-500">
              (${usdValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })})
            </div>
          )}
          
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-xs text-primary hover:underline mt-1"
          >
            {expanded ? 'Less details' : 'More details'}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

interface TransactionFeedProps {
  maxItems?: number;
  className?: string;
}

export function TransactionFeed({ maxItems = 5, className = '' }: TransactionFeedProps) {
  const { data, isLoading, error, refetch } = useTransactionFeed(maxItems);
  const [newTransactionHashes, setNewTransactionHashes] = useState<Set<string>>(new Set());
  
  // Store seen transaction hashes to identify new ones
  const [seenTransactions, setSeenTransactions] = useState<Set<string>>(new Set());
  
  // Check for new transactions when data changes
  useEffect(() => {
    if (data?.data) {
      const currentHashes = new Set(data.data.map(tx => tx.hash));
      
      // If this is the first load, just mark all as seen
      if (seenTransactions.size === 0) {
        setSeenTransactions(currentHashes);
        return;
      }
      
      // Find new transactions (in current but not in seen)
      const newHashes = new Set<string>();
      currentHashes.forEach(hash => {
        if (!seenTransactions.has(hash)) {
          newHashes.add(hash);
        }
      });
      
      // Update state
      setNewTransactionHashes(newHashes);
      setSeenTransactions(currentHashes);
      
      // Clear "new" indicator after 5 seconds
      if (newHashes.size > 0) {
        const timeout = setTimeout(() => {
          setNewTransactionHashes(new Set());
        }, 5000);
        
        return () => clearTimeout(timeout);
      }
    }
  }, [data?.data, seenTransactions]);
  
  // Handle refresh
  const handleRefresh = () => {
    refetch();
  };
  
  // If error, show error state
  if (error) {
    return (
      <Card className={className}>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex justify-between items-center">
            <span>Recent Transactions</span>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 w-8 p-0" 
              onClick={handleRefresh}
              aria-label="Refresh"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"></path>
              </svg>
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="text-red-500">Error loading transactions. Please try again.</div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // If loading, show skeleton
  if (isLoading && !data) {
    return (
      <Card className={className}>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {[...Array(3)].map((_, i) => (
            <div key={i} className="mb-4">
              <div className="flex justify-between items-start">
                <div className="flex items-start space-x-3">
                  <Skeleton className="h-3 w-3 rounded-full mt-1" />
                  <div>
                    <Skeleton className="h-5 w-20 mb-2" />
                    <Skeleton className="h-4 w-28" />
                  </div>
                </div>
                <div>
                  <Skeleton className="h-5 w-20 mb-2" />
                  <Skeleton className="h-4 w-16" />
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }
  
  // No transactions state
  if (!data?.data?.length) {
    return (
      <Card className={className}>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex justify-between items-center">
            <span>Recent Transactions</span>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 w-8 p-0" 
              onClick={handleRefresh}
              aria-label="Refresh"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"></path>
              </svg>
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <div className="text-neutral-400 text-5xl mb-2">💰</div>
            <h4 className="font-medium mb-1">No transactions yet</h4>
            <p className="text-sm text-neutral-500">
              Transaction activity will appear here once available.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Normal state with transactions
  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex justify-between items-center">
          <span>Recent Transactions</span>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 w-8 p-0" 
            onClick={handleRefresh}
            aria-label="Refresh"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"></path>
            </svg>
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <AnimatePresence initial={false}>
          {data.data.map((tx) => (
            <TransactionCard 
              key={tx.hash} 
              {...tx} 
              isNew={newTransactionHashes.has(tx.hash)}
            />
          ))}
        </AnimatePresence>
        
        {data.data.length > 0 && data.data.length < maxItems && (
          <div className="text-center pt-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleRefresh}
              className="text-neutral-500 text-sm"
            >
              Load More Transactions
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
