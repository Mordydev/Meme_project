'use client';

import React, { ReactNode } from 'react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { formatPercentage, getValueColorClass } from '@/lib/format';
import { ArrowUpRight, ArrowDownRight, Info } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { motion } from 'framer-motion';
import { useReducedMotion } from '@/hooks/useReducedMotion';

interface StatCardProps {
  title: string;
  value: string | number;
  secondaryValue?: string;
  change?: number;
  changeLabel?: string;
  icon?: ReactNode;
  tooltip?: string;
  isLoading?: boolean;
  className?: string;
}

/**
 * StatCard Component
 * 
 * Displays a single market statistic in a card format.
 */
export default function StatCard({
  title,
  value,
  secondaryValue,
  change,
  changeLabel = '',
  icon,
  tooltip,
  isLoading = false,
  className
}: StatCardProps) {
  const prefersReducedMotion = useReducedMotion();
  
  // Format and display change value
  const renderChange = () => {
    if (change === undefined) return null;
    
    const isPositive = change >= 0;
    const Icon = isPositive ? ArrowUpRight : ArrowDownRight;
    
    return (
      <div className={cn("flex items-center text-sm", getValueColorClass(change))}>
        <Icon className="mr-1 h-4 w-4" />
        <span>{isPositive ? '+' : ''}{formatPercentage(change)}</span>
        {changeLabel && <span className="ml-1 text-xs text-neutral-500">({changeLabel})</span>}
      </div>
    );
  };

  return (
    <Card className={cn("p-4", className)}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center">
          {icon && (
            <div className="mr-2 h-5 w-5">
              {icon}
            </div>
          )}
          <h3 className="text-sm font-medium text-neutral-500">
            {title}
          </h3>
          {tooltip && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-3.5 w-3.5 ml-1 text-neutral-400 cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>{tooltip}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
        {renderChange()}
      </div>
      
      {isLoading ? (
        <>
          <Skeleton className="h-7 w-24 mb-1" />
          {secondaryValue && <Skeleton className="h-4 w-16" />}
        </>
      ) : (
        <>
          <motion.div 
            className="text-lg md:text-xl font-bold mb-1"
            initial={prefersReducedMotion ? {} : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {value}
          </motion.div>
          {secondaryValue && (
            <div className="text-xs text-neutral-500">
              {secondaryValue}
            </div>
          )}
        </>
      )}
    </Card>
  );
}
