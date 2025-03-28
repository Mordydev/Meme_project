'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/Spinner';
import { ConnectWalletButton } from '@/components/wallet/ConnectWalletButton';
import { TransactionStatusTracker } from './TransactionStatusTracker';
import { formatWalletAddress, getTransactionExplorerUrl } from '@/lib/walletService';
import { timeAgo } from '@/lib/utils';
import { useWallet } from '@/hooks/useWallet';
import { motion, AnimatePresence } from 'framer-motion';
import { useReducedMotion } from '@/hooks/useReducedMotion';

export interface RedemptionTransaction {
  id: string;
  pointsAmount: number;
  tokenAmount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  requestedAt: string;
  processedAt?: string;
  transactionHash?: string;
  recipientAddress: string;
}

export interface RedemptionHistoryProps {
  transactions?: RedemptionTransaction[];
  isLoading?: boolean;
  onRefresh?: () => void;
  onItemClick?: (id: string) => void;
  limit?: number;
  className?: string;
}

export function RedemptionHistory({
  transactions = [],
  isLoading = false,
  onRefresh,
  onItemClick,
  limit = 5,
  className = ''
}: RedemptionHistoryProps) {
  const prefersReducedMotion = useReducedMotion();
  const { isConnected } = useWallet();
  
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [visibleTransactions, setVisibleTransactions] = useState<RedemptionTransaction[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  
  // Set visible transactions based on filter and limit
  useEffect(() => {
    let filtered = [...transactions];
    
    // Apply status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(tx => tx.status === filterStatus);
    }
    
    // Limit the number of transactions displayed
    setVisibleTransactions(filtered.slice(0, limit));
  }, [transactions, filterStatus, limit]);
  
  // Handle transaction item click
  const handleItemClick = (id: string) => {
    if (expandedId === id) {
      setExpandedId(null);
    } else {
      setExpandedId(id);
      if (onItemClick) {
        onItemClick(id);
      }
    }
  };
  
  // Status badge component
  const StatusBadge = ({ status }: { status: string }) => {
    const statusClasses = {
      completed: 'bg-success-50 text-success-800',
      processing: 'bg-primary-50 text-primary-800',
      pending: 'bg-amber-50 text-amber-800',
      failed: 'bg-red-50 text-red-800'
    };
    
    return (
      <span className={`rounded-full px-2 py-1 text-xs font-medium ${statusClasses[status as keyof typeof statusClasses]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };
  
  // Empty state component
  const EmptyState = () => (
    <div className="flex h-[240px] items-center justify-center text-center text-muted-foreground">
      <div>
        <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-10 w-10 text-neutral-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        <p className="mt-2">No redemption history yet.</p>
        <p className="text-sm">Your redemption records will appear here.</p>
        {!isConnected && (
          <div className="mt-4">
            <ConnectWalletButton
              size="sm"
              variant="outline"
            />
          </div>
        )}
      </div>
    </div>
  );
  
  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle>Redemption History</CardTitle>
        {onRefresh && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isLoading}
          >
            {isLoading ? <Spinner size="sm" className="mr-2" /> : null}
            Refresh
          </Button>
        )}
      </CardHeader>
      
      <CardContent className="p-6">
        {/* Filter options */}
        {transactions.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-2">
            <button
              onClick={() => setFilterStatus('all')}
              className={`rounded-md border px-2 py-1 text-xs ${
                filterStatus === 'all' 
                  ? 'border-primary bg-primary-50 text-primary-900' 
                  : 'border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterStatus('pending')}
              className={`rounded-md border px-2 py-1 text-xs ${
                filterStatus === 'pending' 
                  ? 'border-amber-300 bg-amber-50 text-amber-900' 
                  : 'border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50'
              }`}
            >
              Pending
            </button>
            <button
              onClick={() => setFilterStatus('processing')}
              className={`rounded-md border px-2 py-1 text-xs ${
                filterStatus === 'processing' 
                  ? 'border-primary-300 bg-primary-50 text-primary-900' 
                  : 'border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50'
              }`}
            >
              Processing
            </button>
            <button
              onClick={() => setFilterStatus('completed')}
              className={`rounded-md border px-2 py-1 text-xs ${
                filterStatus === 'completed' 
                  ? 'border-success-300 bg-success-50 text-success-900' 
                  : 'border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50'
              }`}
            >
              Completed
            </button>
            <button
              onClick={() => setFilterStatus('failed')}
              className={`rounded-md border px-2 py-1 text-xs ${
                filterStatus === 'failed' 
                  ? 'border-red-300 bg-red-50 text-red-900' 
                  : 'border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50'
              }`}
            >
              Failed
            </button>
          </div>
        )}
        
        {/* Loading state */}
        {isLoading && !visibleTransactions.length ? (
          <div className="flex h-40 items-center justify-center">
            <Spinner size="md" />
          </div>
        ) : visibleTransactions.length > 0 ? (
          <div className="space-y-4">
            {visibleTransactions.map((transaction) => (
              <div key={transaction.id}>
                <div
                  className="cursor-pointer rounded-lg border p-4 transition-colors hover:bg-neutral-50"
                  onClick={() => handleItemClick(transaction.id)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-mono text-base font-medium">
                        {transaction.pointsAmount} SP → {transaction.tokenAmount} SKC
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {timeAgo(new Date(transaction.requestedAt))}
                        {transaction.transactionHash && (
                          <> · Wallet: {formatWalletAddress(transaction.recipientAddress, 4)}</>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={transaction.status} />
                      <div className="text-muted-foreground">
                        <svg className={`h-5 w-5 transition-transform ${expandedId === transaction.id ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
                
                <AnimatePresence>
                  {expandedId === transaction.id && (
                    <motion.div
                      initial={prefersReducedMotion ? { opacity: 1, height: 'auto' } : { opacity: 0, height: 0 }}
                      animate={prefersReducedMotion ? { opacity: 1, height: 'auto' } : { opacity: 1, height: 'auto' }}
                      exit={prefersReducedMotion ? { opacity: 0, height: 'auto' } : { opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-2 rounded-lg">
                        <TransactionStatusTracker
                          transactionId={transaction.id}
                          initialData={{
                            id: transaction.id,
                            pointsAmount: transaction.pointsAmount,
                            tokenAmount: transaction.tokenAmount,
                            recipientAddress: transaction.recipientAddress,
                            status: transaction.status,
                            createdAt: transaction.requestedAt,
                            updatedAt: transaction.processedAt || transaction.requestedAt,
                            completedAt: transaction.status === 'completed' ? transaction.processedAt : undefined,
                            transactionHash: transaction.transactionHash,
                            steps: {
                              verification: transaction.status === 'pending' ? 'pending' : 'completed',
                              tokenTransfer: transaction.status === 'pending' ? 'pending' : 
                                transaction.status === 'processing' ? 'processing' :
                                transaction.status === 'completed' ? 'completed' : 'failed',
                              confirmation: transaction.status === 'completed' ? 'completed' : 'pending'
                            }
                          }}
                          onClose={() => setExpandedId(null)}
                          autoRefresh={transaction.status === 'pending' || transaction.status === 'processing'}
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
            
            {transactions.length > limit && (
              <div className="pt-2 text-center">
                <Button variant="outline" size="sm">
                  View All Transactions
                </Button>
              </div>
            )}
          </div>
        ) : (
          <EmptyState />
        )}
      </CardContent>
    </Card>
  );
}
