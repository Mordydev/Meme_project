/**
 * JavaScript Optimization
 * Utilities for optimizing JavaScript execution and delivery
 */

import { markUserTiming } from './metrics';

/**
 * Schedules a function to run during browser idle time
 * Falls back to setTimeout for browsers without requestIdleCallback
 */
export function scheduleIdle(
  callback: () => void,
  options: { timeout?: number } = {}
): number {
  if (typeof window === 'undefined') return 0;
  
  // Use requestIdleCallback if available
  if ('requestIdleCallback' in window) {
    return window.requestIdleCallback(callback, options);
  }
  
  // Fall back to setTimeout with a reasonable default
  return window.setTimeout(callback, options.timeout || 50);
}

/**
 * Cancels a previously scheduled function
 */
export function cancelIdle(id: number): void {
  if (typeof window === 'undefined') return;
  
  if ('cancelIdleCallback' in window) {
    window.cancelIdleCallback(id);
  } else {
    window.clearTimeout(id);
  }
}

/**
 * Defers non-critical initialization until after page load
 */
export function deferInitialization(
  initFn: () => void,
  delay: number = 0
): void {
  if (typeof window === 'undefined') return;
  
  // Check if document is already loaded
  if (document.readyState === 'complete') {
    if (delay > 0) {
      setTimeout(initFn, delay);
    } else {
      scheduleIdle(initFn);
    }
    return;
  }
  
  // Otherwise wait for load event
  window.addEventListener('load', () => {
    if (delay > 0) {
      setTimeout(initFn, delay);
    } else {
      scheduleIdle(initFn);
    }
  });
}

/**
 * Creates a debounced version of a function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  immediate: boolean = false
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  
  return function(...args: Parameters<T>): void {
    const later = () => {
      timeout = null;
      if (!immediate) func(...args);
    };
    
    const callNow = immediate && !timeout;
    
    if (timeout) {
      clearTimeout(timeout);
    }
    
    timeout = setTimeout(later, wait);
    
    if (callNow) {
      func(...args);
    }
  };
}

/**
 * Creates a throttled version of a function
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let lastCall = 0;
  
  return function(...args: Parameters<T>): void {
    const now = Date.now();
    
    if (now - lastCall >= limit) {
      lastCall = now;
      func(...args);
    }
  };
}

/**
 * Dynamically imports a component with loading tracking
 */
