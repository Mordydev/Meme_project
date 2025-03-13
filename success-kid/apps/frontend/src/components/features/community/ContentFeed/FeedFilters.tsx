'use client';

import React from 'react';
import { ContentFeedType } from '@/types';

interface FeedFiltersProps {
  feedType: ContentFeedType;
  onFeedTypeChange: (type: ContentFeedType) => void;
  availableFilters?: ContentFeedType[];
}

/**
 * Content feed filters for sorting and categorizing content
 */
export function FeedFilters({ 
  feedType, 
  onFeedTypeChange,
  availableFilters = ['latest', 'trending', 'following']
}: FeedFiltersProps) {
  // Filter labels for UI
  const filterLabels: Record<ContentFeedType, string> = {
    latest: 'Latest',
    trending: 'Popular',
    following: 'My Feed'
  };
  
  return (
    <div className="mt-6 border-b">
      <div className="flex space-x-4">
        {availableFilters.map(filter => (
          <button 
            key={filter}
            className={`pb-2 px-1 font-medium transition-colors ${
              filter === feedType 
                ? 'text-primary border-b-2 border-primary' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => onFeedTypeChange(filter)}
            aria-selected={filter === feedType}
          >
            {filterLabels[filter]}
          </button>
        ))}
      </div>
    </div>
  );
}

export default FeedFilters;
