'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ContentCard } from './ContentCard';
import { FeedFilters } from './FeedFilters';
import { EmptyState } from './EmptyState';
import { ContentFeedType, Category } from '@/types';
import { usePostsFeed } from '@/hooks/queries/useCommunity';
import { useRouter } from 'next/navigation';

interface FeedContainerProps {
  initialFeedType?: ContentFeedType;
  categoryId?: string;
  category?: Category;
  onCreatePost?: () => void;
}

/**
 * Main feed container for displaying community content
 */
export function FeedContainer({ 
  initialFeedType = 'latest',
  categoryId, 
  category,
  onCreatePost
}: FeedContainerProps) {
  const router = useRouter();
  const [feedType, setFeedType] = useState<ContentFeedType>(initialFeedType);
  const [page, setPage] = useState(0);
  const loader = useRef<HTMLDivElement>(null);
  const pageSize = 10;
  
  // Fetch posts based on current filters
  const { 
    data,
    isLoading, 
    isError,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage
  } = usePostsFeed({
    categoryId,
    feed: feedType,
    limit: pageSize,
    offset: page * pageSize
  });
  
  // Handle feed type changes
  const handleFeedTypeChange = (newType: ContentFeedType) => {
    setFeedType(newType);
    setPage(0); // Reset pagination when changing feed type
  };
  
  // Handle post selection
  const handleSelectPost = (postId: string) => {
    router.push(`/community/post/${postId}`);
  };
  
  // Infinite scrolling with Intersection Observer
  const handleObserver = useCallback((entries: IntersectionObserverEntry[]) => {
    const [entry] = entries;
    if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
      fetchNextPage().then(() => {
        setPage(prev => prev + 1);
      });
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  useEffect(() => {
    const options = {
      root: null,
      rootMargin: '20px',
      threshold: 0.1
    };
    
    const observer = new IntersectionObserver(handleObserver, options);
    
    if (loader.current) {
      observer.observe(loader.current);
    }
    
    return () => {
      if (loader.current) {
        observer.unobserve(loader.current);
      }
    };
  }, [handleObserver]);

  const posts = data?.posts || [];
  const isEmpty = !isLoading && !isError && posts.length === 0;
  
  return (
    <div>
      {/* Feed Filters */}
      <FeedFilters 
        feedType={feedType} 
        onFeedTypeChange={handleFeedTypeChange} 
      />
      
      {/* Loading state */}
      {isLoading && (
        <div className="py-16 flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      )}
      
      {/* Error state */}
      {isError && (
        <div className="py-16 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 text-alert/60 mx-auto mb-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
          <h3 className="text-lg font-medium mb-2">Failed to load posts</h3>
          <p className="text-muted-foreground mb-6">There was a problem loading the content.</p>
          <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md" onClick={() => window.location.reload()}>
            Try Again
          </button>
        </div>
      )}
      
      {/* Empty state */}
      {isEmpty && (
        <EmptyState 
          feedType={feedType} 
          categoryName={category?.name}
          onCreatePost={onCreatePost}
        />
      )}
      
      {/* Posts grid */}
      {!isLoading && !isError && posts.length > 0 && (
        <div className="mt-6 space-y-6">
          {posts.map(post => (
            <ContentCard 
              key={post.id} 
              post={post}
              onSelect={handleSelectPost}
            />
          ))}
          
          {/* Loading more indicator */}
          {(hasNextPage || isFetchingNextPage) && (
            <div ref={loader} className="py-8 flex justify-center">
              {isFetchingNextPage ? (
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
              ) : (
                <div className="h-8 w-8"></div> // Invisible placeholder for observer
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default FeedContainer;
