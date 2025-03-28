/**
 * Database Optimization Module
 * 
 * Provides comprehensive database optimization tools for query performance,
 * indexing, and monitoring.
 */

// Export indexing utilities
export * from './index-strategy';

// Export query optimization utilities
export * from './query-optimizer';

// Export performance monitoring utilities
export * from './performance-monitor';

// Import modules for default export
import indexStrategy from './index-strategy';
import queryOptimizer from './query-optimizer';
import performanceMonitor from './performance-monitor';

// Export default object with all optimization utilities
export default {
  indexStrategy,
  queryOptimizer,
  performanceMonitor
};
