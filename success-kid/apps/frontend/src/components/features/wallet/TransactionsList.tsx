'use client';

import { useEffect } from 'react';
import { useWallet } from '@/hooks/useWallet';
import { formatDistanceToNow } from '@/lib/utils';
import { formatWalletAddress, getExplorerUrl } from '@/lib/wallet-utils';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/Spinner';
import Link from 'next/link';

interface TransactionsListProps {
  maxItems?: number;
  showHeader?: boolean;
  className?: string;
}

export function TransactionsList({
  maxItems = 5,
  showHeader = true,
  className = ''
}: TransactionsListProps) {
  const { transactions, fetchTransactions, wallet } = useWallet();
  
  // Fetch transactions on initial render
  useEffect(() => {
    if (wallet?.isConnected) {
      fetchTransactions();
    }
  }, [wallet?.isConnected, fetchTransactions]);
  
  // If no wallet is connected, don't render
  if (!wallet?.isConnected) {
    return null;
  }
  
  // If no transactions, show empty state
  if (transactions.length === 0) {
    return (
      <Card className={className}>
        {showHeader && (
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Recent Transactions</CardTitle>
          </CardHeader>
        )}
        
        <CardContent>
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <div className="text-neutral-400 text-5xl mb-2">📜</div>
            <h4 className="font-medium mb-1">No transactions yet</h4>
            <p className="text-sm text-neutral-500">
              Transactions will appear here once you start using your wallet.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Limit the number of transactions to display
  const displayedTransactions = transactions.slice(0, maxItems);
  
  return (
    <Card className={className}>
      {showHeader && (
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex justify-between items-center">
            <span>Recent Transactions</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => fetchTransactions()}
              className="h-8 w-8 p-0 rounded-full"
            >
              <span className="text-lg">↻</span>
            </Button>
          </CardTitle>
        </CardHeader>
      )}
      
      <CardContent>
        <div className="space-y-3">
          {displayedTransactions.map((tx) => (
            <div key={tx.hash} className="flex justify-between items-start border-b last:border-0 pb-3 last:pb-0">
              <div className="flex flex-col">
                <div className="flex items-center">
                  <div className={`
                    w-2 h-2 rounded-full mr-2
                    ${tx.type === 'in' ? 'bg-primary-500' : 'bg-neutral-500'}
                  `}></div>
                  <span className="font-medium">
                    {tx.type === 'in' ? 'Received' : 'Sent'}
                  </span>
                </div>
                
                <div className="text-sm text-neutral-500 mt-1">
                  {tx.type === 'in' && tx.fromAddress && (
                    <span>From: {formatWalletAddress(tx.fromAddress)}</span>
                  )}
                  {tx.type === 'out' && tx.toAddress && (
                    <span>To: {formatWalletAddress(tx.toAddress)}</span>
                  )}
                </div>
                
                <div className="text-xs text-neutral-400 mt-1">
                  {formatDistanceToNow(new Date(tx.timestamp))} ago
                </div>
              </div>
              
              <div className="flex flex-col items-end">
                <div className={`font-medium ${tx.type === 'in' ? 'text-primary-700' : ''}`}>
                  {tx.type === 'in' ? '+' : '-'}{tx.amount} SKC
                </div>
                
                <a 
                  href={getExplorerUrl(tx.hash, 'transaction')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary-500 hover:underline mt-1"
                >
                  View Transaction
                </a>
              </div>
            </div>
          ))}
          
          {transactions.length > maxItems && (
            <div className="text-center pt-2">
              <Link href="/wallet/transactions" passHref>
                <Button variant="outline" size="sm">
                  View All Transactions
                </Button>
              </Link>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
