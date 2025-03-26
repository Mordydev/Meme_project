'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { formatCurrency, formatDate } from '@/lib/format';
import { useWallet } from '@/hooks/useWallet';
import { useReducedMotion } from '@/hooks/useReducedMotion';

interface PerformanceMetricsProps {
  className?: string;
}

/**
 * Custom tooltip for the portfolio charts
 */
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background border border-neutral-200 p-2 rounded shadow-sm">
        <p className="text-xs text-neutral-500">{formatDate(label)}</p>
        <p className="text-sm font-medium">
          {formatCurrency(payload[0].value)}
        </p>
      </div>
    );
  }

  return null;
};

/**
 * PerformanceMetrics Component
 * 
 * Displays portfolio performance analytics with visualizations.
 */
export default function PerformanceMetrics({ className }: PerformanceMetricsProps) {
  const { portfolioHistory, portfolioPerformance, isLoading } = useWallet();
  const [timeRange, setTimeRange] = useState('30d');
  const prefersReducedMotion = useReducedMotion();
  
  // Filter data based on selected time range
  const getFilteredData = () => {
    if (!portfolioHistory) return [];
    
    const now = new Date();
    const cutoffDate = new Date();
    
    switch (timeRange) {
      case '7d':
        cutoffDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        cutoffDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        cutoffDate.setDate(now.getDate() - 90);
        break;
      case '1y':
        cutoffDate.setFullYear(now.getFullYear() - 1);
        break;
      case 'all':
      default:
        return portfolioHistory;
    }
    
    return portfolioHistory.filter(item => new Date(item.date) >= cutoffDate);
  };
  
  // Get portfolio metrics
  const getPerformanceMetrics = () => {
    return [
      {
        label: 'Total Invested',
        value: formatCurrency(portfolioPerformance?.totalInvested || 0),
        change: null
      },
      {
        label: 'Avg. Purchase Price',
        value: formatCurrency(portfolioPerformance?.averagePurchasePrice || 0),
        change: null
      },
      {
        label: 'Highest Value',
        value: formatCurrency(portfolioPerformance?.highestValue || 0),
        change: `on ${formatDate(portfolioPerformance?.highestValueDate || '', 'short')}`
      },
      {
        label: 'Lowest Value',
        value: formatCurrency(portfolioPerformance?.lowestValue || 0),
        change: `on ${formatDate(portfolioPerformance?.lowestValueDate || '', 'short')}`
      }
    ];
  };
  
  const filteredData = getFilteredData();
  const performanceMetrics = getPerformanceMetrics();

  return (
    <div className={cn("space-y-4", className)}>
      <Card className="p-4">
        <h3 className="text-lg font-medium mb-4">Portfolio Performance</h3>
        
        <div className="mb-4 flex justify-between items-center">
          <Tabs 
            value={timeRange} 
            onValueChange={setTimeRange}
            className="w-full"
          >
            <TabsList>
              <TabsTrigger value="7d">7D</TabsTrigger>
              <TabsTrigger value="30d">30D</TabsTrigger>
              <TabsTrigger value="90d">90D</TabsTrigger>
              <TabsTrigger value="1y">1Y</TabsTrigger>
              <TabsTrigger value="all">All</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        
        {isLoading ? (
          <Skeleton className="h-64 w-full" />
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={filteredData}
                margin={{ top: 5, right: 5, left: 0, bottom: 5 }}
              >
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1E88E5" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#1E88E5" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(value) => formatDate(value, 'short')}
                  tick={{ fontSize: 12 }}
                  tickMargin={10}
                  minTickGap={30}
                />
                <YAxis 
                  tickFormatter={(value) => formatCurrency(value, 0)}
                  tick={{ fontSize: 12 }}
                  width={60}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area 
                  type={prefersReducedMotion ? "linear" : "monotone"}
                  dataKey="value" 
                  stroke="#1E88E5" 
                  strokeWidth={2}
                  fill="url(#colorValue)"
                  isAnimationActive={!prefersReducedMotion}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>
      
      {/* Portfolio Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {performanceMetrics.map((metric, index) => (
          <Card key={index} className="p-4">
            <h3 className="text-sm font-medium text-neutral-500 mb-1">
              {metric.label}
            </h3>
            <div className="text-lg font-bold">
              {isLoading ? (
                <Skeleton className="h-6 w-24" />
              ) : (
                metric.value
              )}
            </div>
            {metric.change && (
              <div className="text-xs text-neutral-500 mt-1">
                {isLoading ? (
                  <Skeleton className="h-4 w-16" />
                ) : (
                  metric.change
                )}
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
