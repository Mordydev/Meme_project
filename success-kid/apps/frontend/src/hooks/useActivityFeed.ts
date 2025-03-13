'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useWebSocket } from '@/hooks/useWebSocket';
import { 
  FeedItem, 
  FeedFilters, 
  FeedType, 
  InteractionType, 
  ActiveFilters 
} from '@/types/activity-feed';

// Mock data generator for development
const generateMockFeedItems = (count: number, feedType: FeedType): FeedItem[] => {
  const types = ['post', 'media', 'link', 'activity', 'achievement'];
  
  const users = [
    { id: 'user1', username: 'crypto_enthusiast', displayName: 'Crypto Enthusiast', avatarUrl: '/images/avatars/user1.png' },
    { id: 'user2', username: 'success_kid_fan', displayName: 'Success Kid Fan', avatarUrl: '/images/avatars/user2.png' },
    { id: 'user3', username: 'meme_creator', displayName: 'Meme Creator', avatarUrl: '/images/avatars/user3.png' },
    { id: 'user4', username: 'token_holder', displayName: 'Token Holder', avatarUrl: '/images/avatars/user4.png' },
  ];
  
  return Array.from({ length: count }, (_, i) => {
    const randomType = types[Math.floor(Math.random() * types.length)] as FeedItem['type'];
    const randomUser = users[Math.floor(Math.random() * users.length)];
    const date = new Date();
    date.setHours(date.getHours() - Math.floor(Math.random() * 48));
    
    const interactions = {
      votes: Math.floor(Math.random() * 100),
      comments: Math.floor(Math.random() * 20),
      shares: Math.floor(Math.random() * 10)
    };
    
    const userInteractions = Math.random() > 0.5 ? {
      voted: Math.random() > 0.5 ? (Math.random() > 0.5 ? 'up' : 'down') : null,
      saved: Math.random() > 0.7,
      commented: Math.random() > 0.8
    } : undefined;
    
    // Base feed item properties
    const baseItem = {
      id: `item_${Date.now()}_${i}`,
      type: randomType,
      author: randomUser,
      createdAt: date.toISOString(),
      interactions,
      userInteractions
    };
    
    // Type-specific properties
    switch (randomType) {
      case 'post':
        return {
          ...baseItem,
          type: 'post',
          title: `Sample post ${i + 1} about Success Kid`,
          content: 'This is a sample post about the Success Kid platform. It contains text content that users can read and engage with.',
          hasMedia: false
        };
        
      case 'media':
        return {
          ...baseItem,
          type: 'media',
          title: `Media post ${i + 1}`,
          mediaUrl: '/images/placeholder.jpg',
          mediaType: Math.random() > 0.7 ? 'video' : 'image',
          aspectRatio: 16/9,
          caption: 'This is a media post with an image or video.'
        };
        
      case 'link':
        return {
          ...baseItem,
          type: 'link',
          title: `Link post ${i + 1}`,
          url: 'https://example.com/article',
          previewImage: '/images/placeholder.jpg',
          description: 'This is a shared link with a preview image and description text.',
          domain: 'example.com'
        };
        
      case 'activity':
        return {
          ...baseItem,
          type: 'activity',
          activityType: (Math.random() > 0.5 ? 'post_created' : 'comment_added') as any,
          targetId: `target_${i}`,
          targetType: 'post',
          targetTitle: 'Some post title'
        };
        
      case 'achievement':
        return {
          ...baseItem,
          type: 'achievement',
          achievementId: `achievement_${i}`,
          achievementName: 'Content Creator',
          achievementIcon: '/images/badges/content-creator.svg',
          achievementDescription: 'Created 10 posts that received engagement',
          pointsAwarded: 500
        };
        
      default:
        return {
          ...baseItem,
          type: 'post',
          title: 'Default post',
          content: 'This is a default post.',
          hasMedia: false
        } as any;
    }
  });
};

// Sort items based on sort criteria
const sortItems = (items: FeedItem[], sort: string): FeedItem[] => {
  return [...items].sort((a, b) => {
    if (sort === 'recent') {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    } else if (sort === 'trending' || sort === 'top') {
      // Sort by total interactions for 'trending' and 'top'
      const aTotal = a.interactions.votes + a.interactions.comments * 2;
      const bTotal = b.interactions.votes + b.interactions.comments * 2;
      return bTotal - aTotal;
    }
    return 0;
  });
};

