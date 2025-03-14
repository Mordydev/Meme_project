/**
 * Rendering Optimization
 * Utilities for optimizing React rendering and component performance
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { markUserTiming } from './metrics';
import { scheduleIdle } from './javascript';

/**
 * HOC that tracks and optimizes component rendering performance
 */
export function withRenderTracking<P extends object>(
  Component: React.ComponentType<P>,
  options: {
    name?: string;
    trackUpdates?: boolean;
    logInDevelopment?: boolean;
    compareProps?: (prevProps: Readonly<P>, nextProps: Readonly<P>) => boolean;
  } = {}
): React.FC<P> {
  const {
    name = Component.displayName || Component.name || 'Component',
    trackUpdates = true,
    logInDevelopment = process.env.NODE_ENV === 'development',
    compareProps,
  } = options;
  
  // Create a memoized version if compareProps is provided
  const MemoizedComponent = compareProps 
    ? React.memo(Component, compareProps)
    : Component;
  
  const TrackedComponent: React.FC<P> = (props) => {
    const renderStartTime = useRef(0);
    const renderCount = useRef(0);
    const mountTime = useRef(0);
    
    // Mark render start
    renderStartTime.current = performance.now();
    
    // For first render (mount)
    useEffect(() => {
      const mountDuration = performance.now() - mountTime.current;
      markUserTiming(`${name}-mount-end`);
      markUserTiming(`${name}-mount-duration`, name, `${name}-mount-start`);
      
      if (logInDevelopment) {
        console.log(`[Performance] ${name} mounted in ${mountDuration.toFixed(2)}ms`);
      }
      
      // Record component mount in global tracking
      if (typeof window !== 'undefined') {
        window.__PERFORMANCE_COMPONENTS = window.__PERFORMANCE_COMPONENTS || {};
        window.__PERFORMANCE_COMPONENTS[name] = {
          mountTime: mountDuration,
          renderCount: 1,
          lastRenderTime: mountDuration,
          totalRenderTime: mountDuration,
        };
      }
      
      // Set initial render count
      renderCount.current = 1;
    }, []);
    
    // Track re-renders
    useEffect(() => {
      if (renderCount.current === 0) {
        // This is the initial mount, handled above
        mountTime.current = renderStartTime.current;
        markUserTiming(`${name}-mount-start`);
        return;
      }
      
      if (!trackUpdates) return;
      
      const renderDuration = performance.now() - renderStartTime.current;
      markUserTiming(`${name}-render-${renderCount.current}`);
      
      if (logInDevelopment) {
        console.log(`[Performance] ${name} re-render #${renderCount.current} in ${renderDuration.toFixed(2)}ms`);
      }
      
      // Update component tracking
      if (typeof window !== 'undefined' && window.__PERFORMANCE_COMPONENTS) {
        const stats = window.__PERFORMANCE_COMPONENTS[name];
        if (stats) {
          stats.renderCount += 1;
          stats.lastRenderTime = renderDuration;
          stats.totalRenderTime += renderDuration;
        }
      }
      
      // Increment render count for next render
      renderCount.current += 1;
    });
    
    return <MemoizedComponent {...props} />;
  };
  
  TrackedComponent.displayName = `WithRenderTracking(${name})`;
  
  return TrackedComponent;
}

/**
 * Hook to track component render time
 */
export function useRenderTracking(componentName: string): void {
  const renderStartTime = useRef(performance.now());
  const renderCount = useRef(0);
  
  useEffect(() => {
    const renderTime = performance.now() - renderStartTime.current;
    
    if (process.env.NODE_ENV === 'development') {
      console.log(
        `[Performance] ${componentName} render #${renderCount.current} took ${renderTime.toFixed(2)}ms`
      );
    }
    
    // Record in performance tracking
    if (typeof window !== 'undefined') {
      window.__PERFORMANCE_COMPONENTS = window.__PERFORMANCE_COMPONENTS || {};
      
      if (!window.__PERFORMANCE_COMPONENTS[componentName]) {
        window.__PERFORMANCE_COMPONENTS[componentName] = {
          mountTime: renderTime,
          renderCount: 1,
          lastRenderTime: renderTime,
          totalRenderTime: renderTime,
        };
      } else {
        const stats = window.__PERFORMANCE_COMPONENTS[componentName];
        stats.renderCount += 1;
        stats.lastRenderTime = renderTime;
        stats.totalRenderTime += renderTime;
      }
    }
    
    renderCount.current += 1;
    
    // Prepare for next render
    return () => {
      renderStartTime.current = performance.now();
    };
  });
}

/**
 * Hook to skip rendering until conditions are met
 */
export function useSkipRender(shouldRender: boolean): boolean {
  // Keep track of whether we've ever rendered
  const hasRendered = useRef(false);
  
  // Mark as rendered once shouldRender is true
  if (shouldRender && !hasRendered.current) {
    hasRendered.current = true;
  }
  
  // Return true if we've rendered before, or if shouldRender is true
  return hasRendered.current || shouldRender;
}

