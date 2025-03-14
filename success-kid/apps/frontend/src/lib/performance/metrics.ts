'use client';

import { useEffect, useState } from 'react';

/**
 * Performance monitoring types
 */
export interface CoreWebVitalsMetrics {
  LCP: number | null;  // Largest Contentful Paint
  FID: number | null;  // First Input Delay
  CLS: number | null;  // Cumulative Layout Shift
  FCP: number | null;  // First Contentful Paint
  TTI: number | null;  // Time to Interactive
  TTFB: number | null; // Time to First Byte
  INP: number | null;  // Interaction to Next Paint
}

export interface ComponentPerformanceData {
  renderTime: number;
  renderCount: number;
  lastRenderTimestamp: number;
  memoized: boolean;
}

export interface PerformanceMetrics {
  navigationStart: number;
  firstPaint: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  timeToInteractive: number;
  cumulativeLayoutShift: number;
  totalBlockingTime: number;
  interactionToNextPaint: number | null;
}

export interface PerformanceBudget {
  maxJSSize: number;       // Maximum JS bundle size in KB
  maxCSSSize: number;      // Maximum CSS size in KB
  maxImageSize: number;    // Maximum image payload in KB
  maxFCP: number;          // First Contentful Paint target in ms
  maxLCP: number;          // Largest Contentful Paint target in ms
  maxCLS: number;          // Cumulative Layout Shift target (0-1)
  maxTTI: number;          // Time to Interactive target in ms
  maxINP: number;          // Interaction to Next Paint target in ms
  componentBudgets: Record<string, ComponentBudget>;
}

export interface ComponentBudget {
  maxRenderTime: number;   // Maximum render time in ms
  maxRenderCount: number;  // Maximum render count per session
}

export interface ResourceTiming {
  resourceName: string;
  startTime: number;
  responseEnd: number;
  initiatorType: string;
  transferSize: number;
  decodedBodySize: number;
}

/**
 * Performance Monitoring Service
 */
class PerformanceMonitoringService {
  private static instance: PerformanceMonitoringService;
  private componentMetrics: Map<string, ComponentPerformanceData> = new Map();
  private listeners: Map<string, Set<(data: any) => void>> = new Map();
  private webVitals: CoreWebVitalsMetrics = {
    LCP: null,
    FID: null,
    CLS: null,
    FCP: null,
    TTI: null,
    TTFB: null,
    INP: null
  };
  private performanceBudget: PerformanceBudget = {
    maxJSSize: 150,     // 150KB
    maxCSSSize: 50,     // 50KB
    maxImageSize: 500,  // 500KB
    maxFCP: 1800,       // 1.8s
    maxLCP: 2500,       // 2.5s
    maxCLS: 0.1,        // 0.1
    maxTTI: 3500,       // 3.5s
    maxINP: 200,        // 200ms
    componentBudgets: {}
  };
  private networkInformation: any = null;
  private saveMetricsLocally: boolean = true;
  private metricsStore: Record<string, any[]> = {};

  private constructor() {
    // Initialize with default budget thresholds
    if (typeof window !== 'undefined') {
      // Monitor network information if available
      if ('connection' in navigator) {
        this.networkInformation = (navigator as any).connection;
        if (this.networkInformation) {
          this.networkInformation.addEventListener('change', this.handleNetworkChange);
        }
      }
    }
  }

  public static getInstance(): PerformanceMonitoringService {
    if (!PerformanceMonitoringService.instance) {
      PerformanceMonitoringService.instance = new PerformanceMonitoringService();
    }
    return PerformanceMonitoringService.instance;
  }

  /**
   * Measure timing of function execution
   */
  public measureTiming<T>(label: string, fn: () => T): T {
    if (typeof performance === 'undefined') return fn();
    
    const startTime = performance.now();
    try {
      return fn();
    } finally {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      this.trackMetric('functionTiming', {
        label,
        duration,
        timestamp: Date.now()
      });
      
      if (process.env.NODE_ENV !== 'production') {
        console.log(`[Performance] ${label}: ${duration.toFixed(2)}ms`);
      }
    }
  }

  /**
   * Create markers and measurements using the User Timing API
   */
  public markAndMeasure(markName: string, measureName: string): void {
    if (typeof performance === 'undefined') return;
    
    const markStart = `${markName}_start`;
    const markEnd = `${markName}_end`;
    
    try {
      performance.mark(markEnd);
      performance.measure(measureName, markStart, markEnd);
      
      const entries = performance.getEntriesByName(measureName, 'measure');
      if (entries.length) {
        this.trackMetric('userTiming', {
          name: measureName,
          duration: entries[0].duration,
          timestamp: Date.now()
        });
      }
    } catch (e) {
      console.error('[Performance] Error in markAndMeasure:', e);
    }
  }

