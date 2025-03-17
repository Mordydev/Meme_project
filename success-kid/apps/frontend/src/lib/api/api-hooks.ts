/**
 * React Query hooks for API data fetching
 * 
 * Provides standardized hooks for common API operations that handle
 * caching, loading states, and error handling consistently.
 */
import { useQuery, useMutation, UseQueryOptions, UseMutationOptions, useQueryClient } from '@tanstack/react-query';
import { apiClient, AppError } from './api-client';

/**
 * Default stale time for queries (5 minutes)
 */
const DEFAULT_STALE_TIME = 5 * 60 * 1000;

/**
 * Hook for fetching data from the API
 */
export function useApiQuery<TData = unknown, TError = AppError>(
  key: string | any[],
  url: string,
  options?: UseQueryOptions<TData, TError> & {
    queryParams?: Record<string, any>;
  }
) {
  const queryKey = Array.isArray(key) ? key : [key];
  const queryParams = options?.queryParams;
  
  const queryUrl = queryParams
    ? `${url}${url.includes('?') ? '&' : '?'}${new URLSearchParams(
        Object.entries(queryParams)
          .filter(([_, v]) => v !== undefined && v !== null)
          .map(([k, v]) => [k, String(v)])
      ).toString()}`
    : url;
  
  return useQuery<TData, TError>({
    queryKey,
    queryFn: async () => apiClient.get<TData>(queryUrl),
    staleTime: DEFAULT_STALE_TIME,
    ...options,
  });
}

/**
 * Hook for creating data through the API
 */
export function useApiCreate<TData = unknown, TVariables = unknown, TError = AppError>(
  url: string,
  options?: UseMutationOptions<TData, TError, TVariables> & {
    invalidateQueries?: string[];
  }
) {
  const queryClient = useQueryClient();
  
  return useMutation<TData, TError, TVariables>({
    mutationFn: (variables) => apiClient.post<TData>(url, variables),
    onSuccess: (data, variables, context) => {
      // Invalidate relevant queries on success
      if (options?.invalidateQueries) {
        options.invalidateQueries.forEach(query => {
          queryClient.invalidateQueries({ queryKey: [query] });
        });
      }
      
      // Call original onSuccess if provided
      if (options?.onSuccess) {
        options.onSuccess(data, variables, context);
      }
    },
    ...options,
  });
}

/**
 * Hook for updating data through the API
 */
export function useApiUpdate<TData = unknown, TVariables = unknown, TError = AppError>(
  url: string,
  options?: UseMutationOptions<TData, TError, TVariables> & {
    invalidateQueries?: string[];
    method?: 'put' | 'patch';
  }
) {
  const queryClient = useQueryClient();
  const method = options?.method || 'put';
  
  return useMutation<TData, TError, TVariables>({
    mutationFn: (variables) => 
      method === 'put' 
        ? apiClient.put<TData>(url, variables)
        : apiClient.patch<TData>(url, variables),
    onSuccess: (data, variables, context) => {
      // Invalidate relevant queries on success
      if (options?.invalidateQueries) {
        options.invalidateQueries.forEach(query => {
          queryClient.invalidateQueries({ queryKey: [query] });
        });
      }
      
      // Call original onSuccess if provided
      if (options?.onSuccess) {
        options.onSuccess(data, variables, context);
      }
    },
    ...options,
  });
}

/**
 * Hook for deleting data through the API
 */
export function useApiDelete<TData = unknown, TVariables = unknown, TError = AppError>(
  url: string,
  options?: UseMutationOptions<TData, TError, TVariables> & {
    invalidateQueries?: string[];
  }
) {
  const queryClient = useQueryClient();
  
  return useMutation<TData, TError, TVariables>({
    mutationFn: (variables) => {
      // If variables is a string, use it as the ID in the URL
      if (typeof variables === 'string') {
        return apiClient.delete<TData>(`${url}/${variables}`);
      }
      
      // If variables is an object with an id property, use it in the URL
      if (variables && typeof variables === 'object' && 'id' in variables) {
        return apiClient.delete<TData>(`${url}/${(variables as any).id}`);
      }
      
      // Otherwise, use as is
      return apiClient.delete<TData>(url);
    },
    onSuccess: (data, variables, context) => {
      // Invalidate relevant queries on success
      if (options?.invalidateQueries) {
        options.invalidateQueries.forEach(query => {
          queryClient.invalidateQueries({ queryKey: [query] });
        });
      }
      
      // Call original onSuccess if provided
      if (options?.onSuccess) {
        options.onSuccess(data, variables, context);
      }
    },
    ...options,
  });
}

/**
 * Hook for performing optimistic updates
 */
export function useApiOptimisticUpdate<TData = unknown, TVariables = unknown, TError = AppError>(
  url: string,
  queryKey: string | string[],
  options?: UseMutationOptions<TData, TError, TVariables> & {
    method?: 'put' | 'patch';
    getOptimisticData?: (variables: TVariables, currentData: any) => any;
  }
) {
  const queryClient = useQueryClient();
  const method = options?.method || 'put';
  const keys = Array.isArray(queryKey) ? queryKey : [queryKey];
  
  return useMutation<TData, TError, TVariables>({
    mutationFn: (variables) => 
      method === 'put' 
        ? apiClient.put<TData>(url, variables)
        : apiClient.patch<TData>(url, variables),
    onMutate: async (variables) => {
      // Cancel any outgoing refetches
      await Promise.all(keys.map(key => 
        queryClient.cancelQueries({ queryKey: [key] })
      ));
      
      // Save previous values
      const previousDataMap: Record<string, any> = {};
      
      for (const key of keys) {
        previousDataMap[key] = queryClient.getQueryData([key]);
      }
      
      // Optimistically update the cache
      if (options?.getOptimisticData) {
        for (const key of keys) {
          const currentData = queryClient.getQueryData([key]);
          if (currentData) {
            const optimisticData = options.getOptimisticData(variables, currentData);
            queryClient.setQueryData([key], optimisticData);
          }
        }
      }
      
      return { previousDataMap };
    },
    onError: (err, variables, context) => {
      // Revert to previous values on error
      if (context?.previousDataMap) {
        for (const [key, data] of Object.entries(context.previousDataMap)) {
          queryClient.setQueryData([key], data);
        }
      }
      
      // Call original onError if provided
      if (options?.onError) {
        options.onError(err, variables, context);
      }
    },
    onSuccess: (data, variables, context) => {
      // Invalidate affected queries
      for (const key of keys) {
        queryClient.invalidateQueries({ queryKey: [key] });
      }
      
      // Call original onSuccess if provided
      if (options?.onSuccess) {
        options.onSuccess(data, variables, context);
      }
    },
    ...options,
  });
}

/**
 * Hook for infinite scrolling queries
 */
export function useApiInfiniteQuery<TData = unknown, TError = AppError>(
  key: string | any[],
  url: string,
  options?: UseQueryOptions<TData, TError> & {
    pageParam?: string;
    pageSizeParam?: string;
    initialPageSize?: number;
  }
) {
  const queryKey = Array.isArray(key) ? key : [key];
  const pageParam = options?.pageParam || 'page';
  const pageSizeParam = options?.pageSizeParam || 'pageSize';
  const initialPageSize = options?.initialPageSize || 20;
  
  return useQuery<TData, TError>({
    queryKey,
    queryFn: async ({ pageParam = 1 }) => {
      const queryUrl = `${url}${url.includes('?') ? '&' : '?'}${pageParam}=${pageParam}&${pageSizeParam}=${initialPageSize}`;
      return apiClient.get<TData>(queryUrl);
    },
    ...options,
  });
}
