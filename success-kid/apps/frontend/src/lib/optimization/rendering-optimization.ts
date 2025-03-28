/**
 * Rendering Optimization Utilities
 * 
 * Provides utilities for optimizing React rendering performance
 * with a focus on Server Components and optimal rendering strategies.
 */

import { cache } from 'react';

/**
 * Cache key for route-specific data
 */
export type RouteDataCacheKey = {
  /** Route path */
  path: string;
  
  /** User ID for user-specific data */
  userId?: string;
  
  /** Unique identifier for the specific data type */
  dataType: string;
  
  /** Additional parameters for cache key */
  params?: Record<string, string | number | boolean>;
};

/**
 * Cache fetch function results with route-specific caching strategy
 * 
 * @param fetcher Function that fetches data
 * @returns Cached fetcher function
 */
export function cacheFetchData<T, Args extends any[]>(
  fetcher: (...args: Args) => Promise<T>
): (...args: Args) => Promise<T> {
  return cache(fetcher);
}

/**
 * Determine optimal rendering strategy for a page or component
 * 
 * @param options Rendering strategy options
 * @returns Recommended rendering strategy
 */
export function determineRenderingStrategy(
  options: {
    /** Whether data is frequently updated */
    frequentDataUpdates?: boolean;
    
    /** Whether page requires authentication */
    requiresAuth?: boolean;
    
    /** Whether page contains highly dynamic content */
    highlyDynamic?: boolean;
    
    /** Whether page is SEO-critical */
    seoCritical?: boolean;
    
    /** Whether page is in core user journey */
    coreUserJourney?: boolean;
  }
): {
  /** Recommended rendering strategy */
  strategy: 'SSG' | 'ISR' | 'SSR' | 'CSR' | 'Streaming SSR';
  
  /** Recommendation details */
  details: string;
  
  /** Additional configuration */
  config?: {
    /** ISR revalidation interval in seconds */
    revalidate?: number;
    
    /** Cache-Control header value */
    cacheControl?: string;
  };
} {
  const {
    frequentDataUpdates = false,
    requiresAuth = false,
    highlyDynamic = false,
    seoCritical = true,
    coreUserJourney = false
  } = options;
  
  // Authentication routes need SSR
  if (requiresAuth) {
    if (highlyDynamic) {
      return {
        strategy: 'Streaming SSR',
        details: 'Use Streaming SSR for authenticated pages with highly dynamic content',
        config: {
          cacheControl: 'private, no-cache, no-store, must-revalidate'
        }
      };
    } else {
      return {
        strategy: 'SSR',
        details: 'Use SSR for authenticated pages to verify user session before rendering',
        config: {
          cacheControl: 'private, no-cache, no-store, must-revalidate'
        }
      };
    }
  }
  
  // SEO-critical static content
  if (seoCritical && !frequentDataUpdates && !highlyDynamic) {
    if (coreUserJourney) {
      return {
        strategy: 'SSG',
        details: 'Use SSG for SEO-critical static pages in core user journey',
        config: {
          cacheControl: 'public, max-age=3600, stale-while-revalidate=86400'
        }
      };
    } else {
      return {
        strategy: 'ISR',
        details: 'Use ISR for SEO-critical pages with occasional updates',
        config: {
          revalidate: 3600, // 1 hour
          cacheControl: 'public, max-age=3600, stale-while-revalidate=86400'
        }
      };
    }
  }
  
  // Dynamic content with SEO importance
  if (seoCritical && (frequentDataUpdates || highlyDynamic)) {
    return {
      strategy: 'Streaming SSR',
      details: 'Use Streaming SSR for SEO-critical pages with dynamic content',
      config: {
        cacheControl: 'public, max-age=60, stale-while-revalidate=300'
      }
    };
  }
  
  // Non-SEO dynamic content
  if (highlyDynamic && !seoCritical) {
    return {
      strategy: 'CSR',
      details: 'Use CSR for highly dynamic non-SEO content',
      config: {
        cacheControl: 'public, max-age=0, must-revalidate'
      }
    };
  }
  
  // Default strategy
  return {
    strategy: 'ISR',
    details: 'Use ISR as a balanced default strategy',
    config: {
      revalidate: 300, // 5 minutes
      cacheControl: 'public, max-age=300, stale-while-revalidate=3600'
    }
  };
}

/**
 * Create an Incremental Static Regeneration page config
 * 
 * @param options ISR options
 * @returns Next.js page config object
 */
