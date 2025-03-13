'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { useTransactionData, Transaction } from '@/hooks/useMarketData';
import { format, formatDistanceToNow } from 'date-fns';
import { useMarketData } from '@/components/providers/market';

interface TransactionFeedProps {
  className?: string;
  maxItems?: number;
}

export default function TransactionFeed({ className = '', maxItems = 10 }: TransactionFeedProps) {
  const [activeFilter, setActiveFilter] = useState<'all' | 'buy' | 'sell' | 'transfer'>('all');
  const [expandedTx, setExpandedTx] = useState<string | null>(null);
  
  const { data, isLoading, error } = useTransactionData(activeFilter, maxItems, 0);
  const { formatNumber } = useMarketData();
  
  // Format transaction time as relative time
  const formatTxTime = (timestamp: string) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch (e) {
      return 'unknown time';
    }
  };
  
  // Format token amount with commas
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-US').format(amount);
  };
  
  // Format USD value with 2 decimal places
  const formatUSD = (value: number | null | undefined) => {
    if (value === null || value === undefined) return '-';
    return `$${value.toFixed(2)}`;
  };
  
  // Format wallet address with ellipsis in the middle
  const formatAddress = (address: string) => {
    if (address === '0x0000000000000000000000000000000000000000') {
      return 'Null Address';
    }
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };
  
  // Get transaction type color and icon
  const getTransactionTypeDisplay = (type: string) => {
    switch (type) {
      case 'buy':
        return {
          color: 'text-green-600',
          icon: '↗',
          label: 'Buy'
        };
      case 'sell':
        return {
          color: 'text-red-600',
          icon: '↘',
          label: 'Sell'
        };
      case 'transfer':
        return {
          color: 'text-blue-600',
          icon: '↔',
          label: 'Transfer'
        };
      default:
        return {
          color: 'text-gray-600',
          icon: '•',
          label: type
        };
    }
  };
  
  return (
    <Card className={`p-6 ${className}`}>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Recent Transactions</h2>
        
        <div className="flex space-x-1">
          {(['all', 'buy', 'sell', 'transfer'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-3 py-1 text-sm rounded ${
                activeFilter === filter
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {filter === 'all' ? 'All' : filter.charAt(0).toUpperCase() + filter.slice(1)}
            </button>
          ))}
        </div>
      </div>
      
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : error ? (
        <div className="flex items-center justify-center h-64">
          <p className="text-red-500">Error loading transaction data. Please try again later.</p>
        </div>
      ) : data?.data?.transactions.length === 0 ? (
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">No transactions found</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b">
                <th className="px-4 py-2 text-left">Type</th>
                <th className="px-4 py-2 text-right">Amount (SKC)</th>
                <th className="px-4 py-2 text-right">Value (USD)</th>
                <th className="px-4 py-2 text-left">Time</th>
                <th className="px-4 py-2 text-left">Address</th>
                <th className="px-4 py-2 text-center">Details</th>
              </tr>
            </thead>
            <tbody>
              {data?.data?.transactions.map((tx) => {
                const typeDisplay = getTransactionTypeDisplay(tx.type);
                const isExpanded = expandedTx === tx.hash;
                
                return (
                  <>
                    <tr 
                      key={tx.hash} 
                      className={`border-b ${tx.isSignificant ? 'bg-yellow-50 dark:bg-yellow-900/10' : ''} hover:bg-gray-50 dark:hover:bg-gray-800/50`}
                    >
                      <td className={`px-4 py-3 ${typeDisplay.color} font-medium`}>
                        <span className="mr-1">{typeDisplay.icon}</span>
                        {typeDisplay.label}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {formatAmount(tx.amount)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {formatUSD(tx.value)}
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {formatTxTime(tx.timestamp)}
                      </td>
                      <td className="px-4 py-3 text-gray-500 font-mono text-sm">
                        {tx.type === 'transfer' ? (
                          <span title={`From: ${tx.fromAddress}\nTo: ${tx.toAddress}`}>
                            {formatAddress(tx.fromAddress)} → {formatAddress(tx.toAddress)}
                          </span>
                        ) : tx.type === 'buy' ? (
                          <span title={tx.toAddress}>
                            {formatAddress(tx.toAddress)}
                          </span>
                        ) : (
                          <span title={tx.fromAddress}>
                            {formatAddress(tx.fromAddress)}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => setExpandedTx(isExpanded ? null : tx.hash)}
                          className="text-primary hover:text-primary-dark"
                        >
                          {isExpanded ? 'Hide' : 'View'}
                        </button>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr className="bg-gray-50 dark:bg-gray-800/50">
                        <td colSpan={6} className="px-6 py-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <h4 className="font-semibold mb-2">Transaction Details</h4>
                              <div className="space-y-1 text-sm">
                                <p><span className="text-gray-500">Hash:</span> <span className="font-mono">{tx.hash.slice(0, 18)}...</span></p>
                                <p><span className="text-gray-500">Type:</span> {typeDisplay.label}</p>
                                <p><span className="text-gray-500">Amount:</span> {formatAmount(tx.amount)} SKC</p>
                                {tx.price && <p><span className="text-gray-500">Price:</span> ${tx.price.toFixed(6)} USD</p>}
                                {tx.value && <p><span className="text-gray-500">Value:</span> ${tx.value.toFixed(2)} USD</p>}
                                <p><span className="text-gray-500">Time:</span> {format(new Date(tx.timestamp), 'PPpp')}</p>
                              </div>
                            </div>
                            <div>
                              <h4 className="font-semibold mb-2">Address Information</h4>
                              <div className="space-y-1 text-sm">
                                <p>
                                  <span className="text-gray-500">From:</span> <span className="font-mono">{tx.fromAddress}</span>
                                  {tx.fromAddress === '0x0000000000000000000000000000000000000000' && <span className="ml-2 text-gray-500">(Mint)</span>}
                                </p>
                                <p>
                                  <span className="text-gray-500">To:</span> <span className="font-mono">{tx.toAddress}</span>
                                  {tx.toAddress === '0x0000000000000000000000000000000000000000' && <span className="ml-2 text-gray-500">(Burn)</span>}
                                </p>
                                <div className="mt-3">
                                  <a
                                    href={`https://solscan.io/tx/${tx.hash}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary hover:underline text-sm"
                                  >
                                    View on Solscan →
                                  </a>
                                </div>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      
      {/* Show pagination if there are more transactions */}
      {data?.data?.pagination && data.data.pagination.total > data.data.pagination.limit && (
        <div className="flex justify-center mt-6">
          <a href="#" className="text-primary hover:underline">
            View All Transactions →
          </a>
        </div>
      )}
    </Card>
  );
}
