/**
 * Performance Budgets
 * Defines and enforces performance budgets for the application
 */

import { PerformanceBudget, ComponentBudget } from './types';

/**
 * Default performance budget for the application based on
 * industry standards and our platform requirements
 */
export const DEFAULT_PERFORMANCE_BUDGET: PerformanceBudget = {
  javascript: {
    total: 350, // KB
    initial: 150, // KB
    async: 100, // KB per chunk
  },
  css: {
    total: 50, // KB
  },
  images: {
    total: 800, // KB per initial page load
    individual: 200, // KB max per image
  },
  fonts: {
    total: 100, // KB
  },
  thirdParty: {
    total: 200, // KB
  },
  webVitals: {
    lcp: 2500, // ms
    fid: 100, // ms
    cls: 0.1, // unitless
    inp: 200, // ms
    tti: 3500, // ms
  },
};

/**
 * Component-specific performance budgets for critical UI components
 */
export const COMPONENT_BUDGETS: Record<string, ComponentBudget> = {
  // Feed and content components
  'ActivityFeed': {
    renderTime: 100,
    updateTime: 50,
    instanceCount: 1,
    memoryUsage: 2000,
  },
  'ContentCard': {
    renderTime: 20,
    updateTime: 10,
    instanceCount: 20,
    memoryUsage: 150,
  },
  
  // Real-time components
  'TransactionFeed': {
    renderTime: 80,
    updateTime: 30,
    instanceCount: 1,
    memoryUsage: 1500,
  },
  'MarketStatistics': {
    renderTime: 100,
    updateTime: 50,
    instanceCount: 1,
    memoryUsage: 2000,
  },
  
  // Interactive components
  'PriceChart': {
    renderTime: 150,
    updateTime: 80,
    instanceCount: 1,
    memoryUsage: 3000,
  },
  'RichTextEditor': {
    renderTime: 120,
    updateTime: 50,
    instanceCount: 1,
    memoryUsage: 2500,
  },
  
  // Common UI components
  'Modal': {
    renderTime: 50,
    updateTime: 20,
    instanceCount: 3,
    memoryUsage: 500,
  },
  'InfiniteScroll': {
    renderTime: 30,
    updateTime: 20,
    instanceCount: 5,
    memoryUsage: 1000,
  },
};

/**
 * Checks if component rendering time exceeds budget
 */
export function checkComponentBudget(
  componentName: string,
  renderTime: number,
  instanceCount: number = 1
): { exceeded: boolean; budget: ComponentBudget | null; percentage: number } {
  const budget = COMPONENT_BUDGETS[componentName];
  
  if (!budget) {
    return { exceeded: false, budget: null, percentage: 0 };
  }
  
  const exceeded = renderTime > budget.renderTime;
  const percentage = Math.round((renderTime / budget.renderTime) * 100);
  
  return { exceeded, budget, percentage };
}

/**
 * Checks if a bundle size exceeds the budget
 */
export function checkBundleBudget(
  actualSize: number,
  budgetType: keyof PerformanceBudget['javascript']
): { exceeded: boolean; budget: number; percentage: number } {
  const budget = DEFAULT_PERFORMANCE_BUDGET.javascript[budgetType];
  const exceeded = actualSize > budget;
  const percentage = Math.round((actualSize / budget) * 100);
  
  return { exceeded, budget, percentage };
}

/**
 * Checks if Core Web Vitals metrics exceed budget
 */
export function checkWebVitalsBudget(
  metricName: keyof PerformanceBudget['webVitals'],
  value: number
): { exceeded: boolean; budget: number; percentage: number } {
  const budget = DEFAULT_PERFORMANCE_BUDGET.webVitals[metricName];
  const exceeded = value > budget;
  const percentage = Math.round((value / budget) * 100);
  
  return { exceeded, budget, percentage };
}

/**
 * Determines if the current device/network condition
 * requires more aggressive performance optimizations
 */
export function shouldApplyStrictOptimizations(
  deviceTier: string,
  connectionType: string,
  memoryUsage: number
): boolean {
  // Apply strict optimizations for low-end devices
  if (deviceTier === 'low') return true;
  
  // Apply strict optimizations for slow connections
  if (['slow-2g', '2g', '3g'].includes(connectionType)) return true;
  
  // Apply strict optimizations when memory usage is high
  if (memoryUsage > 80) return true;
  
  return false;
}
