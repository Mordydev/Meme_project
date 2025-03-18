/**
 * React Query Configuration
 * 
 * Optimized setup for React Query to handle server state efficiently
 * with proper caching, stale time, and retry strategies.
 */
import { QueryClient, DefaultOptions } from '@tanstack/react-query';
import { AxiosError } from 'axios';

/**
 * Determine if an error is retryable
 */
const isRetryableError = (error: unknown): boolean => {
  // Don't retry on 4xx errors (except 408 Request Timeout and 429 Too Many Requests)
  if (error instanceof AxiosError) {
    const status = error.response?.status;
    if (status && status >= 400 && status < 500 && status !== 408 && status !== 429) {
      return false;
    }
  }
  return true;
};

/**
 * Default options for all queries and mutations
 */
export const defaultQueryOptions: DefaultOptions = {
  queries: {
    // Global default staleTime (data considered fresh for 30 seconds)
    staleTime: 30 * 1000,
    
    // Cache time (data kept in cache for 5 minutes)
    gcTime: 5 * 60 * 1000,
    
    // Refetch data automatically when window regains focus
    refetchOnWindowFocus: true,
    
    // Don't refetch automatically on reconnect for all queries
    refetchOnReconnect: false,
    
    // Retry failed queries 3 times with exponential backoff
    retry: (failureCount, error) => {
      // Only retry if it's a retryable error and we've tried less than 3 times
      return isRetryableError(error) && failureCount < 3;
    },
    
    // Exponential backoff for retries (in ms)
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    
    // Default error handler
    onError: (error) => {
      console.error('Query error:', error);
    },
  },
  mutations: {
    // Retry mutations twice for network errors, not for 4xx errors
    retry: (failureCount, error) => {
      return isRetryableError(error) && failureCount < 2;
    },
    
    // Mutation retry with exponential backoff
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    
    // Default error handler
    onError: (error) => {
      console.error('Mutation error:', error);
    },
  },
};

/**
 * Cache time configurations for different resource types
 */
export const cacheTimeConfigs = {
  // User profile is semi-static but needs to be fresh when visited
  userProfile: {
    staleTime: 60 * 1000, // 1 minute
    gcTime: 30 * 60 * 1000, // 30 minutes
  },
  
  // Content feeds need to be fresh to show new content
  contentFeed: {
    staleTime: 20 * 1000, // 20 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
  },
  
  // Content details can be cached longer as they change less often
  contentDetails: {
    staleTime: 60 * 1000, // 1 minute
    gcTime: 15 * 60 * 1000, // 15 minutes 
  },
  
  // Leaderboards change infrequently
  leaderboards: {
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  },
  
  // Search results should not be cached long
  search: {
    staleTime: 0, // Always fetch new data
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
  },
  
  // Wallet data needs to be fresh
  wallet: {
    staleTime: 15 * 1000, // 15 seconds
    gcTime: 10 * 60 * 1000, // 10 minutes
  },
  
  // Market data needs frequent updates
  market: {
    staleTime: 10 * 1000, // 10 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
  },
  
  // Settings and preferences can be cached longer
  settings: {
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 24 * 60 * 60 * 1000, // 24 hours
  },
};

/**
 * Query client configuration 
 * Optimized for performance and user experience
 */
export const queryClient = new QueryClient({
  defaultOptions: defaultQueryOptions,
});

/**
 * Prefetch critical data on page load or navigation
 * Call this function to warm the cache for expected data needs
 */
export const prefetchCriticalData = async (userId?: string) => {
  // Don't prefetch if no user ID is available yet
  if (!userId) return;
  
  // Prefetch user profile
  queryClient.prefetchQuery({
    queryKey: ['user', userId],
    queryFn: () => fetch(`/api/users/${userId}`).then(res => res.json()),
    ...cacheTimeConfigs.userProfile,
  });
  
  // Prefetch recent content feed
  queryClient.prefetchQuery({
    queryKey: ['content', 'feed', 'recent'],
    queryFn: () => fetch('/api/content?sortBy=recent&limit=20').then(res => res.json()),
    ...cacheTimeConfigs.contentFeed,
  });
  
  // Prefetch leaderboards
  queryClient.prefetchQuery({
    queryKey: ['leaderboards', 'points', 'week'],
    queryFn: () => fetch('/api/leaderboards?type=points&timeframe=week&limit=10').then(res => res.json()),
    ...cacheTimeConfigs.leaderboards,
  });
};

export default queryClient;
