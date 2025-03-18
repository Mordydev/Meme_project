/**
 * Frontend Optimization Module
 * 
 * Provides comprehensive utilities for optimizing frontend performance,
 * rendering, bundle size, image loading, and monitoring.
 */

// Export image optimization utilities
export * from './image-optimization';

// Export bundle optimization utilities
export * from './bundle-optimization';

// Export rendering optimization utilities
export * from './rendering-optimization';

// Export performance monitoring utilities
export * from './performance-monitoring';

// Import for default export
import * as imageOptimization from './image-optimization';
import * as bundleOptimization from './bundle-optimization';
import * as renderingOptimization from './rendering-optimization';
import * as performanceMonitoring from './performance-monitoring';

// Export default object with all optimization utilities
export default {
  image: imageOptimization,
  bundle: bundleOptimization,
  rendering: renderingOptimization,
  monitoring: performanceMonitoring
};
