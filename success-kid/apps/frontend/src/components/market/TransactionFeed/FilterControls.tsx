'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface FilterControlsProps {
  activeFilter: string;
  onFilterChange: (filter: string) => void;
  className?: string;
}

/**
 * FilterControls Component
 * 
 * Provides filtering options for the transaction feed.
 */
export default function FilterControls({ 
  activeFilter, 
  onFilterChange,
  className 
}: FilterControlsProps) {
  const filters = [
    { id: 'all', label: 'All' },
    { id: 'buy', label: 'Buys' },
    { id: 'sell', label: 'Sells' },
    { id: 'transfer', label: 'Transfers' }
  ];

  return (
    <div className={cn("flex items-center space-x-2", className)}>
      {filters.map((filter) => (
        <button
          key={filter.id}
          className={cn(
            "px-3 py-1 text-sm rounded-md transition-colors",
            activeFilter === filter.id
              ? "bg-primary text-white"
              : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
          )}
          onClick={() => onFilterChange(filter.id)}
        >
          {filter.label}
        </button>
      ))}
    </div>
  );
}
