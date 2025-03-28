'use client';

import React, { useRef, useCallback, useState, useEffect } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { FeedType } from '@/types/community';
import { useFeed } from '@/hooks/useFeed';
import { ContentCard } from './ContentCard';
import { EmptyFeedState } from './EmptyFeedState';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useInView } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';

interface ContentFeedProps {
  initialCategoryId?: string;
  initialFeedType?: FeedType;
  className?: string;
}

export function ContentFeed({ 
  initialCategoryId,
  initialFeedType = 'latest',
  className 
}: ContentFeedProps) {
  const { toast } = useToast();
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
    if (isInView && !isLoading && hasMore) {
      loadMore();
    }
  }, [isInView, isLoading, hasMore, loadMore]);
  
  // Handle voting with toast notification for points
  const handleContentVote = useCallback((postId: string, direction: 'up' | 'down') => {
    handleVote(postId, direction);
    
    // Show toast notification for points earned/lost
    if (direction === 'up') {
      toast({
        title: "Points earned!",
        description: "You earned 5 Success Points for upvoting content",
        duration: 3000,
      });
    }
  }, [handleVote, toast]);
  
  if (error) {
    return (
      <Card className="p-6 text-center">
        <div className="text-red-500 mb-2">
          Error loading content
        </div>
        <p className="text-muted-foreground mb-4">
          There was a problem loading the content feed. Please try again.
        </p>
        <Button 
          onClick={() => window.location.reload()}
          variant="outline"
        >
          Refresh page
        </Button>
      </Card>
    );
  }
  
  return (
    <div className={className}>
      {isLoading && posts.length === 0 ? (
        // Initial loading state with skeletons
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <ContentCardSkeleton key={i} />
          ))}
        </div>
      ) : posts.length === 0 ? (
        // Empty state
        <EmptyFeedState categoryId={filters.categoryId} />
      ) : (
        // Posts list with virtualization
        <VirtualizedContentFeed 
          posts={posts} 
          hasMore={hasMore} 
          isLoading={isLoading} 
          onVote={handleContentVote} 
          onLoadMore={loadMore} 
        />
      )}
    </div>
  );
}

// Virtualized content feed component for performance optimization
function VirtualizedContentFeed({
  posts,
  hasMore,
  isLoading,
  onVote,
  onLoadMore
}: {
  posts: Post[];
  hasMore: boolean;
  isLoading: boolean;
  onVote: (postId: string, direction: 'up' | 'down') => void;
  onLoadMore: () => void;
}) {
  const parentRef = useRef<HTMLDivElement>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const [parentHeight, setParentHeight] = useState(600);
  
  // Update parent height on mount and window resize
  useEffect(() => {
    const updateParentHeight = () => {
      if (parentRef.current) {
        setParentHeight(window.innerHeight - parentRef.current.offsetTop - 32);
      }
    };
    
    updateParentHeight();
    window.addEventListener('resize', updateParentHeight);
    return () => window.removeEventListener('resize', updateParentHeight);
  }, []);
  
  // Set up virtualizer
  const rowVirtualizer = useVirtualizer({
    count: posts.length + 1, // +1 for the "load more" row
    getScrollElement: () => parentRef.current,
    estimateSize: (index) => index < posts.length ? 220 : 80, // Estimated post height or load more row height
    overscan: 5, // Load extra items for smoother scrolling
  });
  
  // Intersection observer for load more
  useEffect(() => {
    if (!loadMoreRef.current || !hasMore || isLoading) return;
    
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !isLoading && hasMore) {
        onLoadMore();
      }
    }, { threshold: 0.5 });
    
    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [hasMore, isLoading, onLoadMore]);
  
  return (
    <div 
      ref={parentRef} 
      className="overflow-auto" 
      style={{ height: parentHeight, width: '100%' }}
    >
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
          const index = virtualRow.index;
          const isLastRow = index === posts.length;
          
          return (
            <div
              key={isLastRow ? 'load-more' : posts[index].id}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: virtualRow.size,
                transform: `translateY(${virtualRow.start}px)`,
                padding: '8px 0',
              }}
            >
              {isLastRow ? (
                // Load more row
                <div 
                  ref={loadMoreRef} 
                  className="py-4 flex justify-center h-16 items-center"
                >
                  {isLoading ? (
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  ) : hasMore ? (
                    <Button 
                      variant="outline" 
                      onClick={onLoadMore}
                      className="min-w-32"
                    >
                      Load more
                    </Button>
                  ) : (
                    <p className="text-sm text-muted-foreground">End of feed reached</p>
                  )}
                </div>
              ) : (
                // Post card
                <ContentCard 
                  post={posts[index]} 
                  onVote={onVote}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ContentCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <div className="p-4">
        {/* Header skeleton */}
        <div className="flex items-center gap-2 mb-3">
          <Skeleton className="h-4 w-4 rounded-full" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-4 rounded-full ml-2" />
          <Skeleton className="h-4 w-20" />
        </div>
        
        {/* Title skeleton */}
        <Skeleton className="h-6 w-full mb-3" />
        <Skeleton className="h-6 w-3/4 mb-4" />
        
        {/* Content skeleton */}
        <div className="space-y-2 mb-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
        
        {/* Engagement bar skeleton */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex gap-4">
            <Skeleton className="h-6 w-16" />
            <Skeleton className="h-6 w-16" />
          </div>
          <Skeleton className="h-6 w-20" />
        </div>
      </div>
    </Card>
  );
}