  /**
   * Start timing a user interaction or operation
   */
  public startMark(markName: string): void {
    if (typeof performance === 'undefined') return;
    
    try {
      performance.mark(`${markName}_start`);
    } catch (e) {
      console.error('[Performance] Error in startMark:', e);
    }
  }

  /**
   * End timing and record measurement
   */
  public endMark(markName: string, measureName: string): number | null {
    if (typeof performance === 'undefined') return null;
    
    try {
      performance.mark(`${markName}_end`);
      performance.measure(
        measureName,
        `${markName}_start`,
        `${markName}_end`
      );
      
      const entries = performance.getEntriesByName(measureName, 'measure');
      if (entries.length) {
        const duration = entries[0].duration;
        
        this.trackMetric('userTiming', {
          name: measureName,
          duration,
          timestamp: Date.now()
        });
        
        return duration;
      }
    } catch (e) {
      console.error('[Performance] Error in endMark:', e);
    }
    
    return null;
  }

  /**
   * Track component render metrics
   */
  public trackComponentRender(
    componentId: string,
    renderTime: number,
    isMemoized: boolean = false
  ): void {
    let metrics = this.componentMetrics.get(componentId);
    
    if (!metrics) {
      metrics = {
        renderTime: 0,
        renderCount: 0,
        lastRenderTimestamp: 0,
        memoized: isMemoized
      };
      this.componentMetrics.set(componentId, metrics);
    }
    
    // Update metrics
    metrics.renderCount++;
    metrics.renderTime = renderTime;
    metrics.lastRenderTimestamp = Date.now();
    
    // Check against budget
    this.checkComponentBudget(componentId, renderTime);
    
    // Notify subscribers
    this.notifyListeners('componentRender', {
      componentId,
      renderTime,
      renderCount: metrics.renderCount,
      timestamp: metrics.lastRenderTimestamp,
      memoized: isMemoized
    });
  }

  /**
   * Get component metrics
   */
  public getComponentMetrics(componentId: string): ComponentPerformanceData | null {
    return this.componentMetrics.get(componentId) || null;
  }

  /**
   * Get all component metrics
   */
  public getAllComponentMetrics(): Map<string, ComponentPerformanceData> {
    return new Map(this.componentMetrics);
  }

  /**
   * Track performance event
   */
  public trackEvent(category: string, action: string, value?: number): void {
    this.trackMetric('customEvent', {
      category,
      action,
      value,
      timestamp: Date.now()
    });
  }

  /**
   * Report Core Web Vitals
   */
  public setCoreWebVital(metric: keyof CoreWebVitalsMetrics, value: number): void {
    this.webVitals[metric] = value;
    
    this.trackMetric('webVitals', {
      metric,
      value,
      timestamp: Date.now()
    });
    
    // Check against budget
    this.checkWebVitalBudget(metric, value);
    
    // Notify subscribers
    this.notifyListeners('webVitals', {
      metric,
      value,
      timestamp: Date.now()
    });
  }

  /**
   * Get all Core Web Vitals
   */
  public getCoreWebVitals(): CoreWebVitalsMetrics {
    return { ...this.webVitals };
  }

  /**
   * Set performance budget
   */
  public setPerformanceBudget(budget: Partial<PerformanceBudget>): void {
    this.performanceBudget = {
      ...this.performanceBudget,
      ...budget
    };
  }

  /**
   * Get current performance budget
   */
  public getPerformanceBudget(): PerformanceBudget {
    return { ...this.performanceBudget };
  }

  /**
   * Set component budget
   */
  public setComponentBudget(componentId: string, budget: ComponentBudget): void {
    this.performanceBudget.componentBudgets[componentId] = budget;
  }

  /**
   * Get resource timing information
   */
  public getResourceTimings(): ResourceTiming[] {
    if (typeof performance === 'undefined') return [];
    
    const entries = performance.getEntriesByType('resource');
    return entries.map(entry => ({
      resourceName: entry.name,
      startTime: entry.startTime,
      responseEnd: entry.responseEnd,
      initiatorType: entry.initiatorType,
      transferSize: (entry as any).transferSize || 0,
      decodedBodySize: (entry as any).decodedBodySize || 0
    }));
  }

  /**
   * Get JS bundle size information
   */
  public getJSBundleSize(): number {
    const resources = this.getResourceTimings();
    const jsResources = resources.filter(res => 
      res.initiatorType === 'script' || 
      res.resourceName.endsWith('.js')
    );
    
    return jsResources.reduce((total, res) => total + res.transferSize, 0) / 1024; // Convert to KB
  }

