'use client';

import { useState, useEffect } from 'react';
import { usePointsStore } from '@/store/usePointsStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Download, Search, ArrowUp, ArrowDown, Filter, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import { useReducedMotion } from '@/hooks/useReducedMotion';

/**
 * Transaction History Component
 * Displays a filterable and searchable history of points transactions
 */
export function TransactionHistory() {
  const { transactions, fetchTransactions, isLoading } = usePointsStore();
  const [filteredTransactions, setFilteredTransactions] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState('all-time');
  const [transactionType, setTransactionType] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const prefersReducedMotion = useReducedMotion();
  
  // Fetch transactions on mount
  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);
  
  // Apply filters and search
  useEffect(() => {
    if (!transactions) return;
    
    let filtered = [...transactions];
    
    // Apply date range filter
    if (dateRange === 'today') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      filtered = filtered.filter(t => new Date(t.timestamp) >= today);
    } else if (dateRange === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      filtered = filtered.filter(t => new Date(t.timestamp) >= weekAgo);
    } else if (dateRange === 'month') {
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      filtered = filtered.filter(t => new Date(t.timestamp) >= monthAgo);
    }
    
    // Apply transaction type filter
    if (transactionType === 'earned') {
      filtered = filtered.filter(t => t.amount > 0);
    } else if (transactionType === 'spent') {
      filtered = filtered.filter(t => t.amount < 0);
    }
    
    // Apply search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(t => 
        t.source.toLowerCase().includes(term) || 
        (t.description && t.description.toLowerCase().includes(term))
      );
    }
    
    // Apply sorting
    if (sortBy === 'newest') {
      filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    } else if (sortBy === 'oldest') {
      filtered.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    } else if (sortBy === 'highest') {
      filtered.sort((a, b) => b.amount - a.amount);
    } else if (sortBy === 'lowest') {
      filtered.sort((a, b) => a.amount - b.amount);
    }
    
    setFilteredTransactions(filtered);
  }, [transactions, searchTerm, dateRange, transactionType, sortBy]);
  
  // Group transactions by date
  const groupTransactionsByDate = () => {
    if (!filteredTransactions.length) return [];
    
    const grouped: any = {};
    
    filteredTransactions.forEach(transaction => {
      const date = new Date(transaction.timestamp);
      const dateStr = date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
      
      if (!grouped[dateStr]) {
        grouped[dateStr] = [];
      }
      
      grouped[dateStr].push(transaction);
    });
    
    return Object.entries(grouped).map(([date, transactions]) => ({
      date,
      transactions
    }));
  };
  
  const groupedTransactions = groupTransactionsByDate();
  
  // Format transaction source with proper capitalization
  const formatSource = (source: string) => {
    return source
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };
  
  // Format time from timestamp
  const formatTime = (timestamp: Date) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Export transactions as CSV
  const exportTransactions = () => {
    if (!filteredTransactions.length) return;
    
    const headers = ['Date', 'Time', 'Amount', 'Source', 'Description', 'Reference ID'];
    
    const csvContent = [
      headers.join(','),
      ...filteredTransactions.map(t => [
        new Date(t.timestamp).toLocaleDateString(),
        new Date(t.timestamp).toLocaleTimeString(),
        t.amount,
        t.source,
        t.description || '',
        t.referenceId || ''
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `success-points-transactions-${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // Calculate total filtered transactions
  const totalEarned = filteredTransactions
    .filter(t => t.amount > 0)
    .reduce((sum, t) => sum + t.amount, 0);
    
  const totalSpent = filteredTransactions
    .filter(t => t.amount < 0)
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  
  return (
    <div className="space-y-6">
      {/* Filter Controls */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Transaction Filters
            </span>
            <div className="flex items-center gap-2">
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => fetchTransactions()}
                className="flex items-center gap-1 h-8"
              >
                <RefreshCw className="h-4 w-4" />
                <span className="hidden sm:inline">Refresh</span>
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={exportTransactions}
                className="flex items-center gap-1 h-8"
                disabled={!filteredTransactions.length}
              >
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Export</span>
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Input
                type="text"
                placeholder="Search transactions..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" />
            </div>
            
            <select
              className="h-10 border border-neutral-200 rounded-md px-3 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
            >
              <option value="all-time">All Time</option>
              <option value="today">Today</option>
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
            </select>
            
            <select
              className="h-10 border border-neutral-200 rounded-md px-3 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              value={transactionType}
              onChange={(e) => setTransactionType(e.target.value)}
            >
              <option value="all">All Transactions</option>
              <option value="earned">Earned Points</option>
              <option value="spent">Spent Points</option>
            </select>
            
            <select
              className="h-10 border border-neutral-200 rounded-md px-3 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="highest">Highest Amount</option>
              <option value="lowest">Lowest Amount</option>
            </select>
          </div>
          
          {/* Filter Summary */}
          <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-neutral-500">
            <span>{filteredTransactions.length} transactions found</span>
            <span className="mx-2">•</span>
            <span className="text-green-600">{totalEarned} points earned</span>
            <span className="mx-2">•</span>
            <span className="text-red-600">{totalSpent} points spent</span>
          </div>
        </CardContent>
      </Card>
      
      {/* Transaction List */}
      <div className="space-y-6">
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, index) => (
              <Card key={index}>
                <CardHeader className="pb-2">
                  <Skeleton className="h-6 w-32" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[...Array(3)].map((_, index) => (
                      <div key={index} className="flex justify-between items-center py-2">
                        <div className="flex items-center gap-3">
                          <Skeleton className="h-10 w-10 rounded-full" />
                          <div>
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-3 w-32 mt-1" />
                          </div>
                        </div>
                        <Skeleton className="h-5 w-16" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredTransactions.length === 0 ? (
          <Card className="py-12">
            <div className="text-center space-y-3">
              <div className="text-neutral-400 mx-auto rounded-full bg-neutral-100 p-3 w-12 h-12 flex items-center justify-center">
                <Search className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-medium">No transactions found</h3>
              <p className="text-neutral-500 max-w-sm mx-auto">
                Try adjusting your search or filters to see more results, or start earning points by engaging with the platform.
              </p>
            </div>
          </Card>
        ) : (
          groupedTransactions.map((group, groupIndex) => (
            <motion.div
              key={group.date}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ 
                duration: 0.3, 
                delay: prefersReducedMotion ? 0 : groupIndex * 0.05,
                ease: 'easeOut'
              }}
            >
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-md">{group.date}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1">
                    {(group.transactions as any[]).map((transaction, index) => (
                      <motion.div
                        key={transaction.id}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ 
                          duration: 0.2, 
                          delay: prefersReducedMotion ? 0 : 0.1 + index * 0.03,
                          ease: 'easeOut'
                        }}
                        className={`flex justify-between items-center py-3 ${
                          index !== (group.transactions as any[]).length - 1 
                            ? 'border-b border-neutral-100' 
                            : ''
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`flex items-center justify-center w-10 h-10 rounded-full 
                            ${transaction.amount > 0 
                              ? 'bg-green-50 text-green-600' 
                              : 'bg-red-50 text-red-600'
                            }`}
                          >
                            {transaction.amount > 0 ? (
                              <ArrowUp className="h-5 w-5" />
                            ) : (
                              <ArrowDown className="h-5 w-5" />
                            )}
                          </div>
                          <div>
                            <div className="font-medium text-neutral-900">{formatSource(transaction.source)}</div>
                            <div className="text-sm text-neutral-500 flex items-center gap-1">
                              <span>{formatTime(transaction.timestamp)}</span>
                              {transaction.description && (
                                <>
                                  <span className="mx-1">•</span>
                                  <span>{transaction.description}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className={`font-mono font-semibold ${
                          transaction.amount > 0 
                            ? 'text-green-600' 
                            : 'text-red-600'
                        }`}>
                          {transaction.amount > 0 ? '+' : ''}{transaction.amount.toLocaleString()} SP
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
