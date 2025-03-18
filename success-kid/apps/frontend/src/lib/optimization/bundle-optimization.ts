/**
 * Bundle Optimization Utilities
 * 
 * Provides utilities for optimizing JavaScript bundle size and loading
 * to improve performance and user experience.
 */

/**
 * Dynamic import with loading tracking
 * 
 * @param importFn Dynamic import function
 * @param options Loading options
 * @returns Promise that resolves to the imported module
 */
export function trackedDynamicImport<T>(
  importFn: () => Promise<T>,
  options?: {
    /** Name for logging and tracking */
    name?: string;
    
    /** Whether to log loading time */
    log?: boolean;
  }
): Promise<T> {
  const name = options?.name || 'unknown module';
  const shouldLog = options?.log ?? process.env.NODE_ENV === 'development';
  
  const startTime = performance.now();
  
  return importFn().then(module => {
    const loadTime = performance.now() - startTime;
    
    if (shouldLog) {
      console.log(`Loaded ${name} in ${loadTime.toFixed(2)}ms`);
    }
    
    // In a real implementation, you might send this to analytics
    
    return module;
  });
}

/**
 * Check if a resource should be preloaded based on viewport
 * 
 * @param element Element to check
 * @param threshold Viewport threshold (0-1)
 * @returns Whether element is close to viewport
 */
export function isNearViewport(
  element: HTMLElement,
  threshold: number = 0.2
): boolean {
  if (!element || typeof window === 'undefined') {
    return false;
  }
  
  const rect = element.getBoundingClientRect();
  const windowHeight = window.innerHeight;
  
  // Element is above viewport but within threshold
  if (rect.bottom < 0 && Math.abs(rect.bottom) < windowHeight * threshold) {
    return true;
  }
  
  // Element is below viewport but within threshold
  if (rect.top > windowHeight && rect.top - windowHeight < windowHeight * threshold) {
    return true;
  }
  
  // Element is partially or fully in viewport
  if (rect.top < windowHeight && rect.bottom > 0) {
    return true;
  }
  
  return false;
}

/**
 * Preload a component when near viewport
 * 
 * @param importFn Dynamic import function
 * @param elementRef Element reference to check
 * @param options Preload options
 */
export function preloadWhenNearViewport<T>(
  importFn: () => Promise<T>,
  elementRef: React.RefObject<HTMLElement>,
  options?: {
    /** Name for logging and tracking */
    name?: string;
    
    /** Viewport threshold (0-1) */
    threshold?: number;
    
    /** Whether to use IntersectionObserver instead of scroll events */
    useIntersectionObserver?: boolean;
  }
): () => void {
  if (typeof window === 'undefined') {
    return () => {}; // No-op on server
  }
  
  const name = options?.name || 'unknown module';
  const threshold = options?.threshold || 0.2;
  const useIntersectionObserver = options?.useIntersectionObserver ?? true;
  
  let hasPreloaded = false;
  let observer: IntersectionObserver | null = null;
  let timeout: NodeJS.Timeout | null = null;
  
  const preload = () => {
    if (hasPreloaded) return;
    
    hasPreloaded = true;
    trackedDynamicImport(importFn, { name, log: true });
    
    // Clean up
    if (observer) {
      observer.disconnect();
      observer = null;
    }
    
    if (timeout) {
      clearTimeout(timeout);
      timeout = null;
    }
    
    window.removeEventListener('scroll', checkPosition);
  };
  
  const checkPosition = () => {
    if (hasPreloaded || !elementRef.current) return;
    
    if (isNearViewport(elementRef.current, threshold)) {
      preload();
    }
  };
  
  // Set up monitoring
  if (useIntersectionObserver && 'IntersectionObserver' in window) {
    // Use IntersectionObserver for better performance
    observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          preload();
        }
      },
      {
        rootMargin: `${threshold * 100}% 0px ${threshold * 100}% 0px`
      }
    );
    
    if (elementRef.current) {
      observer.observe(elementRef.current);
    } else {
      // Try again after a short delay in case ref isn't initialized yet
      timeout = setTimeout(() => {
        if (elementRef.current) {
          observer?.observe(elementRef.current);
        }
      }, 100);
    }
  } else {
    // Fall back to scroll events
    window.addEventListener('scroll', checkPosition, { passive: true });
    
    // Check position on initial load
    timeout = setTimeout(checkPosition, 100);
  }
  
  // Return cleanup function
  return () => {
    if (observer) {
      observer.disconnect();
    }
    
    if (timeout) {
      clearTimeout(timeout);
    }
    
    window.removeEventListener('scroll', checkPosition);
  };
}

