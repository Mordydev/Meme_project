'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useQueryClient } from '@tanstack/react-query';
import { FeedItem, FeedType, FeedFilters } from './types';

interface UseRealTimeUpdatesOptions {
  feedType: FeedType;
  filters: FeedFilters;
  enabled?: boolean;
  autoMerge?: boolean;
}

interface RealTimeUpdate {
  type: 'feed:new_item' | 'feed:interaction_update';
  data: any;
}

/**
 * Custom hook for handling real-time updates to the activity feed
 */
export function useRealTimeUpdates({
  feedType,
  filters,
  enabled = true,
  autoMerge = false
}: UseRealTimeUpdatesOptions) {
  const [newItems, setNewItems] = useState<FeedItem[]>([]);
  const [hasUpdates, setHasUpdates] = useState(false);
  const queryClient = useQueryClient();
  const scrollPositionRef = useRef(0);
  
  // Connect to the WebSocket/SSE endpoint
  const { lastMessage, isConnected } = useWebSocket(
    `/api/v1/feed/live?feedType=${feedType}`,
    {
      reconnectInterval: 3000,
      maxReconnectAttempts: 10
    }
  );
  
  // Save current scroll position before updates
  const saveScrollPosition = useCallback(() => {
    if (typeof window !== 'undefined') {
      scrollPositionRef.current = window.scrollY;
    }
  }, []);
  
  // Restore scroll position after updates
  const restoreScrollPosition = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.scrollTo({
        top: scrollPositionRef.current,
        behavior: 'auto'
      });
    }
  }, []);
  
  // Process new updates from WebSocket
  useEffect(() => {
    if (!lastMessage || !enabled) return;
    
    try {
      const update = JSON.parse(lastMessage) as RealTimeUpdate;
      
      // Handle different update types
      if (update.type === 'feed:new_item') {
        const newItem = update.data.item as FeedItem;
        const applicableFeeds = update.data.feedTypes as FeedType[];
        
        // Check if this update applies to current feed type
        if (applicableFeeds.includes(feedType)) {
          // Check if the item matches current filters
          const matchesFilters = filters.types.includes('all') || 
            filters.types.includes(newItem.type);
            
          if (matchesFilters) {
            setNewItems(prev => {
              // Avoid duplicates
              if (prev.some(item => item.id === newItem.id)) {
                return prev;
              }
              return [newItem, ...prev];
            });
            
            // Show update notification if not auto-merging
            if (!autoMerge) {
              setHasUpdates(true);
            }
          }
        }
      }
      else if (update.type === 'feed:interaction_update') {
        // Update interaction counts for an item
        const { itemId, itemType, updatedCounts } = update.data;
        
        // Update the item in the query cache
        queryClient.setQueriesData({ queryKey: ['activityFeed'] }, (oldData: any) => {
          if (!oldData?.pages) return oldData;
          
          return {
            ...oldData,
            pages: oldData.pages.map((page: any) => ({
              ...page,
              items: page.items.map((item: FeedItem) => {
                if (item.id === itemId) {
                  return {
                    ...item,
                    interactions: {
                      ...item.interactions,
                      ...updatedCounts
                    }
                  };
                }
                return item;
              })
            }))
          };
        });
      }
    } catch (error) {
      console.error('Error processing feed update:', error);
    }
  }, [lastMessage, feedType, filters, autoMerge, enabled, queryClient]);
  
  // Auto-merge new items if enabled
  useEffect(() => {
    if (autoMerge && newItems.length > 0) {
      mergeUpdates();
    }
  }, [autoMerge, newItems]);
  
  // Merge new items into the feed
  const mergeUpdates = useCallback(() => {
    if (newItems.length === 0) return;
    
    saveScrollPosition();
    
    // Update the query data with new items
    queryClient.setQueriesData({ queryKey: ['activityFeed', feedType, filters] }, (oldData: any) => {
      if (!oldData?.pages || oldData.pages.length === 0) return oldData;
      
      // Add new items to the first page
      const firstPage = oldData.pages[0];
      const updatedFirstPage = {
        ...firstPage,
        items: [...newItems, ...firstPage.items]
      };
      
      const updatedPages = [
        updatedFirstPage,
        ...oldData.pages.slice(1)
      ];
      
      return {
        ...oldData,
        pages: updatedPages
      };
    });
    
    // Clear new items and update notification state
    setNewItems([]);
    setHasUpdates(false);
    
    // Restore scroll position after a short delay to ensure DOM is updated
    setTimeout(restoreScrollPosition, 50);
  }, [newItems, queryClient, feedType, filters, saveScrollPosition, restoreScrollPosition]);
  
  return {
    newItems,
    hasUpdates,
    mergeUpdates,
    isConnected
  };
}
