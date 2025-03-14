'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQuery, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import performanceMonitor from './metrics';

/**
 * Network optimization types
 */
export interface CacheOptions {
  maxAge?: number;      // Maximum age in milliseconds
  staleTime?: number;   // Stale time in milliseconds
  tags?: string[];      // Cache tags for invalidation
  prefetch?: boolean;   // Whether to prefetch this data
  revalidate?: boolean; // Whether to revalidate on window focus
}

export interface FetchOptions extends CacheOptions {
  retry?: number;       // Number of retries
  retryDelay?: number;  // Delay between retries in milliseconds
  priority?: 'high' | 'normal' | 'low'; // Request priority
}

export interface BatchRequest<T> {
  id: string;
  request: () => Promise<T>;
}

export interface CacheEntryStatus {
  cached: boolean;      // Whether data is in cache
  stale: boolean;       // Whether cached data is stale
  lastUpdated: number;  // Timestamp of last update
  tags: string[];       // Cache tags
}

export interface NetworkInfo {
  isOnline: boolean;
  isMetered: boolean;
  effectiveType: 'slow-2g' | '2g' | '3g' | '4g' | 'unknown';
  saveData: boolean;
}

/**
 * Hook to get network information
 */
export function useNetworkInfo(): NetworkInfo {
  const [networkInfo, setNetworkInfo] = useState<NetworkInfo>({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    isMetered: false,
    effectiveType: 'unknown',
    saveData: false
  });
  
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Update online status
    const handleOnline = () => {
      setNetworkInfo(prev => ({ ...prev, isOnline: true }));
      performanceMonitor.trackEvent('network', 'online', 1);
    };
    
    const handleOffline = () => {
      setNetworkInfo(prev => ({ ...prev, isOnline: false }));
      performanceMonitor.trackEvent('network', 'offline', 0);
    };
    
    // Update connection type if available
    const updateConnectionInfo = () => {
      if ('connection' in navigator) {
        const connection = (navigator as any).connection;
        
        setNetworkInfo({
          isOnline: navigator.onLine,
          isMetered: connection?.metered || false,
          effectiveType: connection?.effectiveType || 'unknown',
          saveData: connection?.saveData || false
        });
      }
    };
    
    // Set up event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Set up connection change listener if available
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      connection?.addEventListener('change', updateConnectionInfo);
    }
    
    // Initialize
    updateConnectionInfo();
    
    // Clean up
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      
      if ('connection' in navigator) {
        const connection = (navigator as any).connection;
        connection?.removeEventListener('change', updateConnectionInfo);
      }
    };
  }, []);
  
  return networkInfo;
}

/**
 * Optimized data fetching hook with network awareness
 */
export function useOptimizedQuery<T>(
  key: string | string[],
  queryFn: () => Promise<T>,
  options: UseQueryOptions<T> & {
    networkMode?: 'online' | 'offline' | 'always';
    lowDataMode?: boolean;
  } = {}
) {
  const queryClient = useQueryClient();
  const networkInfo = useNetworkInfo();
  const queryKey = Array.isArray(key) ? key : [key];
  
  // Adjust options based on network conditions
  const optimizedOptions = useMemo(() => {
    const opts = { ...options };
    
    // Adjust based on online status
    if (options.networkMode === 'online' && !networkInfo.isOnline) {
      opts.staleTime = Infinity;
      opts.cacheTime = Infinity;
      opts.retry = false;
    }
    
    // Adjust based on connection quality
    if (networkInfo.effectiveType === 'slow-2g' || networkInfo.effectiveType === '2g') {
      opts.staleTime = Math.max(options.staleTime || 0, 5 * 60 * 1000); // 5 minutes minimum
      opts.cacheTime = Math.max(options.cacheTime || 0, 60 * 60 * 1000); // 1 hour minimum
    }
    
    // Adjust for data-saving mode
    if ((options.lowDataMode || networkInfo.saveData) && networkInfo.isMetered) {
      opts.staleTime = Math.max(options.staleTime || 0, 15 * 60 * 1000); // 15 minutes minimum
      opts.refetchOnWindowFocus = false;
      opts.refetchOnReconnect = false;
    }
    
    return opts;
  }, [options, networkInfo]);
  
  // Track fetch timing
  const trackTiming = useCallback((promise: Promise<T>): Promise<T> => {
    const startTime = performance.now();
    
    return promise
      .then(result => {
        const timing = performance.now() - startTime;
        performanceMonitor.trackEvent('query', queryKey.join('/'), timing);
        return result;
      })
      .catch(error => {
        const timing = performance.now() - startTime;
        performanceMonitor.trackEvent('queryError', queryKey.join('/'), timing);
        throw error;
      });
  }, [queryKey]);
  
  // Wrap queryFn with timing
  const trackedQueryFn = useCallback(() => {
    return trackTiming(queryFn());
  }, [queryFn, trackTiming]);
  
  // Use React Query with optimized options
  return useQuery({
    queryKey,
    queryFn: trackedQueryFn,
    ...optimizedOptions
  });
}

