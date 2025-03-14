'use client';

import React, { useCallback, useEffect, useRef, useState, useId, useMemo } from 'react';
import { useVirtualizer } from '@tanstack/react-query';
import performanceMonitor from './metrics';

/**
 * Rendering optimization types
 */
export interface VirtualizedListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  itemHeight: number | ((item: T, index: number) => number);
  overscan?: number;
  onEndReached?: () => void;
  className?: string;
  estimateSize?: (index: number) => number;
  getItemKey?: (index: number) => string | number;
  scrollToIndex?: number;
  scrollToAlignment?: 'start' | 'center' | 'end' | 'auto';
  initialScrollOffset?: number;
  endThreshold?: number;
  onScroll?: (scrollOffset: number) => void;
}

/**
 * Hook for optimizing render performance
 */
export function useRenderOptimization(componentId?: string) {
  const generatedId = useId();
  const id = componentId || `component-${generatedId}`;
  const renderCount = useRef(0);
  const lastRenderTime = useRef(performance.now());
  const renderRef = useRef<number>(0);
  
  // Track component render
  useEffect(() => {
    renderCount.current += 1;
    const now = performance.now();
    const renderTime = now - lastRenderTime.current;
    
    // Report render time to performance monitor
    performanceMonitor.trackComponentRender(id, renderTime);
    
    // Update for next render
    lastRenderTime.current = now;
    
    // Performance mark for debugging
    if (typeof performance !== 'undefined') {
      const markName = `${id}-render-${renderCount.current}`;
      performance.mark(markName);
    }
    
    // Cleanup
    return () => {
      if (typeof performance !== 'undefined') {
        try {
          performance.clearMarks(`${id}-render-${renderCount.current}`);
        } catch (e) {
          // Ignore errors if marks don't exist
        }
      }
    };
  });
  
  /**
   * Determine if component should update based on props comparison
   */
  const shouldUpdate = useCallback((prev: any, next: any): boolean => {
    // If objects are identical, no update needed
    if (prev === next) return false;
    
    // If either is null/undefined but not both
    if (!prev || !next) return true;
    
    // Compare object structures
    const prevKeys = Object.keys(prev);
    const nextKeys = Object.keys(next);
    
    // Different number of keys means different objects
    if (prevKeys.length !== nextKeys.length) return true;
    
    // Check each key
    for (const key of prevKeys) {
      // Different value types
      if (typeof prev[key] !== typeof next[key]) return true;
      
      // Different primitive values
      if (
        typeof prev[key] !== 'object' && 
        prev[key] !== next[key]
      ) return true;
      
      // For objects, do a shallow comparison of nested properties
      if (
        typeof prev[key] === 'object' && 
        prev[key] !== null && 
        next[key] !== null
      ) {
        const objPrev = prev[key];
        const objNext = next[key];
        
        // Handle arrays specifically
        if (Array.isArray(objPrev) && Array.isArray(objNext)) {
          if (objPrev.length !== objNext.length) return true;
          
          // For arrays, check length and do shallow comparison of elements
          // This works well for primitive arrays but might miss changes in object arrays
          if (objPrev.some((item, i) => item !== objNext[i])) return true;
        } else {
          // Check if any properties of the nested object have changed
          const nestedPrevKeys = Object.keys(objPrev);
          const nestedNextKeys = Object.keys(objNext);
          
          if (nestedPrevKeys.length !== nestedNextKeys.length) return true;
          
          if (nestedPrevKeys.some(k => objPrev[k] !== objNext[k])) return true;
        }
      }
    }
    
    // No changes found, no update needed
    return false;
  }, []);
  
  /**
   * Defer non-critical rendering to idle period
   */
  const deferRender = useCallback((callback: () => void): void => {
    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      // Use requestIdleCallback when available
      (window as any).requestIdleCallback(() => {
        renderRef.current = performance.now();
        callback();
        
        // Track deferred render timing
        const renderTime = performance.now() - renderRef.current;
        performanceMonitor.trackEvent('render', 'deferred', renderTime);
      }, { timeout: 500 }); // Timeout ensures it will run within 500ms even without idle period
    } else {
      // Fallback to setTimeout with zero delay
      setTimeout(() => {
        renderRef.current = performance.now();
        callback();
        
        // Track deferred render timing
        const renderTime = performance.now() - renderRef.current;
        performanceMonitor.trackEvent('render', 'deferred', renderTime);
      }, 0);
    }
  }, []);
  
  /**
   * Track specific component renders
   */
  const trackRenders = useCallback((trackingId: string = id): void => {
    renderCount.current += 1;
    
    // Track component render count
    performanceMonitor.trackEvent('renderCount', trackingId, renderCount.current);
  }, [id]);
  
  /**
   * Get the current render count
   */
  const getRenderCount = useCallback((): number => {
    return renderCount.current;
  }, []);
  
  return {
    shouldUpdate,
    deferRender,
    trackRenders,
    getRenderCount,
    componentId: id,
  };
}

