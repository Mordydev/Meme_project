/**
 * Performance Optimization Framework Types
 * Defines the core types used throughout the performance framework
 */

// Core Web Vitals metrics
export interface CoreWebVitals {
  LCP: number | null; // Largest Contentful Paint (ms)
  FID: number | null; // First Input Delay (ms)
  CLS: number | null; // Cumulative Layout Shift (unitless)
  INP: number | null; // Interaction to Next Paint (ms)
  TTI: number | null; // Time to Interactive (ms)
  TBT: number | null; // Total Blocking Time (ms)
  FCP: number | null; // First Contentful Paint (ms)
}

// Performance monitoring metrics
export interface PerformanceMetrics {
  coreWebVitals: CoreWebVitals;
  fps: number | null; // Frames per second
  jank: number | null; // Number of long frames
  memory: MemoryUsage | null;
  navigation: NavigationTiming | null;
  network: NetworkInformation | null;
  deviceTier: DeviceTier;
  timestamp: number;
}

export interface MemoryUsage {
  jsHeapSizeLimit: number;
  totalJSHeapSize: number;
  usedJSHeapSize: number;
  memoryUsagePercentage: number;
}

export interface NavigationTiming {
  navigationStart: number;
  fetchStart: number;
  domInteractive: number;
  domContentLoaded: number;
  domComplete: number;
  loadEventEnd: number;
}

export interface NetworkInformation {
  effectiveType: '4g' | '3g' | '2g' | 'slow-2g' | 'unknown';
  downlink: number;
  rtt: number;
  saveData: boolean;
  bandwidth: 'high' | 'medium' | 'low' | 'unknown';
}

// Device capability classification
export type DeviceTier = 'high' | 'medium' | 'low' | 'unknown';

// Performance budget interface
export interface PerformanceBudget {
  javascript: {
    total: number; // Total JS bundle size in KB
    initial: number; // Initial JS load in KB
    async: number; // Async chunk size in KB
  };
  css: {
    total: number; // Total CSS size in KB
  };
  images: {
    total: number; // Total image weight in KB
    individual: number; // Max individual image size in KB
  };
  fonts: {
    total: number; // Total fonts size in KB
  };
  thirdParty: {
    total: number; // Total third-party resources size in KB
  };
  webVitals: {
    lcp: number; // LCP target in ms
    fid: number; // FID target in ms
    cls: number; // CLS target (unitless)
    inp: number; // INP target in ms
    tti: number; // TTI target in ms
  };
}

// Component-specific performance budget
export interface ComponentBudget {
  renderTime: number; // Maximum render time in ms
  updateTime: number; // Maximum update time in ms
  instanceCount: number; // Maximum instances on a single page
  memoryUsage: number; // Estimated memory usage in KB
}

// Resource hints types
export type ResourceHintType = 'preload' | 'prefetch' | 'preconnect' | 'dns-prefetch';

export interface ResourceHint {
  type: ResourceHintType;
  href: string;
  as?: string;
  crossOrigin?: string;
  media?: string;
}

// Performance issue types
export type PerformanceIssueType = 
  | 'high_lcp'
  | 'high_fid'
  | 'high_cls'
  | 'high_inp'
  | 'low_fps'
  | 'memory_leak'
  | 'excessive_renders'
  | 'network_bottleneck'
  | 'large_bundle'
  | 'long_task';

// Performance issue details
export interface PerformanceIssue {
  type: PerformanceIssueType;
  timestamp: number;
  component?: string;
  metrics: Partial<PerformanceMetrics>;
  details?: Record<string, any>;
  suggestions?: string[];
}

// Performance optimization context
export interface PerformanceOptimizationConfig {
  enableMonitoring: boolean;
  monitoringFrequency: number; // ms
  sampleRate: number; // 0-1
  reportToAnalytics: boolean;
  enablePerfOverlay: boolean;
  adaptiveLoading: boolean;
  budgets: PerformanceBudget;
  autoOptimize: {
    images: boolean;
    deferOffscreen: boolean;
    prefetchLinks: boolean;
    lazyComponents: boolean;
  };
}

// Image optimization options
export interface ImageOptimizationOptions {
  quality: number; // 1-100
  format: 'webp' | 'avif' | 'jpg' | 'png' | 'auto';
  placeholder: 'blur' | 'color' | 'none';
  loading: 'lazy' | 'eager';
  sizes: string;
  breakpoints: number[];
  blurhash?: string;
}

// Network response statistics 
export interface NetworkStats {
  url: string;
  requestTime: number; // ms
  responseTime: number; // ms
  responseSize: number; // bytes
  status: number;
  cached: boolean;
  contentType: string;
  priority: string;
}
