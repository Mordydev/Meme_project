'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { usePointsStore } from '@/store/usePointsStore';
import { motion } from 'framer-motion';

// We'll use simple divs for the chart for now, and replace with recharts when available
interface CategoryData {
  category: string;
  amount: number;
  percentage: number;
  color: string;
}

const categoryColors: Record<string, string> = {
  content_creation: '#1E88E5', // Primary blue
  comment: '#4CAF50', // Success green
  daily_login: '#FFC107', // Sand gold
  referral: '#9C27B0', // Purple
  upvote_received: '#FF9800', // Orange
  achievement: '#E91E63', // Pink
  default: '#757575', // Gray
};

/**
 * Component to visualize points breakdown by category
 */
export function PointsBreakdown() {
  const { transactions } = usePointsStore();
  const [timeRange, setTimeRange] = useState<'all' | 'month' | 'week'>('all');
  
  // Process transactions to get category breakdown
  const categoryData = useMemo(() => {
    // Filter transactions based on time range
    const filteredTransactions = transactions.filter(tx => {
      if (timeRange === 'all') return true;
      
      const txDate = new Date(tx.timestamp);
      const now = new Date();
      if (timeRange === 'month') {
        const monthAgo = new Date();
        monthAgo.setMonth(now.getMonth() - 1);
        return txDate >= monthAgo;
      }
      if (timeRange === 'week') {
        const weekAgo = new Date();
        weekAgo.setDate(now.getDate() - 7);
        return txDate >= weekAgo;
      }
      return true;
    });
    
    // Group by category and sum amounts
    const categoryGroups = filteredTransactions.reduce<Record<string, number>>((acc, tx) => {
      // Only count positive transactions (points earned)
      if (tx.amount <= 0) return acc;
      
      const category = tx.source;
      if (!acc[category]) {
        acc[category] = 0;
      }
      acc[category] += tx.amount;
      return acc;
    }, {});
    
    // Convert to array with percentages
    const total = Object.values(categoryGroups).reduce((sum, amount) => sum + amount, 0);
    
    return Object.entries(categoryGroups).map(([category, amount]) => ({
      category,
      amount,
      percentage: total > 0 ? (amount / total) * 100 : 0,
      color: categoryColors[category] || categoryColors.default,
    })).sort((a, b) => b.amount - a.amount);
  }, [transactions, timeRange]);
  
  // Format category name for display
  const formatCategory = (category: string) => {
    return category
      .replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle>Points Breakdown</CardTitle>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setTimeRange('week')}
              className={`rounded-md px-2 py-1 text-xs font-medium ${
                timeRange === 'week' 
                  ? 'bg-primary text-white' 
                  : 'bg-primary/10 text-primary hover:bg-primary/20'
              }`}
            >
              Week
            </button>
            <button
              onClick={() => setTimeRange('month')}
              className={`rounded-md px-2 py-1 text-xs font-medium ${
                timeRange === 'month' 
                  ? 'bg-primary text-white' 
                  : 'bg-primary/10 text-primary hover:bg-primary/20'
              }`}
            >
              Month
            </button>
            <button
              onClick={() => setTimeRange('all')}
              className={`rounded-md px-2 py-1 text-xs font-medium ${
                timeRange === 'all' 
                  ? 'bg-primary text-white' 
                  : 'bg-primary/10 text-primary hover:bg-primary/20'
              }`}
            >
              All
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {categoryData.length === 0 ? (
          <div className="flex h-40 items-center justify-center text-center text-muted-foreground">
            <div>
              <p>No points data available for selected time period.</p>
              <p className="text-sm">Start engaging with the platform to earn points!</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Simple bar chart */}
            <div className="h-10 w-full rounded-lg bg-gray-100">
              <div className="flex h-full w-full rounded-lg">
                {categoryData.map((category, i) => (
                  <motion.div
                    key={category.category}
                    initial={{ width: 0 }}
                    animate={{ width: `${category.percentage}%` }}
                    transition={{ duration: 0.5, delay: i * 0.1 }}
                    style={{ backgroundColor: category.color }}
                    className="h-full first:rounded-l-lg last:rounded-r-lg"
                    title={`${formatCategory(category.category)}: ${category.amount} points (${category.percentage.toFixed(1)}%)`}
                  />
                ))}
              </div>
            </div>
            
            {/* Category list */}
            <ul className="space-y-2">
              {categoryData.map((category) => (
                <li key={category.category} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div 
                      className="h-3 w-3 rounded-full" 
                      style={{ backgroundColor: category.color }}
                    />
                    <span className="text-sm font-medium">
                      {formatCategory(category.category)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-medium">
                      {category.amount}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      ({category.percentage.toFixed(1)}%)
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