/**
 * Higher-order component for tracking component rendering performance
 */
export function withRenderTracking<P extends object>(
  Component: React.ComponentType<P>,
  componentId?: string
): React.FC<P> {
  const displayName = Component.displayName || Component.name || 'Component';
  const id = componentId || `tracked-${displayName}`;
  
  const MemoizedComponent = React.memo(Component);
  
  const TrackedComponent: React.FC<P> = (props) => {
    const startTime = useRef(performance.now());
    
    // Track render time on mount and unmount
    useEffect(() => {
      const renderTime = performance.now() - startTime.current;
      performanceMonitor.trackComponentRender(id, renderTime, true);
      
      return () => {
        // Optionally track unmount time or other cleanup
      };
    }, []);
    
    return <MemoizedComponent {...props} />;
  };
  
  TrackedComponent.displayName = `Tracked(${displayName})`;
  
  return TrackedComponent;
}

/**
 * Virtualized List for efficient rendering of large lists
 */
export function VirtualizedList<T>({
  items,
  renderItem,
  itemHeight,
  overscan = 5,
  onEndReached,
  className = '',
  estimateSize,
  getItemKey = (index) => index,
  scrollToIndex,
  scrollToAlignment = 'start',
  initialScrollOffset,
  endThreshold = 5,
  onScroll
}: VirtualizedListProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null);
  const trackingId = useId();
  const endReachedCallTimestamp = useRef(0);
  
  // Create the estimate size function
  const getSizeEstimate = useCallback(
    (index: number) => {
      if (estimateSize) {
        return estimateSize(index);
      }
      
      if (typeof itemHeight === 'function') {
        return itemHeight(items[index], index);
      }
      
      return itemHeight;
    },
    [estimateSize, itemHeight, items]
  );
  
  // Set up virtualizer
  const virtualizer = useVirtualizer({
    getScrollElement: () => parentRef.current,
    count: items.length,
    estimateSize: getSizeEstimate,
    overscan,
    getItemKey,
    scrollToAlignment,
    initialScrollOffset,
  });
  
  // Handle scroll to index when prop changes
  useEffect(() => {
    if (scrollToIndex !== undefined) {
      virtualizer.scrollToIndex(scrollToIndex, { align: scrollToAlignment });
    }
  }, [scrollToIndex, scrollToAlignment, virtualizer]);
  
  // Handle scroll events and end reached callbacks
  useEffect(() => {
    if (!parentRef.current || !onEndReached) return;
    
    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = parentRef.current!;
      
      // Notify external scroll handler if provided
      if (onScroll) {
        onScroll(scrollTop);
      }
      
      // Check if we're near the end
      if (
        onEndReached &&
        scrollTop + clientHeight >= scrollHeight - endThreshold * getSizeEstimate(items.length - 1)
      ) {
        // Prevent multiple calls in short succession
        const now = Date.now();
        if (now - endReachedCallTimestamp.current > 500) {
          onEndReached();
          endReachedCallTimestamp.current = now;
        }
      }
    };
    
    const scrollElement = parentRef.current;
    scrollElement.addEventListener('scroll', handleScroll);
    
    return () => {
      scrollElement.removeEventListener('scroll', handleScroll);
    };
  }, [
    items.length,
    onEndReached,
    getSizeEstimate,
    endThreshold,
    onScroll
  ]);
  
  // Track initial and subsequent renders
  useEffect(() => {
    performanceMonitor.trackEvent('virtualizedList', trackingId, items.length);
  }, [trackingId, items.length]);
  
  const virtualItems = virtualizer.getVirtualItems();
  
  return (
    <div
      ref={parentRef}
      className={`virtualized-list overflow-auto ${className}`}
      style={{ height: '100%', width: '100%' }}
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualItems.map((virtualItem) => (
          <div
            key={virtualItem.key}
            data-index={virtualItem.index}
            ref={(el) => virtualizer.measureElement(el as Element)}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              transform: `translateY(${virtualItem.start}px)`,
            }}
          >
            {renderItem(items[virtualItem.index], virtualItem.index)}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Component that manages rendering priority
 */
export function RenderingPrioritization({
  highPriority,
  lowPriority,
  threshold = 100
}: {
  highPriority: React.ReactNode;
  lowPriority: React.ReactNode;
  threshold?: number;
}) {
  const [showLowPriority, setShowLowPriority] = useState(false);
  
  useEffect(() => {
    // First, render the high priority content
    // Then, defer the low priority content
    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      const handle = (window as any).requestIdleCallback(
        () => {
          setShowLowPriority(true);
        },
        { timeout: threshold }
      );
      
      return () => {
        (window as any).cancelIdleCallback(handle);
      };
    } else {
      // Fallback for browsers without requestIdleCallback
      const timeoutId = setTimeout(() => {
        setShowLowPriority(true);
      }, threshold);
      
      return () => {
        clearTimeout(timeoutId);
      };
    }
  }, [threshold]);
  
  return (
    <>
      {highPriority}
      {showLowPriority && lowPriority}
    </>
  );
}

