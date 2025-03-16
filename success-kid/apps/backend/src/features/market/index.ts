/**
 * Market features index
 * Exports all market-related services and types
 */

// Export sub-module interfaces and implementations
export * from './types';
export * from './providers';
export * from './caching';
export * from './price';
export * from './marketcap';
export * from './transactions';
export * from './milestones';
export * from './historical';
export * from './visualization';

// Export MarketFeature plugin
export { default as marketFeature } from './plugin';
