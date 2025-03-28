'use client';

import React, { useEffect, useState } from 'react';
import { useWalletContext } from '@/components/providers/WalletProvider';
import { WalletTransaction } from '@/types/wallet';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  RefreshCw, 
  Loader2, 
  ExternalLink, 
  Clock,
  Filter
} from 'lucide-react';
import { 
  formatDistanceToNow, 
  format, 
  formatRelativeTime,
  formatCurrency
} from '@/lib/date-utils';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

export interface TransactionHistoryProps {
  className?: string;
  limit?: number;
  showFilter?: boolean;
  showRefresh?: boolean;
  onTransactionClick?: (transaction: WalletTransaction) => void;
}

export function TransactionHistory({ 
  className,
  limit = 5,
  showFilter = true,
  showRefresh = true,
  onTransactionClick
}: TransactionHistoryProps) {
  const { wallet, fetchTransactions } = useWalletContext();
  
  const [isLoading, setIsLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  
  useEffect(() => {
    // Set transactions from wallet if available
    if (wallet?.transactions) {
      setTransactions(wallet.transactions);
    } else if (wallet?.isConnected) {
      handleRefresh();
    }
  }, [wallet]);
  
  // Apply filter to transactions
  useEffect(() => {
    if (!wallet?.transactions) return;
    
    if (activeFilter === 'all') {
      setTransactions(wallet.transactions);
    } else {
      setTransactions(
        wallet.transactions.filter(tx => tx.type === activeFilter)
      );
    }
  }, [activeFilter, wallet?.transactions]);
  
  const handleRefresh = async () => {
    if (!wallet) return;
    
    setIsLoading(true);
    try {
      await fetchTransactions();
    } catch (error) {
      console.error('Failed to refresh transactions:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleFilterChange = (value: string) => {
    setActiveFilter(value);
  };
  
  const handleTransactionClick = (transaction: WalletTransaction) => {
    if (onTransactionClick) {
      onTransactionClick(transaction);
    } else {
      // Open transaction in explorer
      window.open(`https://solscan.io/tx/${transaction.hash}`, '_blank');
    }
  };
  
  // If no wallet connected
  if (!wallet || !wallet.isConnected) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-neutral-500">
            <p>Connect your wallet to view transaction history</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Loading state
  if (isLoading && (!transactions || transactions.length === 0)) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Transaction History</span>
            {showRefresh && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                disabled={true}
              >
                <Loader2 className="h-4 w-4 animate-spin" />
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-1.5 flex-1">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // No transactions
  if (!transactions || transactions.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Transaction History</span>
            {showRefresh && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={handleRefresh}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-neutral-500">
            <p>No transactions found for this wallet</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={handleRefresh}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // With transactions
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Transaction History</span>
          <div className="flex items-center gap-1">
            {showFilter && (
              <Select 
                value={activeFilter} 
                onValueChange={handleFilterChange}
              >
                <SelectTrigger className="h-8 w-fit gap-1 text-xs border-none shadow-none bg-transparent px-2">
                  <Filter className="h-3.5 w-3.5" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Transactions</SelectItem>
                  <SelectItem value="in">Received</SelectItem>
                  <SelectItem value="out">Sent</SelectItem>
                </SelectContent>
              </Select>
            )}
            
            {showRefresh && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={handleRefresh}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
              </Button>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {transactions
            .slice(0, limit)
            .map((transaction) => (
              <div 
                key={transaction.id}
                className="flex items-center gap-3 p-2 -mx-2 rounded-md hover:bg-neutral-50 cursor-pointer transition-colors duration-200"
                onClick={() => handleTransactionClick(transaction)}
              >
                <div 
                  className={cn(
                    "flex items-center justify-center w-10 h-10 rounded-full",
                    transaction.type === 'in' 
                      ? "bg-success-100 text-success-700" 
                      : "bg-primary-100 text-primary-700"
                  )}
                >
                  {transaction.type === 'in' ? (
                    <ArrowDownLeft className="h-5 w-5" />
                  ) : (
                    <ArrowUpRight className="h-5 w-5" />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <div className="font-medium truncate">
                      {transaction.type === 'in' ? 'Received' : 'Sent'} SKC
                    </div>
                    <div className="font-mono text-sm">
                      {transaction.type === 'in' ? '+' : '-'}{transaction.amount.toLocaleString(undefined, { maximumFractionDigits: 4 })}
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center mt-1">
                    <div className="text-xs text-neutral-500 flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      {formatRelativeTime(transaction.timestamp)}
                    </div>
                    
                    <div>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div>
                              <Badge 
                                variant={transaction.status === 'confirmed' ? 'outline' : 'secondary'}
                                className="text-xs"
                              >
                                {transaction.status}
                              </Badge>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>View transaction details</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>
                </div>
                
                <ExternalLink className="h-4 w-4 text-neutral-400 ml-1" />
              </div>
            ))}
            
          {/* View more link if we have more transactions than the limit */}
          {wallet.transactions && wallet.transactions.length > limit && (
            <div className="pt-2 text-center">
              <Button
                variant="link"
                size="sm"
                className="text-xs"
                onClick={() => {
                  // Handle view more action
                }}
              >
                View all {wallet.transactions.length} transactions
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
