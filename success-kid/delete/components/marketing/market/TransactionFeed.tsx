'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Date formatting utilities to replace date-fns
const formatDistanceToNow = (date: Date): string => {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return `${diffInSeconds} seconds ago`;
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes === 1 ? '' : 's'} ago`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} hour${diffInHours === 1 ? '' : 's'} ago`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) return `${diffInDays} day${diffInDays === 1 ? '' : 's'} ago`;
  
  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) return `${diffInMonths} month${diffInMonths === 1 ? '' : 's'} ago`;
  
  const diffInYears = Math.floor(diffInMonths / 12);
  return `${diffInYears} year${diffInYears === 1 ? '' : 's'} ago`;
};

const formatDate = (date: Date): string => {
  const options: Intl.DateTimeFormatOptions = { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  };
  return new Intl.DateTimeFormat('en-US', options).format(date);
};

// Transaction types
type TransactionType = 'buy' | 'sell' | 'transfer';

// Transaction interface
interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  usdValue: number;
  tokenPrice: number;
  fromAddress: string;
  toAddress: string;
  timestamp: Date;
  blockExplorerUrl: string;
}

// Generate mock transaction data - replace with API in production
const generateMockTransaction = (): Transaction => {
  const types: TransactionType[] = ['buy', 'sell', 'transfer'];
  const type = types[Math.floor(Math.random() * types.length)];
  
  const amount = Math.floor(Math.random() * 50000) + 1000;
  const tokenPrice = 0.0018;
  const usdValue = amount * tokenPrice;
  
  const generateAddress = () => {
    return '0x' + [...Array(40)].map(() => Math.floor(Math.random() * 16).toString(16)).join('');
  };
  
  const fromAddress = generateAddress();
  const toAddress = generateAddress();
  
  const timestamp = new Date();
  timestamp.setMinutes(timestamp.getMinutes() - Math.floor(Math.random() * 60));
  
  return {
    id: Math.random().toString(36).substr(2, 9),
    type,
    amount,
    usdValue,
    tokenPrice,
    fromAddress,
    toAddress,
    timestamp,
    blockExplorerUrl: `https://solscan.io/tx/${Math.random().toString(36).substr(2, 16)}`
  };
};

// Generate initial transactions
const generateInitialTransactions = (count: number): Transaction[] => {
  return Array.from({ length: count }, (_, i) => generateMockTransaction())
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
};

interface TransactionFeedProps {
  className?: string;
}

