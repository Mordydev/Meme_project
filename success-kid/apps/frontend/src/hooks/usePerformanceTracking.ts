'use client';

import { useEffect, useRef } from 'react';
import { usePerformance } from '@/lib/performance/context';
import performanceMonitor from '@/lib/performance/metrics';
import { useOptimizedSelector } from '@/lib/performance/state-optimization';
import { useNetworkInfo } from '@/lib/performance/network-optimization';

/**
 * Hook for tracking component performance and optimizing rendering
 * 
 * @param componentId - Unique identifier for the component
 * @param options - Optional configuration options
 * @returns Performance tracking utilities and metrics
 */
export function usePerformanceTracking(
  componentId: string,
  options: {
    trackRenders?: boolean;
    trackTiming?: boolean;
    monitorProps?: boolean;
    budget?: { maxRenderTime: number; maxRenderCount: number };
  } = {}
) {
  const {
    trackRenders = true,
    trackTiming = true,
    monitorProps = false,
    budget,
  } = options;
  
  const { isMonitoringEnabled, isPerformanceMode } = usePerformance();
  const networkInfo = useNetworkInfo();
  
  const renderCountRef = useRef(0);
  const renderTimeRef = useRef(0);
  const lastPropsRef = useRef<any>(null);
  const startTimeRef = useRef(0);
  
  // Set component budget if provided
  useEffect(() => {
    if (budget && isMonitoringEnabled) {
      performanceMonitor.setComponentBudget(componentId, budget);
    }
  }, [budget, componentId, isMonitoringEnabled]);
  
  // Start timing the render
  useEffect(() => {
    if (!isMonitoringEnabled || !trackTiming) return;
    
    startTimeRef.current = performance.now();
    
    return () => {
      const renderTime = performance.now() - startTimeRef.current;
      renderTimeRef.current = renderTime;
      
      if (trackRenders) {
        renderCountRef.current += 1;
        performanceMonitor.trackComponentRender(componentId, renderTime);
      }
    };
  }, [componentId, isMonitoringEnabled, trackRenders, trackTiming]);
  
  /**
   * Custom selector hook that tracks performance
   */
  function useTrackedSelector<T, S>(store: any, selector: (state: S) => T, equalityFn?: (a: T, b: T) => boolean) {
    return useOptimizedSelector(store, selector, { 
      equalityFn,
      memoize: isPerformanceMode !== 'high' // Always memoize in balanced or data-saving mode
    });
  }
  
  /**
   * Get performance data for the component
   */
  function getPerformanceData() {
    return {
      renderCount: renderCountRef.current,
      renderTime: renderTimeRef.current,
      networkType: networkInfo.effectiveType,
      isMetered: networkInfo.isMetered,
      performanceMode: isPerformanceMode
    };
  }
  
  /**
   * Check if a render should be skipped based on performance mode
   */
  function shouldOptimizeRender() {
    // In data-saving mode, be aggressive with optimizations
    if (isPerformanceMode === 'data-saving') {
      return true;
    }
    
    // In balanced mode, optimize on metered or slow connections
    if (isPerformanceMode === 'balanced' && (networkInfo.isMetered || networkInfo.effectiveType !== '4g')) {
      return true;
    }
    
    // In high mode, only optimize on the slowest connections
    return isPerformanceMode === 'high' && networkInfo.effectiveType === 'slow-2g';
  }
  
  /**
   * Mark the start of a performance-sensitive operation
   */
  function markOperationStart(operation: string) {
    if (!isMonitoringEnabled) return;
    
    performanceMonitor.startMark(`${componentId}-${operation}`);
  }
  
  /**
   * Mark the end of a performance-sensitive operation and measure its duration
   */
  function markOperationEnd(operation: string) {
    if (!isMonitoringEnabled) return;
    
    const measureName = `${componentId}-${operation}-duration`;
    const duration = performanceMonitor.endMark(`${componentId}-${operation}`, measureName);
    
    return duration;
  }
  
  return {
    useTrackedSelector,
    getPerformanceData,
    shouldOptimizeRender,
    markOperationStart,
    markOperationEnd,
    performanceMode: isPerformanceMode,
    isMonitoringEnabled,
    networkInfo
  };
}

/**
 * HOC for tracking component performance
 * 
 * @param Component - Component to wrap with performance tracking
 * @param componentId - Unique identifier for the component
 * @param options - Optional configuration options
 * @returns Wrapped component with performance tracking
 */
export function withPerformanceTracking<P extends object>(
  Component: React.ComponentType<P>,
  componentId?: string,
  options: {
    trackRenders?: boolean;
    trackTiming?: boolean;
    budget?: { maxRenderTime: number; maxRenderCount: number };
  } = {}
) {
  const displayName = Component.displayName || Component.name || 'Component';
  const id = componentId || `tracked-${displayName}`;
  
  const PerformanceTrackedComponent = (props: P) => {
    usePerformanceTracking(id, options);
    
    return <Component {...props} />;
  };
  
  PerformanceTrackedComponent.displayName = `withPerformanceTracking(${displayName})`;
  
  return PerformanceTrackedComponent;
}