/**
 * Hook to defer rendering of expensive components until after main content
 */
export function useDeferredRender(
  options: { delay?: number; idleTimeout?: number } = {}
): boolean {
  const { delay = 0, idleTimeout = 2000 } = options;
  const [shouldRender, setShouldRender] = useState(false);
  
  useEffect(() => {
    if (delay > 0) {
      // Use simple timeout for delay-based deferral
      const timer = setTimeout(() => setShouldRender(true), delay);
      return () => clearTimeout(timer);
    } else {
      // Use requestIdleCallback for idle-based deferral
      const idleId = scheduleIdle(
        () => setShouldRender(true),
        { timeout: idleTimeout }
      );
      
      return () => {
        if ('cancelIdleCallback' in window) {
          window.cancelIdleCallback(idleId);
        } else {
          clearTimeout(idleId);
        }
      };
    }
  }, [delay, idleTimeout]);
  
  return shouldRender;
}

/**
 * Hook to compare dependency arrays for debugging re-renders
 */
export function useRenderTriggers(deps: React.DependencyList, name: string = 'Component'): void {
  const prevDepsRef = useRef<React.DependencyList | null>(null);
  
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;
    
    if (prevDepsRef.current) {
      const changes = deps.reduce((acc, dep, index) => {
        if (prevDepsRef.current && dep !== prevDepsRef.current[index]) {
          acc.push({
            index,
            prev: prevDepsRef.current[index],
            current: dep,
          });
        }
        return acc;
      }, [] as Array<{ index: number; prev: any; current: any }>);
      
      if (changes.length > 0) {
        console.log(`[Re-render] ${name} re-rendered due to:`, changes);
      }
    }
    
    prevDepsRef.current = deps;
  });
}

/**
 * Hook for efficient list virtualization
 */
export function useVirtualizedList<T>(
  items: T[],
  options: {
    itemHeight: number | ((index: number) => number);
    overscan?: number;
    visibleHeight?: number;
    scrollingDelay?: number;
  }
): {
  virtualItems: Array<{ index: number; start: number; size: number; item: T }>;
  totalHeight: number;
  scrollTo: (index: number) => void;
  containerRef: React.RefObject<HTMLDivElement>;
} {
  const {
    itemHeight,
    overscan = 3,
    visibleHeight: initialVisibleHeight = 0,
    scrollingDelay = 50,
  } = options;
  
  const [scrollTop, setScrollTop] = useState(0);
  const [visibleHeight, setVisibleHeight] = useState(initialVisibleHeight);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollingRef = useRef(false);
  const scrollTimerRef = useRef<number | null>(null);
  
  // Get item height for a specific index
  const getItemHeight = useCallback(
    (index: number): number => {
      return typeof itemHeight === 'function' ? itemHeight(index) : itemHeight;
    },
    [itemHeight]
  );
  
  // Calculate total list height
  const totalHeight = items.reduce((sum, _, index) => sum + getItemHeight(index), 0);
  
  // Update visible height when container is mounted or resized
  useEffect(() => {
    if (!containerRef.current) return;
    
    const updateVisibleHeight = () => {
      if (containerRef.current) {
        setVisibleHeight(containerRef.current.clientHeight);
      }
    };
    
    // Initial update
    updateVisibleHeight();
    
    // Create ResizeObserver for container
    const resizeObserver = new ResizeObserver(() => {
      updateVisibleHeight();
    });
    
    resizeObserver.observe(containerRef.current);
    
    return () => {
      resizeObserver.disconnect();
    };
  }, []);
  
  // Handle container scrolling
  useEffect(() => {
    if (!containerRef.current) return;
    
    const handleScroll = () => {
      if (!containerRef.current) return;
      
      // Get current scroll position
      const newScrollTop = containerRef.current.scrollTop;
      
      // Update scroll position
      setScrollTop(newScrollTop);
      
      // Track scrolling state for optimizations
      if (!scrollingRef.current) {
        scrollingRef.current = true;
      }
      
      // Clear previous timer
      if (scrollTimerRef.current !== null) {
        clearTimeout(scrollTimerRef.current);
      }
      
      // Set a timer to detect when scrolling stops
      scrollTimerRef.current = window.setTimeout(() => {
        scrollingRef.current = false;
      }, scrollingDelay);
    };
    
    // Add scroll event listener
    containerRef.current.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      if (containerRef.current) {
        containerRef.current.removeEventListener('scroll', handleScroll);
      }
      
      if (scrollTimerRef.current !== null) {
        clearTimeout(scrollTimerRef.current);
      }
    };
  }, [scrollingDelay]);
  
  // Calculate visible items based on current scroll position
  const virtualItems = React.useMemo(() => {
    if (!visibleHeight) return [];
    
    // Calculate item positions and determine which are visible
    const virtualItems: Array<{ index: number; start: number; size: number; item: T }> = [];
    let itemTop = 0;
    
    // Find start and end indices of visible items
    let startIndex = 0;
    let endIndex = items.length - 1;
    
    // Find approximate start index based on average item height
    const averageHeight = totalHeight / items.length;
    startIndex = Math.floor(scrollTop / averageHeight);
    
    // Find exact start index by calculating item positions
    let accumulatedHeight = 0;
    for (let i = 0; i < items.length; i++) {
      const size = getItemHeight(i);
      if (accumulatedHeight + size >= scrollTop) {
        startIndex = Math.max(0, i - 1);
        break;
      }
      accumulatedHeight += size;
    }
    
    // Calculate end index based on visible height
    let visibleBottom = scrollTop + visibleHeight;
    accumulatedHeight = 0;
    for (let i = 0; i < items.length; i++) {
      accumulatedHeight += getItemHeight(i);
      if (accumulatedHeight >= visibleBottom) {
        endIndex = Math.min(items.length - 1, i + 1);
        break;
      }
    }
    
    // Add overscan to indices
    startIndex = Math.max(0, startIndex - overscan);
    endIndex = Math.min(items.length - 1, endIndex + overscan);
    
    // Generate virtual items for the visible range
    accumulatedHeight = 0;
    for (let i = 0; i < items.length; i++) {
      const size = getItemHeight(i);
      
      if (i >= startIndex && i <= endIndex) {
        virtualItems.push({
          index: i,
          start: accumulatedHeight,
          size,
          item: items[i],
        });
      }
      
      accumulatedHeight += size;
    }
    
    return virtualItems;
  }, [items, scrollTop, visibleHeight, getItemHeight, overscan, totalHeight]);
  
  // Function to scroll to a specific item index
  const scrollTo = useCallback((index: number) => {
    if (!containerRef.current) return;
    
    // Calculate position of the item
    let start = 0;
    for (let i = 0; i < index; i++) {
      start += getItemHeight(i);
    }
    
    // Scroll to the item
    containerRef.current.scrollTop = start;
  }, [getItemHeight]);
  
  return { virtualItems, totalHeight, scrollTo, containerRef };
}

