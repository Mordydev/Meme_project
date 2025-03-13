'use client';

import React from 'react';
import { Filter, SlidersHorizontal, RefreshCw, LayoutGrid, LayoutList } from 'lucide-react';
import { ActiveFilters } from '@/types/activity-feed';
import { FilterChips } from './FilterChips';

export interface ActivityFeedControlsProps {
  activeFilters: ActiveFilters;
  onFilterChange: (filters: Partial<ActiveFilters>) => void;
  className?: string;
}

export function ActivityFeedControls({
  activeFilters,
  onFilterChange,
  className = ''
}: ActivityFeedControlsProps) {
  const { types = ['all'], sort = 'recent', viewMode = 'standard' } = activeFilters;

  // Sort options
  const sortOptions = [
    { id: 'recent', label: 'Recent' },
    { id: 'trending', label: 'Trending' },
    { id: 'top', label: 'Top' }
  ];

  // Content type options
  const typeOptions = [
    { id: 'all', label: 'All' },
    { id: 'post', label: 'Posts' },
    { id: 'media', label: 'Media' },
    { id: 'achievement', label: 'Achievements' },
    { id: 'activity', label: 'Activity' }
  ];

  // Handle sort change
  const handleSortChange = (sortOption: string) => {
    onFilterChange({ sort: sortOption as 'recent' | 'trending' | 'top' });
  };

  // Handle content type change
  const handleTypeChange = (selectedTypes: string[]) => {
    onFilterChange({ types: selectedTypes });
  };

  // Handle view mode change
  const handleViewModeChange = () => {
    onFilterChange({ viewMode: viewMode === 'standard' ? 'compact' : 'standard' });
  };

  // Handle refresh
  const handleRefresh = () => {
    // Inform parent component to refresh the feed
    onFilterChange({ ...activeFilters, refresh: true });
  };

  return (
    <div className={`w-full ${className}`}>
      <div className="flex flex-col sm:flex-row gap-3 mb-3">
        {/* Sort selector */}
        <div className="flex bg-muted/30 border rounded-md">
          {sortOptions.map((option) => (
            <button
              key={option.id}
              className={`px-3 py-1.5 text-sm font-medium ${
                sort === option.id
                  ? 'bg-primary text-white'
                  : 'text-muted-foreground hover:bg-muted'
              } first:rounded-l-md last:rounded-r-md transition-colors`}
              onClick={() => handleSortChange(option.id)}
            >
              {option.label}
            </button>
          ))}
        </div>

        {/* View mode toggle and refresh button */}
        <div className="flex ml-auto">
          <button
            className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md mr-1"
            onClick={handleViewModeChange}
            aria-label={viewMode === 'standard' ? 'Switch to compact view' : 'Switch to standard view'}
          >
            {viewMode === 'standard' ? <LayoutGrid size={18} /> : <LayoutList size={18} />}
          </button>
          <button
            className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md"
            onClick={handleRefresh}
            aria-label="Refresh feed"
          >
            <RefreshCw size={18} />
          </button>
        </div>
      </div>

      {/* Filter chips */}
      <FilterChips
        availableFilters={typeOptions}
        activeFilters={types}
        onFilterChange={handleTypeChange}
      />
    </div>
  );
}