/**
 * Cache strategy implementation
 */
export class CacheStrategy {
  private cache: Map<string, { data: any; timestamp: number; tags: string[] }> = new Map();
  private defaultMaxAge: number = 5 * 60 * 1000; // 5 minutes
  private networkInfo: NetworkInfo;
  
  constructor(networkInfo: NetworkInfo) {
    this.networkInfo = networkInfo;
  }
  
  /**
   * Get data from cache
   */
  async get<T>(key: string): Promise<T | null> {
    const cacheEntry = this.cache.get(key);
    
    if (!cacheEntry) {
      return null;
    }
    
    // Check if cache entry is expired
    const now = Date.now();
    const isExpired = now - cacheEntry.timestamp > this.defaultMaxAge;
    
    // If offline, return cached data even if expired
    if (!this.networkInfo.isOnline) {
      performanceMonitor.trackEvent('cache', 'offlineHit', now - cacheEntry.timestamp);
      return cacheEntry.data;
    }
    
    // If expired, return null
    if (isExpired) {
      performanceMonitor.trackEvent('cache', 'miss', now - cacheEntry.timestamp);
      return null;
    }
    
    // Return cached data
    performanceMonitor.trackEvent('cache', 'hit', now - cacheEntry.timestamp);
    return cacheEntry.data;
  }
  
  /**
   * Set data in cache
   */
  async set<T>(key: string, data: T, options: CacheOptions = {}): Promise<void> {
    // Record cache set event
    performanceMonitor.trackEvent('cache', 'set', 0);
    
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      tags: options.tags || []
    });
  }
  
  /**
   * Invalidate cache entries
   */
  async invalidate(key: string | RegExp): Promise<void> {
    if (typeof key === 'string') {
      // Invalidate specific key
      this.cache.delete(key);
      performanceMonitor.trackEvent('cache', 'invalidateKey', 0);
    } else {
      // Invalidate keys matching pattern
      const keys = Array.from(this.cache.keys());
      let invalidatedCount = 0;
      
      for (const cacheKey of keys) {
        if (key.test(cacheKey)) {
          this.cache.delete(cacheKey);
          invalidatedCount++;
        }
      }
      
      performanceMonitor.trackEvent('cache', 'invalidatePattern', invalidatedCount);
    }
  }
  
  /**
   * Invalidate cache entries by tag
   */
  async invalidateByTag(tag: string): Promise<void> {
    const keys = Array.from(this.cache.entries());
    let invalidatedCount = 0;
    
    for (const [key, entry] of keys) {
      if (entry.tags.includes(tag)) {
        this.cache.delete(key);
        invalidatedCount++;
      }
    }
    
    performanceMonitor.trackEvent('cache', 'invalidateTag', invalidatedCount);
  }
  
  /**
   * Get cache entry status
   */
  getStatus(key: string): CacheEntryStatus {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return {
        cached: false,
        stale: false,
        lastUpdated: 0,
        tags: []
      };
    }
    
    const now = Date.now();
    const age = now - entry.timestamp;
    
    return {
      cached: true,
      stale: age > this.defaultMaxAge,
      lastUpdated: entry.timestamp,
      tags: [...entry.tags]
    };
  }
  
  /**
   * Clear all cache entries
   */
  async clear(): Promise<void> {
    const count = this.cache.size;
    this.cache.clear();
    performanceMonitor.trackEvent('cache', 'clear', count);
  }
  
  /**
   * Update network info
   */
  updateNetworkInfo(networkInfo: NetworkInfo): void {
    this.networkInfo = networkInfo;
  }
}

/**
 * Optimized fetcher with batching, caching, and prefetching
 */
export class OptimizedFetcher {
  private cache: CacheStrategy;
  private networkInfo: NetworkInfo;
  private batchQueue: Map<string, { resolve: (value: any) => void; reject: (reason: any) => void; request: () => Promise<any> }> = new Map();
  private batchTimer: NodeJS.Timeout | null = null;
  private batchInterval: number = 50; // ms
  
  constructor(networkInfo: NetworkInfo, cache: CacheStrategy) {
    this.networkInfo = networkInfo;
    this.cache = cache;
  }
  
