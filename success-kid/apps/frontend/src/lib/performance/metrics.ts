/**
 * Performance Metrics Collection
 * Utilities for collecting and tracking performance metrics
 */

import { 
  PerformanceMetrics, 
  CoreWebVitals, 
  MemoryUsage,
  NavigationTiming,
  NetworkInformation,
  DeviceTier
} from './types';

/**
 * Creates an empty metrics object with null values
 */
export function createEmptyMetrics(): PerformanceMetrics {
  return {
    coreWebVitals: {
      LCP: null,
      FID: null,
      CLS: null,
      INP: null,
      TTI: null,
      TBT: null,
      FCP: null,
    },
    fps: null,
    jank: null,
    memory: null,
    navigation: null,
    network: null,
    deviceTier: 'unknown',
    timestamp: Date.now(),
  };
}

/**
 * Detects device capability tier based on hardware and browser features
 */
export function detectDeviceTier(): DeviceTier {
  if (typeof window === 'undefined') return 'unknown';
  
  // Use hardware concurrency as primary indicator
  const cores = navigator.hardwareConcurrency || 0;
  
  // Check for device memory API (Chrome only)
  const memory = (navigator as any).deviceMemory || 0;
  
  // Determine device tier
  if (cores >= 8 && memory >= 8) return 'high';
  if (cores >= 4 && memory >= 4) return 'medium';
  if (cores >= 2) return 'low';
  
  // Fallback classification based on user agent
  const userAgent = navigator.userAgent.toLowerCase();
  if (userAgent.includes('android')) {
    // Many Android devices have good core counts but poor single-thread performance
    return memory >= 4 ? 'medium' : 'low';
  }
  
  // Default to medium for unknown
  return 'medium';
}

/**
 * Gets current memory usage information (where available)
 */
export function getMemoryUsage(): MemoryUsage | null {
  if (typeof window === 'undefined' || 
      !performance || 
      !(performance as any).memory) {
    return null;
  }
  
  const memory = (performance as any).memory;
  
  return {
    jsHeapSizeLimit: memory.jsHeapSizeLimit,
    totalJSHeapSize: memory.totalJSHeapSize,
    usedJSHeapSize: memory.usedJSHeapSize,
    memoryUsagePercentage: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100,
  };
}

/**
 * Gets navigation timing metrics
 */
export function getNavigationTiming(): NavigationTiming | null {
  if (typeof window === 'undefined' || !performance || !performance.timing) {
    return null;
  }
  
  const timing = performance.timing;
  
  return {
    navigationStart: timing.navigationStart,
    fetchStart: timing.fetchStart,
    domInteractive: timing.domInteractive,
    domContentLoaded: timing.domContentLoadedEventEnd,
    domComplete: timing.domComplete,
    loadEventEnd: timing.loadEventEnd,
  };
}

/**
 * Gets network information (where available)
 */
export function getNetworkInformation(): NetworkInformation | null {
  if (typeof window === 'undefined') return null;
  
  const connection = 
    (navigator as any).connection || 
    (navigator as any).mozConnection || 
    (navigator as any).webkitConnection;
  
  if (!connection) return null;
  
  let bandwidth: 'high' | 'medium' | 'low' | 'unknown' = 'unknown';
  
  // Determine bandwidth based on effective type
  if (connection.effectiveType === '4g') bandwidth = 'high';
  else if (connection.effectiveType === '3g') bandwidth = 'medium';
  else if (['2g', 'slow-2g'].includes(connection.effectiveType)) bandwidth = 'low';
  
  // Adjust based on downlink if available
  if (connection.downlink) {
    if (connection.downlink > 5) bandwidth = 'high';
    else if (connection.downlink > 1.5) bandwidth = 'medium';
    else bandwidth = 'low';
  }
  
  return {
    effectiveType: connection.effectiveType as any || 'unknown',
    downlink: connection.downlink || 0,
    rtt: connection.rtt || 0,
    saveData: connection.saveData || false,
    bandwidth,
  };
}

/**
 * Estimates FPS based on frame timestamps
 */
export function measureFps(sampleDuration = 1000): Promise<number> {
  return new Promise(resolve => {
    if (typeof window === 'undefined') {
      resolve(0);
      return;
    }
    
    let frameCount = 0;
    const startTime = performance.now();
    
    function countFrame(timestamp: number) {
      frameCount++;
      
      const elapsed = timestamp - startTime;
      
      if (elapsed < sampleDuration) {
        requestAnimationFrame(countFrame);
      } else {
        const fps = Math.round((frameCount * 1000) / elapsed);
        resolve(fps);
      }
    }
    
    requestAnimationFrame(countFrame);
  });
}

/**
 * Creates custom performance marks and measures
 */
export function markUserTiming(markName: string, measureName?: string, startMark?: string): void {
  if (typeof window === 'undefined' || !performance.mark) return;
  
  try {
    // Create mark
    performance.mark(markName);
    
    // Create measure if requested
    if (measureName && startMark) {
      performance.measure(measureName, startMark, markName);
    }
  } catch (e) {
    console.error('Error creating performance mark/measure:', e);
  }
}

/**
 * Measures execution time of a function
 */
export function measureExecutionTime<T>(fn: () => T, label?: string): { result: T; duration: number } {
  const start = performance.now();
  const result = fn();
  const duration = performance.now() - start;
  
  if (label) {
    console.log(`${label}: ${duration.toFixed(2)}ms`);
  }
  
  return { result, duration };
}

/**
 * Measures async function execution time
 */
export async function measureAsyncExecutionTime<T>(
  fn: () => Promise<T>, 
  label?: string
): Promise<{ result: T; duration: number }> {
  const start = performance.now();
  const result = await fn();
  const duration = performance.now() - start;
  
  if (label) {
    console.log(`${label}: ${duration.toFixed(2)}ms`);
  }
  
  return { result, duration };
}

/**
 * Tracks component render timing
 */
export function trackComponentTiming(
  componentName: string, 
  renderTime: number, 
  updateReason?: string
): void {
  // For development only to avoid performance impact in production
  if (process.env.NODE_ENV !== 'development') return;
  
  console.log(
    `%c[Performance] ${componentName}: ${renderTime.toFixed(2)}ms ${updateReason ? '(' + updateReason + ')' : ''}`,
    'color: #3498db;'
  );
  
  // Store for potential reporting
  const timings = window.__COMPONENT_TIMINGS = window.__COMPONENT_TIMINGS || {};
  
  if (!timings[componentName]) {
    timings[componentName] = {
      count: 0,
      totalTime: 0,
      min: Infinity,
      max: 0,
    };
  }
  
  const stats = timings[componentName];
  stats.count++;
  stats.totalTime += renderTime;
  stats.min = Math.min(stats.min, renderTime);
  stats.max = Math.max(stats.max, renderTime);
}

// Extend Window interface
declare global {
  interface Window {
    __COMPONENT_TIMINGS?: Record<
      string, 
      { count: number; totalTime: number; min: number; max: number }
    >;
  }
}
