'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { FeedList } from './FeedList';
import { FeedControls } from './FeedControls';
import { EmptyFeedState } from './EmptyFeedState';
import { UpdateNotification } from './UpdateNotification';
import { useRealTimeUpdates } from './useRealTimeUpdates';
import { useFeedItems } from '@/hooks/queries/useActivityFeed';
import { FeedType, FeedFilters } from './types';

interface FeedContainerProps {
  initialFeedType?: FeedType;
  initialFilters?: FeedFilters;
  userId?: string;
  onItemSelect?: (id: string, type: string) => void;
}

/**
 * Activity feed container component
 * Manages feed state, data fetching, and real-time updates
 */
export function FeedContainer({
  initialFeedType = 'global',
  initialFilters = { types: ['all'], sort: 'recent' },
  userId,
  onItemSelect
}: FeedContainerProps) {
  // Feed state
  const [feedType, setFeedType] = useState<FeedType>(initialFeedType);
  const [filters, setFilters] = useState<FeedFilters>(initialFilters);
  const listRef = useRef<HTMLDivElement>(null);
  
  // Fetch feed data
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    refetch
  } = useFeedItems({
    feedType,
    filters,
  });
  
  // Set up real-time updates
  const {
    hasUpdates,
    mergeUpdates,
    isConnected: isRealtimeConnected
  } = useRealTimeUpdates({
    feedType,
    filters,
    enabled: true,
    autoMerge: false
  });
  
  // Process data for the feed list
  const feedItems = data?.pages.flatMap(page => page.items) || [];
  const isEmpty = !isLoading && !isError && feedItems.length === 0;
  
  // Handle feed type changes
  const handleFeedTypeChange = useCallback((newType: FeedType) => {
    setFeedType(newType);
  }, []);
  
  // Handle filter changes
  const handleFiltersChange = useCallback((newFilters: FeedFilters) => {
    setFilters(newFilters);
  }, []);
  
  // Handle loading more items
  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);
  
  // Scroll to top when filters change
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [feedType, filters]);
  
  return (
    <div className="relative space-y-4">
      {/* Feed Controls */}
      <FeedControls
        feedType={feedType}
        filters={filters}
        onFeedTypeChange={handleFeedTypeChange}
        onFiltersChange={handleFiltersChange}
      />
      
      {/* Update Notification */}
      {hasUpdates && (
        <UpdateNotification 
          onClick={mergeUpdates} 
          position="top"
        />
      )}
      
      {/* Loading state */}
      {isLoading && (
        <div className="py-12 flex justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
        </div>
      )}
      
      {/* Error state */}
      {isError && (
        <div className="py-12 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 text-alert/60 mx-auto mb-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
          <h3 className="text-lg font-medium mb-2">Failed to load activity feed</h3>
          <p className="text-muted-foreground mb-6">There was a problem loading the feed content.</p>
          <button 
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md" 
            onClick={() => refetch()}
          >
            Try Again
          </button>
        </div>
      )}
      
      {/* Empty state */}
      {isEmpty && (
        <EmptyFeedState 
          feedType={feedType} 
          filters={filters}
        />
      )}
      
      {/* Feed list */}
      {!isLoading && !isError && feedItems.length > 0 && (
        <div ref={listRef}>
          <FeedList
            items={feedItems}
            isLoading={isLoading}
            hasMore={!!hasNextPage}
            onLoadMore={handleLoadMore}
            isLoadingMore={isFetchingNextPage}
            onItemSelect={onItemSelect}
          />
        </div>
      )}
    </div>
  );
}

export default FeedContainer;
