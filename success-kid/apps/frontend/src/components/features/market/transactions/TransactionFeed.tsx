'use client';

import { useState } from 'react';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent, 
  CardDescription, 
  CardFooter 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { formatCurrency, timeAgo, truncate } from '@/lib/utils';
import { MarketTransaction } from '@/types';

interface TransactionItemProps {
  transaction: MarketTransaction;
  onExpand?: (hash: string) => void;
  isExpanded: boolean;
}

function TransactionItem({ transaction, onExpand, isExpanded }: TransactionItemProps) {
  const { 
    hash, 
    type, 
    amount, 
    price, 
    value, 
    timestamp, 
    fromAddress, 
    toAddress, 
    isSignificant 
  } = transaction;
  
  // Format based on transaction type
  const typeDisplay = type === 'buy' 
    ? 'Buy' 
    : type === 'sell' 
      ? 'Sell' 
      : 'Transfer';
      
  const typeColor = type === 'buy' 
    ? 'text-accent-500' 
    : type === 'sell' 
      ? 'text-alert-500' 
      : 'text-primary-500';
      
  const typeIconBg = type === 'buy' 
    ? 'bg-accent-100' 
    : type === 'sell' 
      ? 'bg-alert-100' 
      : 'bg-primary-100';
      
  const typeIcon = type === 'buy' 
    ? '↑' 
    : type === 'sell' 
      ? '↓' 
      : '→';
  
  // Format addresses
  const shortenAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };
  
  // Format amount
  const formattedAmount = formatCompactNumber(amount);
  const formattedValue = value ? formatCurrency(value) : undefined;
  
  return (
    <div className={`
      border-b border-neutral-200 p-4
      transition-all
      ${isSignificant ? 'bg-primary-50' : ''}
      hover:bg-neutral-50
    `}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {/* Transaction type icon */}
          <div className={`
            flex h-10 w-10 items-center justify-center rounded-full
            ${typeIconBg} ${typeColor} text-lg font-bold
          `}>
            {typeIcon}
          </div>
          
          {/* Transaction details */}
          <div>
            <div className="flex items-center">
              <span className={`font-medium ${typeColor}`}>{typeDisplay}</span>
              <span className="ml-2 text-sm text-neutral-500">{timeAgo(new Date(timestamp))}</span>
            </div>
            <div className="text-sm text-neutral-600">
              {formattedAmount} SKC {formattedValue ? `(${formattedValue})` : ''}
            </div>
          </div>
        </div>
        
        {/* Transaction hash/expansion */}
        <button
          className="text-xs text-neutral-500 underline-offset-2 hover:underline"
          onClick={() => onExpand && onExpand(hash)}
        >
          {isExpanded ? 'Hide details' : 'View details'}
        </button>
      </div>
      
      {/* Expanded details */}
      {isExpanded && (
        <div className="mt-3 rounded-md bg-neutral-50 p-3 text-sm">
          <div className="mb-1">
            <span className="font-medium">Hash:</span>
            <span className="ml-2 text-neutral-600">{shortenAddress(hash)}</span>
          </div>
          <div className="mb-1">
            <span className="font-medium">From:</span>
            <span className="ml-2 text-neutral-600">{shortenAddress(fromAddress)}</span>
          </div>
          <div className="mb-1">
            <span className="font-medium">To:</span>
            <span className="ml-2 text-neutral-600">{shortenAddress(toAddress)}</span>
          </div>
          {price && (
            <div className="mb-1">
              <span className="font-medium">Price:</span>
              <span className="ml-2 text-neutral-600">${price.toFixed(8)}</span>
            </div>
          )}
          <div>
            <span className="font-medium">Time:</span>
            <span className="ml-2 text-neutral-600">{new Date(timestamp).toLocaleString()}</span>
          </div>
          <div className="mt-2">
            <a 
              href={`https://solscan.io/tx/${hash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              View on Solscan →
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

interface TransactionFeedProps {
  transactions: MarketTransaction[];
  isLoading?: boolean;
  onTypeChange?: (type: string) => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
  className?: string;
}

export function TransactionFeed({
  transactions,
  isLoading = false,
  onTypeChange,
  onLoadMore,
  hasMore = false,
  className = '',
}: TransactionFeedProps) {
  const [activeType, setActiveType] = useState('all');
  const [expandedHash, setExpandedHash] = useState<string | null>(null);
  
  // Handle tab change
  const handleTypeChange = (type: string) => {
    setActiveType(type);
    if (onTypeChange) {
      onTypeChange(type);
    }
  };
  
  // Handle transaction expansion
  const handleExpand = (hash: string) => {
    setExpandedHash(prevHash => prevHash === hash ? null : hash);
  };
  
  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle>Transaction Activity</CardTitle>
        <CardDescription>Recent transactions on the blockchain</CardDescription>
      </CardHeader>
      
      <Tabs value={activeType} onValueChange={handleTypeChange} className="px-6">
        <TabsList className="grid w-full grid-cols-4 mb-2">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="buy">Buys</TabsTrigger>
          <TabsTrigger value="sell">Sells</TabsTrigger>
          <TabsTrigger value="transfer">Transfers</TabsTrigger>
        </TabsList>
      </Tabs>
      
      <CardContent className="p-0">
        {isLoading ? (
          <div className="space-y-4 p-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-md bg-neutral-100"></div>
            ))}
          </div>
        ) : transactions.length === 0 ? (
          <div className="flex h-48 items-center justify-center p-4">
            <p className="text-neutral-500">No transactions found</p>
          </div>
        ) : (
          <div className="max-h-[400px] overflow-y-auto">
            {transactions.map(transaction => (
              <TransactionItem
                key={transaction.hash}
                transaction={transaction}
                onExpand={handleExpand}
                isExpanded={expandedHash === transaction.hash}
              />
            ))}
          </div>
        )}
      </CardContent>
      
      <CardFooter className="justify-center border-t border-neutral-200 p-4">
        {hasMore && (
          <Button 
            variant="outline" 
            onClick={onLoadMore}
            disabled={isLoading}
          >
            {isLoading ? 'Loading...' : 'Load More'}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