/**
 * Smart memoization that allows for deeper comparison
 */
export function useMemoDeep<T>(factory: () => T, deps: React.DependencyList, compareFn?: (prev: T, next: T) => boolean): T {
  const ref = useRef<T | undefined>(undefined);
  const depsRef = useRef<React.DependencyList | undefined>(undefined);
  
  // Default comparison function (deep comparison)
  const defaultCompare = useCallback((prev: any, next: any): boolean => {
    if (prev === next) return true;
    if (!prev || !next) return false;
    
    // Handle arrays
    if (Array.isArray(prev) && Array.isArray(next)) {
      if (prev.length !== next.length) return false;
      
      return prev.every((val, idx) => defaultCompare(val, next[idx]));
    }
    
    // Handle objects
    if (typeof prev === 'object' && typeof next === 'object') {
      const keys1 = Object.keys(prev);
      const keys2 = Object.keys(next);
      
      if (keys1.length !== keys2.length) return false;
      
      return keys1.every(key => defaultCompare(prev[key], next[key]));
    }
    
    // Handle primitives
    return prev === next;
  }, []);
  
  // Custom comparison function or default
  const compare = compareFn || defaultCompare;
  
  const needsUpdate = depsRef.current === undefined || 
    deps.length !== depsRef.current.length || 
    deps.some((dep, i) => !compare(dep, depsRef.current![i]));
  
  if (needsUpdate) {
    ref.current = factory();
    depsRef.current = deps;
  }
  
  return ref.current as T;
}

/**
 * Hook to throttle state updates for better performance
 */
export function useThrottledState<T>(initialState: T, interval: number = 200): [T, (value: T) => void] {
  const [state, setState] = useState<T>(initialState);
  const nextState = useRef<T | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);
  
  const setThrottledState = useCallback((value: T) => {
    nextState.current = value;
    
    if (!timeoutRef.current) {
      timeoutRef.current = setTimeout(() => {
        if (nextState.current !== null) {
          setState(nextState.current);
          nextState.current = null;
        }
        timeoutRef.current = null;
      }, interval);
    }
  }, [interval]);
  
  return [state, setThrottledState];
}

/**
 * Hook to debounce function calls
 */
export function useDebounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number = 300
): (...args: Parameters<T>) => void {
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);
  
  return useCallback((...args: Parameters<T>) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    
    timerRef.current = setTimeout(() => {
      fn(...args);
      timerRef.current = null;
    }, delay);
  }, [fn, delay]);
}

/**
 * Component to batch state updates for improved performance
 */
export function StateUpdateBatcher<T>({ 
  stateUpdates,
  interval = 100,
  onUpdate,
  children
}: {
  stateUpdates: T[];
  interval?: number;
  onUpdate: (batchedUpdates: T[]) => void;
  children: React.ReactNode;
}) {
  const updates = useRef<T[]>([]);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Add new updates to the batch
  useEffect(() => {
    updates.current = [...updates.current, ...stateUpdates];
    
    if (!timeoutRef.current) {
      timeoutRef.current = setTimeout(() => {
        if (updates.current.length > 0) {
          onUpdate([...updates.current]);
          updates.current = [];
        }
        timeoutRef.current = null;
      }, interval);
    }
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [stateUpdates, interval, onUpdate]);
  
  return <>{children}</>;
}

/**
 * Component to minimize effect dependencies
 */
export function useStableEffect(
  effect: React.EffectCallback,
  rawDeps: React.DependencyList
): void {
  // Create stable versions of function dependencies
  const stableDeps = useMemo(() => {
    return rawDeps.map(dep => {
      if (typeof dep === 'function') {
        // Return a reference-stable version that calls the function
        return (...args: any[]) => dep(...args);
      }
      return dep;
    });
  }, rawDeps); // Still depends on rawDeps for re-creation
  
  // Use the effect with stable dependencies
  useEffect(effect, stableDeps);
}
