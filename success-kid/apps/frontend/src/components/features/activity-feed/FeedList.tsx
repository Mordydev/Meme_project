'use client';

import React, { useRef, useCallback, useEffect } from 'react';
import { FeedItem as FeedItemType } from './types';
import { FeedItem } from './FeedItem';

interface FeedListProps {
  items: FeedItemType[];
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  onItemSelect?: (id: string, type: string) => void;
}

/**
 * Virtualized feed list component with infinite scrolling
 */
export function FeedList({
  items,
  isLoading,
  isLoadingMore,
  hasMore,
  onLoadMore,
  onItemSelect
}: FeedListProps) {
  const loaderRef = useRef<HTMLDivElement>(null);
  
  // Intersection observer for infinite scrolling
  const observer = useCallback((node: HTMLDivElement | null) => {
    if (isLoadingMore) return;
    
    if (loaderRef.current) {
      loaderRef.current = null;
    }
    
    if (node) {
      loaderRef.current = node;
      
      const handleObserver = (entries: IntersectionObserverEntry[]) => {
        const [entry] = entries;
        if (entry.isIntersecting && hasMore) {
          onLoadMore();
        }
      };
      
      const observerInstance = new IntersectionObserver(handleObserver, {
        root: null,
        rootMargin: '100px',
        threshold: 0.1
      });
      
      observerInstance.observe(node);
    }
  }, [hasMore, isLoadingMore, onLoadMore]);
  
  // Render feed items
  return (
    <div className="space-y-4">
      {items.map((item) => (
        <FeedItem 
          key={item.id} 
          item={item}
          onSelect={onItemSelect ? () => onItemSelect(item.id, item.type) : undefined}
        />
      ))}
      
      {/* Loading more indicator */}
      {(hasMore || isLoadingMore) && (
        <div ref={observer} className="py-8 flex justify-center">
          {isLoadingMore ? (
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          ) : (
            <div className="h-8 w-8"></div> // Invisible placeholder for observer
          )}
        </div>
      )}
    </div>
  );
}

export default FeedList;
