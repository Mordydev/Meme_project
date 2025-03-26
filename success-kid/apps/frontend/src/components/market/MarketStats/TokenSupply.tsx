'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { formatNumber, formatPercentage } from '@/lib/format';
import { cn } from '@/lib/utils';
import { Flame, Lock, Coins, PieChart as PieChartIcon, Info } from 'lucide-react';
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { TokenAllocation } from '@/types';
import { useReducedMotion } from '@/hooks/useReducedMotion';

interface TokenSupplyProps {
  totalSupply: number;
  circulatingSupply: number;
  burned: number;
  allocations: TokenAllocation[];
  className?: string;
}

/**
 * SourceTooltip component for the pie chart
 */
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

/**
 * TokenSupply Component
 * 
 * Displays token supply information and distribution.
 */
export default function TokenSupply({
  totalSupply,
  circulatingSupply,
  burned,
  allocations,
  className
}: TokenSupplyProps) {
  const prefersReducedMotion = useReducedMotion();
  
  // Calculate percentages
  const circulatingPercentage = (circulatingSupply / totalSupply) * 100;
  const burnedPercentage = (burned / totalSupply) * 100;
  const lockedPercentage = 100 - circulatingPercentage - burnedPercentage;
  
  // Format allocations data for the pie chart
  const COLORS = ['#1E88E5', '#4CAF50', '#FFC107', '#F44336', '#9C27B0', '#00BCD4', '#FF9800'];
  const allocationData = allocations.map((allocation, index) => ({
    ...allocation,
    percentage: ((allocation.amount / totalSupply) * 100).toFixed(2),
    color: COLORS[index % COLORS.length]
  }));

  return (
    <div className={cn("space-y-6", className)}>
      {/* Supply Overview */}
      <Card className="p-4">
        <h3 className="text-lg font-medium mb-4">Token Supply Overview</h3>
        
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center">
              <Coins className="h-5 w-5 text-primary mr-2" />
              <span className="text-sm font-medium">Total Supply:</span>
            </div>
            <span className="text-sm font-medium">
              {formatNumber(totalSupply)} SKC
            </span>
          </div>
          
          <div className="space-y-4 mt-4">
            {/* Circulating Supply */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <div className="flex items-center">
                  <span className="text-sm">Circulating Supply</span>
                  <TooltipProvider>
                    <UITooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3.5 w-3.5 ml-1 text-neutral-400 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Tokens available for trading in the open market</p>
                      </TooltipContent>
                    </UITooltip>
                  </TooltipProvider>
                </div>
                <span className="text-sm text-primary">{formatPercentage(circulatingPercentage)}</span>
              </div>
              <Progress value={circulatingPercentage} className="h-2" />
              <div className="text-xs text-neutral-500 mt-1">
                {formatNumber(circulatingSupply)} SKC
              </div>
            </div>
            
            {/* Locked/Reserved Supply */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <div className="flex items-center">
                  <span className="text-sm">Locked/Reserved</span>
                  <TooltipProvider>
                    <UITooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3.5 w-3.5 ml-1 text-neutral-400 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Tokens locked in vesting contracts or reserved for future use</p>
                      </TooltipContent>
                    </UITooltip>
                  </TooltipProvider>
                </div>
                <span className="text-sm text-secondary">{formatPercentage(lockedPercentage)}</span>
              </div>
              <Progress value={lockedPercentage} className="h-2 bg-neutral-200 dark:bg-neutral-700">
                <div className="h-full bg-secondary" style={{ width: `${lockedPercentage}%` }} />
              </Progress>
              <div className="text-xs text-neutral-500 mt-1">
                {formatNumber(totalSupply - circulatingSupply - burned)} SKC
              </div>
            </div>
            
            {/* Burned Supply */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <div className="flex items-center">
                  <span className="text-sm">Burned</span>
                  <TooltipProvider>
                    <UITooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3.5 w-3.5 ml-1 text-neutral-400 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Tokens permanently removed from circulation</p>
                      </TooltipContent>
                    </UITooltip>
                  </TooltipProvider>
                </div>
                <span className="text-sm text-destructive">{formatPercentage(burnedPercentage)}</span>
              </div>
              <Progress value={burnedPercentage} className="h-2 bg-neutral-200 dark:bg-neutral-700">
                <div className="h-full bg-destructive" style={{ width: `${burnedPercentage}%` }} />
              </Progress>
              <div className="text-xs text-neutral-500 mt-1">
                {formatNumber(burned)} SKC
              </div>
            </div>
          </div>
        </div>
      </Card>
      
      {/* Token Allocation */}
      <Card className="p-4">
        <h3 className="text-lg font-medium mb-4">Token Allocation</h3>
        
        <div className="flex flex-col md:flex-row">
          {/* Pie Chart */}
          <div className="w-full md:w-1/2 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={allocationData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="amount"
                  isAnimationActive={!prefersReducedMotion}
                >
                  {allocationData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<SourceTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          {/* Allocation Legend */}
          <div className="w-full md:w-1/2 p-4">
            <h4 className="text-sm font-medium mb-3">Allocation Breakdown</h4>
            <div className="space-y-3">
              {allocationData.map((entry, index) => (
                <div key={index} className="flex items-center">
                  <div 
                    className="w-3 h-3 rounded-full mr-2" 
                    style={{ backgroundColor: entry.color }}
                  />
                  <div className="flex-1">
                    <span className="text-sm">{entry.name}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">
                      {formatNumber(entry.amount)} SKC
                    </div>
                    <div className="text-xs text-neutral-500">
                      {entry.percentage}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>
      
      {/* Token Release Schedule */}
      {allocations.some(allocation => allocation.vestingSchedule) && (
        <Card className="p-4">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-lg font-medium">Token Release Schedule</h3>
            <TooltipProvider>
              <UITooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center text-xs text-neutral-500">
                    <Info className="h-3.5 w-3.5 mr-1 cursor-help" />
                    Why is this important?
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">
                    Token release schedules show when locked tokens will become available for trading,
                    which can impact market supply and potentially price action.
                  </p>
                </TooltipContent>
              </UITooltip>
            </TooltipProvider>
          </div>
          
          <div className="space-y-4">
            {allocations
              .filter(allocation => allocation.vestingSchedule)
              .map((allocation, index) => (
                <div key={index} className="border-b border-neutral-200 dark:border-neutral-700 pb-4 last:border-b-0 last:pb-0">
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center">
                      <div 
                        className="w-3 h-3 rounded-full mr-2" 
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="text-sm font-medium">{allocation.name}</span>
                    </div>
                    <span className="text-xs text-neutral-500">
                      {formatNumber(allocation.amount)} SKC total
                    </span>
                  </div>
                  
                  <div className="text-xs text-neutral-500 mb-2">
                    {allocation.vestingSchedule}
                  </div>
                  
                  {allocation.nextRelease && (
                    <div className="text-xs bg-primary-50 dark:bg-primary-900/20 text-primary p-2 rounded">
                      Next release: {allocation.nextRelease}
                    </div>
                  )}
                </div>
              ))}
          </div>
        </Card>
      )}
    </div>
  );
}
