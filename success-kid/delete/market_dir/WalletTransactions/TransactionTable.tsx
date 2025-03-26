'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { MarketTransaction } from '@/types';
import { Card } from '@/components/ui/card';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { TransactionModal } from '../TransactionModal';
import TransactionRow from './TransactionRow';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { motion, AnimatePresence } from 'framer-motion';

interface TransactionTableProps {
  transactions: MarketTransaction[];
  className?: string;
}

type SortField = 'date' | 'type' | 'amount' | 'price' | 'value' | 'performance';
type SortDirection = 'asc' | 'desc';

/**
 * TransactionTable Component
 * 
 * Displays wallet transactions in a sortable table format.
 */
export default function TransactionTable({ transactions, className }: TransactionTableProps) {
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [selectedTransaction, setSelectedTransaction] = useState<MarketTransaction | null>(null);
  const prefersReducedMotion = useReducedMotion();
  
  // Handle sort change
  const handleSort = (field: SortField) => {
    if (field === sortField) {
      // Toggle direction if same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new field and default to descending
      setSortField(field);
      setSortDirection('desc');
    }
  };
  
  // Get sorted transactions
  const sortedTransactions = [...transactions].sort((a, b) => {
    let comparison = 0;
    
    switch (sortField) {
      case 'date':
        comparison = new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
        break;
      case 'type':
        comparison = a.type.localeCompare(b.type);
        break;
      case 'amount':
        comparison = a.amount - b.amount;
        break;
      case 'price':
        comparison = a.price - b.price;
        break;
      case 'value':
        comparison = (a.amount * a.price) - (b.amount * b.price);
        break;
      case 'performance':
        const aPerf = a.currentValue ? (a.currentValue - a.value) / a.value * 100 : 0;
        const bPerf = b.currentValue ? (b.currentValue - b.value) / b.value * 100 : 0;
        comparison = aPerf - bPerf;
        break;
    }
    
    return sortDirection === 'asc' ? comparison : -comparison;
  });
  
  // Handle transaction click
  const handleTransactionClick = (transaction: MarketTransaction) => {
    setSelectedTransaction(transaction);
  };
  
  // Handle close modal
  const handleCloseModal = () => {
    setSelectedTransaction(null);
  };
  
  // Render table header with sort controls
  const renderSortHeader = (field: SortField, label: string) => {
    const isActive = sortField === field;
    
    return (
      <th className="px-4 py-3">
        <Button
          variant="ghost"
          size="sm"
          className="flex items-center text-xs font-medium text-neutral-500 uppercase tracking-wider"
          onClick={() => handleSort(field)}
        >
          {label}
          {isActive && (
            sortDirection === 'asc' ? (
              <ChevronUp className="ml-1 h-4 w-4" />
            ) : (
              <ChevronDown className="ml-1 h-4 w-4" />
            )
          )}
        </Button>
      </th>
    );
  };

  // Empty state for no transactions
  if (transactions.length === 0) {
    return (
      <Card className="p-8 text-center">
        <h3 className="text-lg font-medium mb-2">No Transactions Found</h3>
        <p className="text-neutral-500 mb-6">
          {transactions.length === 0 
            ? "You don't have any transactions yet."
            : "No transactions match your current filters."}
        </p>
        <Button onClick={() => window.open('https://dexscreener.com', '_blank')}>
          View DEX
        </Button>
      </Card>
    );
  }

  return (
    <>
      <Card className="overflow-hidden">
        <ScrollArea className="max-h-[500px]">
          <table className="min-w-full divide-y divide-neutral-200 dark:divide-neutral-700">
            <thead className="bg-neutral-50 dark:bg-neutral-900">
              <tr>
                {renderSortHeader('date', 'Date')}
                {renderSortHeader('type', 'Type')}
                {renderSortHeader('amount', 'Amount')}
                {renderSortHeader('price', 'Price')}
                {renderSortHeader('value', 'Value')}
                {renderSortHeader('performance', 'Performance')}
                <th className="px-4 py-3 text-right"></th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-neutral-800 divide-y divide-neutral-200 dark:divide-neutral-700">
              <AnimatePresence initial={false}>
                {sortedTransactions.map((transaction) => (
                  <motion.tr
                    key={transaction.txHash}
                    initial={prefersReducedMotion ? {} : { opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    onClick={() => handleTransactionClick(transaction)}
                    className="cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-700"
                  >
                    <TransactionRow transaction={transaction} />
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </ScrollArea>
      </Card>
      
      {/* Transaction Details Modal */}
      <TransactionModal 
        transaction={selectedTransaction}
        isOpen={!!selectedTransaction}
        onClose={handleCloseModal}
      />
    </>
  );
}