export function lazyImportWithTiming<T>(
  importFn: () => Promise<{ default: T }>,
  componentName: string
): Promise<{ default: T }> {
  const startTime = performance.now();
  markUserTiming(`${componentName}-import-start`);
  
  return importFn().then(module => {
    const loadTime = performance.now() - startTime;
    markUserTiming(`${componentName}-import-end`);
    markUserTiming(`${componentName}-import-duration`, componentName, `${componentName}-import-start`);
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Performance] Lazy loaded ${componentName} in ${loadTime.toFixed(2)}ms`);
    }
    
    return module;
  });
}

/**
 * Batch processes DOM updates for better performance
 */
export function batchDomUpdates(updates: Array<() => void>): void {
  if (typeof window === 'undefined') return;
  
  // Use requestAnimationFrame to batch updates
  requestAnimationFrame(() => {
    // Apply all updates in the next frame
    updates.forEach(update => update());
  });
}

/**
 * Split computation across multiple frames to avoid blocking the main thread
 */
export function splitComputation<T, R>(
  items: T[],
  processFn: (item: T) => R,
  chunkSize: number = 5,
  delayBetweenChunks: number = 0
): Promise<R[]> {
  return new Promise(resolve => {
    const results: R[] = [];
    let index = 0;
    
    function processNextChunk() {
      // Process a chunk of items
      const chunk = items.slice(index, index + chunkSize);
      index += chunkSize;
      
      // Process each item in the chunk
      chunk.forEach(item => {
        results.push(processFn(item));
      });
      
      // Continue if there are more items
      if (index < items.length) {
        if (delayBetweenChunks > 0) {
          setTimeout(processNextChunk, delayBetweenChunks);
        } else {
          requestAnimationFrame(processNextChunk);
        }
      } else {
        // Resolve with all results
        resolve(results);
      }
    }
    
    // Start processing
    processNextChunk();
  });
}

/**
 * Creates a memoized version of a function
 */
export function memoize<T extends (...args: any[]) => any>(
  func: T,
  resolver?: (...args: Parameters<T>) => string
): T {
  const cache = new Map<string, ReturnType<T>>();
  
  return function(...args: Parameters<T>): ReturnType<T> {
    // Generate cache key
    const key = resolver ? resolver(...args) : JSON.stringify(args);
    
    // Return cached result if available
    if (cache.has(key)) {
      return cache.get(key) as ReturnType<T>;
    }
    
    // Otherwise compute and cache result
    const result = func(...args);
    cache.set(key, result);
    
    return result;
  } as T;
}

/**
 * Creates a function with exponential backoff retry logic
 */
export function withRetry<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    initialDelay?: number;
    maxDelay?: number;
    backoffFactor?: number;
    shouldRetry?: (error: any, retryCount: number) => boolean;
  } = {}
): () => Promise<T> {
  const {
    maxRetries = 3,
    initialDelay = 300,
    maxDelay = 5000,
    backoffFactor = 2,
    shouldRetry = () => true
  } = options;
  
  return async function(): Promise<T> {
    let retryCount = 0;
    let delay = initialDelay;
    
    while (true) {
      try {
        return await fn();
      } catch (error) {
        if (retryCount >= maxRetries || !shouldRetry(error, retryCount)) {
          throw error;
        }
        
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, delay));
        
        // Increase delay for next retry
        delay = Math.min(delay * backoffFactor, maxDelay);
        retryCount++;
      }
    }
  };
}

/**
 * Analyzes the current script execution on the page
 */
export function analyzeScripts(): { 
  total: number; 
  async: number; 
  defer: number; 
  blocking: number;
  scripts: Array<{ src: string | null; size: number; async: boolean; defer: boolean }>;
} {
  if (typeof window === 'undefined') {
    return { total: 0, async: 0, defer: 0, blocking: 0, scripts: [] };
  }
  
  const scripts = Array.from(document.querySelectorAll('script'));
  
  // Count script types
  const asyncCount = scripts.filter(s => s.hasAttribute('async')).length;
  const deferCount = scripts.filter(s => s.hasAttribute('defer')).length;
  const blockingCount = scripts.filter(s => !s.hasAttribute('async') && !s.hasAttribute('defer')).length;
  
  // Get script details
  const scriptDetails = scripts.map(script => ({
    src: script.src || null,
    size: script.textContent?.length || 0,
    async: script.hasAttribute('async'),
    defer: script.hasAttribute('defer')
  }));
  
  return {
    total: scripts.length,
    async: asyncCount,
    defer: deferCount,
    blocking: blockingCount,
    scripts: scriptDetails
  };
}

/**
 * Enables module preloading for future navigations
 */
export function enableModulePreloading(moduleUrls: string[]): void {
  if (typeof window === 'undefined') return;
  
  moduleUrls.forEach(url => {
    const link = document.createElement('link');
    link.rel = 'modulepreload';
    link.href = url;
    document.head.appendChild(link);
  });
}

/**
 * Detects long tasks and reports them for monitoring
 */
export function detectLongTasks(callback: (duration: number, taskInfo: any) => void): void {
  if (typeof window === 'undefined' || !window.PerformanceObserver) return;
  
  try {
    const observer = new PerformanceObserver(list => {
      list.getEntries().forEach(entry => {
        // entry.duration is in milliseconds
        callback(entry.duration, entry);
      });
    });
    
    // Start observing long task notifications
    observer.observe({ entryTypes: ['longtask'] });
    
    return () => observer.disconnect();
  } catch (e) {
    console.warn('Long task detection not supported in this browser');
    return () => {};
  }
}
