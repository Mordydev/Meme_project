import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import {
  SearchResponse,
  SuggestionResponse,
  SearchFilters,
  SearchSortOption,
  SavedSearch,
  FilterGroup,
  DiscoveryFeedResponse,
  UserRecommendationsResponse
} from '@/types';
import { useCallback } from 'react';
import { useDebounce } from '@/hooks/useDebounce';

/**
 * Hook for executing search queries
 */
export function useSearch(options: {
  query: string;
  page?: number;
  limit?: number;
  filters?: SearchFilters;
  sort?: SearchSortOption;
  enabled?: boolean;
}) {
  const { query, page = 1, limit = 20, filters, sort = 'relevance', enabled = true } = options;
  
  return useQuery({
    queryKey: ['search', { query, page, limit, filters, sort }],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('q', query);
      params.append('page', page.toString());
      params.append('limit', limit.toString());
      params.append('sort', sort);
      
      // Add filters
      if (filters) {
        if (filters.types?.length) params.append('types', filters.types.join(','));
        if (filters.categories?.length) params.append('categories', filters.categories.join(','));
        if (filters.tags?.length) params.append('tags', filters.tags.join(','));
        
        // Date range filters
        if (filters.dateRange?.start) params.append('dateFrom', filters.dateRange.start);
        if (filters.dateRange?.end) params.append('dateTo', filters.dateRange.end);
        
        // Add any other custom filters
        Object.entries(filters).forEach(([key, value]) => {
          if (
            key !== 'types' && 
            key !== 'categories' && 
            key !== 'tags' && 
            key !== 'dateRange' &&
            value !== undefined
          ) {
            params.append(key, String(value));
          }
        });
      }
      
      const { data } = await apiClient.get<SearchResponse>(`/api/v1/search?${params.toString()}`);
      return data;
    },
    enabled: enabled && query.trim().length >= 2, // Only search with at least 2 characters
  });
}

/**
 * Hook for getting search suggestions as the user types
 */
export function useSearchSuggestions(query: string, options?: { limit?: number }) {
  const { limit = 5 } = options || {};
  const debouncedQuery = useDebounce(query, 300);
  
  return useQuery({
    queryKey: ['search-suggestions', debouncedQuery, limit],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('q', debouncedQuery);
      params.append('limit', limit.toString());
      
      const { data } = await apiClient.get<SuggestionResponse>(`/api/v1/search/suggestions?${params.toString()}`);
      return data;
    },
    enabled: debouncedQuery.trim().length >= 2, // Only fetch suggestions with at least 2 characters
    staleTime: 10 * 1000, // Suggestions remain fresh for 10 seconds
  });
}

/**
 * Hook for fetching available search filters
 */
export function useSearchFilters() {
  return useQuery({
    queryKey: ['search-filters'],
    queryFn: async () => {
      const { data } = await apiClient.get<{ filters: FilterGroup[] }>('/api/v1/search/filters');
      return data.filters;
    },
    staleTime: 5 * 60 * 1000, // Filters remain fresh for 5 minutes
  });
}

/**
 * Hook for managing saved searches
 */
export function useSavedSearches() {
  const queryClient = useQueryClient();
  
  // Fetch saved searches
  const query = useQuery({
    queryKey: ['saved-searches'],
    queryFn: async () => {
      const { data } = await apiClient.get<{ searches: SavedSearch[] }>('/api/v1/search/saved');
      return data.searches;
    },
  });
  
  // Save a search
  const saveSearch = useMutation({
    mutationFn: async (search: { name: string; query: string; filters?: SearchFilters; sort?: SearchSortOption }) => {
      const { data } = await apiClient.post<{ search: SavedSearch }>('/api/v1/search/saved', { data: search });
      return data.search;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-searches'] });
    },
  });
  
  // Delete a saved search
  const deleteSearch = useMutation({
    mutationFn: async (searchId: string) => {
      await apiClient.delete(`/api/v1/search/saved/${searchId}`);
      return { id: searchId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-searches'] });
    },
  });
  
  return {
    ...query,
    saveSearch,
    deleteSearch,
  };
}

/**
 * Hook for tracking search analytics
 */
export function useSearchAnalytics() {
  const trackQuery = useCallback((query: string, resultCount: number, filters?: SearchFilters) => {
    // Send analytics data
    apiClient.post('/api/v1/analytics/search', {
      data: {
        query,
        resultCount,
        filters,
        timestamp: new Date().toISOString(),
      }
    }).catch(error => {
      console.error('Failed to track search query', error);
    });
  }, []);
  
  const trackResultClick = useCallback((query: string, resultId: string, position: number) => {
    // Send analytics data
    apiClient.post('/api/v1/analytics/search/click', {
      data: {
        query,
        resultId,
        position,
        timestamp: new Date().toISOString(),
      }
    }).catch(error => {
      console.error('Failed to track search result click', error);
    });
  }, []);
  
  return {
    trackQuery,
    trackResultClick,
  };
}

/**
 * Hook for fetching discovery feed
 */
export function useDiscoveryFeed(options?: {
  interests?: string[];
  excludeIds?: string[];
  limit?: number;
}) {
  const { interests, excludeIds, limit = 20 } = options || {};
  
  return useQuery({
    queryKey: ['discovery-feed', { interests, excludeIds, limit }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (interests?.length) params.append('interests', interests.join(','));
      if (excludeIds?.length) params.append('excludeIds', excludeIds.join(','));
      params.append('limit', limit.toString());
      
      const { data } = await apiClient.get<DiscoveryFeedResponse>(`/api/v1/discovery/feed?${params.toString()}`);
      return data;
    },
  });
}

/**
 * Hook for fetching user recommendations
 */
export function useUserRecommendations(options?: {
  limit?: number;
  excludeFollowing?: boolean;
}) {
  const { limit = 5, excludeFollowing = true } = options || {};
  
  return useQuery({
    queryKey: ['user-recommendations', { limit, excludeFollowing }],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('limit', limit.toString());
      params.append('excludeFollowing', excludeFollowing.toString());
      
      const { data } = await apiClient.get<UserRecommendationsResponse>(`/api/v1/discovery/users?${params.toString()}`);
      return data.users;
    },
  });
}