/**
 * Delay non-critical module loading until after page load
 * 
 * @param importFn Dynamic import function
 * @param options Loading options
 * @returns Promise that resolves to the imported module
 */
export function loadAfterPageIdle<T>(
  importFn: () => Promise<T>,
  options?: {
    /** Name for logging and tracking */
    name?: string;
    
    /** Minimum delay in milliseconds */
    minDelay?: number;
    
    /** Maximum delay in milliseconds */
    maxDelay?: number;
  }
): Promise<T> {
  const name = options?.name || 'unknown module';
  const minDelay = options?.minDelay || 1000;
  const maxDelay = options?.maxDelay || 5000;
  
  return new Promise((resolve) => {
    // Function to actually load the module
    const loadModule = () => {
      trackedDynamicImport(importFn, { name }).then(resolve);
    };
    
    // Try to use requestIdleCallback for best performance
    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      // Set a maximum timeout to ensure loading even without idle time
      (window as any).requestIdleCallback(loadModule, { timeout: maxDelay });
    } else if (typeof window !== 'undefined') {
      // Fall back to setTimeout with a minimum delay
      setTimeout(loadModule, minDelay);
    } else {
      // Server-side, just load immediately
      loadModule();
    }
  });
}

/**
 * Cache imported module to prevent duplicate loading
 */
const moduleCache = new Map<string, any>();

/**
 * Import a module with caching to prevent duplicate loading
 * 
 * @param key Cache key
 * @param importFn Dynamic import function
 * @returns Promise that resolves to the imported module
 */
export function cachedDynamicImport<T>(
  key: string,
  importFn: () => Promise<T>
): Promise<T> {
  // Check if module is already in cache
  if (moduleCache.has(key)) {
    return Promise.resolve(moduleCache.get(key));
  }
  
  // Import module and cache it
  return importFn().then(module => {
    moduleCache.set(key, module);
    return module;
  });
}

/**
 * Prefetch a route or component during idle time
 * 
 * @param path Route path to prefetch 
 * @param options Prefetch options
 */
export function prefetchDuringIdle(
  path: string,
  options?: {
    /** Priority level (higher means sooner) */
    priority?: 'high' | 'medium' | 'low';
    
    /** Whether to prefetch immediately in development */
    immediateInDev?: boolean;
  }
): void {
  if (typeof window === 'undefined') {
    return; // No-op on server
  }
  
  const priority = options?.priority || 'medium';
  const immediateInDev = options?.immediateInDev ?? true;
  const isDev = process.env.NODE_ENV === 'development';
  
  // If in dev mode and immediateInDev is true, prefetch immediately
  if (isDev && immediateInDev) {
    // In Next.js, use the router to prefetch
    if ((window as any)?.next?.router?.prefetch) {
      (window as any).next.router.prefetch(path);
    }
    return;
  }
  
  // Set delay based on priority
  const delay = priority === 'high' ? 1000 : (priority === 'medium' ? 2000 : 3000);
  
  // Use requestIdleCallback if available
  if ('requestIdleCallback' in window) {
    (window as any).requestIdleCallback(
      () => {
        if ((window as any)?.next?.router?.prefetch) {
          (window as any).next.router.prefetch(path);
        }
      },
      { timeout: delay + 2000 }
    );
  } else {
    // Fall back to setTimeout
    setTimeout(() => {
      if ((window as any)?.next?.router?.prefetch) {
        (window as any).next.router.prefetch(path);
      }
    }, delay);
  }
}
