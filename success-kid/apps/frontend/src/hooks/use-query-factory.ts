/**
 * Query Hook Factory
 * Creates React Query hooks from API services
 */
import { 
  QueryKey, 
  UseQueryOptions, 
  UseMutationOptions,
  useQuery, 
  useMutation,
  useQueryClient
} from '@tanstack/react-query';

/**
 * Creates a query hook for a specific API method
 * 
 * @param queryKey Base query key
 * @param queryFn API function that returns a promise
 * @returns Hook function with proper typing
 */
export function createQueryHook<TData, TParams extends any[] = []>(
  queryKey: QueryKey,
  queryFn: (...args: TParams) => Promise<TData>
) {
  return (
    params: TParams,
    options?: Omit<UseQueryOptions<TData, Error, TData, QueryKey>, 'queryKey' | 'queryFn'>
  ) => {
    // Create a dynamic query key based on params
    const fullQueryKey = Array.isArray(queryKey) 
      ? [...queryKey, ...params]
      : [queryKey, ...params];
      
    return useQuery<TData, Error>({
      queryKey: fullQueryKey,
      queryFn: () => queryFn(...params),
      ...options
    });
  };
}

/**
 * Creates a mutation hook for a specific API method
 * 
 * @param mutationFn API function that accepts data and returns a promise
 * @returns Hook function with proper typing
 */
export function createMutationHook<TData, TVariables>(
  mutationFn: (data: TVariables) => Promise<TData>
) {
  return (
    options?: Omit<UseMutationOptions<TData, Error, TVariables>, 'mutationFn'>
  ) => {
    return useMutation<TData, Error, TVariables>({
      mutationFn,
      ...options
    });
  };
}

/**
 * Type-safe invalidation of query keys
 * 
 * @returns Object with invalidation methods
 */
export function useTypedInvalidation() {
  const queryClient = useQueryClient();
  
  return {
    /**
     * Invalidate queries by key
     * @param queryKey Query key to invalidate
     */
    invalidateQueries: (queryKey: QueryKey) => {
      return queryClient.invalidateQueries({ queryKey });
    },
    
    /**
     * Reset queries by key
     * @param queryKey Query key to reset
     */
    resetQueries: (queryKey: QueryKey) => {
      return queryClient.resetQueries({ queryKey });
    },
    
    /**
     * Set query data
     * @param queryKey Query key to update
     * @param data Data to set
     */
    setQueryData: <T>(queryKey: QueryKey, data: T) => {
      return queryClient.setQueryData<T>(queryKey, data);
    }
  };
}