export function createISRConfig(
  options: {
    /** Revalidation interval in seconds */
    revalidate?: number;
    
    /** Whether to fallback to blocking for dynamic paths */
    fallback?: 'blocking' | true | false;
  } = {}
): {
  revalidate: number;
  fallback?: 'blocking' | true | false;
} {
  return {
    revalidate: options.revalidate || 300, // Default 5 minutes
    fallback: options.fallback || 'blocking'
  };
}

/**
 * Create an optimal Cache-Control header value
 * 
 * @param options Cache control options
 * @returns Cache-Control header value
 */
export function createCacheControlHeader(
  options: {
    /** Whether resource is public or private */
    visibility?: 'public' | 'private';
    
    /** Max age in seconds */
    maxAge?: number;
    
    /** Stale-while-revalidate in seconds */
    staleWhileRevalidate?: number;
    
    /** Whether to use no-cache */
    noCache?: boolean;
    
    /** Whether to use no-store */
    noStore?: boolean;
    
    /** Whether to use must-revalidate */
    mustRevalidate?: boolean;
  } = {}
): string {
  const {
    visibility = 'public',
    maxAge,
    staleWhileRevalidate,
    noCache = false,
    noStore = false,
    mustRevalidate = false
  } = options;
  
  const directives: string[] = [visibility];
  
  if (noCache) {
    directives.push('no-cache');
  } else if (maxAge !== undefined) {
    directives.push(`max-age=${maxAge}`);
  }
  
  if (noStore) {
    directives.push('no-store');
  }
  
  if (mustRevalidate) {
    directives.push('must-revalidate');
  }
  
  if (staleWhileRevalidate !== undefined && !noCache && !noStore) {
    directives.push(`stale-while-revalidate=${staleWhileRevalidate}`);
  }
  
  return directives.join(', ');
}

/**
 * Split and prioritize component rendering for better UX
 * 
 * @param config Rendering priority configuration
 * @returns Rendering priority groups
 */
export function getComponentPriority<T extends Record<string, any>>(
  config: {
    /** All components to render */
    components: T;
    
    /** Critical components to render first */
    critical?: Array<keyof T>;
    
    /** Secondary components to render after critical */
    secondary?: Array<keyof T>;
  }
): {
  /** Critical components to render immediately */
  critical: Partial<T>;
  
  /** Secondary components to render after critical */
  secondary: Partial<T>;
  
  /** Deferred components to render last */
  deferred: Partial<T>;
} {
  const { components, critical = [], secondary = [] } = config;
  
  // Create component groups
  const criticalComponents: Partial<T> = {};
  const secondaryComponents: Partial<T> = {};
  const deferredComponents: Partial<T> = {};
  
  // Assign components to priority groups
  Object.entries(components).forEach(([key, component]) => {
    if (critical.includes(key as keyof T)) {
      criticalComponents[key as keyof T] = component;
    } else if (secondary.includes(key as keyof T)) {
      secondaryComponents[key as keyof T] = component;
    } else {
      deferredComponents[key as keyof T] = component;
    }
  });
  
  return {
    critical: criticalComponents,
    secondary: secondaryComponents,
    deferred: deferredComponents
  };
}

/**
 * Determine whether to use Edge or Node.js runtime for a route
 * 
 * @param options Runtime options
 * @returns Recommended runtime with rationale
 */
export function determineRuntime(
  options: {
    /** Whether route requires complex processing */
    complexProcessing?: boolean;
    
    /** Whether route needs low latency */
    lowLatency?: boolean;
    
    /** Whether route uses third-party npm packages */
    thirdPartyDependencies?: boolean;
    
    /** Whether route needs geolocation */
    needsGeolocation?: boolean;
  } = {}
): {
  /** Recommended runtime */
  runtime: 'edge' | 'nodejs';
  
  /** Rationale for recommendation */
  rationale: string;
} {
  const {
    complexProcessing = false,
    lowLatency = false,
    thirdPartyDependencies = false,
    needsGeolocation = false
  } = options;
  
  // Edge runtime is better for:
  // - Low latency requirements
  // - Simple processing
  // - Geolocation needs
  // - No complex third-party dependencies
  if (lowLatency && !complexProcessing && !thirdPartyDependencies) {
    return {
      runtime: 'edge',
      rationale: 'Edge runtime provides lower latency for lightweight processing'
    };
  }
  
  // Edge runtime is good for geolocation even with some complexity
  if (needsGeolocation && lowLatency && !thirdPartyDependencies) {
    return {
      runtime: 'edge',
      rationale: 'Edge runtime provides geolocation benefits with good latency'
    };
  }
  
  // Otherwise, Node.js runtime is more flexible
  return {
    runtime: 'nodejs',
    rationale: 'Node.js runtime provides better support for complex processing and third-party dependencies'
  };
}
