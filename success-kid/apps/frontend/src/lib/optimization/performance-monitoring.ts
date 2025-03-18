/**
 * Performance Monitoring Utilities
 * 
 * Provides utilities for monitoring and debugging frontend performance
 * to identify and resolve issues.
 */

/**
 * Performance metric with timing information
 */
export type PerformanceMetric = {
  /** Metric name */
  name: string;
  
  /** Metric value (typically in milliseconds) */
  value: number;
  
  /** When the metric was recorded */
  timestamp: number;
  
  /** Additional metadata */
  meta?: Record<string, any>;
};

/**
 * Web Vitals metrics
 */
export type WebVitalMetrics = {
  /** Largest Contentful Paint (ms) */
  lcp?: number;
  
  /** First Input Delay (ms) */
  fid?: number;
  
  /** Cumulative Layout Shift (unitless) */
  cls?: number;
  
  /** Time to First Byte (ms) */
  ttfb?: number;
  
  /** First Contentful Paint (ms) */
  fcp?: number;
  
  /** Interaction to Next Paint (ms) */
  inp?: number;
};

/**
 * In-memory storage for performance metrics
 */
const metricsStore: PerformanceMetric[] = [];

/**
 * Maximum number of metrics to store
 */
const MAX_METRICS = 100;

/**
 * Record a performance metric
 * 
 * @param name Metric name
 * @param value Metric value
 * @param meta Additional metadata
 */
export function recordMetric(
  name: string,
  value: number,
  meta?: Record<string, any>
): void {
  // Create metric object
  const metric: PerformanceMetric = {
    name,
    value,
    timestamp: Date.now(),
    meta
  };
  
  // Add to metrics store
  metricsStore.push(metric);
  
  // Trim store if needed
  if (metricsStore.length > MAX_METRICS) {
    metricsStore.shift();
  }
  
  // Log metric in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Performance] ${name}: ${value}${meta ? ' ' + JSON.stringify(meta) : ''}`);
  }
  
  // In a real implementation, you would send this to your analytics system
}

/**
 * Measure execution time of a function
 * 
 * @param fn Function to measure
 * @param name Metric name
 * @param meta Additional metadata
 * @returns Function result
 */
export function measureExecutionTime<T>(
  fn: () => T,
  name: string,
  meta?: Record<string, any>
): T {
  // Record start time
  const startTime = performance.now();
  
  try {
    // Execute function
    return fn();
  } finally {
    // Calculate duration
    const duration = performance.now() - startTime;
    
    // Record metric
    recordMetric(name, duration, meta);
  }
}

/**
 * Measure execution time of an async function
 * 
 * @param fn Async function to measure
 * @param name Metric name
 * @param meta Additional metadata
 * @returns Promise resolving to function result
 */
export async function measureAsyncExecutionTime<T>(
  fn: () => Promise<T>,
  name: string,
  meta?: Record<string, any>
): Promise<T> {
  // Record start time
  const startTime = performance.now();
  
  try {
    // Execute function
    return await fn();
  } finally {
    // Calculate duration
    const duration = performance.now() - startTime;
    
    // Record metric
    recordMetric(name, duration, meta);
  }
}

/**
 * Get recorded metrics
 * 
 * @param options Filter options
 * @returns Filtered metrics
 */
export function getMetrics(
  options?: {
    /** Filter by metric name */
    name?: string;
    
    /** Filter by time range (start timestamp) */
    from?: number;
    
    /** Filter by time range (end timestamp) */
    to?: number;
  }
): PerformanceMetric[] {
  const { name, from, to } = options || {};
  
  return metricsStore.filter(metric => {
    // Filter by name if specified
    if (name && metric.name !== name) {
      return false;
    }
    
    // Filter by from timestamp if specified
    if (from && metric.timestamp < from) {
      return false;
    }
    
    // Filter by to timestamp if specified
    if (to && metric.timestamp > to) {
      return false;
    }
    
    return true;
  });
}

/**
 * Calculate statistics for a metric
 * 
 * @param name Metric name
 * @returns Metric statistics
 */