/**
 * Hook for detecting when an element is visible in the viewport
 */
export function useIntersectionObserver(
  options: {
    root?: Element | null;
    rootMargin?: string;
    threshold?: number | number[];
    onIntersect?: (isIntersecting: boolean, entry?: IntersectionObserverEntry) => void;
  } = {}
): [React.RefObject<HTMLElement>, boolean] {
  const {
    root = null,
    rootMargin = '0px',
    threshold = 0,
    onIntersect,
  } = options;
  
  const [isIntersecting, setIsIntersecting] = useState(false);
  const ref = useRef<HTMLElement>(null);
  
  useEffect(() => {
    if (!ref.current || typeof IntersectionObserver === 'undefined') return;
    
    const element = ref.current;
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
        
        if (onIntersect) {
          onIntersect(entry.isIntersecting, entry);
        }
      },
      { root, rootMargin, threshold }
    );
    
    observer.observe(element);
    
    return () => {
      observer.unobserve(element);
      observer.disconnect();
    };
  }, [root, rootMargin, threshold, onIntersect]);
  
  return [ref, isIntersecting];
}

/**
 * Hook for deferring rendering of offscreen content
 */
export function useDeferOffscreenRendering<T extends HTMLElement>(
  options: {
    enabled?: boolean;
    rootMargin?: string;
    placeholder?: React.ReactNode;
    fallbackInView?: boolean;
  } = {}
): [React.RefObject<T>, boolean, React.ReactNode] {
  const {
    enabled = true,
    rootMargin = '200px',
    placeholder = null,
    fallbackInView = true,
  } = options;
  
  // Skip optimization if disabled or no IntersectionObserver
  const shouldUseIntersection = 
    enabled && typeof IntersectionObserver !== 'undefined';
  
  const [ref, isInView] = useIntersectionObserver<T>({
    rootMargin,
  });
  
  // If not using intersection, assume in view based on fallback
  const effectivelyInView = shouldUseIntersection ? isInView : fallbackInView;
  
  // Return either the placeholder or null based on visibility
  const placeholderToRender = !effectivelyInView ? placeholder : null;
  
  return [ref, effectivelyInView, placeholderToRender];
}

/**
 * Hook for efficient React Transitions API usage
 */
export function useOptimizedTransition(ms: number = 0): [boolean, (callback: () => void) => void] {
  const [isPending, startTransition] = React.useTransition();
  
  // Create an optimized version that's debounced for less blocking
  const startOptimizedTransition = useCallback((callback: () => void) => {
    if (ms > 0) {
      // Use setTimeout for a small delay to batch updates
      setTimeout(() => {
        startTransition(() => {
          callback();
        });
      }, ms);
    } else {
      // Use standard transition
      startTransition(() => {
        callback();
      });
    }
  }, [startTransition, ms]);
  
  return [isPending, startOptimizedTransition];
}

// Extend Window interface for performance tracking
declare global {
  interface Window {
    __PERFORMANCE_COMPONENTS?: Record<
      string, 
      { 
        mountTime: number; 
        renderCount: number; 
        lastRenderTime: number; 
        totalRenderTime: number; 
      }
    >;
  }
}
