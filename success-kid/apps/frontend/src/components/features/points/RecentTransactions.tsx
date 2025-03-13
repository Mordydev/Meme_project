'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/Spinner';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from '@/lib/utils';

interface Transaction {
  id: string;
  amount: number;
  type: string;
  source: string;
  description: string;
  timestamp: string;
  referenceId?: string;
  referenceType?: string;
}

interface RecentTransactionsProps {
  transactions: Transaction[];
  isLoading?: boolean;
  limit?: number;
  onViewAll?: () => void;
}

// Function to get source icon
const getSourceIcon = (source: string): React.ReactNode => {
  // In a real implementation, we would return appropriate SVG icons
  // based on the source category
  return (
    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
      <span className="text-xs text-primary">
        {source.charAt(0).toUpperCase()}
      </span>
    </div>
  );
};

export default function RecentTransactions({
  transactions,
  isLoading = false,
  limit = 5,
  onViewAll
}: RecentTransactionsProps) {
  const [expandedTransaction, setExpandedTransaction] = useState<string | null>(null);
  
  const toggleTransaction = (id: string) => {
    if (expandedTransaction === id) {
      setExpandedTransaction(null);
    } else {
      setExpandedTransaction(id);
    }
  };
  
  const displayTransactions = transactions.slice(0, limit);
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-48">
            <Spinner />
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Recent Transactions</CardTitle>
        {onViewAll && (
          <button 
            className="text-sm text-primary hover:underline"
            onClick={onViewAll}
          >
            View All
          </button>
        )}
      </CardHeader>
      <CardContent>
        {displayTransactions.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <p>No transactions to display</p>
          </div>
        ) : (
          <div className="space-y-4">
            {displayTransactions.map((transaction, index) => (
              <motion.div
                key={transaction.id}
                className="border rounded-lg p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => toggleTransaction(transaction.id)}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {getSourceIcon(transaction.source)}
                    <div>
                      <p className="font-medium">{transaction.description}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(transaction.timestamp))} ago
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-mono font-bold ${transaction.type === 'earned' ? 'text-success' : 'text-alert'}`}>
                      {transaction.type === 'earned' ? '+' : '-'}{transaction.amount}
                    </p>
                    <p className="text-xs text-muted-foreground uppercase">
                      {transaction.source}
                    </p>
                  </div>
                </div>
                
                {/* Expanded details */}
                {expandedTransaction === transaction.id && (
                  <motion.div 
                    className="mt-4 pt-4 border-t text-sm"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <p className="text-muted-foreground">Transaction ID:</p>
                        <p className="font-mono">{transaction.id}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Timestamp:</p>
                        <p>{new Date(transaction.timestamp).toLocaleString()}</p>
                      </div>
                      {transaction.referenceId && (
                        <div className="col-span-2">
                          <p className="text-muted-foreground">Reference:</p>
                          <p className="font-mono">{transaction.referenceId} ({transaction.referenceType})</p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