// Filter items based on type filters
const filterItems = (items: FeedItem[], typeFilters: string[]): FeedItem[] => {
  // If 'all' is included, return all items
  if (typeFilters.includes('all')) {
    return items;
  }
  
  // Otherwise, filter by included types
  return items.filter(item => typeFilters.includes(item.type));
};

interface UseActivityFeedProps {
  userId?: string;
  feedType: FeedType;
  initialFilters: FeedFilters;
}

interface UseActivityFeedReturn {
  items: FeedItem[];
  isLoading: boolean;
  error: Error | null;
  hasMore: boolean;
  filters: ActiveFilters;
  newItems: FeedItem[];
  hasNewItems: boolean;
  loadMore: () => void;
  handleInteraction: (itemId: string, type: InteractionType, value?: any) => void;
  updateFilters: (newFilters: Partial<ActiveFilters>) => void;
  applyNewItems: () => void;
}

export function useActivityFeed({
  userId,
  feedType,
  initialFilters
}: UseActivityFeedProps): UseActivityFeedReturn {
  // State for feed items
  const [items, setItems] = useState<FeedItem[]>([]);
  const [newItems, setNewItems] = useState<FeedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [cursor, setCursor] = useState<string | null>(null);
  
  // State for filters
  const [filters, setFilters] = useState<ActiveFilters>({
    types: initialFilters.types || ['all'],
    sort: initialFilters.sort || 'recent',
    viewMode: initialFilters.viewMode || 'standard'
  });
  
  // Ref to track if the component is mounted
  const isMounted = useRef(true);
  
  // Connect to WebSocket for real-time updates
  const { sendMessage } = useWebSocket({
    onMessage: (event) => {
      try {
        const message = JSON.parse(event.data);
        
        if (message.type === 'feed:new_item' && message.data?.item) {
          handleNewItem(message.data.item);
        } else if (message.type === 'feed:interaction_update' && message.data?.itemId) {
          handleInteractionUpdate(
            message.data.itemId,
            message.data.updatedCounts
          );
        }
      } catch (err) {
        console.error('Error processing WebSocket message:', err);
      }
    }
  });
  
  // Handle new items from WebSocket
  const handleNewItem = useCallback((newItem: FeedItem) => {
    setNewItems(prev => [newItem, ...prev]);
  }, []);
  
  // Handle interaction updates from WebSocket
  const handleInteractionUpdate = useCallback((itemId: string, updatedCounts: any) => {
    setItems(currentItems => 
      currentItems.map(item => 
        item.id === itemId ? { ...item, interactions: updatedCounts } : item
      )
    );
    
    setNewItems(currentItems =>
      currentItems.map(item =>
        item.id === itemId ? { ...item, interactions: updatedCounts } : item
      )
    );
  }, []);
  
  // Function to fetch feed items
  const fetchFeedItems = useCallback(async (isInitial: boolean = false) => {
    try {
      setIsLoading(true);
      
      // In a real implementation, this would be an API call:
      // const response = await fetch(`/api/v1/feed?feedType=${feedType}&types=${filters.types.join(',')}&sort=${filters.sort}&cursor=${cursor || ''}`);
      // const data = await response.json();
      
      // For development, using mock data
      setTimeout(() => {
        if (!isMounted.current) return;
        
        const mockItems = generateMockFeedItems(10, feedType);
        const sortedItems = sortItems(mockItems, filters.sort);
        const filteredItems = filterItems(sortedItems, filters.types);
        
        if (isInitial) {
          setItems(filteredItems);
        } else {
          setItems(prev => [...prev, ...filteredItems]);
        }
        
        setCursor(`cursor_${Date.now()}`);
        setHasMore(true); // Always true for mock data
        setIsLoading(false);
      }, 800);
    } catch (err) {
      if (!isMounted.current) return;
      
      setError(err instanceof Error ? err : new Error('Failed to fetch feed items'));
      setIsLoading(false);
    }
  }, [feedType, filters.sort, filters.types, cursor]);
  
  // Initial fetch when component mounts or filters change
  useEffect(() => {
    fetchFeedItems(true);
  }, [fetchFeedItems]);
  
  // Set up cleanup
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);
  
  // Load more items
  const loadMore = useCallback(() => {
    if (!isLoading && hasMore) {
      fetchFeedItems();
    }
  }, [fetchFeedItems, isLoading, hasMore]);
  
  // Update filters
  const updateFilters = useCallback((newFilters: Partial<ActiveFilters>) => {
    setFilters(prev => {
      // If refresh is true, just trigger a refresh without changing filters
      if (newFilters.refresh) {
        // Schedule a refresh
        setTimeout(() => {
          if (isMounted.current) {
            fetchFeedItems(true);
          }
        }, 0);
        
        return prev;
      }
      
      // Otherwise update filters and schedule a refresh
      const updated = { ...prev, ...newFilters };
      
      // Schedule a refresh with new filters
      setTimeout(() => {
        if (isMounted.current) {
          fetchFeedItems(true);
        }
      }, 0);
      
      return updated;
    });
  }, [fetchFeedItems]);
  
  // Handle interactions
  const handleInteraction = useCallback((itemId: string, type: InteractionType, value?: any) => {
    // Update local state optimistically
    setItems(currentItems => 
      currentItems.map(item => {
        if (item.id !== itemId) return item;
        
        switch (type) {
          case 'vote':
            const direction = value as 'up' | 'down';
            const currentVote = item.userInteractions?.voted;
            
            // Calculate new vote count and state
            let voteDelta = 0;
            let newVoteState: 'up' | 'down' | null = null;
            
            if (currentVote === direction) {
              // Removing vote
              voteDelta = direction === 'up' ? -1 : 1;
              newVoteState = null;
            } else if (currentVote === null) {
              // Adding new vote
              voteDelta = direction === 'up' ? 1 : -1;
              newVoteState = direction;
            } else {
              // Changing vote direction
              voteDelta = direction === 'up' ? 2 : -2;
              newVoteState = direction;
            }
            
            return {
              ...item,
              interactions: {
                ...item.interactions,
                votes: item.interactions.votes + voteDelta
              },
              userInteractions: {
                ...(item.userInteractions || { commented: false, saved: false }),
                voted: newVoteState
              }
            };
            
          case 'save':
            const newSavedState = !(item.userInteractions?.saved || false);
            
            return {
              ...item,
              userInteractions: {
                ...(item.userInteractions || { voted: null, commented: false }),
                saved: newSavedState
              }
            };
            
          case 'comment':
            // This would typically navigate to comments or open comment form
            // Just update the userInteractions state for now
            return {
              ...item,
              userInteractions: {
                ...(item.userInteractions || { voted: null, saved: false }),
                commented: true
              }
            };
            
          case 'share':
            // Increment share count optimistically
            return {
              ...item,
              interactions: {
                ...item.interactions,
                shares: item.interactions.shares + 1
              }
            };
            
          default:
            return item;
        }
      })
    );
    
    // In a real implementation, make API call to persist interaction
    // For example:
    // fetch('/api/v1/feed/interactions', {
    //   method: 'POST',
    //   body: JSON.stringify({ itemId, type, value })
    // });
    
    // Simulate WebSocket response for demo
    setTimeout(() => {
      if (!isMounted.current) return;
      
      // Find the updated item to simulate server response
      const updatedItem = items.find(item => item.id === itemId);
      if (updatedItem) {
        // Simulate server acknowledging the interaction
        handleInteractionUpdate(itemId, updatedItem.interactions);
      }
    }, 500);
  }, [items, handleInteractionUpdate]);
  
  // Apply new items to the main feed
  const applyNewItems = useCallback(() => {
    setItems(prev => {
      // Merge and sort
      const merged = [...newItems, ...prev];
      const sorted = sortItems(merged, filters.sort);
      const filtered = filterItems(sorted, filters.types);
      return filtered;
    });
    
    // Clear new items queue
    setNewItems([]);
  }, [newItems, filters.sort, filters.types]);
  
  // Determine if there are new items to show
  const hasNewItems = newItems.length > 0;
  
  return {
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
  };
}
