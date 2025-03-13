'use client';

import { useEffect } from 'react';
import { useWallet } from '@/hooks/useWallet';
import { 
  formatTokenAmount, 
  formatWalletAddress, 
  getTimeAgo,
  getTransactionExplorerUrl
} from '@/lib/walletService';

interface TransactionHistoryProps {
  compact?: boolean;
  maxTransactions?: number;
}

export function TransactionHistory({
  compact = false,
  maxTransactions = 3,
}: TransactionHistoryProps) {
  const { transactions, isLoadingTransactions, getTransactions } = useWallet();
  
  useEffect(() => {
    if (!transactions.length && !isLoadingTransactions) {
      getTransactions();
    }
  }, [transactions, isLoadingTransactions, getTransactions]);
  
  if (isLoadingTransactions) {
    return (
      <div className="rounded-lg border border-gray-100 bg-gray-50 p-4 text-center">
        <div className="flex items-center justify-center">
          <svg className="h-5 w-5 animate-spin text-gray-400" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="ml-2 text-sm text-gray-500">Loading transactions...</span>
        </div>
      </div>
    );
  }
  
  if (!transactions.length) {
    return (
      <div className="rounded-lg border border-gray-100 bg-gray-50 p-4 text-center">
        <p className="text-sm text-gray-500">No transactions found</p>
      </div>
    );
  }
  
  const displayTransactions = transactions.slice(0, maxTransactions);
  
  return (
    <div className={`${compact ? 'space-y-2' : 'space-y-3'} rounded-lg border border-gray-200 ${compact ? 'p-3' : 'p-4'}`}>
      {displayTransactions.map((transaction) => (
        <div 
          key={transaction.id}
          className={`flex items-center justify-between ${compact ? 'py-1' : 'rounded-lg border border-gray-100 bg-gray-50 p-3'}`}
        >
          <div className="flex items-center space-x-3">
            <div className={`flex h-8 w-8 items-center justify-center rounded-full ${
              transaction.type === 'in' ? 'bg-success-100 text-success-600' : 'bg-primary-100 text-primary-600'
            }`}>
              {transaction.type === 'in' ? (
                <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 10.293a1 1 0 010 1.414l-6 6a1 1 0 01-1.414 0l-6-6a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l4.293-4.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            
            <div className="min-w-0">
              <p className={`truncate font-medium text-gray-900 ${compact ? 'text-sm' : ''}`}>
                {transaction.type === 'in' ? 'Received' : 'Sent'} SKC
              </p>
              {!compact && (
                <div className="mt-1 flex items-center text-xs text-gray-500">
                  <span className="mr-2 inline-block truncate max-w-[150px]">
                    {transaction.type === 'in' 
                      ? transaction.fromAddress && `From: ${formatWalletAddress(transaction.fromAddress)}`
                      : transaction.toAddress && `To: ${formatWalletAddress(transaction.toAddress)}`
                    }
                  </span>
                  <a 
                    href={getTransactionExplorerUrl(transaction.hash)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center text-primary hover:text-primary-600"
                  >
                    View
                    <svg className="ml-1 h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                      <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                    </svg>
                  </a>
                </div>
              )}
            </div>
          </div>
          
          <div className="text-right">
            <p className={`font-mono font-medium ${transaction.type === 'in' ? 'text-success-600' : 'text-gray-900'} ${compact ? 'text-sm' : ''}`}>
              {transaction.type === 'in' ? '+' : '-'}{formatTokenAmount(transaction.amount)}
            </p>
            <p className="text-xs text-gray-500">
              {getTimeAgo(transaction.timestamp)}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
