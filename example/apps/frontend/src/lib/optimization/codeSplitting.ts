'use client';

import React, { lazy, ComponentType, LazyExoticComponent } from 'react';

/**
 * Options for lazy loading components
 */
interface LazyLoadOptions {
  fallback?: React.ReactNode;
  preload?: boolean;
  ssr?: boolean;
  minDelay?: number;
}

/**
 * Enhanced lazy loading utility with additional options
 * @param factory The component import function
 * @param options Configuration options
 * @returns Lazy-loaded component
 */
export function lazyLoad<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>,
  options: LazyLoadOptions = {}
): LazyExoticComponent<T> {
  const { preload = false, minDelay = 0 } = options;
  
  // Wrap the import with a minimum delay for consistent loading experience
  const enhancedFactory = async () => {
    const start = Date.now();
    
    // Load the component
    const result = await factory();
    
    // Respect minimum delay if specified
    if (minDelay > 0) {
      const elapsed = Date.now() - start;
      const remainingDelay = minDelay - elapsed;
      
      if (remainingDelay > 0) {
        await new Promise(resolve => setTimeout(resolve, remainingDelay));
      }
    }
    
    return result;
  };
  
  // Create the lazy component
  const LazyComponent = lazy(enhancedFactory);
  
  // Preload if requested
  if (preload && typeof window !== 'undefined') {
    // Schedule preloading after main content loads
    setTimeout(() => {
      factory();
    }, 1000);
  }
  
  return LazyComponent;
}

/**
 * Split components by importance to optimize loading
 * @param components Map of components with their importance levels
 * @returns Object with components organized by importance
 */
export function splitByImportance<T extends Record<string, ComponentType<any>>>(
  components: T & { [K in keyof T]: { importance: 'critical' | 'high' | 'medium' | 'low' } }
) {
  const critical: Partial<typeof components> = {};
  const high: Partial<typeof components> = {};
  const medium: Partial<typeof components> = {};
  const low: Partial<typeof components> = {};
  
  Object.entries(components).forEach(([key, value]) => {
    switch (value.importance) {
      case 'critical':
        critical[key] = value;
        break;
      case 'high':
        high[key] = value;
        break;
      case 'medium':
        medium[key] = value;
        break;
      case 'low':
        low[key] = value;
        break;
    }
  });
  
  return { critical, high, medium, low };
}

/**
 * Dynamically import non-critical modules
 * @param path The module path to import
 */
export function dynamicImport<T>(path: string): Promise<T> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      // In SSR, just resolve with an empty object
      resolve({} as T);
      return;
    }
    
    // Use requestIdleCallback if available for better performance
    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(() => {
        import(/* webpackChunkName: "[request]" */ `${path}`)
          .then(module => resolve(module))
          .catch(error => {
            console.error(`Failed to load module: ${path}`, error);
            resolve({} as T);
          });
      });
    } else {
      // Fallback to setTimeout
      setTimeout(() => {
        import(/* webpackChunkName: "[request]" */ `${path}`)
          .then(module => resolve(module))
          .catch(error => {
            console.error(`Failed to load module: ${path}`, error);
            resolve({} as T);
          });
      }, 1000);
    }
  });
}

/**
 * Prefetch a component or module for future use
 * @param path The module path to prefetch
 */
export function prefetch(path: string): void {
  if (typeof window === 'undefined') return;
  
  // Use requestIdleCallback if available
  if ('requestIdleCallback' in window) {
    (window as any).requestIdleCallback(() => {
      import(/* webpackPrefetch: true */ `${path}`);
    });
  } else {
    // Fallback to setTimeout with a delay
    setTimeout(() => {
      import(/* webpackPrefetch: true */ `${path}`);
    }, 2000);
  }
}

/**
 * Create an async-loaded component wrapper with loading state
 */
export function createAsyncComponent<P>(
  importFn: () => Promise<{ default: React.ComponentType<P> }>,
  LoadingComponent: React.ComponentType<any> = () => <div>Loading...</div>
) {
  const LazyComponent = lazy(importFn);
  
  return function AsyncComponent(props: P) {
    return (
      <React.Suspense fallback={<LoadingComponent />}>
        <LazyComponent {...props} />
      </React.Suspense>
    );
  };
}
