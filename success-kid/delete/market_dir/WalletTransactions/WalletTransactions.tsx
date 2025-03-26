'use client';

import React, { useState } from 'react';
import { DownloadIcon, FilterIcon, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useWallet } from '@/hooks/useWallet';
import TransactionTable from './TransactionTable';
import ExportControls from './ExportControls';
import { Skeleton } from '@/components/ui/skeleton';

interface WalletTransactionsProps {
  className?: string;
}

/**
 * WalletTransactions Component
 * 
 * Displays transaction history for the connected wallet with filtering and export capabilities.
 */
export default function WalletTransactions({ className }: WalletTransactionsProps) {
  const { walletTransactions, isLoading, refreshTransactions } = useWallet();
  const [filterType, setFilterType] = useState<string[]>(['buy', 'sell', 'transfer', 'redemption']);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Apply filters to transactions
  const filteredTransactions = walletTransactions.filter(transaction => {
    // Apply type filter
    if (!filterType.includes(transaction.type)) {
      return false;
    }
    
    // Apply search query
    if (searchQuery && searchQuery.length > 0) {
      const query = searchQuery.toLowerCase();
      return (
        transaction.txHash.toLowerCase().includes(query) ||
        transaction.fromAddress.toLowerCase().includes(query) ||
        transaction.toAddress.toLowerCase().includes(query) ||
        transaction.type.toLowerCase().includes(query)
      );
    }
    
    return true;
  });
  
  // Toggle transaction type filter
  const toggleTypeFilter = (type: string) => {
    setFilterType(current => {
      if (current.includes(type)) {
        return current.filter(t => t !== type);
      } else {
        return [...current, type];
      }
    });
  };
  
  // Handle refresh
  const handleRefresh = () => {
    refreshTransactions();
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Filters and Controls */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex flex-1 gap-2 items-center w-full sm:w-auto">
          <Input
            placeholder="Search transactions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full sm:w-64"
          />
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <FilterIcon className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
              <DropdownMenuLabel>Filter by Type</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                checked={filterType.includes('buy')}
                onCheckedChange={() => toggleTypeFilter('buy')}
              >
                Buy
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={filterType.includes('sell')}
                onCheckedChange={() => toggleTypeFilter('sell')}
              >
                Sell
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={filterType.includes('transfer')}
                onCheckedChange={() => toggleTypeFilter('transfer')}
              >
                Transfer
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={filterType.includes('redemption')}
                onCheckedChange={() => toggleTypeFilter('redemption')}
              >
                Redemption
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Button 
            variant="outline" 
            size="icon" 
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
          </Button>
        </div>
        
        <ExportControls transactions={filteredTransactions} disabled={isLoading} />
      </div>
      
      {/* Transaction Table */}
      {isLoading ? (
        <Card className="overflow-hidden p-4">
          <Skeleton className="h-10 w-full mb-4" />
          <Skeleton className="h-12 w-full mb-2" />
          <Skeleton className="h-12 w-full mb-2" />
          <Skeleton className="h-12 w-full" />
        </Card>
      ) : (
        <TransactionTable transactions={filteredTransactions} />
      )}
    </div>
  );
}