  /**
   * Fetch data with caching
   */
  async fetch<T>(key: string, fetchFn: () => Promise<T>, options: FetchOptions = {}): Promise<T> {
    // Try to get from cache first
    const cachedData = await this.cache.get<T>(key);
    if (cachedData !== null) {
      // If cache hit and not stale, return cached data
      return cachedData;
    }
    
    // Start timing
    const startTime = performance.now();
    
    try {
      // Fetch fresh data
      const data = await this.retryWithBackoff<T>(fetchFn, options.retry || 1, options.retryDelay || 1000);
      
      // Cache the result
      await this.cache.set(key, data, options);
      
      // Track successful fetch
      const duration = performance.now() - startTime;
      performanceMonitor.trackEvent('fetch', 'success', duration);
      
      return data;
    } catch (error) {
      // Track failed fetch
      const duration = performance.now() - startTime;
      performanceMonitor.trackEvent('fetch', 'error', duration);
      
      throw error;
    }
  }
  
  /**
   * Prefetch data
   */
  prefetch<T>(key: string, fetchFn: () => Promise<T>, options: FetchOptions = {}): void {
    // Skip prefetching if offline or in data saving mode
    if (!this.networkInfo.isOnline || this.networkInfo.saveData) {
      return;
    }
    
    // Skip if already in cache and not stale
    const status = this.cache.getStatus(key);
    if (status.cached && !status.stale) {
      return;
    }
    
    // Prefetch with low priority
    setTimeout(() => {
      this.fetch(key, fetchFn, { ...options, priority: 'low' })
        .catch(error => {
          // Silently handle prefetch errors
          console.log('Prefetch error:', error);
        });
    }, 100);
    
    // Track prefetch attempt
    performanceMonitor.trackEvent('prefetch', key, 0);
  }
  
  /**
   * Batch multiple requests together
   */
  async batch<T>(requests: BatchRequest<T>[]): Promise<T[]> {
    if (requests.length === 0) return [];
    if (requests.length === 1) return [await requests[0].request()];
    
    // Create a promise for each request
    const promises = requests.map(req => {
      return new Promise<T>((resolve, reject) => {
        this.batchQueue.set(req.id, {
          resolve,
          reject,
          request: req.request
        });
      });
    });
    
    // Start the batch timer if not already running
    if (!this.batchTimer) {
      this.batchTimer = setTimeout(() => this.processBatch(), this.batchInterval);
    }
    
    // Track batch request
    performanceMonitor.trackEvent('batch', 'queuedRequests', requests.length);
    
    // Wait for all promises to resolve
    return Promise.all(promises);
  }
  
  /**
   * Process the batch queue
   */
  private async processBatch(): void {
    this.batchTimer = null;
    
    // If no items in queue, do nothing
    if (this.batchQueue.size === 0) return;
    
    // Track batch processing
    const startTime = performance.now();
    const batchSize = this.batchQueue.size;
    
    // Copy the queue and clear it
    const queue = new Map(this.batchQueue);
    this.batchQueue.clear();
    
    // Process all requests in parallel
    const promises = Array.from(queue.entries()).map(async ([id, { resolve, reject, request }]) => {
      try {
        const result = await request();
        resolve(result);
        return { id, success: true };
      } catch (error) {
        reject(error);
        return { id, success: false };
      }
    });
    
    // Wait for all requests to complete
    const results = await Promise.allSettled(promises);
    
    // Track batch completion
    const duration = performance.now() - startTime;
    const successCount = results.filter(r => r.status === 'fulfilled').length;
    
    performanceMonitor.trackEvent('batch', 'processed', duration);
    performanceMonitor.trackEvent('batch', 'successRate', (successCount / batchSize) * 100);
  }
  
  /**
   * Retry a function with exponential backoff
   */
  private async retryWithBackoff<T>(
    fn: () => Promise<T>,
    maxRetries: number,
    initialDelay: number
  ): Promise<T> {
    let retries = 0;
    
    const execute = async (): Promise<T> => {
      try {
        return await fn();
      } catch (error) {
        if (retries >= maxRetries) {
          throw error;
        }
        
        // Exponential backoff with jitter
        const delay = initialDelay * Math.pow(2, retries) * (0.9 + Math.random() * 0.2);
        retries++;
        
        // Track retry
        performanceMonitor.trackEvent('retry', `attempt-${retries}`, delay);
        
        // Wait and retry
        await new Promise(resolve => setTimeout(resolve, delay));
        return execute();
      }
    };
    
    return execute();
  }
  
  /**
   * Update network info
   */
  updateNetworkInfo(networkInfo: NetworkInfo): void {
    this.networkInfo = networkInfo;
    this.cache.updateNetworkInfo(networkInfo);
  }
}

/**
 * Create fetcher instance
 */
export function createOptimizedFetcher(): OptimizedFetcher {
  // Get network info
  const networkInfo: NetworkInfo = {
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    isMetered: false,
    effectiveType: 'unknown',
    saveData: false
  };
  
  // Update network info if connection API is available
  if (typeof navigator !== 'undefined' && 'connection' in navigator) {
    const connection = (navigator as any).connection;
    
    if (connection) {
      networkInfo.isMetered = connection.metered || false;
      networkInfo.effectiveType = connection.effectiveType || 'unknown';
      networkInfo.saveData = connection.saveData || false;
    }
  }
  
  // Create cache strategy
  const cache = new CacheStrategy(networkInfo);
  
  // Create and return fetcher
  return new OptimizedFetcher(networkInfo, cache);
}

