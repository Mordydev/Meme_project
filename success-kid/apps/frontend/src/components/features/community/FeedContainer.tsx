'use client';

import React, { useRef, useCallback } from 'react';
import { FeedType } from '@/types/community';
import { useFeed } from '@/hooks/useFeed';
import { FeedFilters } from './FeedFilters';
import { ContentCard } from './ContentCard';
import { EmptyFeedState } from './EmptyFeedState';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useInView } from 'framer-motion';

interface FeedContainerProps {
  initialCategoryId?: string;
  initialFeedType?: FeedType;
  className?: string;
}

export function FeedContainer({ 
  initialCategoryId,
  initialFeedType = 'latest',
  className 
}: FeedContainerProps) {
  const {
    posts,
    isLoading,
    error,
    hasMore,
    filters,
    loadMore,
    handleVote,
    changeFeedType,
    changeCategory
  } = useFeed({
    categoryId: initialCategoryId,
    feedType: initialFeedType
  });
  
  // Reference for infinite scroll
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(loadMoreRef, { once: false });
  
  // Load more posts when the load more element comes into view
  React.useEffect(() => {
    if (isInView && !isLoading) {
      loadMore();
    }
  }, [isInView, isLoading, loadMore]);
  
  return (
    <div className={className}>
      <FeedFilters 
        activeFeedType={filters.feedType} 
        onChangeFeedType={changeFeedType}
        className="mb-4"
      />
      
      {isLoading && posts.length === 0 ? (
        // Initial loading state
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-2" />
          <p className="text-muted-foreground">Loading posts...</p>
        </div>
      ) : posts.length === 0 ? (
        // Empty state
        <EmptyFeedState categoryId={filters.categoryId} />
      ) : (
        // Posts list
        <div className="space-y-4">
          {posts.map(post => (
            <ContentCard 
              key={post.id} 
              post={post} 
              onVote={handleVote}
            />
          ))}
          
          {/* Load more control */}
          <div ref={loadMoreRef} className="py-4 flex justify-center">
            {isLoading ? (
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            ) : hasMore ? (
              <Button 
                variant="outline" 
                onClick={loadMore}
              >
                Load more
              </Button>
            ) : (
              <p className="text-sm text-muted-foreground">No more posts to load</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
