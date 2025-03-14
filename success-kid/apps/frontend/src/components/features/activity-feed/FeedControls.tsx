'use client';

import React, { useState } from 'react';
import { FeedType, FeedFilters, FeedItemType } from './types';

interface FeedControlsProps {
  feedType: FeedType;
  filters: FeedFilters;
  onFeedTypeChange: (type: FeedType) => void;
  onFiltersChange: (filters: FeedFilters) => void;
  availableFeedTypes?: FeedType[];
}

/**
 * Controls for filtering and sorting feed content
 */
export function FeedControls({
  feedType,
  filters,
  onFeedTypeChange,
  onFiltersChange,
  availableFeedTypes = ['global', 'following', 'personal']
}: FeedControlsProps) {
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);
  
  // Feed type labels
  const feedTypeLabels: Record<FeedType, string> = {
    global: 'Everyone',
    following: 'Following',
    personal: 'Your Activity'
  };
  
  // Content type options
  const contentTypeOptions: Array<{ value: string; label: string }> = [
    { value: 'all', label: 'All Activity' },
    { value: 'post', label: 'Posts' },
    { value: 'media', label: 'Media' },
    { value: 'achievement', label: 'Achievements' },
    { value: 'activity', label: 'User Activity' }
  ];
  
  // Sort options
  const sortOptions: Array<{ value: string; label: string }> = [
    { value: 'recent', label: 'Most Recent' },
    { value: 'trending', label: 'Trending' },
    { value: 'top', label: 'Top Rated' }
  ];
  
  // Handle content type filter change
  const handleContentTypeChange = (type: string) => {
    const newTypes = type === 'all' ? ['all'] : 
      filters.types.includes(type) ? 
        filters.types.filter(t => t !== type && t !== 'all') : 
        [...filters.types.filter(t => t !== 'all'), type];
    
    // Ensure we always have at least one type selected
    const typesToUpdate = newTypes.length === 0 ? ['all'] : newTypes;
    
    onFiltersChange({
      ...filters,
      types: typesToUpdate
    });
  };
  
  // Handle sort change
  const handleSortChange = (sort: string) => {
    onFiltersChange({
      ...filters,
      sort: sort as 'recent' | 'trending' | 'top'
    });
  };
  
  // Toggle filter expanded state
  const toggleFilterExpanded = () => {
    setIsFilterExpanded(!isFilterExpanded);
  };
  
  return (
    <div className="space-y-4">
      {/* Feed Type Tabs */}
      <div className="border-b">
        <div className="flex space-x-6">
          {availableFeedTypes.map(type => (
            <button
              key={type}
              className={`pb-2 px-1 font-medium transition-colors ${
                type === feedType
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => onFeedTypeChange(type)}
              aria-selected={type === feedType}
            >
              {feedTypeLabels[type]}
            </button>
          ))}
        </div>
      </div>
      
      {/* Filters and Sort Row */}
      <div className="flex flex-wrap justify-between items-center gap-4">
        {/* Active Filters */}
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-sm text-muted-foreground">Show:</span>
          {contentTypeOptions.map(option => (
            <button
              key={option.value}
              onClick={() => handleContentTypeChange(option.value)}
              className={`px-3 py-1 text-xs rounded-full transition-colors ${
                filters.types.includes(option.value) || (option.value === 'all' && filters.types.includes('all'))
                  ? 'bg-primary/10 text-primary'
                  : 'bg-muted/40 text-muted-foreground hover:bg-muted/60'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
        
        {/* Sort Options */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Sort:</span>
          <select
            value={filters.sort}
            onChange={(e) => handleSortChange(e.target.value)}
            className="text-sm bg-transparent border border-muted px-2 py-1 rounded-md"
          >
            {sortOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      {/* Advanced Filter Panel (expandable) */}
      {isFilterExpanded && (
        <div className="p-4 mt-2 bg-muted/10 rounded-md border">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Additional filters can be added here */}
            <div className="col-span-2 text-sm text-muted-foreground">
              Advanced filtering options will be added in a future update.
            </div>
          </div>
        </div>
      )}
      
      {/* Filter Toggle Button */}
      <button
        onClick={toggleFilterExpanded}
        className="text-xs text-muted-foreground hover:text-foreground flex items-center"
      >
        {isFilterExpanded ? (
          <>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3 h-3 mr-1">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
            </svg>
            Hide advanced filters
          </>
        ) : (
          <>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3 h-3 mr-1">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </svg>
            Show advanced filters
          </>
        )}
      </button>
    </div>
  );
}

export default FeedControls;
