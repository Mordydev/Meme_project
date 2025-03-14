'use client';

import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { FeedType, FeedFilters, FeedItem, InteractionType, FeedPreferences, FeedItemType } from '@/components/features/activity-feed/types';

/**
 * Hook to fetch activity feed items
 */
export const useFeedItems = (options: {
  feedType: FeedType;
  filters: FeedFilters;
  cursor?: string;
  limit?: number;
}) => {
  const { feedType, filters, limit = 10 } = options;

  return useInfiniteQuery({
    queryKey: ['activityFeed', feedType, filters],
    queryFn: async ({ pageParam = null }) => {
      const params = new URLSearchParams();
      
      // Add feed type
      params.append('feedType', feedType);
      
      // Add content types to filter
      filters.types.forEach(type => {
        if (type !== 'all') {
          params.append('types', type);
        }
      });
      
      // Add sort parameter
      params.append('sort', filters.sort);
      
      // Add pagination
      params.append('limit', limit.toString());
      if (pageParam) {
        params.append('cursor', pageParam);
      }
      
      const { data } = await apiClient.get(`/api/v1/feed?${params.toString()}`);
      
      return {
        items: data.data.items as FeedItem[],
        nextCursor: data.data.nextCursor,
        hasMore: data.data.hasMore
      };
    },
    getNextPageParam: (lastPage) => lastPage.hasMore ? lastPage.nextCursor : undefined,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
  });
};

/**
 * Hook to handle feed item interactions
 */
export const useFeedInteraction = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      itemId, 
      itemType, 
      interaction, 
      value 
    }: { 
      itemId: string; 
      itemType: FeedItemType; 
      interaction: InteractionType; 
      value?: any; 
    }) => {
      const { data } = await apiClient.post('/api/v1/feed/interactions', {
        data: {
          itemId,
          itemType,
          interaction,
          value
        }
      });
      
      return data.data;
    },
    // Optimistic update for interactions
    onMutate: async ({ itemId, interaction, value }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['activityFeed'] });
      
      // Update all activity feed queries with optimistic data
      queryClient.setQueriesData({ queryKey: ['activityFeed'] }, (oldData: any) => {
        if (!oldData?.pages) return oldData;
        
        return {
          ...oldData,
          pages: oldData.pages.map((page: any) => ({
            ...page,
            items: page.items.map((item: FeedItem) => {
              if (item.id === itemId) {
                // Update appropriate interaction
                const updatedItem = { ...item };
                
                if (interaction === 'vote') {
                  // Calculate vote change
                  let voteDelta = 0;
                  
                  if (value === 'up' && item.userInteractions?.voted !== 'up') {
                    voteDelta = item.userInteractions?.voted === 'down' ? 2 : 1;
                  } else if (value === 'down' && item.userInteractions?.voted !== 'down') {
                    voteDelta = item.userInteractions?.voted === 'up' ? -2 : -1;
                  } else if (value === null && item.userInteractions?.voted === 'up') {
                    voteDelta = -1;
                  } else if (value === null && item.userInteractions?.voted === 'down') {
                    voteDelta = 1;
                  }
                  
                  // Update interactions count and user state
                  updatedItem.interactions = {
                    ...updatedItem.interactions,
                    votes: updatedItem.interactions.votes + voteDelta
                  };
                  
                  if (updatedItem.userInteractions) {
                    updatedItem.userInteractions.voted = value;
                  }
                } else if (interaction === 'save') {
                  // Toggle saved state
                  if (updatedItem.userInteractions) {
                    updatedItem.userInteractions.saved = value;
                  }
                }
                
                return updatedItem;
              }
              return item;
            })
          }))
        };
      });
      
      return { itemId, interaction, value };
    },
    onError: (_, variables, context) => {
      // On error, invalidate the queries to refetch correct data
      queryClient.invalidateQueries({ queryKey: ['activityFeed'] });
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ['activityFeed'] });
    }
  });
};

/**
 * Hook to fetch feed preferences
 */
export const useFeedPreferences = () => {
  return useQuery({
    queryKey: ['feedPreferences'],
    queryFn: async () => {
      const { data } = await apiClient.get('/api/v1/feed/preferences');
      return data.data as FeedPreferences;
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
};

/**
 * Hook to update feed preferences
 */
export const useUpdateFeedPreferences = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (preferences: Partial<FeedPreferences>) => {
      const { data } = await apiClient.put('/api/v1/feed/preferences', {
        data: preferences
      });
      
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feedPreferences'] });
    }
  });
};

// Mock implementation for development until API is available
export const setupMockFeedHandlers = () => {
  // Mock handlers can be implemented here
};
