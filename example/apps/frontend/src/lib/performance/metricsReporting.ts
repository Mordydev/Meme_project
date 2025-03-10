'use client';

import { onCLS, onFID, onLCP, onFCP, onTTFB } from 'web-vitals';

// Types for metric data
export type MetricName = 'CLS' | 'FID' | 'LCP' | 'FCP' | 'TTFB';

export interface MetricData {
  name: MetricName;
  value: number;
  id: string;
  delta: number;
  entries: any[];
  navigationType?: string;
}

// Types for configuration
export interface MetricsReportingConfig {
  analyticsEndpoint?: string;
  debug?: boolean;
  sampleRate?: number;
  reportAllMetrics?: boolean;
  onMetric?: (metric: MetricData) => void;
}

/**
 * Default metric callback function - can be overridden in the configuration
 */
const defaultMetricHandler = (metric: MetricData) => {
  // Default analytics function - sends to console in dev mode, 
  // would send to a real analytics endpoint in production
  if (process.env.NODE_ENV === 'development') {
    console.info(`[Web Vitals] ${metric.name}: ${metric.value}`);
  } else {
    // For production, we would send to a real analytics service
    // This is just a placeholder
    const body = JSON.stringify(metric);
    
    // Using Navigator.sendBeacon for non-blocking analytics if available
    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/analytics/web-vitals', body);
    } else {
      // Fallback to fetch
      fetch('/api/analytics/web-vitals', {
        body,
        method: 'POST',
        keepalive: true,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }
  }
};

/**
 * Initialize web vitals reporting
 * @param config Configuration options
 */
export function initWebVitalsReporting(config: MetricsReportingConfig = {}) {
  const {
    debug = process.env.NODE_ENV === 'development',
    sampleRate = 1.0, // 100% by default
    reportAllMetrics = false,
    onMetric = defaultMetricHandler,
  } = config;
  
  // Check if we should sample this user's data
  const shouldSample = Math.random() <= sampleRate;
  
  if (!shouldSample && !debug) return;
  
  // Get attribution information (e.g., URL, previous page)
  const attribution = {
    url: window.location.href,
    referrer: document.referrer || '',
    userAgent: navigator.userAgent,
  };
  
  // Function to report metrics with attribution
  const reportMetric = (metric: any) => {
    const metricData: MetricData = {
      ...metric,
      ...attribution,
    };
    
    onMetric(metricData);
  };
  
  // Register listeners for Core Web Vitals
  onCLS(reportMetric);
  onFID(reportMetric);
  onLCP(reportMetric);
  
  // Optionally report additional metrics
  if (reportAllMetrics) {
    onFCP(reportMetric);
    onTTFB(reportMetric);
  }
  
  if (debug) {
    console.info('[Web Vitals] Monitoring initialized', {
      debug,
      sampleRate,
      reportAllMetrics,
    });
  }
}

/**
 * Web Vitals Reporter Component for use in app layout
 */
export function WebVitalsReporter(props: MetricsReportingConfig = {}) {
  if (typeof window !== 'undefined') {
    initWebVitalsReporting(props);
  }
  
  // This component doesn't render anything
  return null;
}

/**
 * Check if the current metric values meet performance targets
 */
export function checkPerformanceTargets(metrics: Record<MetricName, number>) {
  const targets = {
    LCP: 2500, // 2.5 seconds
    FID: 100,  // 100 milliseconds
    CLS: 0.1,  // 0.1 score
    FCP: 1800, // 1.8 seconds
    TTFB: 800, // 800 milliseconds
  };
  
  const results = Object.entries(metrics).map(([name, value]) => {
    const target = targets[name as MetricName];
    const isPassing = value <= target;
    
    return {
      metric: name,
      value,
      target,
      isPassing,
      percentToTarget: ((value / target) * 100).toFixed(1) + '%',
    };
  });
  
  return results;
}

/**
 * Track navigation performance timing
 */
export function trackNavigationTiming() {
  if (typeof window === 'undefined' || !window.performance || !window.performance.timing) {
    return null;
  }
  
  const timing = window.performance.timing;
  
  // Calculate key metrics
  const navigationStart = timing.navigationStart;
  const responseEnd = timing.responseEnd;
  const domComplete = timing.domComplete;
  const loadEventEnd = timing.loadEventEnd;
  
  // Convert to milliseconds
  const ttfb = responseEnd - navigationStart;
  const domLoad = domComplete - navigationStart;
  const fullLoad = loadEventEnd - navigationStart;
  
  return {
    ttfb,
    domLoad,
    fullLoad,
  };
}