export function getMetricStats(name: string): {
  /** Number of samples */
  count: number;
  
  /** Average value */
  avg: number;
  
  /** Minimum value */
  min: number;
  
  /** Maximum value */
  max: number;
  
  /** Median value */
  median: number;
  
  /** 95th percentile value */
  p95: number;
} {
  // Get metrics with given name
  const metrics = getMetrics({ name });
  
  // If no metrics, return default stats
  if (metrics.length === 0) {
    return {
      count: 0,
      avg: 0,
      min: 0,
      max: 0,
      median: 0,
      p95: 0
    };
  }
  
  // Get values
  const values = metrics.map(m => m.value).sort((a, b) => a - b);
  
  // Calculate statistics
  const count = values.length;
  const min = values[0];
  const max = values[count - 1];
  const avg = values.reduce((sum, val) => sum + val, 0) / count;
  const median = count % 2 === 0
    ? (values[count / 2 - 1] + values[count / 2]) / 2
    : values[Math.floor(count / 2)];
  const p95 = values[Math.floor(count * 0.95)];
  
  return {
    count,
    avg,
    min,
    max,
    median,
    p95
  };
}

/**
 * Monitor a specific DOM element for layout shifts
 * 
 * @param element Element or selector to monitor
 * @param options Monitoring options
 * @returns Cleanup function
 */
export function monitorLayoutShifts(
  element: string | HTMLElement,
  options?: {
    /** Callback for layout shifts */
    onShift?: (data: { element: HTMLElement, shiftValue: number }) => void;
  }
): () => void {
  if (typeof window === 'undefined') {
    return () => {}; // No-op on server
  }
  
  const onShift = options?.onShift;
  
  // Get element from selector if string
  const targetElement = typeof element === 'string'
    ? document.querySelector(element) as HTMLElement
    : element;
  
  // Return no-op if element not found
  if (!targetElement) {
    console.warn(`Element not found for layout shift monitoring: ${element}`);
    return () => {};
  }
  
  let lastBounds = targetElement.getBoundingClientRect();
  let observerId: number;
  
  // Function to check for layout shifts
  const checkForShifts = () => {
    const currentBounds = targetElement.getBoundingClientRect();
    
    // Calculate positional shift
    const shiftX = Math.abs(currentBounds.left - lastBounds.left);
    const shiftY = Math.abs(currentBounds.top - lastBounds.top);
    
    // Calculate size change
    const widthChange = Math.abs(currentBounds.width - lastBounds.width);
    const heightChange = Math.abs(currentBounds.height - lastBounds.height);
    
    // Calculate total shift
    const totalShift = shiftX + shiftY + widthChange + heightChange;
    
    // If significant shift detected
    if (totalShift > 1) {
      // Calculate normalized shift value (0-1)
      const viewportArea = window.innerWidth * window.innerHeight;
      const lastArea = lastBounds.width * lastBounds.height;
      const currentArea = currentBounds.width * currentBounds.height;
      const areaChange = Math.abs(currentArea - lastArea);
      
      // CLS-like calculation
      const shiftValue = (shiftX * shiftY + areaChange) / viewportArea;
      
      // Record metric
      recordMetric('layoutShift', shiftValue, {
        element: targetElement.tagName + (targetElement.id ? `#${targetElement.id}` : ''),
        shiftX,
        shiftY,
        widthChange,
        heightChange
      });
      
      // Call onShift callback if provided
      if (onShift) {
        onShift({
          element: targetElement,
          shiftValue
        });
      }
    }
    
    // Update last bounds
    lastBounds = currentBounds;
  };
  
  // Start periodic checking
  observerId = window.setInterval(checkForShifts, 250);
  
  // Return cleanup function
  return () => {
    window.clearInterval(observerId);
  };
}

/**
 * Report Web Vitals metrics
 * 
 * @param metrics Web Vitals metrics to report
 */
