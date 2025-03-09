/**
 * Bundle and code optimization utilities for improving
 * performance and load times
 */

// Export code splitting utilities
export * from './codeSplitting';

// Re-export server component optimization
export * from './serverComponentsOptimization';

// Export JavaScript bundle optimization utilities that can be used in client code
// Note: bundleAnalysis, dependencyAudit, and treeShaking are primarily for build-time
// and are not exported here since they're not meant to be used in runtime code
