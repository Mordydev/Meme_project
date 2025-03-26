'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { formatCurrency, formatNumber, formatDate } from '@/lib/format';
import { useWallet } from '@/hooks/useWallet';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { Info } from 'lucide-react';
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useReducedMotion } from '@/hooks/useReducedMotion';

interface PurchaseAnalysisProps {
  className?: string;
}

/**
 * PurchaseAnalysis Component
 * 
 * Displays analysis of user's purchase patterns and token acquisition methods.
 */
export default function PurchaseAnalysis({ className }: PurchaseAnalysisProps) {
  const { purchaseData, purchaseDistribution, isLoading } = useWallet();
  const prefersReducedMotion = useReducedMotion();
  
  // Custom tooltip for bar chart
  const PurchaseTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-neutral-200 p-2 rounded shadow-sm">
          <p className="text-xs text-neutral-500">{formatDate(label, 'medium')}</p>
          <p className="text-sm font-medium">
            Amount: {formatNumber(payload[0].value)} SKC
          </p>
          <p className="text-xs">
            Price: {formatCurrency(payload[0].payload.price)}
          </p>
          <p className="text-xs">
            Value: {formatCurrency(payload[0].payload.value)}
          </p>
        </div>
      );
    }

    return null;
  };
  
  // Custom tooltip for pie chart
  const SourceTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-neutral-200 p-2 rounded shadow-sm">
          <p className="text-sm font-medium">
            {payload[0].name}
          </p>
          <p className="text-xs">
            {formatNumber(payload[0].value)} SKC
          </p>
          <p className="text-xs">
            {payload[0].payload.percentage}% of total
          </p>
        </div>
      );
    }

    return null;
  };
  
  // COLORS for pie chart
  const COLORS = ['#1E88E5', '#4CAF50', '#FFC107', '#F44336', '#9C27B0'];

  return (
    <div className={cn("space-y-6", className)}>
      {/* Purchase History Chart */}
      <Card className="p-4">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-medium">Purchase History</h3>
            <p className="text-sm text-neutral-500">When and how much you've acquired over time</p>
          </div>
          <TooltipProvider>
            <UITooltip>
              <TooltipTrigger asChild>
                <Info className="h-5 w-5 text-neutral-400 cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-sm">
                <p>This chart shows your token acquisition over time, including purchases and point redemptions.</p>
              </TooltipContent>
            </UITooltip>
          </TooltipProvider>
        </div>
        
        {isLoading ? (
          <Skeleton className="h-64 w-full" />
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={purchaseData}
                margin={{ top: 5, right: 5, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(value) => formatDate(value, 'short')}
                  tick={{ fontSize: 12 }}
                  tickMargin={10}
                  minTickGap={30}
                />
                <YAxis 
                  tickFormatter={(value) => formatNumber(value)}
                  tick={{ fontSize: 12 }}
                  width={60}
                />
                <Tooltip content={<PurchaseTooltip />} />
                <Bar 
                  dataKey="amount" 
                  fill="#1E88E5" 
                  radius={[4, 4, 0, 0]}
                  isAnimationActive={!prefersReducedMotion}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>
      
      {/* Token Source Distribution */}
      <Card className="p-4">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-medium">Token Source Distribution</h3>
            <p className="text-sm text-neutral-500">How you've acquired your tokens</p>
          </div>
          <TooltipProvider>
            <UITooltip>
              <TooltipTrigger asChild>
                <Info className="h-5 w-5 text-neutral-400 cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-sm">
                <p>This chart shows the distribution of how you've acquired tokens, such as through market purchases, point redemptions, or airdrops.</p>
              </TooltipContent>
            </UITooltip>
          </TooltipProvider>
        </div>
        
        <div className="flex flex-col md:flex-row">
          {isLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <>
              <div className="w-full md:w-1/2 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={purchaseDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      isAnimationActive={!prefersReducedMotion}
                    >
                      {purchaseDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<SourceTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              
              <div className="w-full md:w-1/2 p-4">
                <h4 className="text-sm font-medium mb-3">Source Breakdown</h4>
                <div className="space-y-3">
                  {purchaseDistribution.map((entry, index) => (
                    <div key={index} className="flex items-center">
                      <div 
                        className="w-3 h-3 rounded-full mr-2" 
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <div className="flex-1">
                        <span className="text-sm">{entry.name}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">
                          {formatNumber(entry.value)} SKC
                        </div>
                        <div className="text-xs text-neutral-500">
                          {entry.percentage}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </Card>
    </div>
  );
}