/**
 * Hook to get an optimized fetcher instance
 */
export function useOptimizedFetcher(): OptimizedFetcher {
  const networkInfo = useNetworkInfo();
  const fetcherRef = useRef<OptimizedFetcher | null>(null);
  
  if (!fetcherRef.current) {
    fetcherRef.current = createOptimizedFetcher();
  }
  
  // Update network info when it changes
  useEffect(() => {
    if (fetcherRef.current) {
      fetcherRef.current.updateNetworkInfo(networkInfo);
    }
  }, [networkInfo]);
  
  return fetcherRef.current;
}

/**
 * Cache-first data fetching hook
 */
export function useCachedFetch<T>(
  key: string,
  fetchFn: () => Promise<T>,
  options: FetchOptions = {}
): { data: T | null; loading: boolean; error: Error | null; refetch: () => Promise<T> } {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const fetcher = useOptimizedFetcher();
  const networkInfo = useNetworkInfo();
  
  // Adjust options based on network conditions
  const optimizedOptions = useMemo(() => {
    const opts = { ...options };
    
    // Extend cache duration for poor connections
    if (networkInfo.effectiveType === 'slow-2g' || networkInfo.effectiveType === '2g') {
      opts.maxAge = Math.max(options.maxAge || 5 * 60 * 1000, 15 * 60 * 1000); // At least 15 minutes
    }
    
    // Extend cache duration for metered connections with data saving
    if (networkInfo.saveData && networkInfo.isMetered) {
      opts.maxAge = Math.max(options.maxAge || 5 * 60 * 1000, 60 * 60 * 1000); // At least 1 hour
    }
    
    return opts;
  }, [options, networkInfo]);
  
  // Fetch data
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await fetcher.fetch(key, fetchFn, optimizedOptions);
      setData(result);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch data'));
      throw err;
    } finally {
      setLoading(false);
    }
  }, [key, fetchFn, fetcher, optimizedOptions]);
  
  // Initial fetch
  useEffect(() => {
    fetchData().catch(error => {
      console.error('Error fetching data:', error);
    });
    
    // Prefetch if specified
    if (optimizedOptions.prefetch) {
      fetcher.prefetch(key, fetchFn, optimizedOptions);
    }
  }, [key, fetchFn, fetcher, fetchData, optimizedOptions]);
  
  return { data, loading, error, refetch: fetchData };
}

/**
 * Resource prefetching hook
 */
export function usePrefetch<T>(
  key: string,
  fetchFn: () => Promise<T>,
  options: FetchOptions = {}
): void {
  const fetcher = useOptimizedFetcher();
  const networkInfo = useNetworkInfo();
  
  // Skip prefetching if offline, in data saving mode, or if the user has a poor connection
  const shouldPrefetch = useMemo(() => {
    if (!networkInfo.isOnline || networkInfo.saveData) {
      return false;
    }
    
    // Skip prefetching for very slow connections
    if (networkInfo.effectiveType === 'slow-2g') {
      return false;
    }
    
    return true;
  }, [networkInfo]);
  
  useEffect(() => {
    if (shouldPrefetch) {
      fetcher.prefetch(key, fetchFn, options);
    }
  }, [key, fetchFn, options, fetcher, shouldPrefetch]);
}

/**
 * Offline-first data fetching hook
 */
export function useOfflineFirst<T>(
  key: string,
  fetchFn: () => Promise<T>,
  fallbackData: T,
  options: FetchOptions = {}
): { data: T; loading: boolean; error: Error | null; isOfflineData: boolean } {
  const [data, setData] = useState<T>(fallbackData);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [isOfflineData, setIsOfflineData] = useState<boolean>(false);
  const fetcher = useOptimizedFetcher();
  const networkInfo = useNetworkInfo();
  
  useEffect(() => {
    let isMounted = true;
    
    const fetchData = async () => {
      setLoading(true);
      
      try {
        // For offline mode, just use the fallback data
        if (!networkInfo.isOnline) {
          if (isMounted) {
            setIsOfflineData(true);
            setData(fallbackData);
          }
          return;
        }
        
        // Otherwise, try to fetch fresh data
        const result = await fetcher.fetch(key, fetchFn, options);
        
        if (isMounted) {
          setData(result);
          setIsOfflineData(false);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('Failed to fetch data'));
          setIsOfflineData(true);
          setData(fallbackData);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    
    fetchData();
    
    return () => {
      isMounted = false;
    };
  }, [key, fetchFn, fallbackData, fetcher, networkInfo.isOnline, options]);
  
  return { data, loading, error, isOfflineData };
}
