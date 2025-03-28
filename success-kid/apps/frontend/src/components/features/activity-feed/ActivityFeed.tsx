'use client';

import React, { useRef, useEffect, useState } from 'react';
import { useInView } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { FeedItem, FeedPreferences } from '@/types/activity-feed';
import { useActivityFeed } from '@/hooks/useActivityFeed';
import { ActivityFeedControls } from './ActivityFeedControls';
import { ActivityFeedList } from './ActivityFeedList';
import { EmptyFeedState } from './EmptyFeedState';
import { UpdateNotification } from './UpdateNotification';
import { FeedPersonalization } from './FeedPersonalization';

export interface ActivityFeedProps {
  userId?: string;
  initialFeedType?: 'global' | 'following' | 'personal';
  initialFilters?: {
    types?: string[];
    sort?: 'recent' | 'trending' | 'top';
  };
  className?: string;
  isCompact?: boolean;
}

export function ActivityFeed({
  userId,
  initialFeedType = 'global',
  initialFilters = { types: ['all'], sort: 'recent' },
  className = '',
  isCompact = false
}: ActivityFeedProps) {
  // Default preferences
  const [preferences, setPreferences] = useState<FeedPreferences>({
    interests: ['community', 'memes', 'success'],
    followedUsers: userId ? [userId] : [],
    contentTypes: initialFilters.types || ['all'],
    viewMode: isCompact ? 'compact' : 'standard'
  });

  const {
    items,
    isLoading,
    error,
    hasMore,
    filters,
    newItems,
    hasNewItems,
    loadMore,
    handleInteraction,
    updateFilters,
    applyNewItems
  } = useActivityFeed({
    userId,
    feedType: initialFeedType,
    initialFilters
  });

  // Reference for infinite scroll
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(loadMoreRef, { once: false });
  
  // Load more items when the load more element comes into view
  useEffect(() => {
    if (isInView && !isLoading && hasMore) {
      loadMore();
    }
  }, [isInView, isLoading, hasMore, loadMore]);

  // Handle preference changes
  const handlePreferencesChanged = (newPreferences: FeedPreferences) => {
    setPreferences(newPreferences);
    
    // Update filters based on preferences
    updateFilters({
      types: newPreferences.contentTypes,
      viewMode: newPreferences.viewMode
    });
  };

  return (
    <div className={`w-full ${className}`}>
      {/* Feed Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
        <ActivityFeedControls
          activeFilters={filters}
          onFilterChange={updateFilters}
        />
        
        {/* Feed Personalization */}
        <FeedPersonalization 
          preferences={preferences}
          onPreferencesChanged={handlePreferencesChanged}
        />
      </div>
      
      {/* New Items Notification */}
      {hasNewItems && (
        <UpdateNotification
          count={newItems.length}
          onClick={applyNewItems}
          className="mb-4"
        />
      )}
      
      {/* Feed Content */}
      {isLoading && items.length === 0 ? (
        // Initial loading state
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-2" />
          <p className="text-muted-foreground">Loading activity feed...</p>
        </div>
      ) : items.length === 0 ? (
        // Empty state
        <EmptyFeedState feedType={initialFeedType} />
      ) : (
        // Items list
        <div className="space-y-4">
          <ActivityFeedList
            items={items}
            onInteraction={handleInteraction}
            isCompact={filters.viewMode === 'compact'}
          />
          
          {/* Load more control */}
          <div ref={loadMoreRef} className="py-4 flex justify-center">
            {isLoading ? (
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            ) : hasMore ? (
              <button
                className="px-4 py-2 text-sm font-medium text-primary bg-transparent border border-primary rounded-md hover:bg-primary/5"
                onClick={loadMore}
              >
                Load more
              </button>
            ) : (
              <p className="text-sm text-muted-foreground">No more items to load</p>
            )}
          </div>
        </div>
      )}
      
      {/* Error state */}
      {error && (
        <div className="p-4 bg-red-50 text-red-800 rounded-md mt-4">
          <p className="font-medium">Error loading feed</p>
          <p className="text-sm">{error.message}</p>
        </div>
      )}
    </div>
  );
}
