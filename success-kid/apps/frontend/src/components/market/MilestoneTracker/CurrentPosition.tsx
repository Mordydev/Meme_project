'use client';

import React from 'react';
import { formatCurrency } from '@/lib/format';
import { NextMilestone } from '@/types';

interface CurrentPositionProps {
  current: number;
  next: NextMilestone | null;
  className?: string;
}

/**
 * CurrentPosition Component
 * 
 * Shows the current market cap position and progress toward the next milestone.
 */
export default function CurrentPosition({ current, next, className }: CurrentPositionProps) {
  // Calculate percentage to next milestone
  const calculateProgressPercentage = () => {
    if (!next) return 100; // All milestones complete
    
    return Math.min(Math.round((current / next.value) * 100), 100);
  };
  
  const progressPercentage = calculateProgressPercentage();

  return (
    <div className={`text-center ${className || ''}`}>
      <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
        {next ? (
          <>
            Current Progress: {formatCurrency(current, 0)} / {formatCurrency(next.value, 0)} to next milestone ({progressPercentage}%)
          </>
        ) : (
          <>
            All milestones achieved! Current market cap: {formatCurrency(current, 0)}
          </>
        )}
      </span>
    </div>
  );
}