export function TransactionFeed({ className = '' }: TransactionFeedProps) {
  const [transactions, setTransactions] = useState<Transaction[]>(generateInitialTransactions(10));
  const [expandedTransaction, setExpandedTransaction] = useState<string | null>(null);
  const [filter, setFilter] = useState<TransactionType | 'all'>('all');
  
  // Simulate real-time transactions - replace with websocket or polling in production
  useEffect(() => {
    const interval = setInterval(() => {
      const newTransaction = generateMockTransaction();
      setTransactions(prev => [newTransaction, ...prev.slice(0, 19)]);
    }, 20000); // New transaction every 20 seconds
    
    return () => clearInterval(interval);
  }, []);
  
  // Format wallet address for display
  const formatAddress = (address: string): string => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };
  
  // Get transaction type icon and color
  const getTransactionMeta = (type: TransactionType) => {
    switch (type) {
      case 'buy':
        return {
          icon: '↗️',
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          label: 'Buy'
        };
      case 'sell':
        return {
          icon: '↘️',
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          label: 'Sell'
        };
      case 'transfer':
        return {
          icon: '↔️',
          color: 'text-primary-600',
          bgColor: 'bg-primary-50',
          borderColor: 'border-primary-200',
          label: 'Transfer'
        };
    }
  };
  
  // Filter transactions
  const filteredTransactions = filter === 'all' 
    ? transactions 
    : transactions.filter(tx => tx.type === filter);
  
  return (
    <div className={`w-full bg-white rounded-xl border border-gray-100 shadow-md ${className}`}>
      <div className="border-b border-gray-100 p-4 flex justify-between items-center">
        <h3 className="text-lg font-bold text-gray-900">Live Transactions</h3>
        
        <div className="flex space-x-2">
          {['all', 'buy', 'sell', 'transfer'].map((type) => (
            <button
              key={type}
              className={`px-3 py-1 rounded-md text-sm font-medium ${
                filter === type 
                  ? 'bg-primary-100 text-primary-700' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              onClick={() => setFilter(type as TransactionType | 'all')}
            >
              {type === 'all' ? 'All' : type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>
      </div>
      
      <div className="overflow-hidden">
        <AnimatePresence initial={false}>
          {filteredTransactions.length > 0 ? (
            <div className="max-h-[600px] overflow-y-auto">
              {filteredTransactions.map((transaction, index) => {
                const meta = getTransactionMeta(transaction.type);
                const isExpanded = expandedTransaction === transaction.id;
                
                return (
                  <motion.div
                    key={transaction.id}
                    initial={index === 0 ? { opacity: 0, y: -20 } : false}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className={`border-b border-gray-100 last:border-b-0 cursor-pointer ${
                      isExpanded ? 'bg-gray-50' : 'hover:bg-gray-50'
                    }`}
                    onClick={() => setExpandedTransaction(isExpanded ? null : transaction.id)}
                  >
                    <div className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className={`flex-shrink-0 h-10 w-10 rounded-full ${meta.bgColor} ${meta.borderColor} border flex items-center justify-center mr-4`}>
                            <span className="text-lg">{meta.icon}</span>
                          </div>
                          
                          <div>
                            <div className="flex items-center">
                              <span className={`font-semibold ${meta.color}`}>{meta.label}</span>
                              <span className="mx-2 text-gray-400">•</span>
                              <span className="text-gray-500 text-sm">
                                {formatDistanceToNow(transaction.timestamp)}
                              </span>
                            </div>
                            
                            <div className="text-gray-700 font-medium">
                              {transaction.amount.toLocaleString()} SKC
                              <span className="text-gray-500 text-sm ml-2">
                                (${transaction.usdValue.toFixed(2)})
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-gray-400">
                          {isExpanded ? (
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                            </svg>
                          ) : (
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          )}
                        </div>
                      </div>
                      
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3 }}
                            className="mt-4 pt-4 border-t border-gray-100"
                          >
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <div className="text-gray-500 mb-1">From</div>
                                <div className="font-medium">{formatAddress(transaction.fromAddress)}</div>
                              </div>
                              <div>
                                <div className="text-gray-500 mb-1">To</div>
                                <div className="font-medium">{formatAddress(transaction.toAddress)}</div>
                              </div>
                              <div>
                                <div className="text-gray-500 mb-1">Transaction Time</div>
                                <div className="font-medium">
                                  {formatDate(transaction.timestamp)}
                                </div>
                              </div>
                              <div>
                                <div className="text-gray-500 mb-1">Token Price</div>
                                <div className="font-medium">${transaction.tokenPrice.toFixed(6)}</div>
                              </div>
                            </div>
                            
                            <div className="mt-4 flex justify-end">
                              <a
                                href={transaction.blockExplorerUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center"
                                onClick={(e) => e.stopPropagation()}
                              >
                                View on Explorer
                                <svg className="ml-1 w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                              </a>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="p-12 text-center">
              <div className="text-gray-400 mb-2 text-xl">No transactions found</div>
              <p className="text-gray-500">Try changing your filter or check back later.</p>
            </div>
          )}
        </AnimatePresence>
      </div>
      
      <div className="border-t border-gray-100 p-4 text-center">
        <a
          href="https://solscan.io/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary-600 hover:text-primary-700 text-sm font-medium"
        >
          View All Transactions on Solscan
        </a>
      </div>
    </div>
  );
}

export default TransactionFeed;