export function reportWebVitals(metrics: WebVitalMetrics): void {
  // Record each metric
  if (metrics.lcp) {
    recordMetric('webVitals.LCP', metrics.lcp);
  }
  
  if (metrics.fid) {
    recordMetric('webVitals.FID', metrics.fid);
  }
  
  if (metrics.cls) {
    recordMetric('webVitals.CLS', metrics.cls);
  }
  
  if (metrics.ttfb) {
    recordMetric('webVitals.TTFB', metrics.ttfb);
  }
  
  if (metrics.fcp) {
    recordMetric('webVitals.FCP', metrics.fcp);
  }
  
  if (metrics.inp) {
    recordMetric('webVitals.INP', metrics.inp);
  }
  
  // In a real implementation, you would send these to your analytics
}

/**
 * Report resource loading performance
 * 
 * @param resource Resource to report
 */
export function reportResourcePerformance(
  resource: string | HTMLImageElement | HTMLScriptElement | HTMLLinkElement
): void {
  if (typeof window === 'undefined') {
    return; // No-op on server
  }
  
  // Wait for next frame to ensure resource is loaded
  requestAnimationFrame(() => {
    let resourceUrl = '';
    let resourceType = '';
    
    // Get resource URL and type
    if (typeof resource === 'string') {
      resourceUrl = resource;
      resourceType = resource.endsWith('.js') ? 'script' : 
                    resource.endsWith('.css') ? 'style' :
                    resource.match(/\.(jpe?g|png|gif|svg|webp)$/i) ? 'image' : 'other';
    } else {
      if (resource.tagName === 'IMG') {
        resourceUrl = (resource as HTMLImageElement).src;
        resourceType = 'image';
      } else if (resource.tagName === 'SCRIPT') {
        resourceUrl = (resource as HTMLScriptElement).src;
        resourceType = 'script';
      } else if (resource.tagName === 'LINK' && (resource as HTMLLinkElement).rel === 'stylesheet') {
        resourceUrl = (resource as HTMLLinkElement).href;
        resourceType = 'style';
      }
    }
    
    // Skip if no resource URL
    if (!resourceUrl) {
      return;
    }
    
    // Get performance entries for this resource
    const entries = performance.getEntriesByName(resourceUrl, 'resource');
    
    // Skip if no entries found
    if (entries.length === 0) {
      return;
    }
    
    // Use the most recent entry
    const entry = entries[entries.length - 1] as PerformanceResourceTiming;
    
    // Record metrics
    recordMetric(`resource.${resourceType}.loadTime`, entry.duration, {
      url: resourceUrl,
      size: entry.transferSize,
      initiatorType: entry.initiatorType
    });
    
    // Record additional metrics for detailed analysis
    recordMetric(`resource.${resourceType}.timeToFirstByte`, entry.responseStart - entry.startTime, {
      url: resourceUrl
    });
    
    recordMetric(`resource.${resourceType}.downloadTime`, entry.responseEnd - entry.responseStart, {
      url: resourceUrl,
      size: entry.transferSize
    });
  });
}

/**
 * Start performance monitoring for all resources
 * 
 * @returns Cleanup function
 */
export function startResourceMonitoring(): () => void {
  if (typeof window === 'undefined') {
    return () => {}; // No-op on server
  }
  
  // Observer for new resources
  const observer = new PerformanceObserver((list) => {
    list.getEntries().forEach((entry) => {
      if (entry.entryType === 'resource') {
        const resourceEntry = entry as PerformanceResourceTiming;
        const url = resourceEntry.name;
        let type = resourceEntry.initiatorType;
        
        // Categorize resources more specifically
        if (type === 'link' && url.match(/\.css$/)) {
          type = 'css';
        } else if (type === 'img' || url.match(/\.(jpe?g|png|gif|svg|webp)$/i)) {
          type = 'image';
        } else if (type === 'script' || url.match(/\.js$/)) {
          type = 'script';
        } else if (url.match(/\.(woff2?|ttf|otf)$/i)) {
          type = 'font';
        }
        
        // Record metrics
        recordMetric(`resource.${type}.loadTime`, resourceEntry.duration, {
          url: resourceEntry.name,
          size: resourceEntry.transferSize,
          initiatorType: resourceEntry.initiatorType
        });
      }
    });
  });
  
  // Start observing
  observer.observe({ entryTypes: ['resource'] });
  
  // Return cleanup function
  return () => {
    observer.disconnect();
  };
}