  /**
   * Get CSS size information
   */
  public getCSSSize(): number {
    const resources = this.getResourceTimings();
    const cssResources = resources.filter(res => 
      res.initiatorType === 'css' || 
      res.resourceName.endsWith('.css')
    );
    
    return cssResources.reduce((total, res) => total + res.transferSize, 0) / 1024; // Convert to KB
  }

  /**
   * Get image size information
   */
  public getImageSize(): number {
    const resources = this.getResourceTimings();
    const imageResources = resources.filter(res => 
      res.initiatorType === 'img' || 
      ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].some(
        ext => res.resourceName.toLowerCase().endsWith(`.${ext}`)
      )
    );
    
    return imageResources.reduce((total, res) => total + res.transferSize, 0) / 1024; // Convert to KB
  }

  /**
   * Get network information (if available)
   */
  public getNetworkInformation(): any {
    return this.networkInformation;
  }

  /**
   * Get effective connection type (4g, 3g, 2g, slow-2g)
   */
  public getEffectiveConnectionType(): string {
    return this.networkInformation?.effectiveType || 'unknown';
  }

  /**
   * Check if device is on a metered connection
   */
  public isMeteredConnection(): boolean {
    return this.networkInformation?.saveData || false;
  }

  /**
   * Subscribe to performance events
   */
  public subscribe(eventType: string, callback: (data: any) => void): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    
    this.listeners.get(eventType)!.add(callback);
    
    // Return unsubscribe function
    return () => {
      const listeners = this.listeners.get(eventType);
      if (listeners) {
        listeners.delete(callback);
      }
    };
  }

  /**
   * Clear all performance marks and measures
   */
  public clearPerformanceMarks(): void {
    if (typeof performance !== 'undefined') {
      performance.clearMarks();
      performance.clearMeasures();
    }
  }

  /**
   * Toggle saving metrics locally
   */
  public setSaveMetricsLocally(save: boolean): void {
    this.saveMetricsLocally = save;
  }

  /**
   * Get saved metrics
   */
  public getSavedMetrics(category?: string): Record<string, any[]> {
    if (category) {
      return { [category]: this.metricsStore[category] || [] };
    }
    return { ...this.metricsStore };
  }

  /**
   * Export metrics to JSON
   */
  public exportMetrics(): string {
    return JSON.stringify(this.metricsStore);
  }

  /**
   * Internal: Track metric
   */
  private trackMetric(category: string, data: any): void {
    // Store metrics locally if enabled
    if (this.saveMetricsLocally) {
      if (!this.metricsStore[category]) {
        this.metricsStore[category] = [];
      }
      this.metricsStore[category].push(data);
      
      // Keep metrics store from growing too large
      if (this.metricsStore[category].length > 1000) {
        this.metricsStore[category] = this.metricsStore[category].slice(-1000);
      }
    }
    
    // In development, log performance issues to console
    if (process.env.NODE_ENV !== 'production') {
      this.logPerformanceIssues(category, data);
    }
  }

  /**
   * Internal: Log performance issues in development
   */
  private logPerformanceIssues(category: string, data: any): void {
    if (category === 'webVitals') {
      const metric = data.metric;
      const value = data.value;
      
      // Check against budget
      switch (metric) {
        case 'LCP':
          if (value > this.performanceBudget.maxLCP) {
            console.warn(`[Performance] LCP (${value.toFixed(1)}ms) exceeds budget (${this.performanceBudget.maxLCP}ms)`);
          }
          break;
        case 'FCP':
          if (value > this.performanceBudget.maxFCP) {
            console.warn(`[Performance] FCP (${value.toFixed(1)}ms) exceeds budget (${this.performanceBudget.maxFCP}ms)`);
          }
          break;
        case 'CLS':
          if (value > this.performanceBudget.maxCLS) {
            console.warn(`[Performance] CLS (${value.toFixed(3)}) exceeds budget (${this.performanceBudget.maxCLS})`);
          }
          break;
        case 'TTI':
          if (value > this.performanceBudget.maxTTI) {
            console.warn(`[Performance] TTI (${value.toFixed(1)}ms) exceeds budget (${this.performanceBudget.maxTTI}ms)`);
          }
          break;
      }
    } else if (category === 'componentRender') {
      const { componentId, renderTime, renderCount } = data;
      const budget = this.performanceBudget.componentBudgets[componentId];
      
      if (budget) {
        if (renderTime > budget.maxRenderTime) {
          console.warn(`[Performance] Component "${componentId}" render time (${renderTime.toFixed(1)}ms) exceeds budget (${budget.maxRenderTime}ms)`);
        }
        
        if (renderCount > budget.maxRenderCount) {
          console.warn(`[Performance] Component "${componentId}" render count (${renderCount}) exceeds budget (${budget.maxRenderCount})`);
        }
      }
    }
  }

  /**
   * Internal: Check Web Vital against budget
   */
  private checkWebVitalBudget(metric: keyof CoreWebVitalsMetrics, value: number): void {
    switch (metric) {
      case 'LCP':
        if (value > this.performanceBudget.maxLCP) {
          this.notifyListeners('budgetExceeded', {
            type: 'webVital',
            metric,
            value,
            budget: this.performanceBudget.maxLCP,
            timestamp: Date.now()
          });
        }
        break;
      case 'FCP':
        if (value > this.performanceBudget.maxFCP) {
          this.notifyListeners('budgetExceeded', {
            type: 'webVital',
            metric,
            value,
            budget: this.performanceBudget.maxFCP,
            timestamp: Date.now()
          });
        }
        break;
      case 'CLS':
        if (value > this.performanceBudget.maxCLS) {
          this.notifyListeners('budgetExceeded', {
            type: 'webVital',
            metric,
            value,
            budget: this.performanceBudget.maxCLS,
            timestamp: Date.now()
          });
        }
        break;
      case 'TTI':
        if (value > this.performanceBudget.maxTTI) {
          this.notifyListeners('budgetExceeded', {
            type: 'webVital',
            metric,
            value,
            budget: this.performanceBudget.maxTTI,
            timestamp: Date.now()
          });
        }
        break;
      case 'INP':
        if (value > this.performanceBudget.maxINP) {
          this.notifyListeners('budgetExceeded', {
            type: 'webVital',
            metric,
            value,
            budget: this.performanceBudget.maxINP,
            timestamp: Date.now()
          });
        }
        break;
    }
  }

  /**
   * Internal: Check component render time against budget
   */
  private checkComponentBudget(componentId: string, renderTime: number): void {
    const budget = this.performanceBudget.componentBudgets[componentId];
    if (!budget) return;
    
    if (renderTime > budget.maxRenderTime) {
      this.notifyListeners('budgetExceeded', {
        type: 'component',
        componentId,
        metric: 'renderTime',
        value: renderTime,
        budget: budget.maxRenderTime,
        timestamp: Date.now()
      });
    }
    
    const metrics = this.componentMetrics.get(componentId);
    if (metrics && metrics.renderCount > budget.maxRenderCount) {
      this.notifyListeners('budgetExceeded', {
        type: 'component',
        componentId,
        metric: 'renderCount',
        value: metrics.renderCount,
        budget: budget.maxRenderCount,
        timestamp: Date.now()
      });
    }
  }

  /**
   * Internal: Handle network change
   */
  private handleNetworkChange = () => {
    this.notifyListeners('networkChange', {
      effectiveType: this.networkInformation?.effectiveType,
      saveData: this.networkInformation?.saveData,
      timestamp: Date.now()
    });
  };

  /**
   * Internal: Notify listeners of events
   */
  private notifyListeners(eventType: string, data: any): void {
    const listeners = this.listeners.get(eventType);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (e) {
          console.error('[Performance] Error in event listener:', e);
        }
      });
    }
    
    // Special case for 'all' listeners that receive all events
    const allListeners = this.listeners.get('all');
    if (allListeners) {
      allListeners.forEach(callback => {
        try {
          callback({ type: eventType, ...data });
        } catch (e) {
          console.error('[Performance] Error in event listener:', e);
        }
      });
    }
  }
}

/**
 * Hook to use Web Vitals reporting
 */
export function useWebVitalsReporting() {
  const [isInitialized, setIsInitialized] = useState(false);
  
  useEffect(() => {
    if (typeof window !== 'undefined' && !isInitialized) {
      // Dynamically import web-vitals
      import('web-vitals').then(({ onCLS, onFID, onLCP, onFCP, onTTFB, onINP }) => {
        const performanceService = PerformanceMonitoringService.getInstance();
        
        onCLS(metric => {
          performanceService.setCoreWebVital('CLS', metric.value);
        });
        
        onFID(metric => {
          performanceService.setCoreWebVital('FID', metric.value);
        });
        
        onLCP(metric => {
          performanceService.setCoreWebVital('LCP', metric.value);
        });
        
        onFCP(metric => {
          performanceService.setCoreWebVital('FCP', metric.value);
        });
        
        onTTFB(metric => {
          performanceService.setCoreWebVital('TTFB', metric.value);
        });
        
        onINP(metric => {
          performanceService.setCoreWebVital('INP', metric.value);
        });
        
        setIsInitialized(true);
      });
    }
  }, [isInitialized]);
  
  return isInitialized;
}

// Export singleton instance
export default PerformanceMonitoringService.getInstance();
