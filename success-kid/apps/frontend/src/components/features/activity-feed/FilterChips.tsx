'use client';

import React from 'react';

export interface FilterOption {
  id: string;
  label: string;
}

export interface FilterChipsProps {
  availableFilters: FilterOption[];
  activeFilters: string[];
  onFilterChange: (filters: string[]) => void;
  className?: string;
}

export function FilterChips({
  availableFilters,
  activeFilters,
  onFilterChange,
  className = ''
}: FilterChipsProps) {
  // Toggle a filter's active state
  const toggleFilter = (filterId: string) => {
    // Special handling for 'all' filter
    if (filterId === 'all') {
      // If 'all' is already active, do nothing
      if (activeFilters.includes('all')) return;
      
      // Otherwise activate only 'all'
      onFilterChange(['all']);
      return;
    }
    
    // If toggling a normal filter
    let newFilters: string[];
    
    // If 'all' is currently active, replace it with the selected filter
    if (activeFilters.includes('all')) {
      newFilters = [filterId];
    } else {
      if (activeFilters.includes(filterId)) {
        // Remove the filter if it's already active
        newFilters = activeFilters.filter(id => id !== filterId);
        
        // If no filters remain, activate 'all'
        if (newFilters.length === 0) {
          newFilters = ['all'];
        }
      } else {
        // Add the filter
        newFilters = [...activeFilters, filterId];
      }
    }
    
    onFilterChange(newFilters);
  };

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {availableFilters.map((filter) => (
        <button
          key={filter.id}
          className={`px-3 py-1 text-sm rounded-full transition-colors ${
            activeFilters.includes(filter.id)
              ? 'bg-primary text-white hover:bg-primary/90'
              : 'bg-muted/50 text-muted-foreground hover:bg-muted'
          }`}
          onClick={() => toggleFilter(filter.id)}
        >
          {filter.label}
        </button>
      ))}
    </div>
  );
}
