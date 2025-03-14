'use client';

/**
 * Performance Framework
 * 
 * This file serves as the main entry point for the performance optimization
 * framework, providing easy access to performance monitoring, optimization
 * utilities, and tracking hooks.
 */

// Re-export all modules for easy imports
export * from './metrics';
export * from './asset-optimization';
export * from './javascript-optimization';
export * from './rendering-optimization';
export * from './state-optimization';
export * from './network-optimization';
export * from './context';

// Re-export tracking hooks for convenience
export { usePerformanceTracking, withPerformanceTracking } from '@/hooks/usePerformanceTracking';

// Export the performance monitor instance as the default export
export { default } from './metrics';

// Additional public utilities
import performanceMonitor from './metrics';
import { OptimizedImage } from './asset-optimization';
import { 
  LazyComponentLoader, 
  createLazyComponent, 
  trackableImport 
} from './javascript-optimization';
import { 
  VirtualizedList, 
  useRenderOptimization, 
  withRenderTracking,
  RenderingPrioritization
} from './rendering-optimization';
import { 
  useOptimizedSelector, 
  createSelectorContext, 
  useDerivedState 
} from './state-optimization';
import { 
  useNetworkInfo, 
  useOptimizedQuery, 
  useOptimizedFetcher 
} from './network-optimization';

// Consolidated export object for easier consumption
export const Performance = {
  /**
   * Core monitoring
   */
  monitor: performanceMonitor,

  /**
   * Component optimization
   */
  Image: OptimizedImage,
  LazyComponent: LazyComponentLoader,
  VirtualizedList,
  RenderingPrioritization,

  /**
   * Factory functions
   */
  createLazyComponent,
  createSelectorContext,

  /**
   * Utility hooks
   */
  useNetworkInfo,
  useOptimizedQuery,
  useOptimizedSelector,
  useDerivedState,
  useRenderOptimization,
  useOptimizedFetcher,

  /**
   * Higher-order components
   */
  withRenderTracking,

  /**
   * Utility functions
   */
  trackableImport,

  /**
   * Report performance metrics for non-automated cases
   */
  report: (category: string, action: string, value?: number) => {
    performanceMonitor.trackEvent(category, action, value);
  }
};
